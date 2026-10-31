import { json, one, query, tx } from '../repositories/db.js';
import { ACTIVE_STATUSES, getIncident, patchMetadata } from '../repositories/incidents.js';
import { conflict, notFound } from '../utils/errors.js';
import { reject } from './actions.js';
import { audit } from './audit.js';
import { simNow } from './clock.js';
import { analyzeFeedback, storeFeedback } from './ingestion.js';
import { reassess } from './investigation.js';

export async function injectEvidence(id, body, actor) {
  const inc = await getIncident(id);
  if (inc.status === 'resolved' && body.kind !== 'new_complaints') throw conflict('Incident is resolved');
  const now = await simNow();
  const patch = {};
  if (body.kind === 'telemetry_missing' || body.telemetry_available === false) patch.telemetry_available = false;
  if (body.telemetry_available === true) patch.telemetry_available = true;
  if (body.kind === 'hotfix_deployed') patch.fix_deployed = true;
  if (body.kind === 'hotfix_deployed') patch.mitigations = [...new Set([...(inc.metadata.mitigations ?? []), 'hotfix'])];
  if (body.contradicts) patch.open_contradictions = (inc.metadata.open_contradictions ?? 0) + 1;
  const evidence = await tx(async (conn) => {
    const res = await query(
      `INSERT INTO incident_evidence (incident_id, evidence_type, source_table, source_record_id, description, evidence_timestamp, relevance_score, metadata) VALUES (?,?,?,?,?,?,?,?)`,
      [id, 'injected', body.source_table ?? 'incident_evidence', body.source_record_id ?? null, body.description, now, 1, json({ kind: body.kind, feedback_ids: body.feedback_ids ?? [], injected: true })], conn,
    );
    if (Object.keys(patch).length) await patchMetadata(id, patch, conn);
    await audit(actor, 'evidence.injected', 'incident', id, { kind: body.kind }, conn);
    return res.insertId;
  });
  if (body.auto_reassess === false) return { evidence_id: evidence, reassessment: null };
  const kind = body.kind === 'other' ? 'new_complaints' : body.kind;
  return { evidence_id: evidence, reassessment: await reassess(id, [kind], actor, body.description), incident_status: (await getIncident(id)).status };
}

async function latestActive() {
  const row = await one("SELECT id FROM incidents WHERE status IN (?) AND domain = 'payments' ORDER BY id DESC LIMIT 1", [ACTIVE_STATUSES]);
  if (!row) throw conflict('No active incident: run detection first');
  return row.id;
}

const minutesBefore = (now, m) => new Date(now.getTime() - m * 60000);
const IOS_TEXT = [
  'iPhone user here, UPI money deducted but no order was created',
  'On iOS the UPI payment was debited and the order never appeared',
  'iOS app took my UPI payment and shows no order',
];

async function injectIosFailures(now) {
  const customers = await query("SELECT id, external_customer_id, city, device_os FROM customers WHERE platform='ios' AND is_synthetic=1 ORDER BY id LIMIT 60");
  const ids = [];
  for (const [i, c] of customers.entries()) {
    const at = minutesBefore(now, 10 + i * 6);
    const orderId = `SYN-IOS-${now.getTime()}-${i}`;
    const amount = 300 + i * 7;
    await query(
      `INSERT INTO orders (external_order_id, customer_id, status, amount, payment_method, platform, device_os, app_version, city, ordered_at, is_synthetic)
       VALUES (?,?,'no_order',?,'upi','ios',?,'2.2',?,?,1)`, [orderId, c.id, amount, c.device_os, c.city, at],
    );
    for (const [type, status] of [['payment_initiated', 'initiated'], ['payment_captured', 'captured']]) {
      await query(
        `INSERT INTO operational_events (event_type, event_timestamp, customer_id, order_id, payment_status, payment_method, amount, platform, device_os, app_version, city, metadata, is_synthetic)
         VALUES (?,?,?,?,?,'upi',?,'ios',?,'2.2',?,?,1)`, [type, at, c.id, orderId, status, amount, c.device_os, c.city, json({ synthetic: true, scenario: 'ios_complaints' })],
      );
    }
    const stored = await storeFeedback({
      source: 'scenario', source_record_id: orderId, customer_id: c.external_customer_id, order_id: orderId, channel: 'support_ticket', rating: 1,
      text: IOS_TEXT[i % IOS_TEXT.length], timestamp: new Date(at.getTime() + 120000).toISOString(), metadata: { synthetic: true, scenario: 'ios_complaints' },
    }, { synthetic: true });
    ids.push(stored.id);
  }
  await analyzeFeedback(ids);
  return ids;
}

