# RecoverIQ Frontend Build Prompt

You are working in the `client/` folder of the `TCS-Hacks` repository, built with React 19, Vite, Tailwind 4, TanStack Query, React Router, React Flow and Recharts. Keep this stack. Change only `client/`.

## What the product is

RecoverIQ follows one customer problem from complaint to verified fix, using a food-delivery example:

customer signals → emerging issue → clusters → affected segment → Root Cause Court → business impact → ranked recovery plan → human approval → simulated action → KPI verification.

The demo story: app release v2.3 breaks UPI payment confirmation on Android 14, so money is debited and no order is created. Rain, a menu price rise, seasonal traffic, a bank outage, a gateway failure and an order service outage are decoys. The UI must show that the system separated the real cause from these decoys using evidence, kept a human in control, and did not call the incident resolved until KPIs held.

## Main problem with the current client

It looks good, but it is an unconnected mock-up of a different product. The template's brand and data are still in place, and most numbers are not real.

### Bugs to fix

1. `DashboardPage.jsx` has no API calls. Every number, name and row is hardcoded.
2. `IssueGraph.jsx` always shows hardcoded nodes and ignores the incident.
3. `CustomerRecoveryListView` expects `entries` but receives `incidentId`, so it renders empty.
4. `SelfEvaluationScorecard` expects `tests` but receives nothing, so it renders empty.
5. `/incidents/INC-2026-084` is hardcoded in several places. Real incident IDs are numbers, and the readable label is `incident_number`.
6. Services return `response.data`, but the backend wraps everything as `{ success, data, meta }`. Read `response.data.data`, and read pagination from `meta.pagination`.
7. The axios timeout is 10 seconds. Investigation, reassessment and detection can take up to about 60 seconds.
8. There is no auth. Approver actions return 401 without a token.
9. Errors only go to `console.error`, so users see nothing when a call fails.
10. The header search, time filter, notification bell and history button do nothing. Sidebar and header badges are hardcoded.
11. Logout only reloads the page.

## Rules

- **Show only real data.** If the API has no value, show an empty state. Never invent a number.
- **Label demo data.** Show "All demo data is synthetic" on every page, using `data_label` from the dashboard API where available.
- **Label simulated actions.** Show "Simulated" on every action, because no real money, message or flag is touched.
- **Separate measured from estimated.** Never mix them in one figure.
- **Use the simulated clock.** Monitoring runs on `sim_now`, so show it in the header.
- **Show analysis limits.** When `partially_analyzed` is true, show "Analysed without AI conclusion".
- **Do not overclaim.** Say "supports", not "proves". Scores are a simulation test, not real-world accuracy.
- **Handle every state.** Each screen needs loading, empty, error and success states.

## API setup

- Base URL: `VITE_API_BASE_URL`, default `http://localhost:5000/api/v1`.
- Response shape: `{ success, data, meta: { requestId, pagination } }`. Errors: `{ success: false, error: { code, message, details } }`.
- Pagination: send `page` and `page_size`. Read `page`, `page_size`, `total` and `total_pages`.
- Auth: `POST /auth/login` with `{ email, password }` returns `{ token, user }`. Send `Authorization: Bearer <token>`.
- JSON keys are snake_case. Rename them in one place, or use snake_case throughout, but do not mix both.
- Delete `src/mocks/data.js` and all `USE_MOCKS` branches. To work without a database, run the backend with `MOCK_MODE=true`. Mock mode needs no login, and POST calls change nothing.
- Use a 120-second timeout for investigate, reassess, run-detection, scenario, reject and evaluate calls. Show progress text while they run.
- After any change, invalidate the affected queries: incident, recommendations, approvals, KPIs, graph and dashboard.

### Replace these service calls

| Current call | Replace with |
|---|---|
| `GET /incidents/:id/segments` | `segments` from `GET /incidents/:id` |
| `GET /incidents/:id/customer-recovery` | `GET /incidents/:id/reconciliation` |
| `GET /incidents/:id/scorecard` | `GET /simulation-test` |
| `POST /incidents/:id/inject-evidence` | `POST /incidents/:id/evidence` |
| `GET /recommendations` | `GET /incidents/:id/recommendations`, or `GET /approvals` across incidents |
| `GET /recovery-actions` | `GET /incidents/:id/actions` for each incident |
| `POST /recommendations/:id/approve` | `POST /approvals/:approval_id/approve` with `{ comments }` |
| `POST /recommendations/:id/reject` | `POST /approvals/:approval_id/reject` with `{ comments }` |
| `GET /kpis/monitoring` | `GET /incidents/:id/kpis` |
| `POST /kpis/refresh` | `POST /demo/advance-clock` with `{ minutes }` |
| `POST /feedback/import` | `POST /ingestion/csv` as multipart field `file` |
| `GET /signals/:id` | Use the row from `GET /signals` |

