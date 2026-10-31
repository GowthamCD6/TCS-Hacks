"""Segment lift: issue rates against each segment's population, never raw complaint counts."""

from __future__ import annotations

from datetime import timedelta

import pandas as pd
from scipy import stats

from ai_services.analytics.data import Frames

MIN_SEGMENT = 30
MIN_AFFECTED = 5
MIN_LIFT = 2.0
ALPHA = 0.01


def population(f: Frames, start: pd.Timestamp) -> pd.DataFrame:
    """One row per customer active in the window, using attributes as of their latest order."""
    o = f.orders[f.orders.ordered_at > start].sort_values("ordered_at")
    if o.empty:
        return pd.DataFrame()
    grouped = o.groupby("customer_id")
    pop = grouped.agg(platform=("platform", "last"), device_os=("device_os", "last"), app_version=("app_version", "last"),
                      city=("city", "last"), orders=("external_order_id", "count"),
                      bank=("bank", "last"), payment_gateway=("payment_gateway", "last"),
                      payment_method=("payment_method", lambda s: s.mode().iat[0] if len(s.mode()) else None)).reset_index()
    pop["app_version"] = pop.app_version.astype(str)
    c = f.customers[["id", "customer_segment", "first_order_at"]].rename(columns={"id": "customer_id", "customer_segment": "value_tier"})
    pop = pop.merge(c, on="customer_id", how="left")
    pop["customer_type"] = (pop.first_order_at >= start - timedelta(days=30)).map({True: "new", False: "returning"})
    pop["frequency"] = pd.cut(pop.orders, [0, 1, 3, 10_000], labels=["1_order", "2_3_orders", "4_plus_orders"]).astype(str)
    pop["device_os__app_version"] = pop.device_os + " | v" + pop.app_version
    pop["device_os__app_version__payment"] = pop.device_os__app_version + " | " + pop.payment_method.fillna("unknown")
    return pop


DIMENSIONS = ["platform", "device_os", "app_version", "city", "payment_method", "bank", "payment_gateway", "customer_type", "frequency",
              "value_tier", "device_os__app_version", "device_os__app_version__payment"]


def analyze(f: Frames, category: str, start) -> dict:
    start = pd.Timestamp(start)
    pop = population(f, start)
    fb = f.feedback[(f.feedback.category == category) & (f.feedback.event_timestamp > start)]
    if pop.empty:
        return {"segments": [], "top_segment": None, "total_affected": 0, "population": 0}
    pop["affected"] = pop.customer_id.isin(set(fb.customer_id.dropna()))
    total_aff, total = int(pop.affected.sum()), len(pop)
    n_tests = sum(pop[d].nunique() for d in DIMENSIONS)
    rows = []
    for dim in DIMENSIONS:
        for value, g in pop.groupby(dim):
            a, n = int(g.affected.sum()), len(g)
            b, m = total_aff - a, total - n
            if m == 0 or n < MIN_SEGMENT:
                continue
            rate, comp = a / n, b / m
            p = float(stats.fisher_exact([[a, n - a], [b, m - b]], alternative="greater")[1])
            lift = rate / comp if comp > 0 else None
            significant = a >= MIN_AFFECTED and (lift is None or lift >= MIN_LIFT) and p < ALPHA / max(n_tests, 1)
            rows.append({
                "dimension": dim, "segment_value": str(value), "affected_customers": a, "total_customers": n,
                "issue_rate": round(rate, 6), "comparison_rate": round(comp, 6),
                "lift_ratio": round(lift, 3) if lift is not None else None, "p_value": p, "significant": significant,
                "coverage": round(a / max(total_aff, 1), 3),
                "limitations": "Observational comparison of complaining customers; silent victims are undercounted."
                               + ("" if a >= 20 else " Small affected count, treat the rate as approximate."),
            })
    rows.sort(key=lambda r: (not r["significant"], -(r["lift_ratio"] or 0)))
    # The narrowest significant segment still explaining at least half of the affected customers.
    top = next((r for r in rows if r["significant"] and r["coverage"] >= 0.5), None)
    return {"segments": rows[:25], "top_segment": top, "total_affected": total_aff, "population": total,
            "multiple_testing": {"tests": n_tests, "alpha": ALPHA, "correction": "bonferroni"}}
