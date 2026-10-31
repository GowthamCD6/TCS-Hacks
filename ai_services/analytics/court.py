"""Root Cause Court: five explicit statistical tests per hypothesis. No LLM touches these numbers."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import timedelta
from typing import Callable

import numpy as np
import pandas as pd
from scipy import stats

from ai_services.analytics.data import Frames
from ai_services.analytics.funnel import funnel_breakpoint, journeys
from ai_services.analytics.signals import _meta

SUPPORTED, REJECTED, UNTESTED, INCONCLUSIVE = "supported", "rejected", "untested", "inconclusive"
OVERLAPPING = "overlapping"
NARROWER_THAN = {"payment_gateway_regression": ["gateway_callback_failure", "bank_outage", "order_service_outage"]}
# Documented scoring: telemetry weighs most because money movement is the strongest evidence. Sentiment is excluded.
TEST_NAMES = ["temporal", "segment_specificity", "telemetry", "dose_response", "counter_check"]
WEIGHTS = {"temporal": 0.15, "segment_specificity": 0.25, "telemetry": 0.3, "dose_response": 0.15, "counter_check": 0.15}
CREDIT = {SUPPORTED: 1.0, INCONCLUSIVE: 0.35, UNTESTED: 0.0, REJECTED: 0.0}
MIN_N = 100
LOOKBACK = timedelta(days=14)
COMPONENT_LOOKBACK = timedelta(days=30)
ONSET_SEARCH_HOURS = 96


@dataclass
class Hypothesis:
    key: str
    statement: str
    change_time: pd.Timestamp | None
    exposed: Callable[[pd.DataFrame], pd.Series] | None  # None means the change touched every order
    evidence: list = field(default_factory=list)
    predicted_stage: str | None = None
    segment: dict = field(default_factory=dict)


@dataclass
class Case:
    f: Frames
    category: str
    orders: pd.DataFrame
    complaints: pd.DataFrame
    onset: pd.Timestamp | None
    post_start: pd.Timestamp
    top_segment: dict | None
    telemetry_available: bool
    breakpoint: dict | None = None
    precise_onset: bool = False


def daily_onset(c: pd.DataFrame, orders: pd.DataFrame, as_of: pd.Timestamp) -> pd.Timestamp | None:
    """First day the per-order complaint rate leaves its baseline and stays out the next day."""
    if c.empty:
        return None
    start = as_of - timedelta(days=30)
    day = lambda s: ((s - start).dt.total_seconds() // 86400).astype(int)  # noqa: E731
    n = 30
    comp = np.bincount(day(c[c.event_timestamp > start].event_timestamp).clip(0, n - 1), minlength=n)
    ords = np.bincount(day(orders[orders.ordered_at > start].ordered_at).clip(0, n - 1), minlength=n)
    rate = comp / np.maximum(ords, 1)
    base = rate[:18]
    limit = base.mean() + 3 * base.std() + 1e-6
    for d in range(1, n):
        if rate[d] > limit and (d == n - 1 or rate[d + 1] > limit) and comp[d] >= 2:
            return start + timedelta(days=d)
    return None


def failure_onset(f: Frames, window_start: pd.Timestamp) -> pd.Timestamp | None:
    """Change-point on the per-journey failure rate in 3-hour bins, sharper than daily complaint counts."""
    j = journeys(f)
    if j.empty:
        return None
    start = window_start - timedelta(days=7)
    search_from = window_start - timedelta(hours=ONSET_SEARCH_HOURS)  # older outages belong to other incidents
    j = j[j.ordered_at >= start]
    bins = ((j.ordered_at - start).dt.total_seconds() // (3 * 3600)).astype(int)
    grouped = (~j.order_created).groupby(bins).agg(["sum", "count"])
    rate = grouped["sum"] / grouped["count"].clip(lower=1)
    limit = rate.median() + 4 * max(float(stats.median_abs_deviation(rate)), 0.01)
    keys = list(rate.index)
    for i, key in enumerate(keys[:-1]):
        at = start + timedelta(hours=3 * int(key))
        # Two bins in a row, or one extreme bin for an outage short enough to fit inside it.
        sustained = rate.loc[key] > limit and rate.loc[keys[i + 1]] > limit
        if at >= search_from and grouped["sum"].loc[key] >= 3 and (sustained or rate.loc[key] > 3 * limit):
            return at
    return None


def attribute(complaints: pd.DataFrame, orders: pd.DataFrame) -> pd.DataFrame:
    """Tie each complaint to an order: the referenced one, else the customer's latest before it."""
    o = orders.sort_values("ordered_at")
    known = complaints[complaints.order_id.isin(set(o.external_order_id))].copy()
    known["attributed_order"] = known.order_id
    rest = complaints.drop(known.index).dropna(subset=["customer_id"]).sort_values("event_timestamp")
    if len(rest):
        asof = pd.merge_asof(rest, o[["customer_id", "ordered_at", "external_order_id"]].astype({"customer_id": rest.customer_id.dtype}),
                             left_on="event_timestamp", right_on="ordered_at", by="customer_id", direction="backward")
        asof["attributed_order"] = asof.external_order_id
        known = pd.concat([known, asof[asof.attributed_order.notna()]], ignore_index=True)
    return known