### Field changes

| Current field | Backend field |
|---|---|
| `incident.id` shown as a label | `incident_number` |
| `severity` as critical, high, medium, low | `severity`, a number from 0 to 1, with `severity_inputs` and `severity_formula` |
| `confidence` | `confidence_score`, 0 to 1 |
| `estimatedFinancialImpact` | `estimated_business_impact` |
| `affectedCustomers` | `affected_customer_count` |
| `primaryHypothesis` | `root_cause_verdict` |
| `hyp.title`, `hyp.likelihoodScore` | `hypothesis`, `confidence_score` |
| `test.name`, `test.verdict` | `test_name`, `status` |
| `rec.approvalStatus` | `approval_decision` and `status` |
| `step.stepNumber`, `step.agentName`, `step.toolName` | `step_number`, `agent_name`, `tool_name` (can be null) |
| `step.outputSummary` as text | `output_summary`, a JSON object |
| KPI `baseline`, `history` | `kpis[].points[]`, first point is the baseline |

### Status values

- Incident: `detected, investigating, awaiting_approval, approved, executing, monitoring, resolved, rejected, escalated, reopened`
- Test: `supported, rejected, untested, inconclusive`
- Hypothesis: the same, plus `overlapping`
- Recommendation: `proposed, approved, rejected, executed, superseded`
- Approval: `pending, approved, rejected, superseded`
- Signal: `open, watch, explained, incident`
- Verification: `recovered, monitoring, not_recovered`

Remove `primary_cause`, `disproven`, `verifying` and `recovery_in_progress`.

## Global layout

- Brand: replace **OpsPilot** with **RecoverIQ** in the header and page title.
- User: replace "Liam Anderson", the Unsplash photo and "Operations Manager" with the logged-in user.
- Sidebar: keep the floating style, but add visible tooltips and keyboard focus. Use these items: Overview, Incidents, Signals, Approvals, Feedback, Recovery, Ingestion, Simulation Test.
- Icons: stop using the settings icon for Incidents.
- Badges: approvals from `approvals_pending`, signals from `signals_open`. Hide a badge when the count is 0.
- Header: keep search only if it filters the current page. Remove the time filter, bell and history button, because the API does not support them.
- Add a `sim_now` clock to the header, from `GET /demo/clock`.
- Add a `/login` page and protect approver actions. Logout must clear the token.
- Pick one visual system. Pages mix fixed hex styles with `slate` and `purple` classes, so move the colours into shared tokens and reuse `Card`, `Badge`, `Button`, `StatCard`.
- Make all pages work at phone width.

## Pages

### 1. Overview (replace `DashboardPage` completely)

Rename "Automation center" to **Recovery overview**. Data: `GET /dashboard/overview`, `GET /approvals?decision=pending`, and `GET /incidents/:id/kpis` for the active incident.

Include:

1. **Stat cards:** open incidents, affected customers (`open_affected_customers`), business impact (`open_business_impact`), pending approvals, open signals, feedback in 24 hours.
2. **Recovery pipeline:** keep the current connected-node look, but use real stages and counts: Feedback → Signals → Investigating → Awaiting approval → Monitoring → Resolved. Counts come from `feedback_total`, `signals_open` and `incidents_by_status`.
3. **Active incident card:** title, status stepper, verdict, confidence, affected customers, impact and an "Open case" button.
4. **Pending approvals:** top 3 with action, risk, cost and incident number.
5. **Latest signals:** include `explained` and `watch` signals with their triage reason. This shows decoys being ignored.
6. **Recovery KPI:** small trend for the active incident with its target line.
7. **Demo controls** (approver only): run detection, scenario buttons from `GET /demo/scenarios`, advance clock by 15, 60 or 240 minutes, run simulation test, and reset with a confirmation step.

Remove: Create Workflow, Active Workflows, Success Rate, Failed Tasks, Customer onboarding, Invoice generation, Budget allocation, Contract validation, Department, Owner, and every hardcoded alert.

### 2. Incidents

- List from `GET /incidents`, filtered by `status` and `category`, with pagination.
- Each row: number, title, status, severity, confidence, affected customers, impact.
- Show a "New incident" action only for approvers, using `POST /incidents`.

### 3. Incident detail (most important page)

Keep the hero card, using real fields. Add a lifecycle stepper, and show `reopened`, `rejected` and `escalated` clearly. Add the severity inputs behind an info control.

Reduce the 10 tabs to these, in this order:

1. **Summary:** verdict, `explanation` sentences with `numbers_used` shown on hover, and the decision brief.
2. **Root Cause Court:** hypotheses and tests.
3. **Payment funnel:** new.
4. **Issue graph:** real data.
5. **Segments and clusters:** both from incident detail.
6. **Impact and reconciliation:** impact plus the new reconciliation view.
7. **Recovery plan:** recommendations and actions.
8. **KPIs:** recovery verification.
9. **Evidence and trace:** evidence, agent trace, timeline and reassessment diffs.

**Root Cause Court**
- Show one row per hypothesis with its 5 tests: `temporal`, `segment_specificity`, `telemetry`, `dose_response`, `counter_check`.
- A compact grid of hypotheses by tests is the strongest view for a jury. Expanding a row shows each test's explanation and `result`.
- Show `predicted_stage` against the observed stage.
- Style `overlapping` as a narrower hypothesis being preferred, not as a failure.
- Show `untested` as missing evidence, never as rejected.
- Show `evidence_summary.supporting`, `contradicting` and `missing`, plus `court.limitations`.
- Rename "Likelihood" to "Confidence". Remove "Bayesian" wording.

**Payment funnel** (new, `GET /incidents/:id/funnel`)
- Show each stage's `entered`, `passed` and `conversion` against `baseline_conversion` and `complement_conversion`.
- Highlight `breakpoint`, and show the segment and window.
- When `telemetry_available` is false, show that the funnel cannot be tested.

**Issue graph**
- Load `GET /incidents/:id/graph`. Use the backend's `nodes` and `edges`, including `type` and `position`.
- Add custom node styles for: `signal`, `incident`, `cluster`, `segment`, `hypothesis`, `recommendation`, `action`, `kpi`.
- Add a switch to `knowledge_graph`, styling nodes and edges by `fact_kind`: `observed`, `derived`, `hypothesis`, `verdict`.
- Add a run comparison using `?diff=runA,runB` with values from `knowledge_graph.runs`. Show `added`, `removed` and `changed`.
- The drawer shows real `data` only. Remove "verified by the autonomous causal reasoning loop".

**Impact and reconciliation**
- Keep Measured, Estimated and Assumptions as three separate blocks, from `GET /incidents/:id/impact`.
- Reconciliation from `GET /incidents/:id/reconciliation`: count and money for `order_created`, `captured_no_order_pending_reversal`, `captured_no_order_reversed`, `captured_no_order_overdue`, `unknown`.
- Show the `overdue` table. Customer IDs arrive masked.
- Replace the current Customer Recovery List with this view. Remove customer names and emails.

**Recovery plan**
- Rank by `priority`. Show score, cost, risk, expected benefit, and the `rationale.score_breakdown` on expand.
- **Approve and execute are separate steps.** Replace "Authorize & Execute Simulation" with "Approve", then "Run simulated action" using `POST /incidents/:id/actions/:recommendationId/execute`.
- Actions with `requires_approval: false` show only the run button.
- Show `403 APPROVAL_REQUIRED` clearly.
- Reject returns `alternative` and `reassessment`. Show the alternative's `trade_off` and the `what_changed` list.
- Show `policy_checks`, for example refunds blocked because telemetry is missing.
- Hide `superseded` items under a "History" toggle.
- Replace the "in-memory" hackathon note with: "Simulated: no real money, message or flag is touched."

**KPIs**
- Use `GET /incidents/:id/kpis`. Chart `points` with a target line.
- Use `comparison_operator`, because some targets are "at most" and some are "at least". The current `<` is wrong for those.
- Show a banner from `verification.outcome` and `reasons`.
- For each KPI, show progress as `sustained_minutes` of `monitoring_window_minutes`. This explains why an executed action is not yet resolved.
- Replace "Refresh Measurements" with "Advance simulated clock".

**Evidence and trace**
- Evidence: show `source_table` and `source_record_id`, with `feedback` rows linking to the record.
- Evidence injection: replace the title, source and relation form with `POST /incidents/:id/evidence`, body `{ kind, description, feedback_ids?, telemetry_available?, auto_reassess }`. `kind` is one of `hotfix_deployed, new_complaints, telemetry_missing, support_transcripts, other`.
- For jury demos, use `POST /demo/scenario/:name`, not fixed text. Names: `hotfix_deployed, ios_complaints, telemetry_missing, support_transcripts, rollback_rejected, relapse`.
- Show the reassessment as a before and after panel from `what_changed`, `hypotheses_changed`, `recommendations_added` and `recommendations_removed`, with `tests_rerun` and `tests_reused`.
- Trace: use `GET /incidents/:id/agent-trace`, grouped by `runs`. Format `input_summary` and `output_summary` as readable JSON, and show planner steps with a null tool properly.
- Timeline: `GET /incidents/:id/timeline`, sorted by `at`.

### 4. Decision brief (new, Summary tab and Approvals page)

