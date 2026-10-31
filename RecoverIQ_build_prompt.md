# RecoverIQ — Backend + AI Service Implementation Specification

You are the lead backend engineer and AI systems engineer for **RecoverIQ**, an autonomous customer experience recovery platform being built for a TCS AI hackathon.

You are working inside an existing repository named `TCS-Hacks`. I am responsible for the complete Node.js backend and Python AI service. Another teammate is independently building the React frontend in the `client/` folder.

Your task is to implement the backend and AI service as a complete, integrated, production-minded hackathon prototype. Do not build the frontend.

FIRST: save this whole message verbatim to `docs/BUILD_PROMPT.md` so it survives context resets, and re-read section 0 whenever you are unsure what to do next.

## 0. Read first: priorities, time box and overrides

We have about 6 working hours today. A complete golden path that works end to end beats twenty half-built features. Where this section conflicts with a later section, this section wins.

### 0.1 Golden path (Must, build this first and keep it working)

Seeded synthetic data → `run detection` → signal → incident created → agent investigates (plan, tool calls, trace) → clusters + segments + Root Cause Court verdicts + impact → ranked recommendations → human approve/reject → simulated action → KPI measured on the simulated clock → incident moves to `monitoring` then `resolved` (or reopened) → inject new evidence → reassessment with a "what changed" diff → evaluation scorecard against hidden truth.

Every item marked Must in 0.3 serves this path. Do not start a Should item until the golden path runs end to end and its tests pass.

### 0.2 Contract first, so the frontend is never blocked

Within the first 45 minutes, before writing business logic:
1. Write `docs/API_CONTRACT.md` for the Must endpoints, with sample JSON for every response.
2. Add a `MOCK_MODE=true` switch in the Node backend that serves those sample responses from `server/src/mocks/` so my teammate can build the UI immediately.
3. Freeze the response shapes for the incident detail, issue graph (React Flow `nodes` and `edges`), court verdicts, recommendations, approvals, agent trace and KPIs. Later changes must be additive only.

### 0.3 Priority of features

| Priority | Items |
|---|---|
| Must | Synthetic generator + seed + hidden truth; `POST /api/v1/feedback`; `POST /api/v1/operational-events`; signal detection; clustering; segment lift; Root Cause Court (5 tests); impact; intervention ranking; agent run with persisted trace; approvals; simulated actions; KPI verification on the simulated clock; evidence injection + reassess; incident graph; evaluation scorecard; API and AI service contracts |
| Should | CSV import with template; the 5 rehearsed jury scenarios as one-click demo endpoints; customer recovery list and message drafts; JWT for approver routes; rate limiting; audit log |
| Could | Google Forms Apps Script webhook (document it, implement if time remains); website feedback form endpoint; external platform adapters beyond a simulated import; Ollama provider |

### 0.4 Overrides to the sections below

