// Generates docs/API_CONTRACT.md. Samples come from src/mocks, which are recorded from the live API.
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../src/config/env.js';

const mocks = path.join(env.serverRoot, 'src', 'mocks');
const manifest = JSON.parse(fs.readFileSync(path.join(mocks, 'manifest.json'), 'utf8'));

const A = 'Approver';
const P = 'Public';
const SECTIONS = [
  ['Auth', [['POST', '/auth/login', P, 'Get a JWT. Body: `email`, `password`.']]],
  ['Feedback and ingestion', [
    ['POST', '/feedback', P, 'Submit feedback. Body: `text` (required, 1-4000), `source`, `channel`, `rating` (1-5), `customer_id`, `order_id`, `source_record_id`, `timestamp` (ISO 8601), `metadata`. Returns 202, or 200 with `duplicate: true` on a repeat delivery.'],
    ['POST', '/feedback/website', P, 'Website form. Body: `rating`, `comment`, `order_reference`, `contact_email`, `contact_consent` (required when an email is given).'],
    ['POST', '/ingestion/google-forms', 'Header `X-Webhook-Token`', 'Apps Script webhook. Body: `response_id`, `comment`, `rating`, `order_reference`, `customer_reference`, `submitted_at`.'],
    ['GET', '/feedback', P, 'Inbox. Filters: `category`, `status`, `source`, `page`, `page_size`.'],
    ['GET', '/feedback/:id', P, 'One record with extraction results.'],
    ['GET', '/ingestion/csv/template', P, 'Downloads the CSV template.'],
    ['POST', '/ingestion/csv', P, 'Multipart: `file` (max 5 MB, 5000 rows), optional `mapping` JSON such as `{"text":"comment"}`.'],
    ['POST', '/ingestion/import/:platform', A, 'Simulated adapters: `support_tickets`, `app_store`, `social`, `contact_center`. Body: `records[]`.'],
    ['GET', '/ingestion/jobs/:id', P, 'Import status.'],
    ['POST', '/operational-events', P, 'Payment, order, delivery and release events.'],
  ]],
  ['Dashboard and signals', [
    ['GET', '/dashboard/overview', P, 'Headline counts, latest signals and incidents.'],
    ['GET', '/signals', P, 'Filters: `status` (`open`, `watch`, `explained`, `incident`), pagination.'],
    ['POST', '/signals/:id/investigate', A, 'Opens or re-runs an investigation. Returns incident detail.'],
  ]],
  ['Incidents', [
    ['GET', '/incidents', P, 'Filters: `status`, `category`, pagination.'],
    ['POST', '/incidents', A, 'Manual incident. Body: `title`, `issue_category`, `description`, `window_start`.'],
    ['GET', '/incidents/:id', P, 'Everything for the detail page: court, segments, clusters, impact, recommendations, reassessments.'],
    ['GET', '/incidents/:id/graph', P, 'React Flow `nodes` and `edges`. Node `type`: `signal`, `incident`, `cluster`, `segment`, `hypothesis`, `recommendation`, `action`, `kpi`. Also returns `knowledge_graph` with `fact_kind` on each node and edge. `?diff=runA,runB` adds `knowledge_graph.diff`.'],
    ['GET', '/incidents/:id/evidence', P, 'Evidence with `source_table` and `source_record_id`.'],
    ['GET', '/incidents/:id/hypotheses', P, 'Root Cause Court results with the 5 tests per hypothesis.'],
    ['POST', '/incidents/:id/investigate', A, 'Runs the agent. Synchronous: allow up to 60 seconds.'],
    ['POST', '/incidents/:id/reassess', A, 'Manual reassessment. Returns the diff.'],
    ['GET', '/incidents/:id/agent-trace', P, 'Runs with every plan, tool call and conclusion step.'],
    ['GET', '/incidents/:id/impact', P, '`measured`, `estimated`, `assumptions` and payment `states`, kept separate.'],
    ['GET', '/incidents/:id/recommendations', P, 'Ranked, with `approval_id` and `approval_decision`.'],
    ['GET', '/incidents/:id/actions', P, 'Simulated action results.'],
    ['POST', '/incidents/:id/actions/:recommendationId/execute', A, 'Runs a simulated action. 403 `APPROVAL_REQUIRED` until approved. Repeat calls return `idempotent_replay: true`.'],
    ['GET', '/incidents/:id/kpis', P, 'Series for charts plus `verification` (`outcome`, `reasons`, per-KPI state).'],
    ['POST', '/incidents/:id/evidence', A, 'Inject evidence. Body: `kind` (`hotfix_deployed`, `new_complaints`, `telemetry_missing`, `support_transcripts`, `other`), `description`, `feedback_ids`, `telemetry_available`, `auto_reassess`.'],
    ['GET', '/incidents/:id/timeline', P, 'Audit entries, actions and agent runs. Sort by `at`.'],
    ['GET', '/incidents/:id/funnel', P, 'Stages, baseline against current conversion, and `breakpoint`.'],
    ['GET', '/incidents/:id/reconciliation', P, 'Counts and money by reconcile state, and the `overdue` list with masked customers.'],
    ['GET', '/incidents/:id/decision-brief', P, 'Latest brief with `numbers_used`, `generator` (`llm` or `template`) and `grounding_passed`.'],
    ['GET', '/incidents/:id/shared-components', P, 'Attributes common to failing journeys. Labelled `attribution_evidence`, not a cause.'],
  ]],
  ['Approvals', [
    ['GET', '/approvals', P, 'Queue. Filter: `decision=pending`.'],
    ['POST', '/approvals', A, 'Request approval. Body: `recommendation_id`, `comments`.'],
    ['POST', '/approvals/:id/approve', A, 'Body: `comments`.'],
    ['POST', '/approvals/:id/reject', A, 'Body: `comments`. Returns the safe `alternative` with its trade-off, and the `reassessment` diff.'],
  ]],
  ['Demo and evaluation', [
    ['POST', '/demo/run-detection', A, 'Processes pending feedback, detects signals, opens and investigates incidents. Allow up to 60 seconds.'],
    ['POST', '/demo/reset', A, 'Body must be `{"DEMO_RESET_CONFIRM":"yes"}`. Removes synthetic incidents and scenario rows only.'],
    ['POST', '/demo/advance-clock', A, 'Body: `minutes` (1-1440). Generates KPI points and verifies recovery.'],
    ['GET', '/demo/clock', P, 'Current `sim_now`.'],
    ['GET', '/demo/scenarios', P, 'Scenario names.'],
    ['POST', '/demo/scenario/:name', A, '`hotfix_deployed`, `ios_complaints`, `telemetry_missing`, `support_transcripts`, `rollback_rejected`, `relapse`.'],
    ['POST', '/demo/evaluate', A, 'Runs the evaluation script and returns the scorecard.'],
    ['GET', '/evaluation/scorecard', P, 'Latest scorecard. 404 until evaluated.'],
    ['GET', '/simulation-test', P, 'Same data as the scorecard, under its final name. It tests planted faults, not real-world accuracy.'],
    ['GET', '/models', P, 'M1 version, training data and evaluation. M2 is `not_built`.'],
  ]],
];

