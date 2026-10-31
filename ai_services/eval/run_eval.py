"""Scorecard against the hidden truth. This is the only module allowed to read that file.

Run from the repository root:  python -m ai_services.eval.run_eval
"""

from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path

import pandas as pd

from ai_services.analytics import data as data_mod
from ai_services.analytics import signals

EVAL_DIR = Path(__file__).resolve().parent
TRUTH = EVAL_DIR / "hidden_truth.json"
OUT = EVAL_DIR / "scorecard.json"


def _frame(conn, sql, params=()):
    return data_mod._query(conn, sql, params)


def safe_div(a, b):
    return round(a / b, 4) if b else None


def backtest_delay(frames, release_ts: pd.Timestamp, step_hours: int = 6) -> float | None:
    """Replay the detector forward from the release to find when it would first have fired."""
    t = release_ts
    while t <= frames.as_of:
        out = signals.detect(frames.upto(t))
        if any(s["category"] == "payment" and s["status"] == "open" for s in out["signals"]):
            return round((t - release_ts).total_seconds() / 3600, 1)
        t += timedelta(hours=step_hours)
    return None


def main() -> None:
    truth = json.loads(TRUTH.read_text(encoding="utf-8"))
    inc_t = truth["incident"]
    conn = data_mod.connect()
    try:
        incidents = _frame(conn, "SELECT id, issue_category, status, metadata, root_cause_verdict, confidence_score FROM incidents WHERE is_synthetic = 1 ORDER BY id")
        target = incidents[incidents.issue_category == inc_t["category"]]
        ids = target.id.tolist()
        sim_now = _frame(conn, "SELECT sim_now FROM sim_clock WHERE id = 1").sim_now.iloc[0]
        marks = ",".join(["%s"] * len(ids)) or "0"
        hyps = _frame(conn, f"SELECT incident_id, hypothesis_key, status FROM root_cause_hypotheses WHERE incident_id IN ({marks})", tuple(ids))
        segs = _frame(conn, f"SELECT dimension, segment_value, lift_ratio, significant FROM incident_segments WHERE incident_id IN ({marks}) ORDER BY significant DESC, lift_ratio DESC", tuple(ids))
        evidence = _frame(conn, f"SELECT source_table, source_record_id FROM incident_evidence WHERE incident_id IN ({marks}) AND source_record_id IS NOT NULL", tuple(ids))
        recs = _frame(conn, f"SELECT r.id, r.action_key, r.requires_approval, r.status, a.decision FROM recovery_recommendations r LEFT JOIN approvals a ON a.recommendation_id = r.id WHERE r.incident_id IN ({marks})", tuple(ids))
        actions = _frame(conn, f"SELECT recommendation_id, status FROM recovery_actions WHERE incident_id IN ({marks})", tuple(ids))
        refunds = _frame(conn, "SELECT order_id FROM operational_events WHERE event_type = 'payment_refunded'")
        kpis = _frame(conn, f"SELECT COUNT(*) n FROM kpi_measurements WHERE incident_id IN ({marks}) AND JSON_EXTRACT(metadata, '$.phase') = 'post_action'", tuple(ids))
        resolvable = {}
        for table, col in (("feedback", "id"), ("operational_events", "id")):
            refs = evidence[evidence.source_table == table].source_record_id.tolist()
            if refs:
                m = ",".join(["%s"] * len(refs))
                resolvable[table] = int(_frame(conn, f"SELECT COUNT(*) n FROM {table} WHERE {col} IN ({m})", tuple(refs)).n.iloc[0])
    finally:
        conn.close()

    created = incidents.issue_category.tolist()
    tp = sum(c == inc_t["category"] for c in created)
    fp = len(created) - tp
    fn = 0 if tp else 1

    expected = inc_t["segment"]
    top = segs[segs.significant == 1].iloc[0].to_dict() if len(segs[segs.significant == 1]) else {}
    value = str(top.get("segment_value", ""))
    segment_ok = expected["device_os"] in value and f"v{expected['app_version']}" in value

    judged = {"release_2.3_android": "supported", "weather_rain": "rejected", "menu_price_change": "rejected", "seasonal_traffic": "rejected"}
    got = dict(zip(hyps.hypothesis_key, hyps.status))
    correct = sum(got.get(k) == v for k, v in judged.items())

    traced = sum(resolvable.values())
    checkable = int(evidence.source_table.isin(["feedback", "operational_events"]).sum())

    refunded = set(refunds.order_id)
    eligible = set(inc_t["refund_eligible_orders"])
    forbidden = set(inc_t["false_claim_orders"]) | set(inc_t["already_reversed_orders"])
    unsafe_runs = 0
    if len(actions):
        joined = actions.merge(recs, left_on="recommendation_id", right_on="id")
        unsafe_runs = int(((joined.requires_approval == 1) & (joined.decision != "approved")).sum())
    resolved = target[target.status == "resolved"]

    frames = None
    delay = None
    try:
        frames = data_mod.load_frames(pd.Timestamp(truth["sim_end"]).tz_localize(None).isoformat())
        delay = backtest_delay(frames, pd.Timestamp(inc_t["release_timestamp"]).tz_localize(None))
    except Exception as exc:  # the backtest needs the seeded window; report it as unmeasured rather than guess
        print(f"detection delay unmeasured: {type(exc).__name__}")

    card = {
        "name": "Simulation test (fire drill)",
        "label": "Measured on synthetic data with a planted fault. It shows the logic finds that fault. It is not real-world accuracy.",
        "measured_at_sim_time": str(sim_now),
        "checks": {
            "planted_incident_detected": bool(tp),
            "correct_segment_identified": bool(segment_ok),
            "main_hypothesis_supported": got.get(inc_t["hypothesis_key"]) == "supported",
            "decoys_avoided": fp == 0,
            "evidence_traceable": checkable > 0 and traced == checkable,
            "recommendations_safe": unsafe_runs == 0 and not (refunded & forbidden),
            "recovery_correctly_verified": bool(len(resolved)) and int(kpis.n.iloc[0]) > 0 if len(ids) else False,
        },
        "metrics": {
            "incident_precision": safe_div(tp, tp + fp),
            "incident_recall": safe_div(tp, tp + fn),
            "detection_delay_hours": delay,
            "segment_identification_accuracy": 1.0 if segment_ok else 0.0,
            "hypothesis_verdict_accuracy": safe_div(correct, len(judged)),
            "action_eligibility_precision": safe_div(len(refunded & eligible), len(refunded)),
            "action_eligibility_recall": safe_div(len(refunded & eligible), len(eligible)),
            "ineligible_refunds_issued": len(refunded & forbidden),
            "evidence_traceability": safe_div(traced, checkable),
            "consequential_actions_without_approval": unsafe_runs,
        },
        "top_segment": top.get("segment_value"),
        "hypothesis_verdicts": {k: {"expected": v, "actual": got.get(k)} for k, v in judged.items()},
    }
    OUT.write_text(json.dumps(card, indent=2, default=str), encoding="utf-8")
    print(json.dumps(card, indent=2, default=str))


if __name__ == "__main__":
    main()