1. **Python reads, Node writes.** Node remains the only writer and system of record. Give the AI service a read-only database connection (a separate read-only MySQL user, `AI_DB_URL` in its `.env`) for analytics queries. Do not ship 60 days of events over HTTP on every call. Node passes IDs and time windows; Python queries what it needs, computes, and returns results. Node persists them.
2. **LLM calls are budgeted.** Do not call the LLM once per feedback record for the seeded dataset. Use deterministic keyword and rule extraction for the seed and bulk imports, LLM extraction only for new or injected records and for cluster samples (at most 5 per cluster), batched where possible, with caching by text hash. Respect Groq rate limits; on 429 back off, and fall back to the rule extractor.
3. **Demo runs on demand, not on a timer.** Background jobs exist, but the demo must not wait for them. Add `POST /api/v1/demo/run-detection`, `POST /api/v1/demo/reset` (requires `DEMO_RESET_CONFIRM=yes` in the body) and `POST /api/v1/demo/scenario/:name` for the jury scenarios.
4. **Simulated clock for KPIs.** Monitoring windows cannot wait in real time. Add a simulated clock (`sim_now`) stored in the database. `POST /api/v1/demo/advance-clock {minutes}` advances it, and a post-action KPI generator produces measurements consistent with the action taken (for example, after rollback the payment-without-order rate falls toward baseline; if no action, it stays high). Recovery verification uses `sim_now`.
5. **Clustering dependency.** Use `sklearn.cluster.HDBSCAN` (scikit-learn 1.3 or later), not the standalone `hdbscan` package, which often fails to build on Windows. Fallback: Agglomerative clustering on cosine distance.
6. **Embedding model offline.** Download `sentence-transformers/all-MiniLM-L6-v2` once during setup (`python scripts/prefetch_models.py`) into a local cache so the demo works without internet. Fallback: TF-IDF vectors if the model is unavailable.
7. **Severity is a formula, documented once.** `severity = affected_customers_share × growth_factor × harm_weight × confidence`, with harm_weight 1.0 for money lost, 0.6 for order not delivered, 0.3 for inconvenience. Show the inputs with the score.
8. **Every LLM sentence that cites a number must reference the tool output it came from** (`numbers_used` with JSON paths into the tool result). The API returns these so the UI can link them.
9. **Hidden truth location.** Write it to `ai_services/eval/hidden_truth.json`. Only the evaluation script may read it; the agent tools, investigation code and APIs must never import or query it. Add a test that fails if any module under `ai_services/agents` or `ai_services/tools` references that file.
10. **No-LLM mode.** With `LLM_PROVIDER=none` the whole golden path must still run: rule extraction, template labels, a fixed investigation plan, template explanations. Incidents analysed this way are marked `partially_analyzed: true`.
11. **Prisma on an existing database.** If the repository already uses another ORM or `mysql2`, keep it. If using Prisma, run `prisma db pull` first and add new tables through additive migrations only. Never drop or rename existing tables.
12. **Windows-friendly.** Use `pathlib` and npm scripts; give PowerShell and bash commands in `docs/LOCAL_SETUP.md`.

## 1. Product objective

RecoverIQ must do more than sentiment analysis, chatbot responses, or a dashboard.

It must implement this end-to-end workflow:

**Customer signals → emerging issue detection → issue clustering → affected segment identification → root-cause investigation → business impact estimation → prioritized recovery plan → human approval → simulated recovery action → KPI verification.**

The product should maintain a persistent incident case from initial detection through verified recovery.

Use a food-delivery platform as the initial demonstration domain.

Example planted incident:
- A new mobile app release, version 2.3, introduces a UPI payment confirmation problem for a subset of Android 14 customers.
- Some customers experience money deducted without an order being created.
- The issue emerges after the release.
- Other unrelated events are deliberately included in the dataset as decoys, such as rain-related delivery delays, menu-price complaints, and increased seasonal traffic.
- The AI must investigate and distinguish the real incident from these decoys using evidence.

All demo data and metrics must be clearly labelled synthetic. Never represent generated records as actual company or customer data.

## 2. First inspect the existing repository

Before modifying files:

1. Inspect the complete repository tree.
2. Read the existing README, requirements, config files, `.gitignore`, `.env.example`, Node package files, and existing source files.
3. Identify the existing framework and dependencies.
4. Inspect the existing database configuration without printing or exposing secrets.
5. Preserve existing working code wherever possible.
6. Do not replace the current database, credentials, project structure, or configuration without a clear technical reason.
7. Do not overwrite the teammate's `client/` implementation.
8. Do not expose `.env` values in logs, responses, generated documentation, or commits.

The current environment is intended to use:
- Node backend: port 5000.
- Python AI service: port 8000.
- Frontend development origin: `http://localhost:5173`.
- Existing MySQL-compatible database: database name currently configured as `tcsmainday`, using the existing environment variables.

Keep the existing values configurable through environment variables. Do not hardcode hostnames, credentials, tokens, ports, or secrets.

## 3. Repository architecture

Keep the existing high-level structure:

```text
TCS-Hacks/
│
├── ai_services/
│   ├── agents/
│   ├── chains/
│   ├── prompts/
│   ├── providers/
│   ├── tools/
│   ├── utils/
│   ├── vector_store/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   └── .env.example
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── jobs/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── app.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── client/                 # Teammate owns this. Do not modify.
│
├── docs/
│   ├── API_CONTRACT.md
│   ├── DATABASE_SCHEMA.md
│   ├── AI_SERVICE_CONTRACT.md
│   └── LOCAL_SETUP.md
│
└── README.md
```