def _rates(case: Case, mask: pd.Series, post: pd.DataFrame) -> tuple[int, int, int, int]:
    hit = post.external_order_id.isin(set(case.complaints.attributed_order))
    exposed, un = post[mask], post[~mask]
    return int(hit[mask].sum()), len(exposed), int(hit[~mask].sum()), len(un)


def _fisher(a: int, n: int, b: int, m: int) -> float:
    return float(stats.fisher_exact([[a, max(n - a, 0)], [b, max(m - b, 0)]], alternative="greater")[1])


def _result(status: str, explanation: str, **metrics) -> dict:
    return {"status": status, "explanation": explanation, "result": metrics}


def test_temporal(case: Case, h: Hypothesis) -> dict:
    if h.change_time is None:
        return _result(UNTESTED, "No dated change exists for this hypothesis, so timing cannot be checked.")
    if case.onset is None:
        return _result(INCONCLUSIVE, "No clear onset could be located in the complaint rate.")
    gap = (case.onset - h.change_time).total_seconds() / 3600
    metrics = dict(onset=case.onset.isoformat(), change_time=h.change_time.isoformat(), gap_hours=round(gap, 1))
    if (-3 if case.precise_onset else -24) <= gap <= 72:
        return _result(SUPPORTED, f"The issue began {gap:.0f} h after the change (daily resolution). Timing alone does not prove cause.", **metrics)
    side = "before" if gap < 0 else "long after"
    return _result(REJECTED, f"The issue began {abs(gap):.0f} h {side} this change, which does not fit.", **metrics)


