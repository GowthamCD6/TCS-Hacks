# Database Schema

The source of truth is `server/db/migrations/001_recoveriq_core.sql`. It works on MySQL 8 and is written for TiDB. Migrations are additive and tracked in `recoveriq_migrations`.

**Why mysql2 and SQL rather than Prisma:** the repository had no ORM, Prisma does not officially support TiDB and its migrations need a shadow database, and the seed depends on fast bulk inserts. Plain SQL gives one reviewable, additive file.

| Group | Tables |
|---|---|
| Sources | `customers`, `orders`, `feedback`, `operational_events`, `product_releases` |
| Case | `signals`, `incidents`, `issue_clusters`, `incident_segments`, `incident_evidence`, `incident_reassessments` |
| Court | `root_cause_hypotheses`, `investigation_tests` |
| Recovery | `recovery_recommendations`, `approvals`, `recovery_actions` |
| Agent | `agent_runs`, `agent_steps` |
| KPIs | `kpi_definitions`, `kpi_measurements`, `sim_clock` |
| Platform | `ingestion_jobs`, `audit_logs`, `users` |

## Additions beyond the specification

- `orders`: payment state and exposure are per order.
- `signals`: backs `GET /signals`.
- `incident_segments`, `incident_reassessments`: persist segment results and diffs.
- `sim_clock`, `users`: simulated time and approver login.
- `is_synthetic` on source tables, so a reset touches only demo rows.
- `incidents.metadata`: telemetry and fix flags, rejected actions, mitigations, and the latest court, impact and explanation.

## Key guarantees

- `feedback (source, source_record_id)` is unique, which makes ingestion idempotent.
- `recovery_actions (recommendation_id)` is unique, which makes actions idempotent.
- `approvals (recommendation_id)` is unique: one decision per recommendation.
- Related state changes run in transactions.
- `feedback.order_id` and `operational_events.order_id` hold the external order reference with no foreign key, because events can arrive before their order.