Adapt this layout if the repository already has an established structure. Do not create duplicate source trees.

Use a modular architecture. Keep route handlers thin. Put business logic in services, database access in repositories, and validation in validators.

## 4. Backend technology and responsibilities

Use the existing Node.js setup if it is already configured. Otherwise use:
- Node.js
- Express
- Prisma ORM with MySQL provider, if compatible with the existing database
- Zod for request validation
- JWT authentication for protected operations
- bcrypt for password hashing if user authentication is implemented
- Helmet
- CORS with configured allowed origins
- Rate limiting
- Centralized error handling
- Structured logging with secrets and personal data redacted

Do not introduce Redis, Kafka, or complex infrastructure unless the existing project already requires it. Use a persistent database-backed job queue for the hackathon prototype.

Node.js is the **single system of record**. It owns customer records, feedback, incidents, evidence references, approvals, recovery actions, and KPI measurements.

The Python service must not directly write to the application database. It may read through a separate read-only connection (see 0.4 item 1).

## 5. Database design

Inspect the current database first. Create or update migrations carefully. Use appropriate indexes, foreign keys, timestamps, unique constraints, and transactions.

Design the following entities. Adjust names only when necessary for the existing schema.

### customers
- id
- external_customer_id
- name (optional)
- email (optional)
- phone (optional)
- city
- customer_segment
- platform
- device_os
- app_version
- created_at

Avoid collecting unnecessary personal data. Do not expose contact details in general analytics responses.

### feedback
- id
- source
- source_record_id
- customer_id (nullable)
- order_id (nullable)
- channel
- rating (nullable)
- text
- language
- category (nullable)
- sentiment (nullable)
- urgency (nullable)
- metadata JSON
- event_timestamp
- created_at
- processing_status

Add an idempotency strategy so repeated webhook deliveries do not create duplicate feedback.

### operational_events
- id
- event_type
- event_timestamp
- customer_id (nullable)
- order_id (nullable)
- payment_status (nullable)
- payment_method (nullable)
- amount (nullable)
- platform
- device_os
- app_version
- city
- metadata JSON
- created_at

Support events such as payment initiated, payment captured, payment failed, payment reversed, order created, order cancelled, delivery delayed, and app release deployed.

### product_releases
- id
- version
- platform
- release_timestamp
- description
- changes JSON
- created_at

### incidents
- id
- incident_number (human-readable, unique)
- title
- description
- issue_category
- status
- severity
- confidence_score
- first_detected_at
- last_updated_at
- affected_customer_count
- estimated_business_impact
- root_cause_verdict
- resolution_summary
- closed_at
- created_at

Use a controlled lifecycle:
`detected → investigating → awaiting_approval → approved → executing → monitoring → resolved`

Also support `rejected`, `escalated`, and `reopened` where appropriate.

### issue_clusters
- id
- incident_id (nullable)
- label
- description
- cluster_key
- feedback_count
- severity_score
- first_seen_at
- last_seen_at
- metadata JSON

### incident_evidence
- id
- incident_id
- evidence_type
- source_table
- source_record_id (nullable)
- description
- evidence_timestamp
- relevance_score
- supports_hypothesis (nullable)
- metadata JSON
- created_at

Evidence must be traceable to its original source record whenever possible.

### root_cause_hypotheses
- id
- incident_id
- hypothesis
- status (`supported`, `rejected`, `untested`, `inconclusive`)
- confidence_score
- explanation
- evidence_summary JSON
- created_at
- updated_at

### investigation_tests
- id
- incident_id
- hypothesis_id
- test_name
- status (`supported`, `rejected`, `untested`, `inconclusive`)
- result JSON
- explanation
- created_at

### recovery_recommendations
- id
- incident_id
- title
- description
- priority
- estimated_cost
- expected_benefit
- risk_level
- requires_approval
- status
- rationale JSON
- created_at

### approvals
- id
- incident_id
- recommendation_id
- requested_by
- reviewed_by
- decision (`pending`, `approved`, `rejected`)
- comments
- reviewed_at
- created_at

