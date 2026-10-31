# Untested Work

Phase 2 ran with smoke checks only. Everything below still needs a real test run. All smoke checks used local MySQL, not TiDB.

## Full suites not run

- `python -m pytest ai_services/tests`. Not run since the Phase 2 changes, so existing tests may need updating, including the 2 tests added with the LLM fixes.
- `npm test` in `server/`. Not run since the Phase 2 changes.
- `npm run demo:run` and `node scripts/scenario-check.js` on the final code.

## No automated tests yet

- `funnel_breakpoint`, `reconcile` and `failure_onset`
- Court telemetry matching on predicted stage, and the `overlapping` status
- Numeric grounding and decision brief fallback
- Hypothesis proposer and its validator
- Knowledge graph persistence, superseding and run diff
- `shared_components`
- M1 hybrid routing in `/internal/feedback/analyze`
- New endpoints: funnel, reconciliation, decision-brief, shared-components, models, simulation-test

## Not verified

- M1 score on human-checked reviews. `human_label` is blank until labelled by hand.
- The decision brief through the full live agent with Groq.
- `qwen/qwen3.8-27b` as the best model. The full comparison was skipped.
- Migrations 002 and 003 on TiDB, including the multi-column `ALTER TABLE`.
- Seeding 264k events on TiDB, and read-only `SET SESSION TRANSACTION READ ONLY` there.
- The baseline in `data/calibration.json`. It has not been checked against an NPCI figure.
- Scenario `ios_complaints` after the funnel change.

## Skipped by decision

M2 attribution, M3, customer messages, Olist, real-data check, full model comparison, and the explain-path and impact-neighbourhood tools.