def test_specificity(case: Case, h: Hypothesis) -> dict:
    post = case.orders[case.orders.ordered_at >= case.post_start]
    fail = order_failures(case) if case.category == "payment" else None
    if fail is not None and h.exposed is not None:
        # Payments are judged on verified journeys, so silent victims count and complaints do not skew it.
        flagged = post.assign(_fail=fail.reindex(post.index))
        mask = h.exposed(flagged)
        a, n, b, m = int(flagged[mask]._fail.sum()), int(mask.sum()), int(flagged[~mask]._fail.sum()), int((~mask).sum())
        if n < 20 or m < 20:
            return _result(INCONCLUSIVE, "Too few orders in one comparison group.", exposed_orders=n, unexposed_orders=m)
        r1, r0 = a / n, (b + 0.5) / (m + 1)
        lift, p = r1 / r0, _fisher(a, n, b, m)
        metrics = dict(metric="captured_no_order_rate", exposed_failures=a, exposed_orders=n, unexposed_failures=b, unexposed_orders=m,
                       exposed_rate=round(r1, 5), unexposed_rate=round(r0, 5), lift=round(lift, 3), p_value=p)
        if lift >= 2 and p < 0.01:
            return _result(SUPPORTED, f"Exposed orders fail at {lift:.1f}x the rate of the complement.", **metrics)
        if lift < 1.5:
            return _result(REJECTED, f"Exposed and unexposed orders fail at similar rates (lift {lift:.2f}).", **metrics)
        return _result(INCONCLUSIVE, f"Lift of {lift:.2f} is not decisive.", **metrics)
    if h.exposed is None:
        top = case.top_segment
        if top and top["coverage"] >= 0.5 and top["total_customers"] / max(post.customer_id.nunique(), 1) < 0.3:
            return _result(REJECTED, "This change touched every customer, yet the issue is concentrated in one narrow segment.",
                           segment=top["segment_value"], coverage=top["coverage"], lift=top["lift_ratio"])
        return _result(INCONCLUSIVE, "A universal change has no unexposed group to compare against.")
    mask = h.exposed(post)
    a, n, b, m = _rates(case, mask, post)
    if n < 20 or m < 20:
        return _result(INCONCLUSIVE, "Too few orders in one comparison group.", exposed_orders=n, unexposed_orders=m)
    r1, r0 = a / n, (b + 0.5) / (m + 1)
    lift, p = r1 / r0, _fisher(a, n, b, m)
    metrics = dict(exposed_issues=a, exposed_orders=n, unexposed_issues=b, unexposed_orders=m,
                   exposed_rate=round(r1, 5), unexposed_rate=round(r0, 5), lift=round(lift, 3), p_value=p)
    if lift >= 2 and p < 0.01:
        return _result(SUPPORTED, f"Exposed orders produce complaints at {lift:.1f}x the unexposed rate.", **metrics)
    if lift < 1.5:
        return _result(REJECTED, f"Exposed and unexposed orders complain at similar rates (lift {lift:.2f}).", **metrics)
    return _result(INCONCLUSIVE, f"Lift of {lift:.2f} is not decisive.", **metrics)


def order_failures(case: Case) -> pd.Series | None:
    """Per-order telemetry failure flag for the issue category, or None when telemetry is unavailable."""
    if not case.telemetry_available:
        return None
    ev = case.f.events
    orders = case.orders
    if case.category == "payment":
        cap = ev[ev.event_type == "payment_captured"]
        if cap[cap.event_timestamp >= case.post_start].empty:
            return None
        created = set(ev[ev.event_type == "order_created"].order_id)
        captured = set(cap.order_id)
        # Bank failures never capture money, but the journey still broke before an order existed.
        broken = set(ev[ev.event_type.isin(["bank_debit_failed", "bank_debit_pending"])].order_id)
        return orders.external_order_id.isin((captured - created) | broken)
    if case.category == "delivery":
        d = ev[ev.event_type == "delivery_delayed"]
        if d[d.event_timestamp >= case.post_start].empty:
            return None
        return orders.external_order_id.isin(set(d.order_id))
    return None