### recovery_actions
- id
- incident_id
- recommendation_id
- action_type
- status
- target_reference
- execution_result JSON
- executed_at
- created_at

### agent_runs
- id
- incident_id (nullable)
- run_type
- status
- input_summary JSON
- final_summary JSON
- started_at
- completed_at
- error_message

### agent_steps
- id
- agent_run_id
- step_number
- agent_name
- tool_name
- input_summary JSON
- output_summary JSON
- evidence_references JSON
- status
- duration_ms
- created_at

This trace is important. The jury should be able to see what the agent planned, which tools it called, what evidence it found, and how it reached a conclusion.

### kpi_definitions
- id
- name
- description
- unit
- target_value
- comparison_operator
- monitoring_window_minutes
- created_at

### kpi_measurements
- id
- incident_id
- kpi_definition_id
- measured_value
- measured_at
- metadata JSON

### ingestion_jobs
- id
- source
- status
- total_records
- processed_records
- failed_records
- error_summary
- created_at
- completed_at

### audit_logs
- id
- actor_type
- actor_id
- action
- resource_type
- resource_id
- details JSON
- created_at

Ensure the schema is usable in the actual existing database. Generate migrations and a documented database setup procedure. Never silently drop existing tables or data.

## 6. Feedback ingestion — support multiple sources

Implement a common ingestion pipeline. All sources must normalize into the same feedback format.

### Source A: Public feedback API

Create:
`POST /api/v1/feedback`

Accept:
- customer identifier (optional)
- order identifier (optional)
- source
- channel
- rating (optional)
- text
- timestamp (optional)
- metadata (optional)

Validate inputs, sanitize content, apply rate limits, store the original feedback, and create a processing job.

Return an acknowledgement and feedback ID. Do not make users wait for a long AI analysis.

### Source B: Website feedback form

Provide an API suitable for a public feedback form. It should accept ratings, comments, optional order reference, and optional contact details with appropriate consent.

### Source C: Google Forms

Support Google Forms through a Google Apps Script webhook that forwards each form submission to the RecoverIQ ingestion API.

Document:
1. Creating a Google Form.
2. Adding an Apps Script `onFormSubmit` trigger.
3. Mapping form fields to the API payload.
4. Configuring a secure webhook token.
5. Sending the POST request.
6. Handling retries and duplicate submissions.

Do not claim that Google Forms automatically sends webhooks without this integration.

### Source D: CSV uploads

Create:
`POST /api/v1/ingestion/csv`

Support CSV upload with validation, field mapping, batch processing, error reporting, and duplicate detection.

Provide a downloadable sample CSV template.

### Source E: External platforms

Create adapter interfaces for:
- support tickets
- app-store reviews
- social feedback
- contact-center transcripts

For the hackathon, provide simulated import adapters and document how official integrations would work. Do not claim real-time integration with a platform unless it is genuinely implemented and authenticated.

### Source F: Operational and telemetry events

Create:
`POST /api/v1/operational-events`

Support operational data such as payment events, order events, app versions, release information, and delivery status.

These records are critical for validating root-cause hypotheses. Customer sentiment alone is not proof.

## 7. Ingestion and asynchronous processing

Implement this flow:

1. Receive feedback.
2. Validate and normalize it.
3. Persist it to MySQL.
4. Create an ingestion job or processing job.
5. Return the acknowledgement.
6. A background worker fetches pending jobs.
7. The worker calls the AI service.
8. The AI service returns structured extraction and classification.
9. Node persists the result.
10. The signal detection process checks for emerging issues.
11. When an incident is created or updated, save its evidence and agent trace.

Implement retry limits, failure status, idempotency, and structured error handling.

Avoid creating an incident for every negative review. Use aggregation, thresholds, and anomaly detection.

## 8. AI service — Python FastAPI

Implement the service inside `ai_services/`.

Use:
- Python
- FastAPI
- Pydantic
- Pandas
- NumPy
- scikit-learn
- SciPy
- Sentence Transformers
- HDBSCAN if dependency installation is reliable; provide a fallback clustering method
- Groq API through an OpenAI-compatible client
- pytest

Keep AI logic modular.

### AI service endpoints

Implement:

`GET /health`

`POST /internal/feedback/analyze`

