"""Knowledge graph. It connects evidence for explanation; it is not the judge, the court is.

Entities only: no node per transaction or review. Edges carry aggregates, up to 5 exemplar IDs and a
re-runnable query handle. Python builds the payload here; Node is the only writer.
"""

from __future__ import annotations

import pandas as pd

from ai_services.analytics.data import Frames
from ai_services.analytics.funnel import journeys

MAX_EXEMPLARS = 5
RELATION = {"supported": "SUPPORTS", "rejected": "CONTRADICTS", "untested": "UNTESTED", "inconclusive": "INCONCLUSIVE"}
COMPONENTS = ["bank", "payment_gateway", "psp_app", "os", "os_version", "app_version", "device_model", "network_type"]


class Builder:
    def __init__(self, incident_id: int):
        self.incident_id = incident_id
        self.nodes: dict = {}
        self.edges: list = []

    def scoped(self, key: str) -> str:
        return f"i{self.incident_id}:{key}"

    def node(self, node_type, key, label, fact_kind, *, scoped=True, props=None, source_table=None, source_id=None, confidence=None) -> tuple:
        natural = self.scoped(key) if scoped else key
        self.nodes[(node_type, natural)] = {
            "node_type": node_type, "natural_key": natural[:190], "label": str(label)[:255], "fact_kind": fact_kind, "props": props or {},
            "source_table": source_table, "source_id": source_id, "confidence": confidence, "incident_scoped": scoped}
        return node_type, natural[:190]

    def edge(self, src, dst, edge_type, fact_kind, props=None, evidence=None):
        self.edges.append({"src": list(src), "dst": list(dst), "edge_type": edge_type, "fact_kind": fact_kind, "props": props or {}, "evidence_ids": (evidence or [])[:MAX_EXEMPLARS]})


def build(incident_id: int, outputs: dict) -> dict:
    b = Builder(incident_id)
    court, seg = outputs["run_root_cause_court"], outputs["analyze_segments"]
    incident = b.node("incident", "root", f"Incident {incident_id}", "observed", source_table="incidents", source_id=str(incident_id))
    for c in outputs["cluster_issues"]["clusters"][:5]:
        n = b.node("issue_cluster", c["cluster_id"], c["label"], "derived", props={"size": c["size"]})
        b.edge(incident, n, "GROUPS", "derived", {"n": c["size"], "share": c["severity_indicators"]["share_of_complaints"]},
               [{"table": "feedback", "id": i} for i in c["feedback_ids"]])
    top = seg.get("top_segment")
    segment = None
    if top:
        segment = b.node("segment", top["segment_value"], top["segment_value"], "derived", props={"dimension": top["dimension"]})
        b.edge(incident, segment, "CONCENTRATED_IN", "derived", {"n": top["affected_customers"], "rate": top["issue_rate"], "lift": top["lift_ratio"], "p_value": top["p_value"]})
    funnel = court.get("funnel") or {}
    point = funnel.get("breakpoint")
    if point:
        stage = b.node("funnel_stage", point["stage"], point["stage"], "observed", scoped=False)
        b.edge(segment or incident, stage, "BREAKS_AT", "derived",
               {"n": point["entered"], "rate": point["conversion"], "baseline_rate": point["baseline_conversion"], "drop": point["drop_vs_baseline"],
                "p_value": point["p_vs_baseline"], "window": funnel.get("window"), "query": {"tool": "funnel_breakpoint", "segment": funnel.get("segment")}})
    verdict_key = court.get("verdict_key")
    for h in court["hypotheses"]:
        kind = "verdict" if h["hypothesis_key"] == verdict_key and h["status"] == "supported" else "hypothesis"
        node = b.node("hypothesis", h["hypothesis_key"], h["hypothesis"], kind, confidence=h["confidence_score"], props={"status": h["status"], "predicted_stage": h.get("predicted_stage")})
        b.edge(incident, node, "HAS_HYPOTHESIS", kind, {"status": h["status"], "confidence": h["confidence_score"]})
        for ref in h.get("evidence_references", []):
            if ref["source_table"] == "product_releases":
                version, platform = ref["source_record_id"].split(":")
                rel = b.node("release", ref["source_record_id"], f"v{version} {platform}", "observed", scoped=False, source_table="product_releases", source_id=ref["source_record_id"])
                b.edge(rel, node, "DEPLOYED_AT", "observed", {"at": h.get("change_time")})
        for name, t in h["tests"].items():
            test = b.node("court_test", f"{h['hypothesis_key']}:{name}", name, "derived", props={"status": t["status"]})
            b.edge(node, test, "TESTED_BY", "derived")
            b.edge(test, node, RELATION[t["status"]], "derived", {"explanation": t["explanation"]})
    for r in outputs["recommend_interventions"]["recommendations"]:
        n = b.node("recommendation", r["action_key"], r["title"], "derived", props={"priority": r["priority"], "risk": r["risk_level"]})
        if verdict_key:
            b.edge(("hypothesis", b.scoped(verdict_key)[:190]), n, "JUSTIFIES", "derived", {"score": r["score"]})
    return {"nodes": list(b.nodes.values()), "edges": b.edges}


def shared_components(f: Frames, segment: dict | None, start, end=None, limit: int = 8) -> dict:
    """Attributes common to failing journeys but rare in good ones, such as when iOS complaints appear."""
    j = journeys(f)
    if j.empty:
        return {"components": [], "telemetry_available": False}
    start = pd.Timestamp(start)
    end = pd.Timestamp(end) if end is not None else f.as_of
    j = j[(j.ordered_at >= start) & (j.ordered_at <= end)]
    for col, value in (segment or {}).items():
        if col in j:
            j = j[j[col].astype(str) == str(value)]
    bad, good = j[j.bank_debit_success & ~j.order_created], j[j.order_created]
    rows = []
    if bad.empty or good.empty:
        return {"components": [], "failing_journeys": len(bad), "good_journeys": len(good), "telemetry_available": True}
    for col in COMPONENTS:
        shares_bad = bad[col].astype(str).value_counts(normalize=True)
        shares_good = good[col].astype(str).value_counts(normalize=True)
        for value, share in shares_bad.items():
            base = float(shares_good.get(value, 0))
            rows.append({"attribute": col, "value": value, "share_of_failing": round(float(share), 4), "share_of_good": round(base, 4), "ratio": round(float(share) / max(base, 0.005), 3)})
    rows = [r for r in rows if r["share_of_failing"] >= 0.5]
    rows.sort(key=lambda r: -r["ratio"])
    return {"components": rows[:limit], "failing_journeys": len(bad), "good_journeys": len(good), "telemetry_available": True, "label": "attribution_evidence"}
