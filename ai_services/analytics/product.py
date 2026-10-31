"""Product domain analytics: classification, detection, court, impact and interventions.

Results use the same shapes as the payments pipeline, so Node, the graph, briefs, approvals and KPIs
are reused unchanged. Numbers come from code. Sentiment is excluded.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LogisticRegression

from ai_services.analytics import data
from ai_services.analytics.extraction import redact
from ai_services.analytics.signals import severity

META = Path(__file__).resolve().parents[1] / "data" / "synthetic_product" / "meta.json"
SUPPORTED, REJECTED, UNTESTED, INCONCLUSIVE = "supported", "rejected", "untested", "inconclusive"
OVERLAPPING = "overlapping"
TEST_NAMES = ["concentration", "rate_lift", "control_test", "timing", "agreement"]
WEIGHTS = {"concentration": 0.15, "rate_lift": 0.2, "control_test": 0.35, "timing": 0.1, "agreement": 0.2}
CREDIT = {SUPPORTED: 1.0, INCONCLUSIVE: 0.35, UNTESTED: 0.0, REJECTED: 0.0}
SUSPECTS = ["batch_id", "supplier", "firmware", "campaign_id", "city", "buyer_type", "courier_incident"]
BROADER = {"supplier": "batch_id"}
ISSUE = "charging_issue"
RULES = [
    ("charging_issue", r"not charg|won'?t charg|will not charg|stop(ped)? charg|no charg|charging (case|issue|problem)|does(n't| not) charg"),
    ("battery_drain", r"battery|backup|drain"),
    ("connectivity", r"connect|pair|bluetooth|disconnect"),
    ("physical_damage", r"broken|damage|crack|dent"),
    ("delivery_issue", r"deliver|courier|late\b"),
    ("price_value", r"price|value for money|worth|costly|expensive"),
    ("quality", r"quality|sound|bass|poor|bad|defect|waste"),
]
RULES = [(k, re.compile(p, re.I)) for k, p in RULES]
UNIT_REPLACEMENT_COST = 1400


def classify(text: str, rating=None) -> dict:
    category = next((name for name, p in RULES if p.search(text or "")), "praise_or_neutral")
    if category != ISSUE and rating is not None and rating >= 4 and category not in ("connectivity", "battery_drain"):
        category = "praise_or_neutral"
    sentiment = "positive" if rating and rating >= 4 else "negative" if rating and rating <= 2 else "neutral"
    return {"category": category, "sentiment": sentiment, "urgency": "high" if category == ISSUE else "medium" if sentiment == "negative" else "low",
            "pain_point": redact(text)[:120], "component": "product", "reference": None, "financial_loss": False, "actionable": sentiment == "negative",
            "language": "en", "summary": redact(text)[:160], "extractor": "rules"}


@dataclass
class World:
    orders: pd.DataFrame
    returns: pd.DataFrame
    tickets: pd.DataFrame
    reviews: pd.DataFrame
    batches: pd.DataFrame
    firmware: pd.DataFrame
    campaigns: pd.DataFrame
    couriers: pd.DataFrame
    as_of: pd.Timestamp


def as_of() -> pd.Timestamp:
    return pd.Timestamp(json.loads(META.read_text(encoding="utf-8"))["as_of"]).tz_localize(None)


def load_world() -> World:
    conn = data.connect()
    try:
        q = lambda sql: data._query(conn, sql)  # noqa: E731
        w = World(q("SELECT * FROM product_orders"), q("SELECT * FROM product_returns"), q("SELECT * FROM product_tickets"),
                  q("SELECT id, order_id, rating, text, category, event_timestamp FROM feedback WHERE domain = 'product' AND processing_status = 'processed'"),
                  q("SELECT * FROM product_batches"), q("SELECT * FROM product_firmware_releases"), q("SELECT * FROM product_campaigns"), q("SELECT * FROM product_courier_incidents"), as_of())
    finally:
        conn.close()
    for df, cols in ((w.orders, ["order_date", "delivery_date"]), (w.returns, ["returned_at"]), (w.tickets, ["opened_at"]), (w.reviews, ["event_timestamp"])):
        for c in cols:
            df[c] = pd.to_datetime(df[c])
    w.orders["price"] = w.orders.price.astype(float)
    return w


def _naive(s: pd.Series) -> pd.Series:
    return pd.to_datetime(s, utc=True).dt.tz_localize(None)


def world_from_generated(d: dict) -> World:
    orders = pd.DataFrame(d["orders"]).assign(order_date=lambda x: _naive(x.order_date), delivery_date=lambda x: _naive(x.delivery_date))
    returns = pd.DataFrame(d["returns"]).assign(returned_at=lambda x: _naive(x.returned_at))
    returns["id"] = range(1, len(returns) + 1)
    tickets = pd.DataFrame(d["tickets"]).assign(opened_at=lambda x: _naive(x.opened_at))
    tickets["id"] = range(1, len(tickets) + 1)
    reviews = pd.DataFrame(d["feedback"]).assign(event_timestamp=lambda x: _naive(x.event_timestamp))
    reviews["id"] = range(1, len(reviews) + 1)
    reviews["category"] = [classify(t, r)["category"] for t, r in zip(reviews.text, reviews.rating)]
    return World(orders, returns, tickets, reviews, pd.DataFrame(d["batches"]), pd.DataFrame(d["firmware_releases"]), pd.DataFrame(d["campaigns"]),
                 pd.DataFrame(d["courier_incidents"]), pd.Timestamp(d["meta"]["as_of"]).tz_localize(None))


def detect(w: World, window_days: int = 14) -> dict:
    end, start = w.as_of, w.as_of - timedelta(days=window_days)
    base_start = start - timedelta(days=window_days * 2)
    delivered = lambda a, b: int(((w.orders.delivery_date > a) & (w.orders.delivery_date <= b)).sum())  # noqa: E731
    units_now, units_base = delivered(start, end), delivered(base_start, start)
    r = w.reviews
    out, suppressed = [], []
    for category in sorted(set(r.category.dropna()) - {"praise_or_neutral"}):
        cur = r[(r.category == category) & (r.event_timestamp > start) & (r.event_timestamp <= end)]
        base = r[(r.category == category) & (r.event_timestamp > base_start) & (r.event_timestamp <= start)]
        base_rate = (len(base) + 0.5) / max(units_base, 1)
        expected = base_rate * units_now
        ratio = (len(cur) / max(units_now, 1)) / base_rate
        p = float(stats.poisson.sf(len(cur) - 1, max(expected, 0.5)))
        anomaly = min(50.0, -np.log10(max(p, 1e-300)))
        if len(cur) < 8 or ratio < 2 or anomaly < 3:
            suppressed.append({"category": category, "count": len(cur), "rate_ratio": round(ratio, 3), "reason": "Below sample, rate-ratio or significance threshold"})
            continue
        customers = cur.order_id.nunique()
        sev = severity(customers / max(units_now, 1), min(10.0, ratio), 0.6, min(1.0, anomaly / 10))
        out.append({"signal_key": f"product:{category}:{start.date()}", "category": category, "status": "open", "triage_reason": None,
                    "window_start": start.isoformat(), "window_end": end.isoformat(), "baseline_count": round(expected, 3), "current_count": len(cur),
                    "absolute_increase": round(len(cur) - expected, 3), "percent_increase": None, "anomaly_score": round(anomaly, 3), "severity_score": sev["score"], "severity": sev,
                    "affected_customers": customers, "metrics": {"rate_ratio": round(ratio, 3), "baseline_days": window_days * 2, "units_delivered_current": units_now, "poisson_p_value": p}})
    return {"as_of": end.isoformat(), "signals": sorted(out, key=lambda s: -s["severity_score"]), "suppressed": suppressed}


def outcomes(w: World) -> pd.DataFrame:
    """One row per unit with its issue flag from each independent source."""
    o = w.orders.copy()
    for col in SUSPECTS:
        o[col] = o[col].astype(object).where(o[col].notna(), "none").astype(str)
    o["from_reviews"] = o.order_id.isin(set(w.reviews[w.reviews.category == ISSUE].order_id))
    o["from_returns"] = o.order_id.isin(set(w.returns[w.returns.reason_code == "not_charging"].order_id))
    o["from_tickets"] = o.order_id.isin(set(w.tickets[w.tickets.topic == "not_charging"].order_id))
    o["issue"] = o.from_reviews | o.from_returns | o.from_tickets
    fail = pd.concat([w.returns[w.returns.reason_code == "not_charging"].rename(columns={"returned_at": "t"})[["order_id", "t"]],
                      w.tickets[w.tickets.topic == "not_charging"].rename(columns={"opened_at": "t"})[["order_id", "t"]]]).groupby("order_id").t.min()
    o["failed_at"] = o.order_id.map(fail)
    return o


def _result(status, explanation, **metrics):
    return {"status": status, "explanation": explanation, "result": metrics}


def _control(o: pd.DataFrame, flags: pd.DataFrame) -> dict:
    """Logistic regression fitted now, so each suspect's effect holds the others fixed. Nothing is saved."""
    model = LogisticRegression(C=5.0, max_iter=1000).fit(flags.to_numpy(float), o.issue.astype(int))
    return dict(zip(flags.columns, model.coef_[0]))


