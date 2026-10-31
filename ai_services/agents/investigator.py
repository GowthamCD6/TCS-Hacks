"""Custom tool-calling investigation agent with a bounded loop and a full step trace.

The LLM may only choose the order of tools and word the conclusion. All numbers come from tools, and
with no LLM the fixed plan runs the same tools, so the incident is simply marked partially analysed.
"""

from __future__ import annotations

import json
import re
import time

import pandas as pd

from ai_services.agents import decision_brief
from ai_services.analytics import kg
from ai_services.analytics.data import Frames
from ai_services.config import ai_config
from ai_services.prompts.recoveriq import EXPLAIN_SYSTEM, NEXT_TOOL_SYSTEM
from ai_services.providers.groq_provider import LLMClient
from ai_services.tools.investigation_tools import FIXED_PLAN, TOOLS, Context

AGENT = "investigator"
# Which court tests each kind of new evidence can change.
EVIDENCE_TESTS = {
    "hotfix_deployed": set(),
    "approval_rejected": set(),
    "telemetry_missing": {"telemetry"},
    "new_complaints": {"segment_specificity", "telemetry", "dose_response", "counter_check"},
    "support_transcripts": {"segment_specificity", "dose_response"},
}


def lookup(outputs: dict, path: str):
    """Resolve 'tool.key[0].key' against tool outputs; None if the path is invalid."""
    cur = outputs
    for token in re.findall(r"[^.\[\]]+|\[\d+\]", path):
        try:
            cur = cur[int(token[1:-1])] if token.startswith("[") else cur[token]
        except (KeyError, IndexError, TypeError, ValueError):
            return None
    return cur


NUMBER_RE = re.compile(r"\d+(?:\.\d+)?")


def _rounds_to(shown: str, value) -> bool:
    """True when the number as written is the cited value, allowing only for display rounding."""
    try:
        decimals = len(shown.split(".")[1]) if "." in shown else 0
        return abs(float(shown) - float(value)) <= 0.5 * 10 ** -decimals + 1e-9
    except (TypeError, ValueError):
        return False


def _identifier_numbers(outputs: dict) -> set[str]:
    """Numbers inside names such as 'Android 14' or 'Release 2.3' are labels, not claims."""
    names = [lookup(outputs, "run_root_cause_court.verdict"), lookup(outputs, "analyze_segments.top_segment.segment_value")]
    return {n for name in names if isinstance(name, str) for n in NUMBER_RE.findall(name)}


def citable_facts(o: dict) -> dict:
    """The only values the LLM may cite, keyed by the exact path it must return."""
    court, seg, imp = o["run_root_cause_court"], o["analyze_segments"], o["estimate_impact"]
    paths = {"run_root_cause_court.confidence_score": court["confidence_score"]}
    if seg.get("top_segment"):
        for key in ("lift_ratio", "issue_rate", "comparison_rate", "affected_customers"):
            paths[f"analyze_segments.top_segment.{key}"] = seg["top_segment"][key]
    for key, value in imp.get("measured", {}).items():
        paths[f"estimate_impact.measured.{key}"] = value
    return {"citable_numbers": paths, "verdict": court["verdict"], "verdict_status": court["verdict_status"],
            "top_segment": (seg.get("top_segment") or {}).get("segment_value"),
            "rejected_hypotheses": [h["hypothesis"] for h in court["hypotheses"] if h["status"] == "rejected"],
            "missing_evidence": court["reasons"]}


def validate_sentences(sentences, outputs: dict) -> list[dict]:
    """Keep only sentences whose every number is backed by a real tool output path."""
    kept = []
    labels = _identifier_numbers(outputs)
    for s in sentences if isinstance(sentences, list) else []:
        if not isinstance(s, dict) or not isinstance(s.get("text"), str):
            continue
        used = s.get("numbers_used") or []
        valid = all(isinstance(u, dict) and _same(lookup(outputs, str(u.get("path"))), u.get("value")) for u in used)
        numbers = NUMBER_RE.findall(re.sub(r"(?<=\d),(?=\d)", "", s["text"]))
        if valid and all(n in labels or any(_rounds_to(n, u["value"]) for u in used) for n in numbers):
            kept.append({"text": s["text"], "numbers_used": used})
    return kept


def _same(actual, value) -> bool:
    try:
        return actual is not None and abs(float(actual) - float(value)) < 1e-6
    except (TypeError, ValueError):
        return actual == value