`POST /internal/signals/detect`

`POST /internal/issues/cluster`

`POST /internal/segments/analyze`

`POST /internal/incidents/investigate`

`POST /internal/incidents/impact`

`POST /internal/incidents/recommend`

`POST /internal/incidents/reassess`

`POST /internal/agent/run`

All endpoints must have Pydantic input and output schemas. Add internal service authentication using a shared service token. Do not expose internal endpoints publicly.

### A. Feedback understanding

For each feedback record, extract:
- issue category
- sentiment
- urgency
- customer pain point
- product/service component
- payment or order reference if explicitly present
- whether the customer reports financial loss
- whether the feedback is actionable
- language
- concise summary

Return structured JSON.

Use the LLM for semantic extraction, not for computing business metrics.

Do not hallucinate customer IDs, order IDs, payment outcomes, dates, or facts not present in the source.

### B. Issue clustering

Use sentence embeddings to group semantically similar complaints.

Suggested embedding model:
`sentence-transformers/all-MiniLM-L6-v2`

Keep the embedding model configurable so it can be replaced by a multilingual model if needed.

Use HDBSCAN where practical, or a documented fallback such as DBSCAN/Agglomerative Clustering.

The output should contain:
- cluster ID
- cluster label
- representative issue
- feedback IDs
- cluster size
- time window
- severity indicators
- confidence

The LLM may create human-readable labels, but cluster membership and counts must be computed by code.

### C. Emerging signal detection

Detect unusual increases in issue volume compared with historical baseline.

Implement:
- rolling time windows
- baseline counts
- current counts
- absolute increase
- percentage increase
- volume anomaly score
- severity score
- minimum sample thresholds

Use appropriate statistical methods such as Poisson/binomial comparisons, z-scores, or robust median/MAD methods depending on the available data.

Avoid division-by-zero errors and misleading percentage increases when baseline volume is tiny.

Return the metrics used so the frontend can display the evidence.

### D. Customer segment analysis

Investigate affected segments such as:
- Android vs iOS
- operating system version
- app version
- city
- payment method
- new vs returning customers
- customer frequency
- customer value tier

Calculate:
- affected customers
- total customers in segment
- issue rate
- comparison issue rate
- lift ratio
- statistical significance where appropriate
- confidence and limitations

Never declare a segment disproportionately affected based only on raw complaint count. Compare rates against the segment's population.

### E. Root Cause Court

This is a core differentiator.

The system must evaluate each hypothesis using explicit tests:

1. Temporal test: Did the issue begin after a product release or operational change?
2. Segment specificity test: Are particular customer groups affected at a substantially higher rate?
3. Telemetry test: Do operational events support the reported failure?
4. Dose-response test: Is exposure to the suspected change associated with higher issue rates?
5. Counter-check test: Are unaffected groups or alternative explanations inconsistent with the hypothesis?

Every test must return:
- `supported`
- `rejected`
- `untested`
- `inconclusive`

If telemetry is missing, return `untested`; do not treat missing evidence as proof against the hypothesis.

Temporal correlation alone does not prove causation. Compare exposed and unexposed groups and show limitations.

The court should return:
- candidate hypotheses
- tests performed
- evidence supporting each hypothesis
- contradicting evidence
- missing evidence
- verdict
- confidence score
- reasons for the verdict

Do not use an LLM to fabricate statistical evidence. The numerical tests must be implemented in Python.

### F. Business impact estimation

Calculate using actual supplied records:
- affected customer count
- affected order count
- failed or incomplete transactions
- captured payment amount at risk
- confirmed refund amount if available
- estimated lost order value
- estimated repeat-complaint risk

Distinguish between:
- payment failed before debit
- payment debited and subsequently reversed
- payment captured but no order created
- successful order with a delivery problem
- unknown payment state

Never recommend refunding a customer solely because they complained. A refund must be based on verified transaction state and policy.

Clearly distinguish measured values from estimates and assumptions.

### G. Intervention recommendation engine

Generate and rank practical interventions.

Examples:
- investigate or roll back a release
- disable a problematic feature flag
- escalate a payment gateway issue
- reconcile captured payments without orders
- create a support incident
- notify affected customers
- issue an eligible refund
- offer a goodwill coupon to eligible customers
- update customer support scripts