def test_telemetry(case: Case, h: Hypothesis) -> dict:
    fail = order_failures(case)
    if fail is None:
        return _result(UNTESTED, "No operational telemetry is available for this failure. Missing evidence is not evidence against the hypothesis.")
    if case.category == "payment" and case.breakpoint and case.breakpoint.get("telemetry_available"):
        observed = (case.breakpoint.get("breakpoint") or {}).get("stage")
        metrics = dict(metric="funnel_breakpoint", observed_stage=observed, predicted_stage=h.predicted_stage, funnel=case.breakpoint.get("breakpoint"))
        if observed is None:
            return _result(INCONCLUSIVE, "The funnel shows no significant break for this segment and window.", **metrics)
        if h.predicted_stage is None:
            return _result(REJECTED, f"The funnel broke at {observed}, and this explanation predicts no payment break.", **metrics)
        if observed != h.predicted_stage:
            return _result(REJECTED, f"The funnel broke at {observed}, but this hypothesis predicts {h.predicted_stage}.", **metrics)
        return _result(SUPPORTED, f"The funnel broke at {observed}, the stage this hypothesis predicts.", **metrics)
    orders = case.orders.assign(_fail=fail)
    post = orders[orders.ordered_at >= case.post_start]
    if h.exposed is None:
        if h.change_time is None or case.onset is None or h.change_time >= case.onset:
            return _result(INCONCLUSIVE, "No quiet period exists between this change and the onset.")
        between = orders[(orders.ordered_at >= h.change_time) & (orders.ordered_at < case.onset)]
        before = orders[orders.ordered_at < h.change_time]
        r1, r0 = between._fail.mean() if len(between) else 0.0, before._fail.mean() if len(before) else 0.0
        metrics = dict(failure_rate_after_change=round(float(r1), 5), failure_rate_before_change=round(float(r0), 5),
                       orders_after_change=len(between))
        if len(between) >= MIN_N and r1 < 2 * max(r0, 1e-4):
            return _result(REJECTED, "Failure telemetry did not move after this change, until the later onset.", **metrics)
        return _result(INCONCLUSIVE, "Telemetry around this change is not decisive.", **metrics)
    mask = h.exposed(post)
    a, n = int(post[mask]._fail.sum()), int(mask.sum())
    b, m = int(post[~mask]._fail.sum()), int((~mask).sum())
    if n < 20 or m < 20:
        return _result(INCONCLUSIVE, "Too few orders for a telemetry comparison.", exposed_orders=n, unexposed_orders=m)
    r1, r0 = a / n, (b + 0.5) / (m + 1)
    lift, p = r1 / r0, _fisher(a, n, b, m)
    metrics = dict(exposed_failures=a, exposed_orders=n, unexposed_failures=b, unexposed_orders=m,
                   exposed_rate=round(r1, 5), unexposed_rate=round(r0, 5), lift=round(lift, 3), p_value=p)
    if lift >= 2 and p < 0.01:
        return _result(SUPPORTED, f"Telemetry confirms the failure: {r1:.1%} of exposed orders against {r0:.2%} unexposed.", **metrics)
    if lift < 1.5 and n >= MIN_N:
        return _result(REJECTED, f"Telemetry failure rate is not elevated for exposed orders (lift {lift:.2f}).", **metrics)
    return _result(INCONCLUSIVE, f"Telemetry lift of {lift:.2f} is not decisive.", **metrics)


def test_dose(case: Case, h: Hypothesis) -> dict:
    if h.exposed is None:
        return _result(INCONCLUSIVE, "A universal change has no graded exposure to test.")
    post = case.orders[case.orders.ordered_at >= case.post_start].copy()
    post["_x"] = h.exposed(post)
    post["_hit"] = post.external_order_id.isin(set(case.complaints.attributed_order))
    by = post.groupby("customer_id").agg(orders=("_x", "size"), exposed=("_x", "sum"), hits=("_hit", "sum"))
    share = by.exposed / by.orders
    by["dose"] = np.select([share == 0, share <= 0.5], ["none", "partial"], "high")
    t = by.groupby("dose")[["orders", "hits"]].sum().reindex(["none", "partial", "high"]).fillna(0)
    rate = (t.hits / t.orders.replace(0, np.nan)).fillna(0)
    metrics = dict(rates={k: round(float(v), 5) for k, v in rate.items()}, orders={k: int(v) for k, v in t.orders.items()})
    if t.orders.loc["high"] < 20 or t.orders.loc["none"] < 20:
        return _result(INCONCLUSIVE, "Not enough orders across exposure levels.", **metrics)
    table = np.array([t.hits.values, (t.orders - t.hits).values])
    table = table[:, table.sum(axis=0) > 0]
    p = float(stats.chi2_contingency(table)[1]) if table[0].sum() > 0 else 1.0
    metrics["p_value"] = p
    top, none = rate.loc["high"], rate.loc["none"]
    ordered = rate.loc["none"] <= rate.loc["partial"] <= rate.loc["high"] or t.orders.loc["partial"] < 20
    if ordered and top >= 2 * max(none, 1e-4) and p < 0.05:
        return _result(SUPPORTED, "The issue rate rises with the share of a customer's orders that were exposed.", **metrics)
    if top < 1.5 * max(none, 1e-4):
        return _result(REJECTED, "More exposure does not mean more issues.", **metrics)
    return _result(INCONCLUSIVE, "Exposure and issue rate show no clean gradient.", **metrics)