def template_sentences(o: dict) -> list[dict]:
    court, seg, imp = o["run_root_cause_court"], o["analyze_segments"], o["estimate_impact"]
    out = []
    hyps = court["hypotheses"]
    if hyps:
        idx = next((i for i, h in enumerate(hyps) if h["hypothesis_key"] == court["verdict_key"]), 0)
        conf = hyps[idx]["confidence_score"]
        out.append({"text": f"The court's leading finding is: {court['verdict']}, with confidence {conf}.",
                    "numbers_used": [{"value": conf, "path": f"run_root_cause_court.hypotheses[{idx}].confidence_score"}]})
    top = seg.get("top_segment")
    if top:
        out.append({"text": f"Customers in {top['segment_value']} report the issue at {top['lift_ratio']} times the rate of everyone else.",
                    "numbers_used": [{"value": top["lift_ratio"], "path": "analyze_segments.top_segment.lift_ratio"}]})
    measured = imp.get("measured", {})
    if "affected_order_count" in measured:
        out.append({"text": f"Telemetry shows {measured['affected_order_count']} affected orders, with {measured['captured_amount_at_risk']} still at risk.",
                    "numbers_used": [{"value": measured["affected_order_count"], "path": "estimate_impact.measured.affected_order_count"},
                                     {"value": measured["captured_amount_at_risk"], "path": "estimate_impact.measured.captured_amount_at_risk"}]})
    rejected = [h["hypothesis_key"] for h in hyps if h["status"] == "rejected"]
    if rejected:
        out.append({"text": "Rejected on the evidence: " + ", ".join(rejected) + ".", "numbers_used": []})
    return out


def _summary(name: str, out: dict) -> dict:
    """Compact, render-friendly output for the trace."""
    if name == "cluster_issues":
        return {"method": out["method"], "embedding": out["embedding"], "clusters": [{"label": c["label"], "size": c["size"]} for c in out["clusters"][:6]]}
    if name == "analyze_segments":
        return {"top_segment": out["top_segment"], "population": out.get("population"), "total_affected": out.get("total_affected")}
    if name == "run_root_cause_court":
        return {"verdict": out["verdict"], "verdict_status": out["verdict_status"], "confidence_score": out["confidence_score"],
                "hypotheses": [{"key": h["hypothesis_key"], "status": h["status"], "tests": {k: v["status"] for k, v in h["tests"].items()}} for h in out["hypotheses"]],
                "tests_rerun": out["tests_rerun"], "tests_reused": out["tests_reused"]}
    if name == "propose_hypotheses":
        return {"accepted": len(out["accepted"]), "rejected": out["rejected"], "generator": out["generator"]}
    if name == "find_shared_components":
        return {"top": out["components"][:3], "failing_journeys": out.get("failing_journeys"), "label": out.get("label")}
    if name == "check_refund_eligibility":
        return {"eligible_orders": len(out["eligible"]), "eligible_amount": out["eligible_amount"], "blocked_reason": out.get("blocked_reason")}
    if name == "recommend_interventions":
        return {"ranked": [{"action": r["action_key"], "score": r["score"]} for r in out["recommendations"]], "policy_checks": out["policy_checks"]}
    return out


def _references(name: str, out: dict) -> list[dict]:
    if name == "cluster_issues":
        return [{"source_table": "feedback", "source_record_id": str(i)} for c in out["clusters"][:3] for i in c["feedback_ids"][:3]]
    if name == "run_root_cause_court":
        return [r for h in out["hypotheses"] for r in h["evidence_references"]]
    if name == "gather_signal_context":
        return [{"source_table": "operational_events", "source_record_id": str(c["event_id"])} for c in out["recent_changes"]]
    return []


def _collect_evidence(ctx: Context) -> list[dict]:
    o, ev = ctx.outputs, []
    court = o["run_root_cause_court"]
    key = court.get("verdict_key")
    for c in o["cluster_issues"]["clusters"][:3]:
        rep = c["representative_feedback_id"]
        ts = c["time_window"]["first_seen"]
        ev.append({"evidence_type": "customer_feedback", "source_table": "feedback", "source_record_id": str(rep),
                   "description": c["representative_issue"][:240], "evidence_timestamp": ts, "relevance_score": c["confidence"], "supports_hypothesis": key})
    for h in court["hypotheses"]:
        for r in h["evidence_references"]:
            ev.append({"evidence_type": "operational_context", **r, "evidence_timestamp": None, "relevance_score": h["confidence_score"], "supports_hypothesis": h["hypothesis_key"]})
    if ctx.telemetry_available:
        eligible = o["check_refund_eligibility"]["eligible"][:10]
        ids = {e["order_id"] for e in eligible}
        cap = ctx.f.events[(ctx.f.events.event_type == "payment_captured") & ctx.f.events.order_id.isin(ids)]
        for e in cap.itertuples():
            ev.append({"evidence_type": "payment_telemetry", "source_table": "operational_events", "source_record_id": str(e.id),
                       "description": f"Payment captured for {e.order_id} with no order_created event", "evidence_timestamp": e.event_timestamp.isoformat(),
                       "relevance_score": 0.9, "supports_hypothesis": key})
    return ev


def _pick_next(ctx: Context, remaining: list[str]) -> tuple[str, str]:
    ready = [t for t in remaining if all(n in ctx.outputs for n in TOOLS[t].needs)]
    default = ready[0]
    gathered = {k: _summary(k, v) for k, v in ctx.outputs.items()}
    got = ctx.llm.json(NEXT_TOOL_SYSTEM, json.dumps({"allowed": ready, "evidence_so_far": gathered}, default=str)[:6000], 80)
    if got and got.get("tool") in ready:
        return got["tool"], str(got.get("reason", ""))[:200]
    return default, "Fixed plan: next evidence gap in order."