Use `GET /incidents/:id/decision-brief`. Show `headline`, `what_happened`, `evidence[]`, `options[]` as a comparison table, `recommended_option`, `if_rejected`, `confidence_statement`, and `numbers_used`.

Show `generator` as "AI-written" or "Template", and show a warning if `grounding_passed` is false. Leave `usefulness_rating` out for now.

### 5. Approvals

- Use `GET /approvals?decision=pending`. Each item includes `decision_brief`.
- Group by incident, and put the brief above its actions.
- Add a decided list using `decision=approved` and `decision=rejected`.
- Calculate the stat cards from real data. Remove "Avg Approval SLA".
- Require comments when rejecting.

### 6. Signals

- Use `GET /signals`, filtered by status.
- Show current count, baseline, rate ratio, anomaly score, severity and `triage_reason` from `metrics`.
- Explain `explained` and `watch`, because these are the decoys.
- The investigate action returns incident detail, so navigate using its `id`.

### 7. Feedback

This page currently shows workflow logs. Rebuild it as a feedback inbox.

- Columns: time, source, channel, rating, text, category, sentiment, urgency, processing status, customer reference.
- API filters: `category`, `status` and `source`. Remove channel, sentiment, urgency and search filters, unless they only filter the loaded page and say so.
- Remove Execution ID, Workflow Name, Triggered By, Duration and all workflow options.
- The drawer uses `GET /feedback/:id` and shows `metadata.extraction`: intent, confidence, pain point, financial loss, and whether it was handled by `m1`, `llm` or `rules`.

### 8. Recovery

- List simulated actions across incidents, and link each to its incident.
- Show `action_type`, `target_reference`, `execution_result`, `executed_at`.
- Keep every action labelled Simulated. Remove any fixed success text and "342 customers".

### 9. Ingestion

- CSV: template link `GET /ingestion/csv/template`. Upload as multipart, then show accepted, duplicates, failed and row errors. Poll `GET /ingestion/jobs/:id`.
- Google Forms: replace the sample script. It must send `response_id` and the `X-Webhook-Token` header to `/ingestion/google-forms`. Remove the random customer reference, because `response_id` makes retries safe.
- Website form: `POST /feedback/website`. Fields: `rating`, `comment`, `order_reference`, `contact_email`, `contact_consent`. Require consent when an email is given.
- External sources: label them as simulated adapters.

### 10. Simulation Test (new page)

Move this out of the incident tabs.

- `GET /simulation-test` loads results. `POST /demo/evaluate` runs them.
- Show the `checks` pass or fail from data. Remove the always-green "Passed" badge.
- Show `metrics`, `hypothesis_verdicts` and `top_segment`.
- Show this line prominently: "This shows the logic finds a planted fault. It is not real-world accuracy."
- A 404 means no run yet, so show a "Run test" empty state.

### 11. Models (small section on Simulation Test)

Use `GET /models`. Show the M1 version, training data and evaluation. If `human_checked_test.status` is `not_available`, say the human-checked score is pending. Do not show the proxy score as accuracy.

## Remove completely

- OpsPilot branding, Liam Anderson, Mario Lee and every sample person
- All workflow wording
- Fake details: Datadog, ConfigCat, PR #4182, commit hashes, 92x lift, 98.1%, "Bayesian", "SRS AT-1 to AT-13", and fixed percentages
- `src/mocks/data.js`, hardcoded incident IDs and badges
- Customer names, emails and phone numbers
- Unused code: `RecoveryPage`'s fixed stats, unused imports, and `PAYMENT_STATES`, `ISSUE_CATEGORIES` in `types/index.js` that do not match the backend
- Any chart with no API data, including feedback trends, sentiment and severity distribution

## Do not build

These backend features do not exist: customer message drafts, M2 attribution, `GET /incidents/:id/attribution`, graph explain-path, notifications, and date-range filtering.

## Known backend gaps

- Mock mode has no samples yet for funnel, reconciliation, decision-brief, shared-components, models and simulation-test. Keep empty states ready. Mock responses for these need capturing after database setup.
- `GET /models` is not yet confirmed working.
- Decision briefs currently come from the template, so handle both generators.

## Done when

1. `npm run build` and `npm run lint` pass.
2. No hardcoded incident, person or metric remains. Searching for `OpsPilot`, `INC-2026-084`, `Liam`, `workflow` and `mockIncidents` finds nothing.
3. With the live backend, this path works in the UI: reset → run detection → open incident → review court → reject rollback → approve flag and refund → run actions → advance clock 45 minutes (still `monitoring`) → advance 240 minutes (`resolved`) → run simulation test.
4. Each scenario shows a visible change in verdict, confidence or plan.
5. Every page has loading, empty and error states, and works at phone width.
