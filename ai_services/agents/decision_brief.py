"""Decision brief for the human approver, and the testable-hypothesis proposer.

The LLM only words what the inputs say. Output failing the schema or numeric grounding is regenerated
once, then replaced by a template built directly from the same inputs.
"""

from __future__ import annotations

import json

import pandas as pd

from ai_services.analytics import grounding
from ai_services.analytics.funnel import STAGES
from ai_services.config import ai_config
from ai_services.prompts.recoveriq import BRIEF_SYSTEM, PROPOSER_SYSTEM
from ai_services.providers.groq_provider import LLMClient

BRIEF_KEYS = ["headline", "what_happened", "evidence", "options", "recommended_option", "if_rejected", "confidence_statement", "numbers_used"]
OPTION_KEYS = ["action", "customer_benefit", "business_cost", "risk", "reversible", "time_to_effect"]
SEGMENT_COLUMNS = {"bank", "payment_gateway", "psp_app", "os", "os_version", "app_version", "device_model", "network_type", "device_os", "payment_method", "city"}


def brief_inputs(court: dict, impact: dict, recommendations: dict) -> dict:
    reconciliation = impact.get("reconciliation") or {}
    return {
        "court": {"verdict": court["verdict"], "verdict_status": court["verdict_status"], "confidence_score": court["confidence_score"],
                  "reasons": court["reasons"], "breakpoint": (court.get("funnel") or {}).get("breakpoint"),
                  "rejected": [h["hypothesis"] for h in court["hypotheses"] if h["status"] == "rejected"]},
        "reconcile": {"states": reconciliation.get("states"), "reversal_tat_days": reconciliation.get("reversal_tat_days"), "overdue_count": len(reconciliation.get("overdue", []))},
        "impact": {"measured": impact.get("measured"), "estimated": impact.get("estimated"), "assumptions": impact.get("assumptions")},
        "options": [{"action": r["action_key"], "title": r["title"], "score": r["score"], "estimated_cost": r["estimated_cost"], "risk_level": r["risk_level"],
                     "requires_approval": r["requires_approval"], "minutes_to_effect": r["rationale"].get("minutes"), "reversibility": r["rationale"]["score_breakdown"]["reversibility"],
                     "alternative": r["rationale"].get("alternative")} for r in recommendations["recommendations"][:6]],
        "policy_checks": recommendations.get("policy_checks", []),
    }


def template_brief(i: dict) -> dict:
    court, states = i["court"], (i["reconcile"].get("states") or {})
    measured = i["impact"].get("measured") or {}
    pending = states.get("captured_no_order_pending_reversal", {})
    overdue = states.get("captured_no_order_overdue", {})
    point = court.get("breakpoint")
    numbers = [{"value": court["confidence_score"], "path": "court.confidence_score"}]
    evidence = [{"claim": r, "ref": "court.reasons"} for r in court["reasons"][:4]]
    if point:
        evidence.append({"claim": f"The payment funnel breaks at {point['stage']}, where conversion is {point['conversion']} against {point['baseline_conversion']}.", "ref": "court.breakpoint"})
        numbers += [{"value": point["conversion"], "path": "court.breakpoint.conversion"}, {"value": point["baseline_conversion"], "path": "court.breakpoint.baseline_conversion"}]
    what = f"{court['verdict']}."
    if pending or overdue:
        what += f" Reconciliation shows {pending.get('count', 0)} payments awaiting reversal and {overdue.get('count', 0)} overdue."
        numbers += [{"value": pending.get("count", 0), "path": "reconcile.states.captured_no_order_pending_reversal.count"},
                    {"value": overdue.get("count", 0), "path": "reconcile.states.captured_no_order_overdue.count"}]
    elif not states:
        what += " Transaction state cannot be verified because payment telemetry is unavailable."
    options = [{"action": o["action"], "customer_benefit": o["title"], "business_cost": o["estimated_cost"] if o["estimated_cost"] is not None else "Not estimated",
                "risk": o["risk_level"], "reversible": o["reversibility"] >= 0.7, "time_to_effect": f"{o['minutes_to_effect']} minutes" if o["minutes_to_effect"] else "Not estimated"}
               for o in i["options"]]
    first = i["options"][0] if i["options"] else None
    second = i["options"][1] if len(i["options"]) > 1 else None
    return {
        "headline": court["verdict"], "what_happened": what, "evidence": evidence, "options": options,
        "recommended_option": first["action"] if first else "No action available",
        "if_rejected": f"The next ranked option is {second['action']}." if second else "No alternative is available, so the incident stays open.",
        "confidence_statement": f"The court status is {court['verdict_status']} with confidence {court['confidence_score']}. This is observational evidence, not proof. Measured at-risk amount: {measured.get('captured_amount_at_risk', measured.get('affected_units', 'unknown'))}.",
        "numbers_used": numbers,
    }


def _valid(brief) -> bool:
    if not isinstance(brief, dict) or any(k not in brief for k in BRIEF_KEYS):
        return False
    if not isinstance(brief["evidence"], list) or not isinstance(brief["options"], list) or not brief["options"]:
        return False
    return all(isinstance(o, dict) and all(k in o for k in OPTION_KEYS) for o in brief["options"])


def generate(inputs: dict, llm: LLMClient | None = None, job: str = "decision_brief") -> dict:
    llm = llm or LLMClient()
    fallback = template_brief(inputs)
    if not llm.enabled:
        return {"brief": fallback, "generator": "template", "grounding": {"passed": True, "attempts": 0}}
    payload = json.dumps(inputs, default=str)
    note = ""
    for attempt in (1, 2):
        got = llm.json(BRIEF_SYSTEM, payload + note, 1500)
        if not _valid(got):
            grounding.log(job, ai_config.GROQ_MODEL, False, attempt, ["invalid_schema"])
            note = "\nThe previous reply did not match the schema."
            continue
        result = grounding.check(got, inputs)
        grounding.log(job, ai_config.GROQ_MODEL, result["passed"], attempt, result["unbacked"])
        if result["passed"]:
            return {"brief": got, "generator": "llm", "grounding": {"passed": True, "attempts": attempt}}
        note = f"\nThese values are not in the input, so remove them: {result['unbacked']}"
    return {"brief": fallback, "generator": "template", "grounding": {"passed": False, "attempts": 2}}


def validate_proposal(p: dict, stages=STAGES) -> tuple[bool, str]:
    """A proposal must name a testable component, or it never reaches the court."""
    if not isinstance(p, dict):
        return False, "not an object"
    if p.get("predicted_break_stage") not in stages:
        return False, "unknown funnel stage"
    segment = p.get("predicted_segment")
    if not isinstance(segment, dict) or not segment or not set(segment) <= SEGMENT_COLUMNS:
        return False, "segment must use known columns"
    if not isinstance(p.get("component"), str) or not p["component"].strip():
        return False, "no component"
    try:
        pd.Timestamp(p.get("predicted_onset"))
    except (TypeError, ValueError):
        return False, "onset is not a date"
    return True, ""


def propose(graph_summary: dict, llm: LLMClient) -> dict:
    if not llm.enabled:
        return {"accepted": [], "rejected": [], "generator": "none"}
    got = llm.json(PROPOSER_SYSTEM, json.dumps(graph_summary, default=str)[:5000], 700) or {}
    accepted, rejected = [], []
    for p in (got.get("hypotheses") or [])[:3]:
        ok, why = validate_proposal(p)
        (accepted if ok else rejected).append(p if ok else {"proposal": p, "reason": why})
    return {"accepted": accepted, "rejected": rejected, "generator": "llm"}