Score recommendations using:
- expected customer benefit
- urgency
- estimated cost
- implementation time
- risk
- evidence confidence
- reversibility

Return a structured rationale and the evidence references used.

The LLM may explain and prioritize candidate actions, but policy and eligibility checks must be deterministic.

### H. Agent orchestration

Implement a custom tool-calling agent. Do not create a generic chatbot.

The agent should:
1. Receive an incident or emerging signal.
2. Create an investigation plan.
3. Select tools based on the missing evidence.
4. Call the tools.
5. Inspect their outputs.
6. Form and test hypotheses.
7. Request additional evidence when necessary.
8. Produce a final evidence-backed report.
9. Recommend interventions.
10. Reassess when new evidence arrives.

Use explicit tool schemas and strict validation. Limit the number of steps, tool calls, execution time, and token usage.

Persist each plan, tool call, tool result, and conclusion through the Node backend's agent trace mechanism.

If the LLM fails, the statistical pipeline must still work and the incident must be marked as partially analyzed rather than fabricated as successful.

### I. Adaptive investigation

When new evidence is injected:
- identify which evidence is new
- compare it with the existing incident
- determine which hypotheses are affected
- rerun only relevant tests where possible
- update confidence and verdicts
- explain what changed and why
- update recommendations if necessary

Support these jury scenarios:
- A hotfix has been deployed.
- Complaints begin appearing on iOS too.
- Payment telemetry is missing.
- New support transcripts are imported.
- A human approver rejects the proposed rollback.

The agent must adapt to the evidence rather than simply repeat its first answer.

## 9. LLM provider and model configuration

Use Groq as the default hosted LLM provider.

Use the OpenAI-compatible endpoint:
`https://api.groq.com/openai/v1`

Configure:
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `LLM_PROVIDER`
- `LLM_BASE_URL`
- `LLM_TIMEOUT_SECONDS`
- `LLM_MAX_RETRIES`

Do not hardcode a model ID throughout the code. Model availability changes; make it configurable and document that the selected model ID must be checked against the current Groq model catalogue.

Use the LLM for:
- feedback extraction
- issue labels
- hypothesis generation
- investigation planning
- evidence-backed explanations
- intervention descriptions
- customer message drafts

Use Python code for:
- counting
- clustering membership
- anomaly detection
- segment rates
- statistical tests
- business impact calculations
- action eligibility
- KPI verification

Do not send unnecessary customer personal information to the LLM. Redact email, phone, and other direct identifiers before external model calls.

Implement:
- provider abstraction
- timeout handling
- retries with backoff
- JSON output validation
- invalid response handling
- safe fallback behavior
- token and latency logging without logging sensitive prompts or secrets

Optionally support Ollama through a configurable local provider, but do not make it a dependency for the first working version.

## 10. Simulated recovery actions and human approval

Never execute real financial transactions, real customer messages, or real production feature-flag changes in this hackathon prototype.

Implement simulated adapters:
- `simulate_refund`
- `simulate_coupon`
- `simulate_customer_notification`
- `simulate_feature_flag_change`
- `simulate_support_ticket`

All simulated actions must be persisted with an execution result and timestamp.

Require human approval for consequential actions, especially:
- rollback or feature-flag changes
- refund or compensation workflows
- customer communications

The agent may recommend and prepare actions, but it must not silently execute them.

Implement approval endpoints:
- request approval
- approve recommendation
- reject recommendation
- view pending approvals

If approval is rejected, the agent should propose a safe alternative and explain the trade-off.

## 11. KPI monitoring and verified recovery

Define measurable recovery KPIs.

Examples:
- payment failure rate
- payment-without-order rate
- complaint volume
- refund completion time
- affected customer contact rate
- repeat complaint rate
- successful order completion rate
- repeat-order rate

Store KPI measurements with timestamps.

Do not mark an incident resolved merely because a recovery action was executed.

Require:
1. A recovery action has completed.
2. Relevant KPIs have been measured after the action.
3. KPI values meet their configured targets.
4. Targets remain satisfied for the required monitoring window.
5. No significant contradictory evidence remains.