def test_counter(case: Case, h: Hypothesis) -> dict:
    orders = case.orders
    post = orders[orders.ordered_at >= case.post_start]
    pre = orders[orders.ordered_at < case.post_start]
    hits = set(case.complaints.attributed_order)
    if h.exposed is None:
        d_post = max((case.f.as_of - case.post_start).total_seconds(), 1)
        d_pre = max((case.post_start - pre.ordered_at.min()).total_seconds(), 1) if len(pre) else d_post
        order_growth = (len(post) / d_post) / max(len(pre) / d_pre, 1e-9)
        r_post = post.external_order_id.isin(hits).mean() if len(post) else 0.0
        r_pre = pre.external_order_id.isin(hits).mean() if len(pre) else 0.0
        ratio = float(r_post / max(r_pre, 1e-4))
        metrics = dict(order_growth=round(order_growth, 3), rate_ratio=round(ratio, 3))
        if ratio >= 2:
            return _result(REJECTED, f"Complaints per order rose {ratio:.1f}x while orders grew only {order_growth:.2f}x, so this does not explain it.", **metrics)
        return _result(SUPPORTED, "Complaints per order stayed flat, consistent with this explanation.", **metrics)
    un_post, un_pre = post[~h.exposed(post)], pre[~h.exposed(pre)]
    if len(un_post) < 20 or len(un_pre) < 20:
        return _result(INCONCLUSIVE, "Unexposed group too small to act as a control.")
    a, b = int(un_post.external_order_id.isin(hits).sum()), int(un_pre.external_order_id.isin(hits).sum())
    r1, r0 = (a + 0.5) / (len(un_post) + 1), (b + 0.5) / (len(un_pre) + 1)
    ratio, p = r1 / r0, _fisher(a, len(un_post), b, len(un_pre))
    metrics = dict(unexposed_rate_after=round(r1, 5), unexposed_rate_before=round(r0, 5), ratio=round(ratio, 3), p_value=p)
    if ratio < 1.75:
        return _result(SUPPORTED, f"The unexposed control group stayed flat ({ratio:.2f}x).", **metrics)
    if ratio >= 2 and p < 0.01:
        return _result(REJECTED, f"The issue also rose {ratio:.1f}x where this exposure is absent.", **metrics)
    return _result(INCONCLUSIVE, "The unexposed control moved slightly; alternatives remain open.", **metrics)


TESTS = {"temporal": test_temporal, "segment_specificity": test_specificity, "telemetry": test_telemetry,
         "dose_response": test_dose, "counter_check": test_counter}


