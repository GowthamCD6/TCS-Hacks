"""RecoverIQ internal AI service. Reads analytics data, computes, and returns results for Node to persist.

Run from the repository root:  uvicorn ai_services.main:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import hmac
import json
import logging
from pathlib import Path
from typing import Any, Literal, Optional

import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from ai_services.agents import investigator, product_agent
from ai_services.analytics import clustering, court, data, funnel, grounding, impact, intent, kg, kpi, product, recommend, reconcile, segments, signals
from ai_services.analytics.extraction import extract, redact
from ai_services.config import ai_config
from ai_services.prompts.recoveriq import EXTRACT_SYSTEM, PRODUCT_CATEGORIES, PRODUCT_EXTRACT_SYSTEM
from ai_services.providers.groq_provider import LLMClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
app = FastAPI(title="RecoverIQ AI Service", version="1.0.0")


def require_token(x_service_token: str = Header(default="")) -> None:
    expected = ai_config.AI_SERVICE_TOKEN
    if not expected:
        raise HTTPException(503, "AI_SERVICE_TOKEN is not configured")
    if not hmac.compare_digest(x_service_token, expected):
        raise HTTPException(401, "Invalid service token")


auth = [Depends(require_token)]


class AnalyzeRequest(BaseModel):
    feedback_ids: list[int] = Field(max_length=2000)
    mode: Literal["rules", "llm"] = "rules"
    domain: Literal["payments", "product"] = "payments"


class Extraction(BaseModel):
    feedback_id: int
    category: str
    sentiment: str
    urgency: str
    pain_point: str
    component: str
    reference: Optional[str]
    financial_loss: bool
    actionable: bool
    language: str
    summary: str
    extractor: str
    intent: Optional[str] = None
    intent_confidence: Optional[float] = None


class AnalyzeResponse(BaseModel):
    results: list[Extraction]
    routed_to_llm: int = 0
    routing_share_to_llm: float = 0


class DetectRequest(BaseModel):
    as_of: str
    window_hours: int = Field(default=72, ge=6, le=336)
    baseline_days: int = Field(default=21, ge=3, le=30)


class CaseRequest(BaseModel):
    as_of: str
    category: str
    window_start: str
    telemetry_available: bool = True


class SegmentedCaseRequest(CaseRequest):
    top_segment: Optional[dict[str, Any]] = None


class RecommendRequest(CaseRequest):
    top_segment: Optional[dict[str, Any]] = None
    fix_deployed: bool = False
    rejected_actions: list[str] = []


class AgentRequest(CaseRequest):
    incident_id: int = 0
    domain: Literal["payments", "product"] = "payments"
    run_type: Literal["investigation", "reassessment"] = "investigation"
    fix_deployed: bool = False
    rejected_actions: list[str] = []
    evidence_kinds: list[str] = []
    prior_tests: Optional[dict[str, Any]] = None


class ClusterRequest(BaseModel):
    as_of: str
    category: str
    window_start: str


class KpiVerifyRequest(BaseModel):
    definitions: list[dict[str, Any]]
    measurements: list[dict[str, Any]]
    action_completed_at: Optional[str]
    mitigation_applied: bool
    contradictory_evidence: int = 0
    now: str


def _analyze_one(row, llm: LLMClient) -> dict:
    base = extract(row.text, row.rating)
    if llm.enabled:
        got = llm.json(EXTRACT_SYSTEM, f"<customer_text>{redact(row.text)[:1500]}</customer_text>", 250)
        if got:
            merged = {**base, **{k: got[k] for k in ("category", "sentiment", "urgency", "pain_point", "component", "language", "summary")
                                 if isinstance(got.get(k), str)}}
            merged["financial_loss"] = bool(got.get("financial_loss", base["financial_loss"]))
            merged["actionable"] = bool(got.get("actionable", base["actionable"]))
            # A reference only counts when quoted verbatim, so the model cannot invent one.
            ref = got.get("reference")
            merged["reference"] = ref if isinstance(ref, str) and ref in row.text else base["reference"]
            merged["extractor"] = "llm"
            return merged
    return base


def _analyze_product(row, llm: LLMClient | None) -> dict:
    rating = None if pd.isna(row.rating) else int(row.rating)
    out = product.classify(row.text, rating)
    if llm and llm.enabled:
        got = llm.json(PRODUCT_EXTRACT_SYSTEM, f"<customer_text>{redact(row.text)[:1500]}</customer_text>", 200)
        if got and got.get("category") in PRODUCT_CATEGORIES:
            out = {**out, "category": got["category"], "extractor": "llm"}
    return {"feedback_id": int(row.id), **out}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "recoveriq-ai", "llm_provider": ai_config.LLM_PROVIDER, "llm_enabled": LLMClient().enabled,
            "db_configured": bool(ai_config.AI_DB_URL)}


@app.post("/internal/feedback/analyze", response_model=AnalyzeResponse, dependencies=auth)
def analyze(req: AnalyzeRequest) -> dict:
    llm = LLMClient() if req.mode == "llm" else None
    rows = data.load_feedback_by_ids(req.feedback_ids)
    if rows.empty:
        return {"results": []}
    if req.domain == "product":
        return {"results": [_analyze_product(r, llm) for r in rows.itertuples()]}
    predictions = intent.classify([redact(t) for t in rows.text]) or [None] * len(rows)
    results, routed = [], 0
    for r, p in zip(rows.itertuples(), predictions):
        rating = None if pd.isna(r.rating) else int(r.rating)
        confident = bool(p and p["confident"])
        if confident:
            out = {**extract(r.text, rating), "category": p["category"], "extractor": "m1"}
        elif llm:
            routed += 1
            out = _analyze_one(r, llm)
        else:
            out = extract(r.text, rating)
        results.append({"feedback_id": int(r.id), **out, "intent": p and p["intent"], "intent_confidence": p and p["intent_confidence"]})
    return {"results": results, "routed_to_llm": routed, "routing_share_to_llm": round(routed / len(results), 4)}


@app.post("/internal/signals/detect", dependencies=auth)
def detect(req: DetectRequest) -> dict:
    return signals.detect(data.load_frames(req.as_of), req.window_hours, req.baseline_days)


@app.post("/internal/issues/cluster", dependencies=auth)
def cluster(req: ClusterRequest) -> dict:
    f = data.load_frames(req.as_of)
    fb = f.feedback[(f.feedback.category == req.category) & (f.feedback.event_timestamp >= pd.Timestamp(req.window_start).tz_localize(None))]
    return clustering.cluster([{"id": r.id, "text": r.text, "event_timestamp": r.event_timestamp.isoformat()} for r in fb.itertuples()])


@app.post("/internal/segments/analyze", dependencies=auth)
def analyze_segments(req: CaseRequest) -> dict:
    return segments.analyze(data.load_frames(req.as_of), req.category, _naive(req.window_start))


@app.post("/internal/incidents/investigate", dependencies=auth)
def investigate(req: SegmentedCaseRequest) -> dict:
    return court.run_court(data.load_frames(req.as_of), req.category, _naive(req.window_start), req.top_segment, req.telemetry_available)


@app.post("/internal/incidents/impact", dependencies=auth)
def incident_impact(req: CaseRequest) -> dict:
    return impact.estimate(data.load_frames(req.as_of), req.category, _naive(req.window_start), req.telemetry_available)


@app.post("/internal/refunds/eligibility", dependencies=auth)
def eligibility(req: CaseRequest) -> dict:
    return impact.refund_eligibility(data.load_frames(req.as_of), _naive(req.window_start), req.telemetry_available)


@app.post("/internal/incidents/recommend", dependencies=auth)
def incident_recommend(req: RecommendRequest) -> dict:
    f = data.load_frames(req.as_of)
    start = _naive(req.window_start)
    verdict = court.run_court(f, req.category, start, req.top_segment, req.telemetry_available)
    return recommend.recommend(verdict, impact.estimate(f, req.category, start, req.telemetry_available),
                               impact.refund_eligibility(f, start, req.telemetry_available),
                               req.telemetry_available, req.fix_deployed, req.rejected_actions)


def _run_agent(req: AgentRequest) -> dict:
    if req.domain == "product":
        return product_agent.run(product.load_world(), req.window_start, req.incident_id, req.rejected_actions)
    return investigator.run(data.load_frames(req.as_of), req.category, req.window_start, req.run_type, req.telemetry_available,
                            req.fix_deployed, req.rejected_actions, req.evidence_kinds, req.prior_tests, incident_id=req.incident_id)


@app.post("/internal/agent/run", dependencies=auth)
def agent_run(req: AgentRequest) -> dict:
    return _run_agent(req)


@app.post("/internal/incidents/reassess", dependencies=auth)
def reassess(req: AgentRequest) -> dict:
    return _run_agent(req.model_copy(update={"run_type": "reassessment"}))


class FunnelRequest(BaseModel):
    as_of: str
    segment: dict[str, str] = {}
    window_start: str
    window_end: Optional[str] = None


class ReconcileRequest(BaseModel):
    as_of: str
    window_start: str
    window_end: Optional[str] = None


@app.post("/internal/funnel/breakpoint", dependencies=auth)
def funnel_breakpoint(req: FunnelRequest) -> dict:
    end = _naive(req.window_end) if req.window_end else None
    return funnel.funnel_breakpoint(data.load_frames(req.as_of), req.segment, _naive(req.window_start), end)


@app.post("/internal/reconcile", dependencies=auth)
def reconcile_window(req: ReconcileRequest) -> dict:
    end = _naive(req.window_end) if req.window_end else None
    return reconcile.public(reconcile.reconcile(data.load_frames(req.as_of), _naive(req.window_start), end))


class SharedComponentsRequest(BaseModel):
    as_of: str
    window_start: str
    segment: dict[str, str] = {}


@app.post("/internal/kg/shared-components", dependencies=auth)
def kg_shared(req: SharedComponentsRequest) -> dict:
    return kg.shared_components(data.load_frames(req.as_of), req.segment, _naive(req.window_start))


@app.get("/internal/models", dependencies=auth)
def models() -> dict:
    report_path = Path(__file__).resolve().parent / "eval" / "m1_report.json"
    report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else None
    return {"m1": {"meta": intent.model_info(), "evaluation": report}, "m2": {"status": "not_built"}, "llm_grounding": grounding.pass_rate()}


@app.get("/internal/llm/grounding", dependencies=auth)
def llm_grounding() -> dict:
    return grounding.pass_rate()


@app.post("/internal/product/detect", dependencies=auth)
def product_detect() -> dict:
    return product.detect(product.load_world())


@app.post("/internal/kpi/verify", dependencies=auth)
def verify_kpis(req: KpiVerifyRequest) -> dict:
    return kpi.verify(req.definitions, req.measurements, req.action_completed_at, req.mitigation_applied, req.contradictory_evidence, req.now)


def _naive(value: str) -> pd.Timestamp:
    ts = pd.Timestamp(value)
    return ts.tz_convert(None) if ts.tzinfo else ts