const shrink = (v, depth = 0) => {
  if (Array.isArray(v)) return v.slice(0, 2).map((x) => shrink(x, depth + 1));
  if (v && typeof v === 'object') {
    if (depth > 5) return '...';
    return Object.fromEntries(Object.entries(v).slice(0, 30).map(([k, x]) => [k, shrink(x, depth + 1)]));
  }
  return typeof v === 'string' && v.length > 140 ? `${v.slice(0, 140)}...` : v;
};

const sample = (method, route) => {
  const m = manifest.find((e) => e.method === method && e.route === route);
  if (!m) return '';
  const { data, pagination } = JSON.parse(fs.readFileSync(path.join(mocks, m.file), 'utf8'));
  const body = { success: true, data: shrink(data), meta: { requestId: 'uuid', ...(pagination ? { pagination } : {}) } };
  return `Status ${m.status}. Sample (arrays trimmed to 2 items):\n\n\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\`\n`;
};

let out = `# RecoverIQ API Contract

Generated by \`node scripts/build-contract.js\`. Samples are recorded from the running API. All sample data is synthetic.
Shapes are frozen: later changes are additive only.

## Basics

- Base URL: \`http://localhost:5000/api/v1\`. Health: \`GET http://localhost:5000/health\`.
- CORS allows \`CLIENT_ORIGIN\` (default \`http://localhost:5173\`), with credentials.
- **Mock mode:** \`MOCK_MODE=true\` in \`server/.env\` serves these samples with no database or AI service. Auth is not enforced and POSTs change nothing.
- **Auth:** "Approver" routes need \`Authorization: Bearer <token>\` from \`POST /auth/login\`. Scripts may use \`X-Owner-Token\`.
- All JSON keys are snake_case, and times are ISO 8601 UTC. Monitoring runs on the simulated clock, not the wall clock.

## Envelope

\`\`\`json
{ "success": true, "data": {}, "meta": { "requestId": "uuid", "pagination": { "page": 1, "page_size": 20, "total": 42, "total_pages": 3 } } }
\`\`\`

\`\`\`json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed", "details": [{ "path": "text", "message": "Required" }] }, "meta": { "requestId": "uuid" } }
\`\`\`

| HTTP | code | When |
|---|---|---|
| 401 | UNAUTHORIZED | Missing or invalid credentials |
| 403 | APPROVAL_REQUIRED | Executing an unapproved action |
| 404 | NOT_FOUND | Unknown id or route |
| 409 | CONFLICT | Invalid lifecycle move, or already decided |
| 422 | VALIDATION_ERROR, INVALID_CSV | Bad input |
| 429 | RATE_LIMITED | Slow down |
| 502, 503 | AI_SERVICE_ERROR, AI_SERVICE_UNAVAILABLE | AI service failed; nothing is fabricated |

## Status values

- Incident: \`detected, investigating, awaiting_approval, approved, executing, monitoring, resolved, rejected, escalated, reopened\`
- Test: \`supported, rejected, untested, inconclusive\`
- Hypothesis: the same, plus \`overlapping\` when a narrower supported hypothesis is preferred
- Recommendation: \`proposed, approved, rejected, executed, superseded\`
- Approval: \`pending, approved, rejected, superseded\`
- Signal: \`open, watch, explained, incident\`
- Verification outcome: \`recovered, monitoring, not_recovered\`
- Payment state: \`failed_before_debit, debited_then_reversed, captured_no_order, delivery_problem, unknown_payment_state\`

An incident with \`partially_analyzed: true\` was analysed without an LLM conclusion. Its numbers are still computed; show the flag. In \`explanation\`, every sentence lists \`numbers_used\` with JSON paths into the tool output.

## Endpoints

`;
for (const [title, rows] of SECTIONS) {
  out += `\n### ${title}\n`;
  for (const [method, route, auth, notes] of rows) out += `\n#### \`${method} ${route}\`\n\nAuth: ${auth}. ${notes}\n\n${sample(method, route)}`;
}
fs.writeFileSync(path.join(env.repoRoot, 'docs', 'API_CONTRACT.md'), out);
console.log(`docs/API_CONTRACT.md: ${SECTIONS.flatMap((s) => s[1]).length} endpoints`);
