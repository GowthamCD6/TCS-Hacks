"""Payment funnel analysis. Root cause is found where the money's journey breaks, not in review text."""

from __future__ import annotations

from datetime import timedelta

import pandas as pd
from scipy import stats

from ai_services.analytics.data import Frames

# Order matters: each stage counts journeys that reached it successfully.
STAGES = ["order_draft_created", "payment_initiated", "collect_request_sent", "customer_authorised", "bank_debit_success",
          "gateway_callback_received", "client_confirm_call", "order_created"]
FAILED_STATUSES = {"timeout", "failed"}
ALPHA = 0.01
MIN_JOURNEYS = 12  # short outages are small; Fisher's test guards significance
BASELINE_DAYS = 7
BASELINE_GAP_DAYS = 3  # gradual rollouts fail before the detected onset, so skip the days just before it


def journeys(f: Frames) -> pd.DataFrame:
    """One row per funnel order with a True/False column per stage, plus order attributes."""
    ev = f.events
    if "payment_status" not in ev or ev.empty:
        return pd.DataFrame()
    ev = ev[ev.event_type.isin(STAGES) & ~ev.payment_status.isin(FAILED_STATUSES)]
    upi = set(ev[ev.event_type == "order_draft_created"].order_id)
    if not upi:
        return pd.DataFrame()
    wide = (ev[ev.order_id.isin(upi)].assign(hit=True).pivot_table(index="order_id", columns="event_type", values="hit", aggfunc="any", fill_value=False))
    for stage in STAGES:
        if stage not in wide:
            wide[stage] = False
    wide = wide[STAGES].astype(bool).reset_index()
    return wide.merge(f.orders, left_on="order_id", right_on="external_order_id", how="inner")


def _mask(df: pd.DataFrame, segment: dict) -> pd.Series:
    m = pd.Series(True, index=df.index)
    for col, value in (segment or {}).items():
        if col not in df:
            return pd.Series(False, index=df.index)
        m &= df[col].astype(str) == str(value)
    return m


def _rates(df: pd.DataFrame) -> list[dict]:
    out = []
    for a, b in zip(STAGES, STAGES[1:]):
        entered = int(df[a].sum())
        passed = int((df[a] & df[b]).sum())
        out.append({"stage": b, "entered": entered, "passed": passed, "conversion": round(passed / entered, 5) if entered else None})
    return out


def _p(cur: dict, ref: dict) -> float:
    """One-sided: is current conversion lower than the reference conversion?"""
    table = [[cur["passed"], cur["entered"] - cur["passed"]], [ref["passed"], ref["entered"] - ref["passed"]]]
    return float(stats.fisher_exact(table, alternative="less")[1])


def funnel_breakpoint(f: Frames, segment: dict | None, start, end=None) -> dict:
    """Conversion per stage against the segment's own baseline and its complement; returns the biggest significant drop."""
    start, end = pd.Timestamp(start), pd.Timestamp(end) if end is not None else f.as_of
    j = journeys(f)
    result = {"segment": segment or {}, "window": {"start": start.isoformat(), "end": end.isoformat()}, "stages": [], "breakpoint": None, "telemetry_available": not j.empty}
    if j.empty:
        return result
    seg = _mask(j, segment or {})
    now = (j.ordered_at >= start) & (j.ordered_at <= end)
    base_end = start - timedelta(days=BASELINE_GAP_DAYS)
    base = (j.ordered_at < base_end) & (j.ordered_at >= base_end - timedelta(days=BASELINE_DAYS))
    current, baseline = _rates(j[seg & now]), _rates(j[seg & base])
    complement = _rates(j[~seg & now]) if segment else None
    best = None
    for i, stage in enumerate(current):
        ref, comp = baseline[i], complement[i] if complement else None
        row = {**stage, "baseline_conversion": ref["conversion"], "complement_conversion": comp["conversion"] if comp else None,
               "drop_vs_baseline": None, "p_vs_baseline": None, "p_vs_complement": None, "significant": False}
        # A new segment such as a fresh app version has no history, so its complement is the only reference.
        has_base = ref["entered"] >= MIN_JOURNEYS
        has_comp = bool(comp and comp["entered"] >= MIN_JOURNEYS)
        if stage["entered"] and (has_base or has_comp):
            reference = ref if has_base else comp
            row["drop_vs_baseline"] = round(reference["conversion"] - stage["conversion"], 5)
            row["p_vs_baseline"] = _p(stage, ref) if has_base else None
            row["p_vs_complement"] = _p(stage, comp) if has_comp else None
            passes = [p < ALPHA for p in (row["p_vs_baseline"], row["p_vs_complement"]) if p is not None]
            row["significant"] = stage["entered"] >= MIN_JOURNEYS and all(passes) and row["drop_vs_baseline"] > 0
            if row["significant"] and (best is None or row["drop_vs_baseline"] > best["drop_vs_baseline"]):
                best = row
        result["stages"].append(row)
    if best:
        result["breakpoint"] = {k: best[k] for k in ("stage", "conversion", "baseline_conversion", "complement_conversion", "drop_vs_baseline", "p_vs_baseline", "p_vs_complement", "entered")}
    return result