Otherwise keep the incident in `monitoring`, or reopen/escalate it when appropriate.

## 12. Backend REST API

Implement versioned routes.

### Feedback and ingestion
- `POST /api/v1/feedback`
- `GET /api/v1/feedback`
- `GET /api/v1/feedback/:id`
- `POST /api/v1/ingestion/csv`
- `GET /api/v1/ingestion/jobs/:id`
- `POST /api/v1/operational-events`

### Dashboard and signals
- `GET /api/v1/dashboard/overview`
- `GET /api/v1/signals`
- `POST /api/v1/signals/:id/investigate`

### Incidents
- `GET /api/v1/incidents`
- `POST /api/v1/incidents`
- `GET /api/v1/incidents/:id`
- `GET /api/v1/incidents/:id/graph`
- `GET /api/v1/incidents/:id/evidence`
- `GET /api/v1/incidents/:id/hypotheses`
- `POST /api/v1/incidents/:id/investigate`
- `POST /api/v1/incidents/:id/reassess`
- `GET /api/v1/incidents/:id/agent-trace`
- `GET /api/v1/incidents/:id/impact`
- `GET /api/v1/incidents/:id/recommendations`

### Approvals and recovery
- `GET /api/v1/approvals`
- `POST /api/v1/approvals/:id/approve`
- `POST /api/v1/approvals/:id/reject`
- `POST /api/v1/incidents/:id/actions/:recommendationId/execute`
- `GET /api/v1/incidents/:id/actions`

### KPI and evidence injection
- `GET /api/v1/incidents/:id/kpis`
- `POST /api/v1/incidents/:id/evidence`
- `GET /api/v1/incidents/:id/timeline`

Use pagination, filters, consistent response envelopes, validation, and meaningful HTTP status codes.

Do not expose internal database records without a response DTO.

## 13. Frontend integration contract

My teammate is building the React frontend separately.

Create a complete `docs/API_CONTRACT.md` with:
- every endpoint
- HTTP method
- authentication requirements
- request body
- response body
- validation errors
- pagination format
- status values
- sample JSON
- CORS requirements
- expected API base URL

Create `docs/AI_SERVICE_CONTRACT.md` describing all internal Python endpoints and their Pydantic schemas.

The frontend must be able to render:
1. Dashboard overview.
2. Feedback inbox.
3. Emerging issue signals.
4. Incident list and incident detail.
5. CX issue graph.
6. Root Cause Court results.
7. Affected customer segments.
8. Evidence panel with source references.
9. Business impact.
10. Ranked intervention recommendations.
11. Human approval queue.
12. Simulated recovery action results.
13. Agent execution trace.
14. KPI monitoring.
15. Evidence injection and reassessment.
16. Data ingestion and import status.

For the issue graph, return nodes and edges in a stable, documented structure suitable for React Flow.

## 14. Synthetic dataset and demo mode

Create a reproducible synthetic data generator.

Generate approximately 60 days of food-delivery platform data with:
- feedback from multiple channels
- customers with different segments
- orders
- payment events
- delivery events
- app versions
- product releases
- operational telemetry

Plant one genuine incident:
- payment confirmation failure following app version 2.3
- concentrated in a specific affected device/OS segment
- some captured payments without successful order creation

Plant at least three decoys:
- weather-related delivery complaints
- menu price complaints
- seasonal increase in traffic or feedback

Create a hidden-truth specification for evaluation. The hidden truth must not be available to the agent's investigation tools or normal API responses.

Make the synthetic dataset deterministic using a fixed random seed.

The generated data should contain enough unaffected customers to allow fair segment comparisons.

Create scripts:
- generate synthetic dataset
- seed database
- reset demo data safely
- run demo scenario

Do not destroy existing application data when seeding. Require an explicit demo reset command and explain its effect.

## 15. Evaluation and quality

Write automated tests for:
- feedback validation
- duplicate ingestion
- CSV import
- signal detection
- clustering
- segment lift
- root-cause tests
- missing telemetry handling
- impact calculations
- refund eligibility
- approval and rejection
- simulated actions
- KPI verification
- incident lifecycle
- adaptive reassessment

