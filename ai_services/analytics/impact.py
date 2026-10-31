"""Business impact from transaction state. Refund eligibility is decided here, never by a complaint."""

from __future__ import annotations

from datetime import timedelta

import pandas as pd

from ai_services.analytics.data import Frames
from ai_services.analytics.reconcile import OVERDUE, PENDING, public, reconcile
from ai_services.config import ai_config

ASSUMED_REPEAT_COMPLAINT_RATE = 0.25


def classify_orders(f: Frames, start: pd.Timestamp) -> pd.DataFrame:
    """One row per order with a verified payment state, derived only from telemetry."""
    o = f.orders[f.orders.ordered_at >= start][["external_order_id", "customer_id", "amount", "ordered_at", "payment_method"]].copy()
    ids = set(o.external_order_id)
    ev = f.events[f.events.order_id.isin(ids)]
    has = {t: set(g.order_id) for t, g in ev.groupby("event_type")}
    s = o.external_order_id
    isin = lambda t: s.isin(has.get(t, set()))  # noqa: E731
    state = pd.Series("completed", index=o.index, dtype=object)
    state[~isin("payment_initiated") & ~isin("order_created")] = "unknown_payment_state"
    state[isin("payment_initiated") & ~isin("payment_captured") & ~isin("payment_failed")] = "unknown_payment_state"
    state[isin("payment_failed")] = "failed_before_debit"
    state[isin("delivery_delayed")] = "delivery_problem"
    no_order = isin("payment_captured") & ~isin("order_created")
    state[no_order] = "captured_no_order"
    state[no_order & (isin("payment_reversed"))] = "debited_then_reversed"
    o["payment_state"] = state
    o["refunded"] = isin("payment_refunded")
    return o


def refund_eligibility(f: Frames, start, telemetry_available: bool = True) -> dict:
    """Eligible = verified captured, no order, not reversed, not refunded, past the settlement grace period."""
    if not telemetry_available:
        return {"eligible": [], "blocked_reason": "Payment telemetry is unavailable, so no transaction state can be verified.", "eligible_amount": 0.0}
    rows = reconcile(f, pd.Timestamp(start))["_rows"]
    grace = f.as_of - timedelta(minutes=ai_config.REFUND_GRACE_MINUTES)
    e = rows[rows.state.isin([PENDING, OVERDUE]) & ~rows.refunded & (rows.event_timestamp <= grace)]
    return {"eligible": [{"order_id": r.order_id, "customer_id": str(r.customer_id), "amount": float(r.amount), "state": r.state} for r in e.itertuples()],
            "eligible_amount": round(float(e.amount.sum()), 2), "blocked_reason": None,
            "policy": f"reconciled as captured with no order, not reversed, not refunded, older than {ai_config.REFUND_GRACE_MINUTES} minutes"}


def estimate(f: Frames, category: str, start, telemetry_available: bool = True) -> dict:
    start = pd.Timestamp(start)
    fb = f.feedback[(f.feedback.category == category) & (f.feedback.event_timestamp >= start)]
    complainers = fb.customer_id.nunique()
    repeat = int((fb.groupby("customer_id").size() > 1).sum())
    if not telemetry_available:
        return {
            "measured": {"complaining_customers": int(complainers), "complaints": len(fb)},
            "estimated": {}, "assumptions": ["Payment telemetry is unavailable; transaction amounts are not known."],
            "states": {}, "affected_customer_count": int(complainers), "affected_order_count": 0,
            "estimated_business_impact": 0.0, "telemetry_available": False,
        }
    o = classify_orders(f, start)
    groups = {k: {"orders": len(g), "amount": round(float(g.amount.sum()), 2)} for k, g in o.groupby("payment_state") if k != "completed"}
    bad = o[o.payment_state.isin(["captured_no_order", "debited_then_reversed"])] if category == "payment" else \
        o[o.payment_state == "delivery_problem"] if category == "delivery" else o.iloc[0:0]
    at_risk = o[(o.payment_state == "captured_no_order") & ~o.refunded]
    failed = o[o.payment_state.isin(["failed_before_debit", "unknown_payment_state"])]
    refunds = o[o.refunded]
    customers = set(bad.customer_id.dropna()) | set(fb.customer_id.dropna())
    repeat_rate = repeat / complainers if complainers else 0.0
    lost_value = float(bad.amount.sum())
    return {
        "measured": {
            "affected_order_count": len(bad), "failed_or_incomplete_transactions": len(failed) + len(bad),
            "captured_amount_at_risk": round(float(at_risk.amount.sum()), 2),
            "confirmed_refund_amount": round(float(refunds.amount.sum()), 2),
            "complaints": len(fb), "complaining_customers": int(complainers), "observed_repeat_complainers": repeat,
        },
        "estimated": {
            "estimated_lost_order_value": round(lost_value, 2),
            "estimated_repeat_complaints": round(max(repeat_rate, ASSUMED_REPEAT_COMPLAINT_RATE) * len(customers), 1),
        },
        "assumptions": [f"Repeat-complaint risk uses the larger of the observed rate and an assumed {ASSUMED_REPEAT_COMPLAINT_RATE:.0%}.",
                        "Lost order value assumes affected orders are not re-placed."],
        "states": groups, "reconciliation": public(reconcile(f, start)), "affected_customer_count": len(customers), "affected_order_count": len(bad),
        "estimated_business_impact": round(lost_value, 2), "telemetry_available": True,
    }