def build_hypotheses(case: Case) -> list[Hypothesis]:
    f, as_of = case.f, case.f.as_of
    out: list[Hypothesis] = []
    seg = (case.top_segment or {}).get("segment_value", "")
    parts = [p.strip() for p in seg.split("|")] if "|" in seg else []
    seg_os = parts[0] if parts else None
    seg_ver = parts[1].lstrip("v") if len(parts) > 1 else None
    seg_pay = parts[2] if len(parts) > 2 else None

    releases = f.releases[f.releases.release_timestamp >= as_of - LOOKBACK]
    fix_versions = [v for v in releases.version.astype(str) if v.count(".") >= 2]
    for r in releases.itertuples():
        ver = str(r.version)
        if ver in fix_versions:
            continue
        narrowed = seg_ver == ver

        def exposed(df, ver=ver, plat=r.platform, narrowed=narrowed):
            m = (df.app_version.astype(str) == ver) & (df.platform == plat)
            if narrowed and seg_os:
                m &= df.device_os == seg_os
            if narrowed and seg_pay:
                m &= df.payment_method == seg_pay
            return m

        where = f" for {seg_os}" + (f" {seg_pay.upper()} orders" if seg_pay else "") if narrowed else ""
        out.append(Hypothesis(f"release_{ver}_{r.platform}", f"Release {ver} on {r.platform}{where} caused the issue",
                              r.release_timestamp, exposed,
                              [{"source_table": "product_releases", "source_record_id": f"{ver}:{r.platform}",
                                "description": str(r.description or f"Release {ver}")}]))

    ev = f.events
    rain = ev[ev.event_type == "weather_alert"]
    if not rain.empty:
        ends = [pd.Timestamp(_meta(m).get("end")).tz_localize(None) if _meta(m).get("end") else t + timedelta(days=3)
                for m, t in zip(rain.metadata if "metadata" in rain else [None] * len(rain), rain.event_timestamp)]
        cities, t0, t1 = set(rain.city.dropna()), rain.event_timestamp.min(), max(ends)
        out.append(Hypothesis("weather_rain", f"Heavy rain in {', '.join(sorted(cities))} caused the issue", t0,
                              lambda df, c=cities, a=t0, b=t1: df.city.isin(c) & (df.ordered_at >= a) & (df.ordered_at <= b),
                              [{"source_table": "operational_events", "source_record_id": str(rain.iloc[0].id), "description": "Weather alert"}]))
    for etype, key, text in (("menu_price_change", "menu_price_change", "The menu price change drove the complaints"),
                             ("marketing_campaign", "seasonal_traffic", "Seasonal or campaign traffic explains the rise")):
        e = ev[ev.event_type == etype]
        if not e.empty:
            out.append(Hypothesis(key, text, e.event_timestamp.max(), None,
                                  [{"source_table": "operational_events", "source_record_id": str(e.iloc[-1].id), "description": etype.replace("_", " ")}]))
    if case.category == "payment":
        for h in out:
            h.predicted_stage = "client_confirm_call" if h.key.startswith("release_") else None
        release = next((h for h in out if h.key.startswith("release_") and h.key.endswith("android")), None)
        rel = release.exposed if release else (lambda df: pd.Series(False, index=df.index))
        out.append(Hypothesis("payment_gateway_regression", "A shared UPI gateway or backend regression, independent of the app release, caused the issue",
                              None, lambda df, rel=rel: (df.payment_method == "upi") & ~rel(df), predicted_stage="gateway_callback_received"))
        out += payment_component_hypotheses(case)
    return out


def _spike(j: pd.DataFrame, flag: pd.Series, dim: str | None) -> tuple:
    """Find the component and 3-hour bin with the worst rate of a failure flag, for a dated hypothesis."""
    if j.empty or not flag.any():
        return None, None
    bins = j.ordered_at.dt.floor("3h")
    keys = [bins] if dim is None else [j[dim], bins]
    g = flag.groupby(keys).agg(["sum", "count"])
    g = g[g["count"] >= 8]
    if g.empty:
        return None, None
    best = (g["sum"] / g["count"]).idxmax()
    return (None, best) if dim is None else best


