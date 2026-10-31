"""Recovery verification. An executed action is not recovery; sustained measured KPIs are."""

from __future__ import annotations

from datetime import datetime, timedelta

OPS = {"<=": lambda v, t: v <= t, ">=": lambda v, t: v >= t, "<": lambda v, t: v < t, ">": lambda v, t: v > t}


def _ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)


def verify(definitions: list[dict], measurements: list[dict], action_completed_at: str | None,
           mitigation_applied: bool, contradictory_evidence: int, now: str) -> dict:
    """Returns outcome: recovered | monitoring | not_recovered, with one result per KPI."""
    if not action_completed_at:
        return {"outcome": "monitoring", "reasons": ["No recovery action has completed."], "kpis": []}
    start, results, reasons = _ts(action_completed_at), [], []
    for d in definitions:
        pts = sorted(((_ts(m["measured_at"]), float(m["measured_value"])) for m in measurements
                      if m["kpi_name"] == d["name"] and _ts(m["measured_at"]) > start), key=lambda p: p[0])
        window = timedelta(minutes=d["monitoring_window_minutes"])
        check = OPS[d["comparison_operator"]]
        target = float(d["target_value"])
        latest = pts[-1][1] if pts else None
        meets = latest is not None and check(latest, target)
        # Sustained means the latest unbroken run of passing points covers the whole window.
        run_start = None
        for ts, v in reversed(pts):
            if not check(v, target):
                break
            run_start = ts
        sustained_for = (pts[-1][0] - run_start) if run_start else timedelta(0)
        sustained = sustained_for >= window
        window_elapsed = bool(pts) and pts[-1][0] - start >= window
        results.append({"name": d["name"], "unit": d["unit"], "target_value": target, "comparison_operator": d["comparison_operator"],
                        "latest_value": latest, "meets_target": meets, "sustained": sustained,
                        "sustained_minutes": int(sustained_for.total_seconds() // 60),
                        "monitoring_window_minutes": d["monitoring_window_minutes"], "required": bool(d.get("required_for_resolution", True)),
                        "measurements_after_action": len(pts), "window_elapsed": window_elapsed})
    required = [r for r in results if r["required"]]
    if contradictory_evidence > 0:
        reasons.append(f"{contradictory_evidence} contradictory evidence item(s) remain open.")
    if required and all(r["sustained"] for r in required) and contradictory_evidence == 0:
        return {"outcome": "recovered", "reasons": ["All required KPIs met target for their full monitoring window."], "kpis": results}
    failed = [r for r in required if r["window_elapsed"] and not r["meets_target"]]
    if failed and mitigation_applied:
        reasons.append("A mitigation ran but these KPIs still miss target: " + ", ".join(r["name"] for r in failed))
        return {"outcome": "not_recovered", "reasons": reasons, "kpis": results}
    reasons.append("Required KPIs have not yet held target for the full monitoring window.")
    return {"outcome": "monitoring", "reasons": reasons, "kpis": results}
