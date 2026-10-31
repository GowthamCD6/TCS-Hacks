"""Product investigation. Its result has the same shape as the payments agent, so Node stores it unchanged."""

from __future__ import annotations

import time

from ai_services.agents import decision_brief
from ai_services.analytics import clustering, kg, product
from ai_services.providers.groq_provider import LLMClient


def _step(n, tool, output, started):
    return {"step_number": n, "agent_name": "product_investigator", "tool_name": tool, "input_summary": {}, "output_summary": output, "evidence_references": [],
            "status": "completed", "duration_ms": int((time.perf_counter() - started) * 1000)}


def run(w: product.World, window_start: str, incident_id: int = 0, rejected_actions: list | None = None, llm: LLMClient | None = None) -> dict:
    started = time.perf_counter()
    llm = llm or LLMClient()
    o = product.outcomes(w)
    rows = [{"id": r.id, "text": r.text, "event_timestamp": r.event_timestamp.isoformat()} for r in w.reviews[w.reviews.category == product.ISSUE].itertuples()]
    clusters = clustering.cluster(rows)
    seg = product.segments(o)
    court = product.run_court(o)
    impact = product.estimate(w, o, court)
    recs = product.recommend_actions(court, impact, rejected_actions)
    outputs = {"cluster_issues": clusters, "analyze_segments": seg, "run_root_cause_court": court, "recommend_interventions": recs}
    brief = decision_brief.generate(decision_brief.brief_inputs(court, impact, recs), llm)
    top = seg.get("top_segment")
    sentences = [{"text": f"The court's leading finding is: {court['verdict']}.", "numbers_used": []}]
    if top:
        sentences.append({"text": f"{top['dimension']} {top['segment_value']} fails at {top['lift_ratio']} times the rate of other units.",
                          "numbers_used": [{"value": top["lift_ratio"], "path": "analyze_segments.top_segment.lift_ratio"}]})
    evidence = [{"evidence_type": "customer_feedback", "source_table": "feedback", "source_record_id": str(c["representative_feedback_id"]), "description": c["representative_issue"][:240],
                 "evidence_timestamp": c["time_window"]["first_seen"], "relevance_score": c["confidence"], "supports_hypothesis": court["verdict_key"]} for c in clusters["clusters"][:3]]
    bad = w.returns[w.returns.reason_code == "not_charging"].head(5)
    evidence += [{"evidence_type": "product_return", "source_table": "product_returns", "source_record_id": str(r.id), "description": f"Return for {r.order_id}: not charging",
                  "evidence_timestamp": r.returned_at.isoformat(), "relevance_score": 0.9, "supports_hypothesis": court["verdict_key"]} for r in bad.itertuples()]
    steps = [_step(1, "cluster_issues", {"clusters": len(clusters["clusters"])}, started), _step(2, "analyze_segments", {"top_segment": top and top["segment_value"]}, started),
             _step(3, "run_root_cause_court", {"verdict": court["verdict"], "status": court["verdict_status"]}, started), _step(4, "estimate_impact", impact["measured"], started),
             _step(5, "recommend_interventions", {"ranked": [r["action_key"] for r in recs["recommendations"]]}, started)]
    return {"steps": steps, "clusters": clusters, "segments": seg, "court": court, "impact": impact, "eligibility": {"eligible": []}, "recommendations": recs, "evidence": evidence,
            "explanation": sentences, "partially_analyzed": brief["generator"] != "llm", "llm_tokens": llm.tokens, "duration_ms": int((time.perf_counter() - started) * 1000),
            "shared_components": None, "kg": kg.build(incident_id, outputs), "decision_brief": brief, "kpi_baseline": product.kpi_baseline(w, o, court)}
