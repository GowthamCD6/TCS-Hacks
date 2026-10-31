import { json, one, query, tx } from '../repositories/db.js';
import { ACTIVE_STATUSES, createIncident, getIncident } from '../repositories/incidents.js';
import { notFound } from '../utils/errors.js';
import { callAi } from './aiClient.js';
import { simNow } from './clock.js';
import { drainPendingFeedback } from './ingestion.js';
import { investigate } from './investigation.js';

const TITLES = {
  payment: 'Payment failures: money debited without an order',
  delivery: 'Delivery delays above baseline',
  pricing: 'Pricing complaints above baseline',
  food_quality: 'Food quality complaints above baseline',
  app_ux: 'App experience complaints above baseline',
  charging_issue: 'Zenbuds Pro: units not charging after delivery',
};

async function upsertSignal(s, domain) {
  await query(
    `INSERT INTO signals (signal_key, category, status, triage_reason, window_start, window_end, baseline_count, current_count, absolute_increase, percent_increase, anomaly_score, severity_score, metrics, is_synthetic, domain)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)
     ON DUPLICATE KEY UPDATE window_end=VALUES(window_end), baseline_count=VALUES(baseline_count), current_count=VALUES(current_count), absolute_increase=VALUES(absolute_increase),
       percent_increase=VALUES(percent_increase), anomaly_score=VALUES(anomaly_score), severity_score=VALUES(severity_score), metrics=VALUES(metrics)`,
    [s.signal_key, s.category, s.status, s.triage_reason, new Date(`${s.window_start}Z`), new Date(`${s.window_end}Z`), s.baseline_count, s.current_count, s.absolute_increase,
      s.percent_increase, s.anomaly_score, s.severity_score, json({ ...s.metrics, severity: s.severity, affected_customers: s.affected_customers }), domain],
  );
  return one('SELECT * FROM signals WHERE signal_key = ?', [s.signal_key]);
}

async function openIncidentFor(row, s, domain = 'payments') {
  return tx(async (conn) => {
    const id = await createIncident({
      title: TITLES[s.category] ?? `${s.category} issue above baseline`,
      description: `Complaint rate is ${s.metrics.rate_ratio} times the ${s.metrics.baseline_days}-day baseline.`,
      category: s.category,
      windowStart: `${s.window_start}Z`,
      severity: s.severity_score,
      severityInputs: s.severity.inputs,
      signalId: row.id,
      synthetic: true,
      domain,
    }, conn);
    await query("UPDATE signals SET incident_id=?, status='incident' WHERE id=?", [id, row.id], conn);
    return id;
  });
}

export async function runDetection({ autoInvestigate = true, actor, domain = 'payments' } = {}) {
  const processedFeedback = await drainPendingFeedback(domain);
  const asOf = await simNow();
  const detected = domain === 'product' ? await callAi('/internal/product/detect', {}) : await callAi('/internal/signals/detect', { as_of: asOf.toISOString() });
  const incidents = [];
  const signals = [];
  for (const s of detected.signals) {
    const row = await upsertSignal(s, domain);
    signals.push({ id: row.id, category: s.category, status: row.status, triage_reason: s.triage_reason, severity_score: s.severity_score });
    if (s.status !== 'open' || row.incident_id) continue;
    const active = await one(`SELECT id FROM incidents WHERE issue_category=? AND status IN (?) ORDER BY id DESC LIMIT 1`, [s.category, ACTIVE_STATUSES]);
    if (active) {
      await query("UPDATE signals SET incident_id=?, status='incident' WHERE id=?", [active.id, row.id]);
      continue;
    }
    const id = await openIncidentFor(row, s, domain);
    if (autoInvestigate) await investigate(id, actor);
    incidents.push((await getIncident(id)).incident_number);
  }
  return { as_of: asOf, processed_feedback: processedFeedback, signals, suppressed: detected.suppressed, incidents_created: incidents };
}

export async function investigateSignal(signalId, actor) {
  const row = await one('SELECT * FROM signals WHERE id = ?', [signalId]);
  if (!row) throw notFound('Signal');
  if (row.incident_id) {
    await investigate(row.incident_id, actor);
    return row.incident_id;
  }
  const metrics = typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics;
  const id = await openIncidentFor(row, {
    category: row.category,
    window_start: row.window_start.toISOString().replace('Z', ''),
    severity_score: row.severity_score,
    severity: metrics.severity,
    metrics,
  }, row.domain);
  await investigate(id, actor);
  return id;
}