def test_all(o: pd.DataFrame, col: str, value: str, adjusted: float) -> dict:
    exposed = o[col] == value
    a, n, b, m = int(o[exposed].issue.sum()), int(exposed.sum()), int(o[~exposed].issue.sum()), int((~exposed).sum())
    total = max(a + b, 1)
    share = a / total
    tests = {}
    tests["concentration"] = (_result(SUPPORTED, f"{share:.0%} of affected units share this suspect.", share=round(share, 4), affected=a) if share >= 0.5 else
                              _result(REJECTED, f"Only {share:.0%} of affected units share this suspect.", share=round(share, 4), affected=a) if share < 0.25 else
                              _result(INCONCLUSIVE, f"{share:.0%} of affected units share this suspect.", share=round(share, 4), affected=a))
    r1, r0 = a / max(n, 1), (b + 0.5) / (m + 1)
    lift = r1 / r0
    p = float(stats.fisher_exact([[a, n - a], [b, max(m - b, 0)]], alternative="greater")[1])
    metrics = dict(exposed_rate=round(r1, 4), other_rate=round(r0, 4), lift=round(lift, 3), p_value=p, units=n)
    tests["rate_lift"] = (_result(SUPPORTED, f"Issue rate is {lift:.1f}x the rest.", **metrics) if lift >= 2 and p < 0.01 else
                          _result(REJECTED, f"Issue rate is similar to the rest (lift {lift:.2f}).", **metrics) if lift < 1.5 else
                          _result(INCONCLUSIVE, f"Lift of {lift:.2f} is not decisive.", **metrics))
    ratio = float(np.exp(adjusted))
    tests["control_test"] = (_result(SUPPORTED, f"With other suspects held fixed, odds are still {ratio:.1f}x higher.", adjusted_odds_ratio=round(ratio, 3)) if ratio >= 3 else
                             _result(REJECTED, f"The effect disappears once other suspects are held fixed (odds {ratio:.2f}x).", adjusted_odds_ratio=round(ratio, 3)) if ratio < 1.75 else
                             _result(INCONCLUSIVE, f"Adjusted odds of {ratio:.2f}x are not decisive.", adjusted_odds_ratio=round(ratio, 3)))
    delay = (o[exposed & o.failed_at.notna()].failed_at - o[exposed & o.failed_at.notna()].delivery_date).dt.days
    if len(delay) < 5:
        tests["timing"] = _result(UNTESTED, "Too few dated failures to test timing.", failures=len(delay))
    else:
        q1, q3 = delay.quantile(0.25), delay.quantile(0.75)
        m_ = dict(median_days=float(delay.median()), iqr_days=float(q3 - q1), failures=len(delay))
        tests["timing"] = (_result(SUPPORTED, f"Failures cluster about {delay.median():.0f} days after delivery.", **m_) if q3 - q1 <= 8 else
                           _result(INCONCLUSIVE, "Failure delay is spread widely.", **m_))
    sources = {}
    for s in ("from_reviews", "from_returns", "from_tickets"):
        x, y = o[exposed][s].mean(), (o[~exposed][s].sum() + 0.5) / (m + 1)
        sources[s[5:]] = round(float(x / y), 3)
    agree = sum(v >= 1.5 for v in sources.values())
    tests["agreement"] = (_result(SUPPORTED, "Reviews, tickets and returns all point here.", sources=sources) if agree == 3 else
                          _result(REJECTED, "The independent sources do not agree.", sources=sources) if agree <= 1 else
                          _result(INCONCLUSIVE, "Two of the three sources agree.", sources=sources))
    return tests


