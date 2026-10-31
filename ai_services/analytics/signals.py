"""Emerging signal detection: complaint rate per order against a rolling baseline."""

from __future__ import annotations

import json
from datetime import timedelta

import numpy as np
import pandas as pd
from scipy import stats

from ai_services.analytics.data import Frames

HARM_WEIGHT = {"payment": 1.0, "delivery": 0.6}
DEFAULT_HARM = 0.3
TRACKED = ["payment", "delivery", "pricing", "food_quality", "app_ux"]
CONTEXT_EVENTS = {"delivery": "weather_alert", "pricing": "menu_price_change"}
MIN_COUNT = 8
MIN_RATE_RATIO = 2.0
MIN_ABS_INCREASE = 5.0
MIN_ANOMALY = 3.0  # -log10(p)


def _meta(value) -> dict:
    if isinstance(value, dict):
        return value
    try:
        return json.loads(value) if value else {}
    except (TypeError, ValueError):
        return {}


def severity(share: float, growth: float, harm: float, confidence: float) -> dict:
    """severity = affected_customers_share x growth_factor x harm_weight x confidence (capped at 1)."""
    inputs = {"affected_customers_share": round(share, 5), "growth_factor": round(growth, 3),
              "harm_weight": harm, "confidence": round(confidence, 3)}
    return {"score": round(min(1.0, share * growth * harm * confidence), 4), "inputs": inputs,
            "formula": "affected_customers_share * growth_factor * harm_weight * confidence"}


def _triage(f: Frames, cat: str, complaints: pd.DataFrame, start, end) -> tuple[str, str | None]:
    """Decide whether a statistical spike is incident-worthy or already explained by known context."""
    etype = CONTEXT_EVENTS.get(cat)
    if not etype:
        return "open", None
    ctx = f.events[(f.events.event_type == etype) & (f.events.event_timestamp <= end)]
    if ctx.empty:
        return "open", None
    if etype == "weather_alert":
        ctx = ctx[ctx.event_timestamp + timedelta(days=5) >= start]
        cities = set(ctx.city.dropna())
        if cities and not complaints.empty:
            by_city = complaints.merge(f.customers[["id", "city"]], left_on="customer_id", right_on="id", suffixes=("", "_c"))
            share = float(by_city.city.isin(cities).mean()) if len(by_city) else 0.0
            if share >= 0.6:
                return "explained", f"{share:.0%} of complaints are from cities under a weather alert ({', '.join(sorted(cities))})"
        return "open", None
    recent = ctx[ctx.event_timestamp >= start - timedelta(days=21)]
    if not recent.empty:
        return "watch", "Coincides with a planned menu price change; low harm, monitored without an incident"
    return "open", None


def detect(f: Frames, window_hours: int = 72, baseline_days: int = 21) -> dict:
    end = f.as_of
    start = end - timedelta(hours=window_hours)
    base_start = start - timedelta(days=baseline_days)
    fb = f.feedback[f.feedback.category.notna()]
    cur_orders = int(((f.orders.ordered_at > start) & (f.orders.ordered_at <= end)).sum())
    base_orders = int(((f.orders.ordered_at > base_start) & (f.orders.ordered_at <= start)).sum())
    active = max(1, f.orders[(f.orders.ordered_at > start)].customer_id.nunique())
    signals, suppressed = [], []

    in_cur = fb[(fb.event_timestamp > start) & (fb.event_timestamp <= end)]
    in_base = fb[(fb.event_timestamp > base_start) & (fb.event_timestamp <= start)]
    neg_cur, neg_base = in_cur[in_cur.category != "praise"], in_base[in_base.category != "praise"]
    if base_orders and cur_orders and len(neg_base):
        expected_raw = len(neg_base) * (window_hours / 24) / baseline_days
        vol = len(neg_cur) / max(expected_raw, 1)
        rate = (len(neg_cur) / cur_orders) / (len(neg_base) / base_orders)
        order_growth = (cur_orders / (window_hours / 24)) / (base_orders / baseline_days)
        suppressed.append({"category": "all", "raw_volume_ratio": round(vol, 3), "order_volume_ratio": round(order_growth, 3),
                           "rate_ratio": round(rate, 3),
                           "reason": "Overall volume is compared per order, so traffic growth alone cannot raise a signal"})

    for cat in TRACKED:
        cur = in_cur[in_cur.category == cat]
        base = in_base[in_base.category == cat]
        count = len(cur)
        slices = (base.event_timestamp - base_start).dt.total_seconds().div(window_hours * 3600).astype(int)
        n_slices = max(1, int(baseline_days * 24 / window_hours))
        per_slice = np.bincount(slices.clip(0, n_slices - 1), minlength=n_slices) if len(base) else np.zeros(n_slices)
        # Half a complaint of smoothing stops a tiny baseline producing a huge percentage.
        base_rate = (len(base) + 0.5) / max(base_orders, 1)
        expected = base_rate * cur_orders
        rate_ratio = (count / max(cur_orders, 1)) / base_rate
        p = float(stats.poisson.sf(count - 1, max(expected, 0.5)))
        anomaly = min(50.0, -np.log10(max(p, 1e-300)))
        med = float(np.median(per_slice))
        mad = float(stats.median_abs_deviation(per_slice))
        metrics = {
            "window_hours": window_hours, "baseline_days": baseline_days, "orders_current": cur_orders,
            "orders_baseline": base_orders, "complaints_per_1000_orders_current": round(1000 * count / max(cur_orders, 1), 3),
            "complaints_per_1000_orders_baseline": round(1000 * base_rate, 3), "rate_ratio": round(rate_ratio, 3),
            "expected_count": round(expected, 3), "poisson_p_value": p, "baseline_median_per_window": med,
            "baseline_mad_per_window": mad, "robust_z": round((count - med) / (1.4826 * mad), 3) if mad else None,
            "min_sample": MIN_COUNT,
        }
        abs_inc = count - expected
        if count < MIN_COUNT or rate_ratio < MIN_RATE_RATIO or abs_inc < MIN_ABS_INCREASE or anomaly < MIN_ANOMALY:
            suppressed.append({"category": cat, "count": count, "rate_ratio": round(rate_ratio, 3),
                               "reason": "Below sample, rate-ratio or significance threshold"})
            continue
        status, reason = _triage(f, cat, cur, start, end)
        customers = cur.customer_id.nunique()
        sev = severity(customers / active, min(10.0, rate_ratio), HARM_WEIGHT.get(cat, DEFAULT_HARM), min(1.0, anomaly / 10))
        signals.append({
            "signal_key": f"{cat}:{start.date()}", "category": cat, "status": status, "triage_reason": reason,
            "window_start": start.isoformat(), "window_end": end.isoformat(), "baseline_count": round(expected, 3),
            "current_count": count, "absolute_increase": round(abs_inc, 3),
            "percent_increase": round(100 * abs_inc / max(expected, 1), 2) if expected >= 3 else None,
            "anomaly_score": round(anomaly, 3), "severity_score": sev["score"], "severity": sev,
            "affected_customers": customers, "metrics": metrics,
        })
    signals.sort(key=lambda s: -s["severity_score"])
    return {"as_of": end.isoformat(), "signals": signals, "suppressed": suppressed}