def run(f: Frames, category: str, window_start: str, run_type: str = "investigation", telemetry_available: bool = True,  # noqa: PLR0913
        fix_deployed: bool = False, rejected_actions: list | None = None, evidence_kinds: list | None = None,
        prior_tests: dict | None = None, llm: LLMClient | None = None, incident_id: int = 0) -> dict:
    started = time.perf_counter()
    only = None
    if evidence_kinds and prior_tests:
        only = set().union(*(EVIDENCE_TESTS.get(k, set(EVIDENCE_TESTS["new_complaints"])) for k in evidence_kinds))
    ctx = Context(f, category, pd.Timestamp(window_start).tz_localize(None) if pd.Timestamp(window_start).tzinfo else pd.Timestamp(window_start),
                  telemetry_available, fix_deployed, rejected_actions or [], only, prior_tests, llm or LLMClient())
    steps = [{"agent_name": "planner", "tool_name": None, "status": "completed", "duration_ms": 0, "evidence_references": [],
              "input_summary": {"category": category, "window_start": str(window_start), "run_type": run_type, "evidence_kinds": evidence_kinds or []},
              "output_summary": {"plan": FIXED_PLAN, "tests_to_rerun": sorted(only) if only is not None else "all",
                                 "mode": "llm" if ctx.llm.enabled else "fixed_plan_no_llm"}}]
    remaining = list(FIXED_PLAN)
    while remaining:
        out_of_budget = len(steps) >= ai_config.AGENT_MAX_STEPS or time.perf_counter() - started > ai_config.AGENT_MAX_SECONDS
        # Budgets stop LLM deliberation, not the deterministic pipeline, so a report is always complete.
        name, reason = (remaining[0], "Budget reached: finishing the fixed plan.") if out_of_budget else _pick_next(ctx, remaining)
        tool = TOOLS[name]
        t0 = time.perf_counter()
        try:
            out = tool.fn(ctx, tool.args())
            ctx.outputs[name] = out
            status = "completed"
        except Exception as exc:
            ctx.llm.failed = True
            steps.append({"agent_name": AGENT, "tool_name": name, "status": "failed", "duration_ms": int((time.perf_counter() - t0) * 1000),
                          "input_summary": {"reason": reason}, "output_summary": {"error": type(exc).__name__}, "evidence_references": []})
            raise
        remaining.remove(name)
        steps.append({"agent_name": AGENT, "tool_name": name, "status": status, "duration_ms": int((time.perf_counter() - t0) * 1000),
                      "input_summary": {"reason": reason}, "output_summary": _summary(name, out), "evidence_references": _references(name, out)})
        if name == "run_root_cause_court":
            missing = sorted({m.split(":")[0] for h in out["hypotheses"] for m in h["missing_evidence"]})
            if missing:
                steps.append({"agent_name": AGENT, "tool_name": "request_additional_evidence", "status": "completed", "duration_ms": 0,
                              "input_summary": {"reason": "Court reported untested evidence"}, "output_summary": {"requested": missing}, "evidence_references": []})

    sentences = template_sentences(ctx.outputs)
    used_llm = False
    if ctx.llm.enabled:
        got = ctx.llm.json(EXPLAIN_SYSTEM, json.dumps(citable_facts(ctx.outputs), default=str)[:7000], 500)
        checked = validate_sentences((got or {}).get("sentences"), ctx.outputs)
        if checked:
            sentences, used_llm = checked, True
    partially = not used_llm
    brief = decision_brief.generate(decision_brief.brief_inputs(ctx.outputs["run_root_cause_court"], ctx.outputs["estimate_impact"], ctx.outputs["recommend_interventions"]), ctx.llm)
    steps.append({"agent_name": "reporter", "tool_name": None, "status": "completed", "duration_ms": 0, "evidence_references": [],
                  "input_summary": {"llm_conclusion": used_llm}, "output_summary": {"explanation": sentences}})
    for i, s in enumerate(steps, 1):
        s["step_number"] = i
    o = ctx.outputs
    return {
        "steps": steps, "signal_context": o["gather_signal_context"], "clusters": o["cluster_issues"], "segments": o["analyze_segments"],
        "court": o["run_root_cause_court"], "impact": o["estimate_impact"], "eligibility": o["check_refund_eligibility"],
        "recommendations": o["recommend_interventions"], "evidence": _collect_evidence(ctx), "explanation": sentences,
        "shared_components": o["find_shared_components"], "kg": kg.build(incident_id, o), "decision_brief": brief,
        "proposed_hypotheses": o["propose_hypotheses"],
        "partially_analyzed": partially, "llm_tokens": ctx.llm.tokens, "duration_ms": int((time.perf_counter() - started) * 1000),
    }
