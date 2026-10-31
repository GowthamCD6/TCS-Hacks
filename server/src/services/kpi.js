import crypto from 'node:crypto';
import { json, one, query, tx } from '../repositories/db.js';
import { ACTIVE_STATUSES, getIncident, patchMetadata, setStatus } from '../repositories/incidents.js';
import { callAi } from './aiClient.js';
import { audit } from './audit.js';
import { setSimNow, simNow } from './clock.js';

export const KPI_DEFINITIONS = [
  { name: 'payment_without_order_rate', description: 'Share of captured payments with no order created', unit: 'percent', target_value: 0.5, comparison_operator: '<=', monitoring_window_minutes: 120, required: 1 },
  { name: 'complaint_volume', description: 'Complaints per hour in the incident category', unit: 'per_hour', target_value: 3, comparison_operator: '<=', monitoring_window_minutes: 120, required: 1 },
  { name: 'successful_order_completion_rate', description: 'Share of orders completed', unit: 'percent', target_value: 93, comparison_operator: '>=', monitoring_window_minutes: 120, required: 1 },
  { name: 'complaint_rate_new_batches', description: 'Complaints per 100 units for new batches', unit: 'per_100_units', target_value: 1.5, comparison_operator: '<=', monitoring_window_minutes: 120, required: 1, domain: 'product' },
  { name: 'not_charging_return_share', description: 'Not charging share of returns', unit: 'percent', target_value: 8, comparison_operator: '<=', monitoring_window_minutes: 120, required: 1, domain: 'product' },
  { name: 'replacement_acceptance_rate', description: 'Customers accepting a replacement', unit: 'percent', target_value: 60, comparison_operator: '>=', monitoring_window_minutes: 120, required: 1, domain: 'product' },
];
const HEALTHY = { payment_without_order_rate: 0.1, complaint_volume: 1, successful_order_completion_rate: 96, complaint_rate_new_batches: 0.9, not_charging_return_share: 6 };
const STEP_MINUTES = 15;
const RECOVERY_PER_STEP = 0.4;
export const ROOT_FIXES = ['rollback_release', 'disable_feature_flag', 'hotfix', 'quarantine_batch'];

export async function seedKpiDefinitions() {
  for (const d of KPI_DEFINITIONS) {
    await query(
      `INSERT INTO kpi_definitions (name, description, unit, target_value, comparison_operator, monitoring_window_minutes, required_for_resolution, domain) VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE description=VALUES(description), domain=VALUES(domain)`,
      [d.name, d.description, d.unit, d.target_value, d.comparison_operator, d.monitoring_window_minutes, d.required, d.domain ?? 'payments'],
    );
  }
}

const definitions = (domain = 'payments') => query('SELECT * FROM kpi_definitions WHERE domain = ?', [domain]);

async function measureFromData(incident, since, until) {
  const p = await one(
    `SELECT SUM(c.order_id IS NOT NULL) captured, SUM(c.order_id IS NOT NULL AND o.order_id IS NULL) lost
     FROM operational_events c LEFT JOIN operational_events o ON o.order_id = c.order_id AND o.event_type = 'order_created'
     WHERE c.event_type = 'payment_captured' AND c.event_timestamp > ? AND c.event_timestamp <= ?`, [since, until],
  );
  const f = await one('SELECT COUNT(*) n FROM feedback WHERE category = ? AND event_timestamp > ? AND event_timestamp <= ?', [incident.issue_category, since, until]);
  const o = await one("SELECT COUNT(*) n, SUM(status IN ('delivered')) done FROM orders WHERE ordered_at > ? AND ordered_at <= ?", [since, until]);
  const hours = (until - since) / 3600000;
  return {
    payment_without_order_rate: p.captured ? (100 * Number(p.lost)) / Number(p.captured) : 0,
    complaint_volume: Number(f.n) / hours,
    successful_order_completion_rate: o.n ? (100 * Number(o.done)) / Number(o.n) : 100,
  };
}

// Baseline points come from real seeded rows, so the demo starts from measured values.
export async function recordBaselineKpis(incidentId, supplied) {
  const inc = await getIncident(incidentId);
  const defs = await definitions(inc.domain);
  const now = await simNow();
  const have = await one('SELECT COUNT(*) n FROM kpi_measurements WHERE incident_id = ?', [incidentId]);
  if (have.n) return;
  const values = supplied ?? await measureFromData(inc, new Date(now - 86400000), now);
  for (const d of defs) {
    await query('INSERT IGNORE INTO kpi_measurements (incident_id, kpi_definition_id, measured_value, measured_at, metadata) VALUES (?,?,?,?,?)',
      [incidentId, d.id, Number(values[d.name].toFixed(4)), now, json({ phase: 'baseline', origin: 'measured_from_events' })]);
  }
}

// Deterministic noise so a rehearsed demo repeats exactly.
const noise = (seed, spread) => {
  const n = crypto.createHash('sha256').update(seed).digest().readUInt16BE(0) / 65535;
  return (n - 0.5) * spread;
};

export function nextValue(name, current, healing, seed, degraded) {
  const healthy = HEALTHY[name];
  const goal = healing ? healthy : degraded;
  const spread = Math.abs(degraded - healthy) * 0.06;
  return Math.max(0, Number((current + (goal - current) * RECOVERY_PER_STEP + noise(seed, spread)).toFixed(4)));
}

function replyAcceptance(inc) {
  const { replacement = 0, refund = 0 } = inc.metadata.replies ?? {};
  return replacement + refund ? Number(((100 * replacement) / (replacement + refund)).toFixed(4)) : 0;
}