def verdict(tests: dict) -> dict:
    s = [t["status"] for t in tests.values()]
    conf = sum(WEIGHTS[k] * CREDIT[v["status"]] for k, v in tests.items())
    if s.count(REJECTED) >= 2 or tests["control_test"]["status"] == REJECTED or tests["rate_lift"]["status"] == REJECTED:
        return {"status": REJECTED, "confidence": round(min(conf, 0.2), 3)}
    if s.count(SUPPORTED) >= 4 and tests["control_test"]["status"] == SUPPORTED:
        return {"status": SUPPORTED, "confidence": round(min(conf, 0.95), 3)}
    return {"status": INCONCLUSIVE, "confidence": round(min(conf, 0.65), 3)}


def segments(o: pd.DataFrame) -> dict:
    rows = []
    total_aff = int(o.issue.sum())
    n_tests = sum(o[c].nunique() for c in SUSPECTS)
    for col in SUSPECTS:
        for value, g in o.groupby(col):
            a, n = int(g.issue.sum()), len(g)
            b, m = total_aff - a, len(o) - n
            if n < 30 or m == 0:
                continue
            rate, comp = a / n, b / m
            p = float(stats.fisher_exact([[a, n - a], [b, m - b]], alternative="greater")[1])
            lift = rate / comp if comp else None
            rows.append({"dimension": col, "segment_value": str(value), "affected_customers": a, "total_customers": n, "issue_rate": round(rate, 6), "comparison_rate": round(comp, 6),
                         "lift_ratio": round(lift, 3) if lift else None, "p_value": p, "significant": a >= 5 and (lift or 99) >= 2 and p < 0.01 / n_tests,
                         "coverage": round(a / max(total_aff, 1), 3), "limitations": "Issue flags combine reviews, tickets and returns; silent failures are undercounted."})
    rows.sort(key=lambda r: (not r["significant"], -(r["lift_ratio"] or 0)))
    top = next((r for r in rows if r["significant"] and r["coverage"] >= 0.5), None)
    return {"segments": rows[:25], "top_segment": top, "total_affected": total_aff, "population": len(o)}