def payment_component_hypotheses(case: Case) -> list[Hypothesis]:
    """H2 to H4: each names one component, its own onset, and the funnel stage it would break."""
    j = journeys(case.f)
    if j.empty:
        return []
    j = j[j.ordered_at >= case.f.as_of - COMPONENT_LOOKBACK]
    out = []
    bank, t2 = _spike(j, j.customer_authorised & ~j.bank_debit_success, "bank")
    if bank is not None:
        out.append(Hypothesis("bank_outage", f"A UPI outage at {bank} caused the issue", t2, lambda df, b=bank: df.bank == b,
                              predicted_stage="bank_debit_success", segment={"bank": bank}))
    gateway, t3 = _spike(j, j.bank_debit_success & ~j.gateway_callback_received, "payment_gateway")
    if gateway is not None:
        out.append(Hypothesis("gateway_callback_failure", f"Lost callbacks from {gateway} caused the issue", t3, lambda df, g=gateway: df.payment_gateway == g,
                              predicted_stage="gateway_callback_received", segment={"payment_gateway": gateway}))
    _, t4 = _spike(j, j.client_confirm_call & ~j.order_created, None)
    if t4 is not None:
        t4_end = t4 + timedelta(hours=3)
        out.append(Hypothesis("order_service_outage", "An order service outage caused the issue", t4,
                              lambda df, a=t4, b=t4_end: (df.ordered_at >= a) & (df.ordered_at < b), predicted_stage="order_created"))
    return out


def verdict(tests: dict[str, dict]) -> dict:
    s = [t["status"] for t in tests.values()]
    n_sup, n_rej = s.count(SUPPORTED), s.count(REJECTED)
    conf = sum(WEIGHTS[k] * CREDIT[v["status"]] for k, v in tests.items())
    core_rejected = tests["segment_specificity"]["status"] == REJECTED or tests["telemetry"]["status"] == REJECTED
    if n_rej >= 2 or core_rejected:
        status, conf = REJECTED, min(conf, 0.2)
    elif n_sup >= 3 and n_rej == 0 and tests["telemetry"]["status"] == SUPPORTED:
        status = SUPPORTED
    else:
        status, conf = INCONCLUSIVE, min(conf, 0.65)
    return {"status": status, "confidence": round(min(conf, 0.95), 3)}


def missing_evidence(tests: dict[str, dict]) -> list[str]:
    return [f"{k}: {v['explanation']}" for k, v in tests.items() if v["status"] == UNTESTED]


def segment_filter(top: dict | None) -> dict:
    """Turn a segment result into column filters for the funnel."""
    if not top:
        return {}
    value, dim = top["segment_value"], top["dimension"]
    if "|" not in value:
        return {dim: value} if dim in ("bank", "payment_gateway", "device_os", "app_version", "payment_method", "platform", "city") else {}
    parts = [p.strip() for p in value.split("|")]
    out = {"device_os": parts[0], "app_version": parts[1].lstrip("v")}
    if len(parts) > 2:
        out["payment_method"] = parts[2]
    return out


def prepare_case(f: Frames, category: str, window_start, top_segment: dict | None, telemetry_available: bool = True) -> Case:
    complaints = f.feedback[f.feedback.category == category]
    start = pd.Timestamp(window_start)
    start = start.tz_localize(None) if start.tzinfo else start
    onset = failure_onset(f, start) if category == "payment" and telemetry_available else None
    precise = onset is not None
    if onset is None:
        onset = daily_onset(complaints, f.orders, f.as_of)
    post_start = pd.Timestamp(window_start)
    if onset is not None:
        post_start = onset
    complaints = attribute(complaints, f.orders)
    return Case(f, category, f.orders, complaints, onset, post_start, top_segment, telemetry_available, precise_onset=precise)


def _analysis_start(case: Case, leader: dict | None, window_start) -> str:
    """Harm can start before complaints do, so impact is measured from the supported cause."""
    points = [pd.Timestamp(window_start)]
    if case.onset is not None:
        points.append(case.onset)
    if leader and leader["change_time"]:
        points.append(pd.Timestamp(leader["change_time"]))
    return min(p.tz_localize(None) if p.tzinfo else p for p in points).isoformat()


