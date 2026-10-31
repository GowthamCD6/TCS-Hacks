// Runs each jury scenario from a fresh reset and prints what it changed.
import { env } from '../src/config/env.js';

const base = `${process.env.API_URL ?? `http://localhost:${env.PORT}`}/api/v1`;
const headers = { 'Content-Type': 'application/json', 'x-owner-token': env.OWNER_API_TOKEN };

async function api(method, path, body) {
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const payload = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(payload.error)}`);
  return payload.data;
}

async function fresh() {
  await api('POST', '/demo/reset', { DEMO_RESET_CONFIRM: 'yes' });
  await api('POST', '/demo/run-detection');
  return (await api('GET', '/incidents'))[0].id;
}

for (const name of ['hotfix_deployed', 'ios_complaints', 'telemetry_missing', 'support_transcripts', 'rollback_rejected']) {
  const id = await fresh();
  const { result } = await api('POST', `/demo/scenario/${name}`);
  const diff = result.reassessment;
  const detail = await api('GET', `/incidents/${id}`);
  console.log(`\n## ${name} -> status ${detail.status}, confidence ${detail.confidence_score}`);
  console.log(`   verdict: ${detail.root_cause_verdict}`);
  console.log(`   tests rerun ${diff.tests_rerun}, reused ${diff.tests_reused}`);
  diff.what_changed.forEach((c) => console.log(`   * ${c}`));
}

// A mitigation that later regresses must reopen the incident rather than resolve it.
const id = await fresh();
const recs = await api('GET', `/incidents/${id}/recommendations`);
const rollback = recs.find((r) => r.action_key === 'rollback_release');
await api('POST', `/approvals/${rollback.approval_id}/approve`, {});
await api('POST', `/incidents/${id}/actions/${rollback.id}/execute`);
await api('POST', '/demo/advance-clock', { minutes: 30 });
await api('POST', '/demo/scenario/relapse');
await api('POST', '/demo/advance-clock', { minutes: 300 });
console.log(`\n## relapse -> status ${(await api('GET', `/incidents/${id}`)).status}`);

// Notifying customers without a fix must not look like recovery.
const id2 = await fresh();
const notify = (await api('GET', `/incidents/${id2}/recommendations`)).find((r) => r.action_key === 'notify_customers');
await api('POST', `/approvals/${notify.approval_id}/approve`, {});
await api('POST', `/incidents/${id2}/actions/${notify.id}/execute`);
await api('POST', '/demo/advance-clock', { minutes: 300 });
const kpis = await api('GET', `/incidents/${id2}/kpis`);
console.log(`\n## notify only -> status ${(await api('GET', `/incidents/${id2}`)).status}; ${kpis.verification.reasons.join(' ')}`);