def run_court(o: pd.DataFrame) -> dict:
    """Each suspect dimension puts forward its worst value, then all face the same five tests."""
    picks = {}
    for col in SUSPECTS:
        g = o[o[col] != "none"].groupby(col).issue.agg(["mean", "size"])
        g = g[g["size"] >= 30]
        if len(g):
            picks[col] = str(g["mean"].idxmax())
    flags = pd.DataFrame({f"{c}:{v}": (o[c] == v) for c, v in picks.items()})
    adjusted = _control(o, flags)
    out = []
    for col, value in picks.items():
        key = f"{col}:{value}"
        tests = test_all(o, col, value, adjusted[key])
        v = verdict(tests)
        supporting = [t["explanation"] for t in tests.values() if t["status"] == SUPPORTED]
        against = [t["explanation"] for t in tests.values() if t["status"] == REJECTED]
        missing = [f"{k}: {t['explanation']}" for k, t in tests.items() if t["status"] == UNTESTED]
        out.append({"hypothesis_key": key, "hypothesis": f"{col.replace('_', ' ')} {value} caused the charging failures", "status": v["status"], "confidence_score": v["confidence"],
                    "change_time": None, "predicted_stage": None, "tests": tests, "supporting_evidence": supporting, "contradicting_evidence": against, "missing_evidence": missing,
                    "evidence_references": [], "explanation": f"{sum(t['status'] == SUPPORTED for t in tests.values())} of 5 tests support this; {sum(t['status'] == REJECTED for t in tests.values())} reject it."})
    supported = {h["hypothesis_key"].split(":")[0] for h in out if h["status"] == SUPPORTED}
    for h in out:
        narrower = BROADER.get(h["hypothesis_key"].split(":")[0])
        if h["status"] == SUPPORTED and narrower in supported:
            h["status"] = OVERLAPPING
    out.sort(key=lambda h: (-h["confidence_score"], h["hypothesis_key"]))
    leader = next((h for h in out if h["status"] == SUPPORTED), None)
    best = leader or next((h for h in out if h["status"] == INCONCLUSIVE), None)
    start = o[o.failed_at.notna()].failed_at.min()
    return {"hypotheses": out, "verdict": best["hypothesis"] if leader else f"Unproven: {best['hypothesis']}" if best else "No hypothesis survived the court",
            "verdict_key": best["hypothesis_key"] if best else None, "verdict_status": best["status"] if best else INCONCLUSIVE, "confidence_score": best["confidence_score"] if best else 0.0,
            "reasons": (best["supporting_evidence"] + best["missing_evidence"]) if best else [], "onset": start.isoformat() if pd.notna(start) else None, "funnel": None,
            "analysis_start": start.isoformat() if pd.notna(start) else None, "tests_rerun": 5 * len(out), "tests_reused": 0,
            "limitations": ["Observational data: these tests support causal claims but cannot prove them."]}