def proposed_hypothesis(p: dict) -> Hypothesis:
    """An LLM proposal becomes a normal hypothesis: the same five tests judge it."""
    segment = {str(k): str(v) for k, v in p["predicted_segment"].items()}

    def exposed(df, seg=segment):
        m = pd.Series(True, index=df.index)
        for col, value in seg.items():
            m &= df[col].astype(str) == value if col in df else False
        return m

    onset = pd.Timestamp(p["predicted_onset"])
    key = "proposed_" + "_".join(f"{v}" for v in segment.values()).lower().replace(" ", "_")[:40]
    return Hypothesis(key, f"Proposed: {p['component']}", onset.tz_localize(None) if onset.tzinfo else onset, exposed,
                      predicted_stage=p["predicted_break_stage"], segment=segment)


def run_court(f: Frames, category: str, window_start, top_segment: dict | None = None, telemetry_available: bool = True,
              only_tests: set[str] | None = None, prior: dict | None = None, proposals: list | None = None) -> dict:
    """prior maps hypothesis key to earlier tests; tests outside only_tests are reused from it."""
    case = prepare_case(f, category, window_start, top_segment, telemetry_available)
    if category == "payment" and telemetry_available:
        case.breakpoint = funnel_breakpoint(f, segment_filter(top_segment), case.post_start, f.as_of)
    out, rerun, reused = [], 0, 0
    for h in build_hypotheses(case) + [proposed_hypothesis(p) for p in proposals or []]:
        tests = {}
        old = (prior or {}).get(h.key, {})
        for name in TEST_NAMES:
            if only_tests is not None and name not in only_tests and name in old:
                tests[name] = {**old[name], "reused": True}
                reused += 1
            else:
                tests[name] = TESTS[name](case, h)
                rerun += 1
        v = verdict(tests)
        supporting = [t["explanation"] for t in tests.values() if t["status"] == SUPPORTED]
        against = [t["explanation"] for t in tests.values() if t["status"] == REJECTED]
        out.append({
            "hypothesis_key": h.key, "hypothesis": h.statement, "status": v["status"], "confidence_score": v["confidence"],
            "change_time": h.change_time.isoformat() if h.change_time is not None else None,
            "predicted_stage": h.predicted_stage, "tests": tests, "supporting_evidence": supporting, "contradicting_evidence": against,
            "missing_evidence": missing_evidence(tests), "evidence_references": h.evidence,
            "explanation": f"{sum(t['status'] == SUPPORTED for t in tests.values())} of 5 tests support this; "
                           f"{sum(t['status'] == REJECTED for t in tests.values())} reject it.",
        })
    supported = {h["hypothesis_key"] for h in out if h["status"] == SUPPORTED}
    for h in out:
        narrower = [k for k in NARROWER_THAN.get(h["hypothesis_key"], []) if k in supported]
        if h["status"] == SUPPORTED and narrower:
            h["status"] = OVERLAPPING
            h["overlaps_with"] = narrower
            h["explanation"] += f" Overlaps the narrower {narrower[0]}, which is preferred."
    out.sort(key=lambda h: (-h["confidence_score"], h["hypothesis_key"]))
    leader = next((h for h in out if h["status"] == SUPPORTED), None)
    best = leader or next((h for h in out if h["status"] == INCONCLUSIVE), None)
    return {
        "hypotheses": out, "verdict": best["hypothesis"] if leader else
        (f"Unproven: {best['hypothesis']}" if best else "No hypothesis survived the court"),
        "verdict_key": best["hypothesis_key"] if best else None, "verdict_status": best["status"] if best else "inconclusive",
        "confidence_score": best["confidence_score"] if best else 0.0,
        "reasons": (best["supporting_evidence"] + best["missing_evidence"]) if best else [],
        "onset": case.onset.isoformat() if case.onset is not None else None,
        "funnel": case.breakpoint,
        "analysis_start": _analysis_start(case, leader, window_start),
        "tests_rerun": rerun, "tests_reused": reused,
        "limitations": ["Observational data: these tests support causal claims but cannot prove them as a randomised experiment would."],
    }
