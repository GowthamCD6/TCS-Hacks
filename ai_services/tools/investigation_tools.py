"""Tool registry for the investigation agent. Each tool has a validated input schema and reads only analytics data."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

import pandas as pd
from pydantic import BaseModel, Field

from ai_services.analytics import clustering, court, impact, kg, recommend, segments
from ai_services.analytics.data import Frames
from ai_services.analytics.extraction import extract, redact
from ai_services.prompts.recoveriq import LABEL_SYSTEM, UNTRUSTED_NOTE  # noqa: F401
from ai_services.agents.decision_brief import propose
from ai_services.providers.groq_provider import LLMClient

MAX_CLUSTER_ROWS = 800
MAX_LABEL_SAMPLES = 5


@dataclass
class Context:
    f: Frames
    category: str
    window_start: pd.Timestamp
    telemetry_available: bool = True
    fix_deployed: bool = False
    rejected_actions: list = field(default_factory=list)
    only_tests: set | None = None
    prior_tests: dict | None = None
    llm: LLMClient = field(default_factory=LLMClient)
    outputs: dict = field(default_factory=dict)

    @property
    def analysis_start(self) -> pd.Timestamp:
        start = self.outputs.get("run_root_cause_court", {}).get("analysis_start")
        return pd.Timestamp(start) if start else self.window_start


class NoArgs(BaseModel):
    pass


class ClusterArgs(BaseModel):
    max_rows: int = Field(default=MAX_CLUSTER_ROWS, ge=10, le=MAX_CLUSTER_ROWS)


def gather_signal_context(ctx: Context, _: NoArgs) -> dict:
    fb = ctx.f.feedback[(ctx.f.feedback.category == ctx.category) & (ctx.f.feedback.event_timestamp >= ctx.window_start)]
    ev = ctx.f.events[ctx.f.events.event_type.isin(["app_release_deployed", "weather_alert", "menu_price_change", "marketing_campaign"])]
    recent = ev[ev.event_timestamp >= ctx.f.as_of - court.LOOKBACK]
    return {"complaints_in_window": len(fb), "complaining_customers": int(fb.customer_id.nunique()),
            "recent_changes": [{"event_id": int(e.id), "type": e.event_type, "at": e.event_timestamp.isoformat(),
                                "city": e.city if isinstance(e.city, str) else None} for e in recent.itertuples()],
            "telemetry_available": ctx.telemetry_available}


def cluster_issues(ctx: Context, args: ClusterArgs) -> dict:
    fb = ctx.f.feedback[(ctx.f.feedback.category == ctx.category) & (ctx.f.feedback.event_timestamp >= ctx.window_start)]
    fb = fb.sort_values("event_timestamp").tail(args.max_rows)
    rows = [{"id": r.id, "text": r.text, "event_timestamp": r.event_timestamp.isoformat(),
             "financial_loss": extract(r.text, r.rating)["financial_loss"]} for r in fb.itertuples()]
    out = clustering.cluster(rows)
    texts = {r["id"]: r["text"] for r in rows}
    for c in out["clusters"]:
        samples = [redact(texts[i]) for i in c["feedback_ids"][:MAX_LABEL_SAMPLES]]
        got = ctx.llm.json(LABEL_SYSTEM, "\n".join(f"<customer_text>{s}</customer_text>" for s in samples), 40)
        if got and isinstance(got.get("label"), str):
            c["label"] = got["label"][:120]
    return out


def analyze_segments(ctx: Context, _: NoArgs) -> dict:
    return segments.analyze(ctx.f, ctx.category, ctx.window_start)


def find_shared_components(ctx: Context, _: NoArgs) -> dict:
    return kg.shared_components(ctx.f, None, ctx.window_start)


def propose_hypotheses(ctx: Context, _: NoArgs) -> dict:
    seg = ctx.outputs["analyze_segments"].get("top_segment")
    summary = {"top_segment": seg and seg["segment_value"], "shared_components": ctx.outputs["find_shared_components"]["components"][:5],
               "recent_changes": ctx.outputs["gather_signal_context"]["recent_changes"][:8]}
    return propose(summary, ctx.llm)


def run_root_cause_court(ctx: Context, _: NoArgs) -> dict:
    top = ctx.outputs.get("analyze_segments", {}).get("top_segment")
    proposals = ctx.outputs.get("propose_hypotheses", {}).get("accepted", [])
    return court.run_court(ctx.f, ctx.category, ctx.window_start, top, ctx.telemetry_available, ctx.only_tests, ctx.prior_tests, proposals)


def estimate_impact(ctx: Context, _: NoArgs) -> dict:
    return impact.estimate(ctx.f, ctx.category, ctx.analysis_start, ctx.telemetry_available)


def check_refund_eligibility(ctx: Context, _: NoArgs) -> dict:
    return impact.refund_eligibility(ctx.f, ctx.analysis_start, ctx.telemetry_available)


def recommend_interventions(ctx: Context, _: NoArgs) -> dict:
    return recommend.recommend(ctx.outputs["run_root_cause_court"], ctx.outputs["estimate_impact"],
                               ctx.outputs["check_refund_eligibility"], ctx.telemetry_available, ctx.fix_deployed, ctx.rejected_actions)


@dataclass(frozen=True)
class Tool:
    fn: Callable
    args: type[BaseModel]
    needs: tuple = ()


TOOLS: dict[str, Tool] = {
    "gather_signal_context": Tool(gather_signal_context, NoArgs),
    "cluster_issues": Tool(cluster_issues, ClusterArgs, ("gather_signal_context",)),
    "analyze_segments": Tool(analyze_segments, NoArgs, ("gather_signal_context",)),
    "find_shared_components": Tool(find_shared_components, NoArgs, ("analyze_segments",)),
    "propose_hypotheses": Tool(propose_hypotheses, NoArgs, ("find_shared_components",)),
    "run_root_cause_court": Tool(run_root_cause_court, NoArgs, ("propose_hypotheses",)),
    "estimate_impact": Tool(estimate_impact, NoArgs, ("run_root_cause_court",)),
    "check_refund_eligibility": Tool(check_refund_eligibility, NoArgs, ("run_root_cause_court",)),
    "recommend_interventions": Tool(recommend_interventions, NoArgs, ("estimate_impact", "check_refund_eligibility")),
}
FIXED_PLAN = list(TOOLS)
