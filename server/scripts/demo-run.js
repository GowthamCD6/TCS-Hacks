// Runs the whole golden path against a running API and stops at the first unmet expectation.
// Usage: API_URL=http://localhost:5000 OWNER_API_TOKEN=... node scripts/demo-run.js
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';

const base = `${process.env.API_URL ?? `http://localhost:${env.PORT}`}/api/v1`;
const headers = { 'Content-Type': 'application/json', 'x-owner-token': env.OWNER_API_TOKEN };

async function api(method, path, body) {
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const payload = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(payload.error)}`);
  return payload.data;
}
const log = (msg, extra) => console.log(`- ${msg}`, extra ?? '');

await api('POST', '/demo/reset', { DEMO_RESET_CONFIRM: 'yes' });
log('demo reset');

const detection = await api('POST', '/demo/run-detection');
log('detection', { signals: detection.signals.map((s) => `${s.category}:${s.status}`), incidents: detection.incidents_created });
assert.equal(detection.incidents_created.length, 1);

const [incident] = await api('GET', '/incidents');
const id = incident.id;
let detail = await api('GET', `/incidents/${id}`);
log('investigated', { status: detail.status, verdict: detail.root_cause_verdict, confidence: detail.confidence_score, partial: detail.partially_analyzed });
assert.equal(detail.status, 'awaiting_approval');
assert.equal(detail.court.verdict_key, 'release_2.3_android');

const trace = await api('GET', `/incidents/${id}/agent-trace`);
log('trace steps', trace.runs[0].steps.length);
const graph = await api('GET', `/incidents/${id}/graph`);
log('graph', { nodes: graph.nodes.length, edges: graph.edges.length });

const blocked = await fetch(`${base}/incidents/${id}/actions/${detail.recommendations.find((r) => r.requires_approval).id}/execute`, { method: 'POST', headers });
assert.equal(blocked.status, 403);
log('unapproved execution refused', blocked.status);

const transcripts = await api('POST', '/demo/scenario/support_transcripts');
log('transcripts', transcripts.result.reassessment.what_changed);

const rejected = await api('POST', '/demo/scenario/rollback_rejected');
log('rollback rejected', rejected.result.alternative);
assert.ok(rejected.result.alternative);

const pick = async (key) => (await api('GET', `/incidents/${id}/recommendations`)).find((r) => r.action_key === key && r.status !== 'superseded');
const flag = await pick('disable_feature_flag');
await api('POST', `/approvals/${flag.approval_id}/approve`, { comments: 'Scoped flag approved' });
const refund = await pick('issue_eligible_refunds');
await api('POST', `/approvals/${refund.approval_id}/approve`, { comments: 'Verified refunds only' });
const act1 = await api('POST', `/incidents/${id}/actions/${flag.id}/execute`);
const again = await api('POST', `/incidents/${id}/actions/${flag.id}/execute`);
assert.equal(again.idempotent_replay, true);
const act2 = await api('POST', `/incidents/${id}/actions/${refund.id}/execute`);
log('actions', { flag: act1.status, refund: act2.execution_result });

detail = await api('GET', `/incidents/${id}`);
assert.equal(detail.status, 'monitoring');
const early = await api('POST', '/demo/advance-clock', { minutes: 45 });
log('after 45 sim minutes', early.verifications);
assert.equal((await api('GET', `/incidents/${id}`)).status, 'monitoring');

const late = await api('POST', '/demo/advance-clock', { minutes: 240 });
log('after 285 sim minutes', late.verifications);
detail = await api('GET', `/incidents/${id}`);
assert.equal(detail.status, 'resolved');
const kpis = await api('GET', `/incidents/${id}/kpis`);
log('kpis', kpis.verification.kpis.map((k) => `${k.name}=${k.latest_value}`));

const score = await api('POST', '/demo/evaluate');
log('scorecard', score);
console.log('\nGolden path passed.');