def estimate(w: World, o: pd.DataFrame, court: dict) -> dict:
    key = court.get("verdict_key") or ""
    col, _, value = key.partition(":")
    scope = o[o[col] == value] if col in o else o.iloc[0:0]
    affected = scope[scope.issue]
    stock = 0
    if col == "batch_id":
        row = w.batches[w.batches.batch_id == value]
        stock = int((row.units_produced - row.units_sold).sum())
    sold = len(scope)
    rate = len(affected) / max(sold, 1)
    price = float(scope.price.mean()) if sold else 0.0
    expected_failures = round((sold - len(affected)) * rate)
    replacement = (len(affected) + expected_failures) * UNIT_REPLACEMENT_COST
    refund = (len(affected) + expected_failures) * price
    return {"measured": {"affected_customers": len(affected), "affected_units": len(affected), "units_sold_in_scope": sold, "stock_left": stock, "issue_rate": round(rate, 4)},
            "estimated": {"further_failures_expected": expected_failures, "replacement_cost": round(replacement, 2), "refund_cost": round(refund, 2)},
            "assumptions": [f"Unit replacement cost of {UNIT_REPLACEMENT_COST} is assumed.", "Further failures assume the observed rate holds for units not yet failed."],
            "states": {}, "reconciliation": None, "affected_customer_count": len(affected), "affected_order_count": len(affected), "estimated_business_impact": round(replacement, 2), "telemetry_available": True}


CATALOG = [
    ("quarantine_batch", "Quarantine the batch and stop sales", "Warehouse lead", 0, "No further customers receive a faulty unit", "complaint_rate_new_batches", "medium", 30, 0.9),
    ("replacement_offer", "Offer a replacement or refund (reply 1 or 2)", "Customer care lead", None, "Affected customers get a working unit or their money back", "replacement_acceptance_rate", "medium", 60, 0.3),
    ("supplier_escalation", "Escalate to the supplier", "Supplier quality manager", 0, "Root fault fixed for future batches", "complaint_rate_new_batches", "low", 120, 1.0),
    ("fast_track_refunds", "Fast-track refunds for returned units", "Finance lead", None, "Faster money back for customers who already returned", "not_charging_return_share", "low", 45, 0.4),
    ("batch_quality_check", "Run a quality check on the batch", "Quality lead", 15000, "Confirms the fault before more units ship", "complaint_rate_new_batches", "low", 240, 1.0),
]


def recommend_actions(court: dict, impact: dict, rejected: list | None = None) -> dict:
    rejected = set(rejected or [])
    conf = float(court.get("confidence_score") or 0)
    if court.get("verdict_status") != SUPPORTED:
        return {"recommendations": [], "policy_checks": [{"action": "all", "allowed": False, "reason": "No suspect is supported yet."}], "eligible_refund_orders": 0}
    est, units = impact["estimated"], impact["measured"]["affected_units"]
    costs = {"replacement_offer": est["replacement_cost"], "fast_track_refunds": est["refund_cost"]}
    out = []
    for key, title, owner, cost, benefit, kpi, risk, minutes, rev in CATALOG:
        if key in rejected:
            continue
        cost = costs.get(key, cost)
        parts = {"customer_benefit": 0.8, "urgency": 0.9 if key == "quarantine_batch" else 0.6, "confidence": conf, "reversibility": rev, "speed": 1 - min(minutes, 240) / 240}
        out.append({"action_key": key, "action_type": "simulate_product_action", "title": title, "description": f"{title}. Owner: {owner}.", "score": round(sum(parts.values()) / len(parts), 4),
                    "estimated_cost": cost, "expected_benefit": benefit, "risk_level": risk, "requires_approval": True,
                    "rationale": {"owner": owner, "kpi": kpi, "customer_benefit": benefit, "score_breakdown": {k: round(v, 3) for k, v in parts.items()}, "minutes": minutes, "target_count": units,
                                  "evidence_references": [{"tool": "run_root_cause_court", "path": "$.confidence_score", "value": conf}]}})
    out.sort(key=lambda r: -r["score"])
    for i, r in enumerate(out, 1):
        r["priority"] = i
    return {"recommendations": out, "policy_checks": [], "eligible_refund_orders": 0}


def kpi_baseline(w: World, o: pd.DataFrame, court: dict) -> dict:
    new = o[o.batch_id == (court.get("verdict_key") or ":").split(":")[-1]]
    share = (w.returns.reason_code == "not_charging").mean() * 100 if len(w.returns) else 0.0
    return {"complaint_rate_new_batches": round(100 * float(new.issue.mean()), 4) if len(new) else 0.0, "not_charging_return_share": round(float(share), 4), "replacement_acceptance_rate": 0.0}