async function injectTranscripts(now) {
  const lost = await query(
    `SELECT o.external_order_id, c.external_customer_id FROM orders o JOIN customers c ON c.id = o.customer_id
     WHERE o.status='no_order' AND o.device_os='Android 14' AND o.ordered_at <= ? ORDER BY o.ordered_at DESC LIMIT 25`, [now],
  );
  const ids = [];
  for (const [i, o] of lost.entries()) {
    const stored = await storeFeedback({
      source: 'support_transcript', source_record_id: `transcript-${o.external_order_id}`, customer_id: o.external_customer_id, order_id: o.external_order_id, channel: 'call_transcript', rating: 1,
      text: 'Synthetic call transcript: after the UPI app returned to the app the confirmation screen hung, the money was debited and no order was created.',
      timestamp: minutesBefore(now, 5 + i).toISOString(), metadata: { synthetic: true, scenario: 'support_transcripts' },
    }, { synthetic: true });
    if (!stored.duplicate) ids.push(stored.id);
  }
  if (ids.length) await analyzeFeedback(ids);
  return ids;
}

const SCENARIOS = {
  hotfix_deployed: async (id, now, actor) => {
    await query(
      `INSERT IGNORE INTO product_releases (version, platform, release_timestamp, description, changes, is_synthetic) VALUES ('2.3.1','android',?,?,?,1)`,
      [now, 'Hotfix for UPI confirmation callback', json(['Restore UPI intent callback handling'])],
    );
    await query(`INSERT INTO operational_events (event_type, event_timestamp, platform, app_version, metadata, is_synthetic) VALUES ('app_release_deployed',?,'android','2.3.1',?,1)`, [now, json({ description: 'Hotfix', synthetic: true })]);
    return injectEvidence(id, { kind: 'hotfix_deployed', description: 'Hotfix 2.3.1 deployed for the UPI confirmation callback', source_table: 'product_releases', source_record_id: '2.3.1:android' }, actor);
  },
  ios_complaints: async (id, now, actor) => {
    const ids = await injectIosFailures(now);
    return injectEvidence(id, { kind: 'new_complaints', description: `${ids.length} iOS customers report the same failure, with matching telemetry`, feedback_ids: ids.slice(0, 200), contradicts: true }, actor);
  },
  telemetry_missing: (id, _now, actor) => injectEvidence(id, { kind: 'telemetry_missing', description: 'Payment telemetry feed is unavailable for the incident window' }, actor),
  support_transcripts: async (id, now, actor) => {
    const ids = await injectTranscripts(now);
    return injectEvidence(id, { kind: 'support_transcripts', description: `${ids.length} support call transcripts imported`, feedback_ids: ids }, actor);
  },
  rollback_rejected: async (id, _now, actor) => {
    const a = await one(
      `SELECT a.id FROM approvals a JOIN recovery_recommendations r ON r.id = a.recommendation_id WHERE a.incident_id = ? AND a.decision='pending' AND r.action_key='rollback_release'`, [id],
    );
    if (!a) throw conflict('No pending rollback approval on this incident');
    return reject(a.id, 'Rollback rejected: peak hours, finance cannot accept a full release revert', actor);
  },
  relapse: async (id, _now, actor) => {
    await patchMetadata(id, { relapse: true });
    return injectEvidence(id, { kind: 'other', description: 'Failure rate is climbing again after the mitigation', auto_reassess: false }, actor);
  },
};

export const SCENARIO_NAMES = Object.keys(SCENARIOS);

export async function runScenario(name, actor) {
  const scenario = SCENARIOS[name];
  if (!scenario) throw notFound(`Scenario ${name}`);
  const id = await latestActive();
  const result = await scenario(id, await simNow(), actor);
  return { scenario: name, incident_id: id, result };
}