Create an evaluation report comparing:
- whether the planted incident was detected
- whether the correct segment was identified
- whether the main hypothesis was supported
- whether decoys were avoided
- whether evidence was traceable
- whether recommendations were safe
- whether recovery was correctly verified

Include measurable evaluation metrics such as precision, recall, detection delay, segment identification accuracy, hypothesis verdict accuracy, and action eligibility accuracy.

Do not claim perfect accuracy without measured results.

## 16. Security and reliability

- Never commit `.env`.
- Create `.env.example` with placeholder values only.
- Validate and sanitize all external input.
- Apply rate limits to public ingestion endpoints.
- Verify internal service tokens.
- Restrict CORS.
- Avoid SQL injection.
- Redact secrets and customer identifiers from logs.
- Avoid exposing stack traces to clients.
- Add request IDs.
- Add timeouts for inter-service calls.
- Use idempotency for webhook and CSV ingestion.
- Use database transactions for related state changes.
- Make recovery actions idempotent.
- Enforce human approval for consequential actions.
- Treat imported feedback and LLM output as untrusted data.
- Never allow instructions embedded in customer feedback to override agent system instructions or tool permissions.

## 17. Execution plan — time-boxed, golden path first

Do not attempt to write the entire system in one giant file. Times are targets from the start of work; if a stage overruns, cut its Should items, never the golden path.

| Time | Stage | Output that must work before moving on |
|---|---|---|
| 0:00–0:45 | Inspect repo; freeze env config, DB schema, `API_CONTRACT.md` and `AI_SERVICE_CONTRACT.md`; `MOCK_MODE` responses | Frontend teammate can call every Must endpoint and get sample JSON |
| 0:45–1:45 | Additive migrations; Express foundation (envelope, errors, request IDs, health); synthetic generator + seed + hidden truth | `npm run seed` loads 60 days; `GET /health` on 5000 and 8000 |
| 1:45–3:15 | AI service: Groq provider + no-LLM mode, rule extraction, signal detection, clustering, segment lift, Root Cause Court, impact | `pytest` green; the court supports v2.3/Android 14 and rejects the three decoys on seeded data |
| 3:15–4:15 | Agent orchestration with persisted trace; recommendations; approvals; simulated actions | `run-detection` → incident → investigation → recommendations → approve → action, end to end |
| 4:15–5:00 | Simulated clock + KPI verification; evidence injection + reassess with diff; the 5 jury scenarios | Each scenario changes the verdict, confidence or plan as expected |
| 5:00–5:45 | Evaluation scorecard; switch `MOCK_MODE` off with the frontend; fix integration issues | Scorecard numbers measured, UI shows live data |
| 5:45–6:00 | Final full run, `docs/LOCAL_SETUP.md`, demo script in `docs/DEMO.md` | One clean run from reset to resolved |
| After | Should, then Could items | Only if the golden path is green |

At each stage:
1. Implement the code.
2. Run tests and the golden path so far.
3. Fix errors.
4. Report files created or changed, and what was verified.
5. Continue to the next stage without waiting for my approval.

Do not claim that a feature works unless you have run and verified it.

## 18. Final acceptance criteria

The implementation is not complete until I can:

1. Start the Node backend on port 5000.
2. Start the Python AI service on port 8000.
3. Connect the backend to the existing MySQL-compatible database.
4. Submit feedback through an API.
5. Import feedback through CSV.
6. Receive Google Forms submissions through the documented Apps Script webhook.
7. Store feedback and operational events.
8. Detect an emerging issue.
9. Cluster similar complaints.
10. Identify affected customer segments.
11. Run evidence-based root-cause tests.
12. Estimate business impact.
13. Generate ranked recovery recommendations.
14. Require human approval.
15. Execute simulated recovery actions.
16. Measure post-action KPIs.
17. Verify whether recovery actually worked.
18. View the complete agent execution trace.
19. Inject new evidence and observe adaptive reassessment.
20. Supply the frontend teammate with a complete, working API contract.

Start by inspecting the existing repository. Then implement the system stage by stage. Make reasonable engineering decisions without asking me to approve every file. If an essential existing configuration or database constraint prevents implementation, explain the specific blocker and propose the smallest safe change.