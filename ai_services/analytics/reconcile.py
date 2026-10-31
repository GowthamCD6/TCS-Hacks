"""Reconciliation joins debit records with orders. It is the source of truth for impact and refunds, never complaint text."""

from __future__ import annotations

from datetime import timedelta

import pandas as pd

from ai_services.analytics.data import Frames
from ai_services.config import ai_config

CREATED = "order_created"
PENDING = "captured_no_order_pending_reversal"
REVERSED = "captured_no_order_reversed"
OVERDUE = "captured_no_order_overdue"
UNKNOWN = "unknown"
STATES = [CREATED, PENDING, REVERSED, OVERDUE, UNKNOWN]


def mask_customer(value) -> str:
    text = str(value)
    return f"***{text[-3:]}" if len(text) > 3 else "***"


def reconcile(f: Frames, start=None, end=None) -> dict:
    """Every captured payment in the window ends in exactly one state."""
    start = pd.Timestamp(start) if start is not None else f.events.event_timestamp.min()
    end = pd.Timestamp(end) if end is not None else f.as_of
    ev = f.events
    captures = ev[(ev.event_type == "payment_captured") & (ev.event_timestamp >= start) & (ev.event_timestamp <= end)]
    captures = captures.sort_values("event_timestamp").drop_duplicates("order_id")
    created = set(ev[ev.event_type == CREATED].order_id)
    reversed_ids = set(ev[ev.event_type.isin(["reversal_completed", "payment_reversed"])].order_id)
    refunded = set(ev[ev.event_type == "payment_refunded"].order_id)
    known = set(f.orders.external_order_id)
    tat = timedelta(days=ai_config.UPI_REVERSAL_TAT_DAYS)

    state = pd.Series(PENDING, index=captures.index, dtype=object)
    state[captures.event_timestamp + tat < f.as_of] = OVERDUE
    state[captures.order_id.isin(reversed_ids)] = REVERSED
    state[~captures.order_id.isin(known) & ~captures.order_id.isin(created)] = UNKNOWN
    state[captures.order_id.isin(created)] = CREATED
    rows = captures.assign(state=state, refunded=captures.order_id.isin(refunded),
                           reversal_due_at=captures.event_timestamp + tat)
    summary = {s: {"count": int((rows.state == s).sum()), "amount": round(float(rows[rows.state == s].amount.fillna(0).sum()), 2)} for s in STATES}
    overdue = rows[rows.state == OVERDUE]
    return {
        "window": {"start": start.isoformat(), "end": end.isoformat()}, "as_of": f.as_of.isoformat(), "reversal_tat_days": ai_config.UPI_REVERSAL_TAT_DAYS,
        "captured_payments": len(rows), "states": summary,
        "overdue": [{"order_id": r.order_id, "customer": mask_customer(r.customer_id), "amount": float(r.amount), "captured_at": r.event_timestamp.isoformat(),
                     "reversal_due_at": r.reversal_due_at.isoformat(), "days_overdue": (f.as_of - r.reversal_due_at).days} for r in overdue.itertuples()],
        "_rows": rows[["order_id", "customer_id", "amount", "state", "refunded", "event_timestamp", "reversal_due_at"]],
    }


def public(result: dict) -> dict:
    return {k: v for k, v in result.items() if not k.startswith("_")}
