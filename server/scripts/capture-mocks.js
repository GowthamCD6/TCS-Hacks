// Records live responses from a running API into src/mocks, so mocks can never drift from real shapes.
// Mock samples are captured in rich states: mid-flow for approvals, after recovery for KPIs.
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../src/config/env.js';

const base = `${process.env.API_URL ?? `http://localhost:${env.PORT}`}/api/v1`;
const headers = { 'Content-Type': 'application/json', 'x-owner-token': env.OWNER_API_TOKEN };
const dir = path.join(env.serverRoot, 'src', 'mocks');
const manifest = [];

async function call(method, url, body) {
  const res = await fetch(base + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const payload = await res.json();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(payload.error)}`);
  return { status: res.status, data: payload.data, pagination: payload.meta?.pagination };
}

async function record(method, route, url, body) {
  const out = await call(method, url, body);
  const file = `${method}${route.replace(/[/:]/g, '_')}.json`;
  fs.writeFileSync(path.join(dir, file), JSON.stringify({ data: out.data, pagination: out.pagination }, null, 2));
  manifest.push({ method, route, file, status: out.status });
  return out.data;
}

fs.mkdirSync(dir, { recursive: true });
await call('POST', '/demo/reset', { DEMO_RESET_CONFIRM: 'yes' });
await record('POST', '/demo/run-detection', '/demo/run-detection');
const id = (await call('GET', '/incidents')).data[0].id;
const stem = `/incidents/${id}`;
const p = '/incidents/:id';

await record('POST', '/feedback', '/feedback', { source: 'mock-capture', source_record_id: `capture-${Date.now()}`, channel: 'api', text: 'SYNTHETIC: UPI money deducted but no order was created', rating: 1 });
await record('GET', '/feedback', '/feedback?page_size=10&category=payment');
const fb = (await call('GET', '/feedback?page_size=1')).data[0];
await record('GET', '/feedback/:id', `/feedback/${fb.id}`);
await record('GET', '/dashboard/overview', '/dashboard/overview');
await record('GET', '/signals', '/signals');
await record('GET', '/incidents', '/incidents');
await record('GET', '/demo/clock', '/demo/clock');
await record('GET', '/demo/scenarios', '/demo/scenarios');
await record('GET', '/approvals', '/approvals?decision=pending');

const recs = await record('GET', `${p}/recommendations`, `${stem}/recommendations`);
await record('POST', '/demo/scenario/:name', '/demo/scenario/support_transcripts');
await record('POST', `${p}/reassess`, `${stem}/reassess`);
const rollback = recs.find((r) => r.action_key === 'rollback_release');
await record('POST', '/approvals/:id/reject', `/approvals/${rollback.approval_id}/reject`, { comments: 'SYNTHETIC: rollback rejected in peak hours' });
const fresh = (await call('GET', `${stem}/recommendations`)).data;
const flag = fresh.find((r) => r.action_key === 'disable_feature_flag');
await record('POST', '/approvals/:id/approve', `/approvals/${flag.approval_id}/approve`, { comments: 'SYNTHETIC: approved' });
await record('POST', `${p}/actions/:recommendationId/execute`, `${stem}/actions/${flag.id}/execute`);
await record('POST', '/demo/advance-clock', '/demo/advance-clock', { minutes: 240 });

await record('GET', p, stem);
for (const name of ['graph', 'evidence', 'hypotheses', 'agent-trace', 'impact', 'actions', 'kpis', 'timeline', 'funnel', 'reconciliation', 'decision-brief', 'shared-components']) await record('GET', `${p}/${name}`, `${stem}/${name}`);
await record('POST', '/demo/evaluate', '/demo/evaluate');
await record('GET', '/evaluation/scorecard', '/evaluation/scorecard');
await record('GET', '/simulation-test', '/simulation-test');
await record('GET', '/models', '/models');

const stub = (method, route, data, status = 200) => {
  const file = `${method}${route.replace(/[/:]/g, '_')}.json`;
  fs.writeFileSync(path.join(dir, file), JSON.stringify({ data }, null, 2));
  manifest.push({ method, route, file, status });
};
stub('POST', '/auth/login', { token: 'mock-token', user: { id: 1, display_name: 'Demo Approver', role: 'approver' } });
stub('POST', '/demo/reset', { incidents: 1, kept: 'Non-synthetic records were not touched.' });
stub('POST', '/ingestion/csv', { job_id: 1, total_records: 2, accepted: 1, duplicates: 0, failed: 1, errors: [{ row: 3, errors: ['text: String must contain at least 1 character(s)'] }] }, 202);
stub('GET', '/ingestion/jobs/:id', { id: 1, source: 'csv', status: 'completed', total_records: 2, processed_records: 1, failed_records: 1, duplicate_records: 0, error_summary: null, created_at: '2026-10-14T00:00:00.000Z', completed_at: '2026-10-14T00:00:05.000Z' });
stub('POST', '/operational-events', { id: 1 }, 201);
stub('POST', `${p}/evidence`, { evidence_id: 1, reassessment: (await call('GET', stem)).data.reassessments[0]?.diff ?? null, incident_status: 'awaiting_approval' }, 201);
stub('POST', `${p}/investigate`, (await call('GET', stem)).data);
stub('POST', '/signals/:id/investigate', (await call('GET', stem)).data);

fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
await call('POST', '/demo/reset', { DEMO_RESET_CONFIRM: 'yes' });
console.log(`captured ${manifest.length} mock routes`);