export async function recordReply(incidentId, reply, count = 1) {
  const inc = await getIncident(incidentId);
  const replies = { replacement: 0, refund: 0, ...inc.metadata.replies };
  replies[reply === 1 ? 'replacement' : 'refund'] += count;
  await patchMetadata(incidentId, { replies });
  return { replies, replacement_acceptance_rate: replyAcceptance({ metadata: { replies } }), simulated: true };
}

async function generateKpis(inc, from, to) {
  const defs = await definitions(inc.domain);
  const healing = (inc.metadata.mitigations ?? []).some((m) => ROOT_FIXES.includes(m)) && !inc.metadata.relapse;
  for (const d of defs) {
    const rows = await query('SELECT measured_value FROM kpi_measurements WHERE incident_id = ? AND kpi_definition_id = ? ORDER BY measured_at', [inc.id, d.id]);
    if (!rows.length) continue;
    const degraded = Math.max(...rows.slice(0, 1).map((r) => (d.comparison_operator === '>=' ? 0 : r.measured_value)), 0) || rows[0].measured_value;
    const anchor = d.comparison_operator === '>=' ? rows[0].measured_value : degraded;
    let value = rows[rows.length - 1].measured_value;
    for (let t = from.getTime() + STEP_MINUTES * 60000; t <= to.getTime(); t += STEP_MINUTES * 60000) {
      // Acceptance comes only from simulated customer replies, never from the generator.
      value = d.name === 'replacement_acceptance_rate' ? replyAcceptance(inc) : nextValue(d.name, value, healing, `${inc.id}:${d.id}:${t}`, anchor);
      await query('INSERT IGNORE INTO kpi_measurements (incident_id, kpi_definition_id, measured_value, measured_at, metadata) VALUES (?,?,?,?,?)',
        [inc.id, d.id, value, new Date(t), json({ phase: 'post_action', origin: 'simulated_kpi_generator', synthetic: true })]);
    }
  }
}

export async function verifyRecovery(incidentId, actor) {
  const inc = await getIncident(incidentId);
  const defs = await definitions(inc.domain);
  const now = await simNow();
  const action = await one("SELECT MIN(executed_at) first_at FROM recovery_actions WHERE incident_id = ? AND status = 'completed'", [incidentId]);
  const rows = await query(
    `SELECT m.measured_value, m.measured_at, d.name kpi_name FROM kpi_measurements m JOIN kpi_definitions d ON d.id = m.kpi_definition_id WHERE m.incident_id = ?`, [incidentId],
  );
  const mitigations = inc.metadata.mitigations ?? [];
  return callAi('/internal/kpi/verify', {
    definitions: defs.map((d) => ({ ...d, target_value: Number(d.target_value) })),
    measurements: rows.map((r) => ({ ...r, measured_at: r.measured_at.toISOString() })),
    action_completed_at: action.first_at ? action.first_at.toISOString() : null,
    mitigation_applied: mitigations.some((m) => ROOT_FIXES.includes(m)),
    contradictory_evidence: inc.metadata.open_contradictions ?? 0,
    now: now.toISOString(),
  }).then((v) => ({ ...v, actor }));
}

async function applyVerdict(incidentId, actor) {
  const inc = await getIncident(incidentId);
  if (inc.status !== 'monitoring') return null;
  const v = await verifyRecovery(incidentId, actor);
  if (v.outcome === 'recovered') {
    await setStatus(incidentId, 'resolved', actor, null, { resolution_summary: 'Recovery verified: all required KPIs held target for their full monitoring window.' });
  } else if (v.outcome === 'not_recovered') {
    await setStatus(incidentId, 'reopened', actor, null, { reasons: v.reasons });
  }
  return { incident_id: incidentId, outcome: v.outcome, reasons: v.reasons, status: (await getIncident(incidentId)).status };
}

export async function advanceClock(minutes, actor) {
  const from = await simNow();
  const to = new Date(from.getTime() + minutes * 60000);
  await tx(async (conn) => { await setSimNow(to, conn); await audit(actor, 'clock.advanced', 'sim_clock', 1, { minutes, sim_now: to }, conn); });
  const incidents = await query('SELECT id FROM incidents WHERE status IN (?)', [ACTIVE_STATUSES]);
  const results = [];
  for (const { id } of incidents) {
    await generateKpis(await getIncident(id), from, to);
    const r = await applyVerdict(id, actor);
    if (r) results.push(r);
  }
  return { sim_now: to, advanced_minutes: minutes, verifications: results };
}

export async function kpiReport(incidentId) {
  await getIncident(incidentId);
  const rows = await query(
    `SELECT d.name, d.unit, d.target_value, d.comparison_operator, d.monitoring_window_minutes, m.measured_value, m.measured_at, m.metadata
     FROM kpi_measurements m JOIN kpi_definitions d ON d.id = m.kpi_definition_id WHERE m.incident_id = ? ORDER BY m.measured_at`, [incidentId],
  );
  const series = {};
  for (const r of rows) {
    series[r.name] ??= { name: r.name, unit: r.unit, target_value: r.target_value, comparison_operator: r.comparison_operator, monitoring_window_minutes: r.monitoring_window_minutes, points: [] };
    series[r.name].points.push({ measured_at: r.measured_at, value: r.measured_value });
  }
  const verification = await verifyRecovery(incidentId);
  delete verification.actor;
  return { sim_now: await simNow(), kpis: Object.values(series), verification };
}
