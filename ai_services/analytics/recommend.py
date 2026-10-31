"""Intervention ranking. Policy and eligibility are deterministic; an LLM may only reword descriptions."""

from __future__ import annotations

WEIGHTS = {"customer_benefit": 0.3, "urgency": 0.2, "confidence": 0.2, "reversibility": 0.1, "speed": 0.1, "low_risk": 0.05, "low_cost": 0.05}
RISK_SCORE = {"low": 1.0, "medium": 0.6, "high": 0.25}

# key: adapter, title, benefit, urgency, cost, minutes, risk, reversibility, approval
CATALOG = {
    "rollback_release": ("simulate_feature_flag_change", "Roll back the suspected release", 0.95, 0.95, 0, 45, "high", 0.8, True),
    "disable_feature_flag": ("simulate_feature_flag_change", "Disable the affected feature with a flag for the segment", 0.85, 0.9, 0, 15, "medium", 0.95, True),
    "reconcile_payments": ("simulate_support_ticket", "Reconcile captured payments that have no order", 0.6, 0.8, 0, 30, "low", 1.0, False),
    "issue_eligible_refunds": ("simulate_refund", "Refund verified captured payments without orders", 0.8, 0.8, None, 60, "medium", 0.3, True),
    "notify_customers": ("simulate_customer_notification", "Notify verified affected customers", 0.5, 0.6, 0, 20, "low", 0.2, True),
    "goodwill_coupon": ("simulate_coupon", "Offer a goodwill coupon to verified affected customers", 0.35, 0.3, None, 20, "low", 0.2, True),
    "update_support_scripts": ("simulate_support_ticket", "Update support scripts with the verified failure", 0.3, 0.5, 0, 15, "low", 1.0, False),
    "create_support_incident": ("simulate_support_ticket", "Open a coordinated support incident", 0.35, 0.6, 0, 10, "low", 1.0, False),
    "escalate_gateway": ("simulate_support_ticket", "Escalate to the payment gateway provider", 0.5, 0.7, 0, 30, "low", 1.0, False),
    "restore_telemetry": ("simulate_support_ticket", "Restore payment telemetry before any money moves", 0.6, 0.95, 0, 30, "low", 1.0, False),
    "monitor_hotfix": ("simulate_support_ticket", "Monitor the deployed hotfix against recovery KPIs", 0.6, 0.7, 0, 5, "low", 1.0, False),
}
ALTERNATIVE_FOR = {
    "rollback_release": ("disable_feature_flag", "A flag limits the blast radius to the affected segment but leaves the release live, so the underlying defect remains until a fix ships."),
    "disable_feature_flag": ("create_support_incident", "No technical mitigation will run; customers stay exposed and support absorbs the failures."),
    "issue_eligible_refunds": ("reconcile_payments", "Reconciliation verifies money owed without paying it, so customers wait longer."),
    "notify_customers": ("update_support_scripts", "Support answers those who ask, but silent victims are not told."),
}


def _candidates(court: dict, impact: dict, telemetry: bool, fix_deployed: bool) -> list[str]:
    leader = next((h for h in court["hypotheses"] if h["status"] == "supported"), None)
    key = court.get("verdict_key") or ""
    out = ["create_support_incident", "update_support_scripts"]
    if not telemetry:
        return out + ["restore_telemetry"]
    release_led = bool(leader and leader["hypothesis_key"].startswith("release_"))
    if fix_deployed:
        out.append("monitor_hotfix")
    elif release_led:
        out += ["rollback_release", "disable_feature_flag"]
    if key == "payment_gateway_regression" or any(h["hypothesis_key"] == "payment_gateway_regression" and h["status"] != "rejected"
                                                  for h in court["hypotheses"]):
        out.append("escalate_gateway")
    if impact.get("measured", {}).get("captured_amount_at_risk", 0) > 0:
        out.append("reconcile_payments")
    return out


def recommend(court: dict, impact: dict, eligibility: dict, telemetry_available: bool = True, fix_deployed: bool = False,
              rejected_actions: list[str] | None = None) -> dict:
    rejected = set(rejected_actions or [])
    conf = float(court.get("confidence_score") or 0)
    candidates = _candidates(court, impact, telemetry_available, fix_deployed)
    n_eligible = len(eligibility.get("eligible", []))
    verified_customers = len({e["customer_id"] for e in eligibility.get("eligible", [])})
    policy: list[dict] = []
    if n_eligible:
        candidates += ["issue_eligible_refunds", "notify_customers", "goodwill_coupon"]
    else:
        policy.append({"action": "issue_eligible_refunds", "allowed": False,
                       "reason": eligibility.get("blocked_reason") or "No orders meet the verified refund policy."})
    alternatives = {}
    for key in list(candidates):
        if key in rejected:
            candidates.remove(key)
            alt = ALTERNATIVE_FOR.get(key)
            if alt and alt[0] not in rejected:
                alternatives[alt[0]] = {"replaces": key, "trade_off": alt[1]}
                if alt[0] not in candidates:
                    candidates.append(alt[0])
    out = []
    for key in dict.fromkeys(candidates):
        adapter, title, benefit, urgency, cost, minutes, risk, rev, approval = CATALOG[key]
        if key == "issue_eligible_refunds":
            cost = eligibility["eligible_amount"]
        elif key == "goodwill_coupon":
            cost = 100.0 * verified_customers
        parts = {"customer_benefit": benefit, "urgency": urgency, "confidence": conf, "reversibility": rev,
                 "speed": 1 - min(minutes, 120) / 120, "low_risk": RISK_SCORE[risk], "low_cost": 1 - min((cost or 0) / 100000, 1)}
        score = sum(WEIGHTS[k] * v for k, v in parts.items())
        out.append({
            "action_key": key, "action_type": adapter, "title": title, "description": title + ".",
            "score": round(score, 4), "estimated_cost": cost,
            "expected_benefit": f"Benefit index {benefit:.2f}; about {minutes} minutes to implement", "risk_level": risk,
            "requires_approval": approval,
            "rationale": {"score_breakdown": {k: round(v, 3) for k, v in parts.items()}, "weights": WEIGHTS,
                          "evidence_references": [{"tool": "run_root_cause_court", "path": "$.confidence_score", "value": conf}],
                          "target_count": n_eligible if key in ("issue_eligible_refunds",) else verified_customers, "minutes": minutes,
                          **({"alternative": alternatives[key]} if key in alternatives else {})},
        })
    out.sort(key=lambda r: -r["score"])
    for i, r in enumerate(out, 1):
        r["priority"] = i
    return {"recommendations": out, "policy_checks": policy, "eligible_refund_orders": n_eligible}
