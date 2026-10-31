# AI Service Contract

Internal FastAPI service, port 8000. Bind it to localhost and never expose it publicly. Schemas are the Pydantic models in `ai_services/main.py`; live docs are at `/docs`.

Every `/internal/*` call needs the header `X-Service-Token`. Node is the only writer. Python reads through the read-only `AI_DB_URL` user: Node passes IDs and time windows, Python queries and computes, Node persists the result.

| Endpoint | Request | Response |
|---|---|---|
| `GET /health` | none | `status`, `llm_provider`, `llm_enabled`, `db_configured` |
| `POST /internal/feedback/analyze` | `feedback_ids[]` (max 2000), `mode` (`rules` or `llm`) | `results[]`: category, sentiment, urgency, pain_point, component, reference, financial_loss, actionable, language, summary, extractor |
| `POST /internal/signals/detect` | `as_of`, `window_hours`, `baseline_days` | `signals[]` with metrics and severity inputs, `suppressed[]` |
| `POST /internal/issues/cluster` | `as_of`, `category`, `window_start` | `method`, `embedding`, `clusters[]`, `noise_count` |
| `POST /internal/segments/analyze` | Case | `segments[]`, `top_segment`, `total_affected`, `population`, `multiple_testing` |
| `POST /internal/incidents/investigate` | Case + `top_segment` | Court result: `hypotheses[]` with 5 tests, `verdict`, `verdict_key`, `verdict_status`, `confidence_score`, `reasons`, `onset`, `analysis_start`, `limitations` |
| `POST /internal/incidents/impact` | Case | `measured`, `estimated`, `assumptions`, `states`, `affected_customer_count` |
| `POST /internal/refunds/eligibility` | Case | `eligible[]`, `eligible_amount`, `blocked_reason`, `policy` |
| `POST /internal/incidents/recommend` | Case + `top_segment`, `fix_deployed`, `rejected_actions` | `recommendations[]`, `policy_checks[]`, `eligible_refund_orders` |
| `POST /internal/agent/run` | Agent request | Full run: `steps[]`, `clusters`, `segments`, `court`, `impact`, `eligibility`, `recommendations`, `evidence[]`, `explanation[]`, `partially_analyzed`, `llm_tokens` |
| `POST /internal/incidents/reassess` | Agent request with `evidence_kinds`, `prior_tests` | Same as above; tests that the evidence cannot affect are reused and marked `reused` |
| `POST /internal/kpi/verify` | `definitions`, `measurements`, `action_completed_at`, `mitigation_applied`, `contradictory_evidence`, `now` | `outcome`, `reasons`, `kpis[]` |

Case is `as_of`, `category`, `window_start`, `telemetry_available`.

## Rules the service enforces

- **Numbers come from code.** The LLM picks tool order from an allowed list, writes cluster labels and words conclusions. A sentence whose numbers do not match a `numbers_used` path into tool output is dropped.
- **Customer text is data.** It is redacted and wrapped as untrusted before any model call, and it cannot change tools or policy.
- **Severity:** `affected_customers_share × growth_factor × harm_weight × confidence`, capped at 1. Harm weight: payment 1.0, delivery 0.6, others 0.3.
- **Court verdict:** supported needs at least 3 supported tests, none rejected, and telemetry supported. Rejected needs 2 rejected tests, or a rejected specificity or telemetry test. Missing telemetry is `untested`, never evidence against.
- **Refund policy:** verified captured, no order, not reversed, not refunded, older than `REFUND_GRACE_MINUTES` (24 hours by default, because auto-reversals can arrive that late).
- **No LLM:** with `LLM_PROVIDER=none`, or on an outage, the same tools run and the incident is marked `partially_analyzed`.
- **Hidden truth:** only `ai_services/eval/run_eval.py` reads `eval/hidden_truth.json`. A test fails if agents, tools, analytics, providers or chains reference it.
