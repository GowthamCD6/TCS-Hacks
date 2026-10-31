// Read models. These are the response DTOs: customer contact fields are never selected.
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { one, parseJson, query } from '../repositories/db.js';
import { getIncident } from '../repositories/incidents.js';
import { notFound } from '../utils/errors.js';
import { simNow } from './clock.js';
import { buildGraph } from './graph.js';
import { knowledgeGraph } from './knowledgeGraph.js';

const parseRows = (rows, cols) => rows.map((r) => ({ ...r, ...Object.fromEntries(cols.map((c) => [c, parseJson(r[c])])) }));

export const incidentDto = (i) => ({
  id: i.id,
  incident_number: i.incident_number,
  title: i.title,
  description: i.description,
  issue_category: i.issue_category,
  domain: i.domain,
  status: i.status,
  severity: i.severity,
  severity_inputs: i.severity_inputs,
  severity_formula: 'affected_customers_share * growth_factor * harm_weight * confidence',
  confidence_score: i.confidence_score,
  first_detected_at: i.first_detected_at,
  last_updated_at: i.last_updated_at,
  affected_customer_count: i.affected_customer_count,
  estimated_business_impact: i.estimated_business_impact,
  root_cause_verdict: i.root_cause_verdict,
  resolution_summary: i.resolution_summary,
  partially_analyzed: Boolean(i.partially_analyzed),
  closed_at: i.closed_at,
  is_synthetic: Boolean(i.is_synthetic),
});

export async function listIncidents({ page, page_size: size, status, category, domain }) {
  const where = ['1=1'];
  const args = [];
  if (domain) { where.push('domain = ?'); args.push(domain); }
  if (status) { where.push('status = ?'); args.push(status); }
  if (category) { where.push('issue_category = ?'); args.push(category); }
  const clause = where.join(' AND ');
  const [{ total }] = await query(`SELECT COUNT(*) total FROM incidents WHERE ${clause}`, args);
  const rows = await query(`SELECT * FROM incidents WHERE ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`, [...args, size, (page - 1) * size]);
  return { items: rows.map((r) => incidentDto({ ...r, severity_inputs: parseJson(r.severity_inputs) })), total };
}

export const clustersFor = async (id) => parseRows(await query('SELECT id, label, description, feedback_count, severity_score, first_seen_at, last_seen_at, metadata FROM issue_clusters WHERE incident_id = ? ORDER BY feedback_count DESC', [id]), ['metadata']);
export const segmentsFor = async (id) => (await query('SELECT * FROM incident_segments WHERE incident_id = ? ORDER BY significant DESC, lift_ratio DESC', [id])).map((s) => ({ ...s, significant: Boolean(s.significant) }));

export async function hypothesesFor(id) {
  const rows = parseRows(await query('SELECT * FROM root_cause_hypotheses WHERE incident_id = ? ORDER BY confidence_score DESC', [id]), ['evidence_summary']);
  const tests = parseRows(await query('SELECT * FROM investigation_tests WHERE incident_id = ? ORDER BY id', [id]), ['result']);
  return rows.map((h) => ({ ...h, tests: tests.filter((t) => t.hypothesis_id === h.id).map(({ id: testId, test_name: name, status, result, explanation }) => ({ id: testId, test_name: name, status, result, explanation })) }));
}

export const recommendationsFor = async (id) => (await parseRows(await query(
  `SELECT r.*, a.id approval_id, a.decision approval_decision FROM recovery_recommendations r LEFT JOIN approvals a ON a.recommendation_id = r.id WHERE r.incident_id = ? ORDER BY r.status = 'superseded', r.priority`, [id],
), ['rationale'])).map((r) => ({ ...r, requires_approval: Boolean(r.requires_approval) }));

export const evidenceFor = async (id) => parseRows(await query('SELECT * FROM incident_evidence WHERE incident_id = ? ORDER BY id', [id]), ['metadata']);
export const actionsFor = async (id) => parseRows(await query('SELECT * FROM recovery_actions WHERE incident_id = ? ORDER BY id', [id]), ['execution_result']);

export async function incidentDetail(id) {
  const inc = await getIncident(id);
  const [hypotheses, segments, recommendations, clusters, reassessments] = await Promise.all([
    hypothesesFor(id), segmentsFor(id), recommendationsFor(id), clustersFor(id),
    query('SELECT id, trigger_summary, diff, created_at FROM incident_reassessments WHERE incident_id = ? ORDER BY id DESC', [id]),
  ]);
  const m = inc.metadata;
  return {
    ...incidentDto(inc),
    window_start: m.window_start,
    telemetry_available: m.telemetry_available !== false,
    fix_deployed: Boolean(m.fix_deployed),
    court: m.court ?? null,
    explanation: m.explanation ?? [],
    impact: m.impact ?? null,
    shared_components: m.shared_components ?? null,
    policy_checks: m.policy_checks ?? [],
    hypotheses,
    segments,
    clusters,
    recommendations,
    reassessments: parseRows(reassessments, ['diff']),
  };
}

export async function incidentGraph(id, diff, domain) {
  if (domain === 'product') return knowledgeGraph(id, diff);
  const incident = await getIncident(id);
  const signal = incident.metadata.signal_id ? await one('SELECT id, category, anomaly_score, current_count FROM signals WHERE id = ?', [incident.metadata.signal_id]) : null;
  const kpiRows = await query(
    `SELECT d.name, d.unit, d.target_value, m.measured_value latest_value FROM kpi_definitions d
     JOIN kpi_measurements m ON m.kpi_definition_id = d.id
     WHERE m.incident_id = ? AND m.measured_at = (SELECT MAX(x.measured_at) FROM kpi_measurements x WHERE x.incident_id = m.incident_id AND x.kpi_definition_id = d.id)`, [id],
  );
  const graph = buildGraph({
    incident, signal, clusters: await clustersFor(id), segments: await segmentsFor(id), hypotheses: await hypothesesFor(id),
    recommendations: await recommendationsFor(id), actions: await actionsFor(id), kpis: kpiRows,
  });
  return { ...graph, knowledge_graph: await knowledgeGraph(id, diff) };
}

export async function agentTrace(id) {
  await getIncident(id);
  const runs = parseRows(await query('SELECT * FROM agent_runs WHERE incident_id = ? ORDER BY id', [id]), ['input_summary', 'final_summary']);
  const steps = runs.length ? parseRows(await query('SELECT * FROM agent_steps WHERE agent_run_id IN (?) ORDER BY agent_run_id, step_number', [runs.map((r) => r.id)]), ['input_summary', 'output_summary', 'evidence_references']) : [];
  return { runs: runs.map((r) => ({ ...r, steps: steps.filter((s) => s.agent_run_id === r.id) })) };
}

export async function timeline(id) {
  await getIncident(id);
  const audits = parseRows(await query(
    `SELECT action, actor_type, actor_id, details, created_at FROM audit_logs
     WHERE (resource_type='incident' AND resource_id=?) OR (resource_type IN ('approval','recovery_action') AND JSON_EXTRACT(details,'$.incident_id') = ?) ORDER BY id`, [String(id), id],
  ), ['details']);
  const actions = await actionsFor(id);
  const runs = await query('SELECT run_type, status, started_at FROM agent_runs WHERE incident_id = ? ORDER BY id', [id]);
  const entries = [
    ...audits.map((a) => ({ type: 'audit', action: a.action, actor: a.actor_id ?? a.actor_type, details: a.details, at: a.created_at })),
    ...actions.map((a) => ({ type: 'action', action: a.target_reference, actor: 'simulated-adapter', details: a.execution_result, at: a.executed_at })),
    ...runs.map((r) => ({ type: 'agent_run', action: r.run_type, actor: 'investigator-agent', details: { status: r.status }, at: r.started_at })),
  ];
  return { entries };
}

export async function listFeedback({ page, page_size: size, category, status, source, domain }) {
  const where = ['1=1'];
  const args = [];
  if (domain) { where.push('f.domain = ?'); args.push(domain); }
  if (category) { where.push('f.category = ?'); args.push(category); }
  if (status) { where.push('f.processing_status = ?'); args.push(status); }
  if (source) { where.push('f.source = ?'); args.push(source); }
  const clause = where.join(' AND ');
  const [{ total }] = await query(`SELECT COUNT(*) total FROM feedback f WHERE ${clause}`, args);
  const rows = await query(
    `SELECT f.id, f.source, f.channel, f.rating, f.text, f.language, f.category, f.sentiment, f.urgency, f.order_id, f.event_timestamp, f.processing_status, f.is_synthetic, c.external_customer_id customer_ref, c.city
     FROM feedback f LEFT JOIN customers c ON c.id = f.customer_id WHERE ${clause} ORDER BY f.event_timestamp DESC LIMIT ? OFFSET ?`, [...args, size, (page - 1) * size],
  );
  return { items: rows, total };
}

export async function getFeedback(id) {
  const row = await one(
    `SELECT f.id, f.source, f.source_record_id, f.channel, f.rating, f.text, f.language, f.category, f.sentiment, f.urgency, f.order_id, f.metadata, f.event_timestamp, f.processing_status, f.is_synthetic, c.external_customer_id customer_ref, c.city
     FROM feedback f LEFT JOIN customers c ON c.id = f.customer_id WHERE f.id = ?`, [id],
  );
  if (!row) throw notFound('Feedback');
  return { ...row, metadata: parseJson(row.metadata) };
}

export async function getJob(id) {
  const row = await one('SELECT id, source, status, total_records, processed_records, failed_records, duplicate_records, error_summary, created_at, completed_at FROM ingestion_jobs WHERE id = ?', [id]);
  if (!row) throw notFound('Ingestion job');
  return { ...row, error_summary: parseJson(row.error_summary) };
}

export async function listSignals({ page, page_size: size, status, domain }) {
  const clause = [status && 'status = ?', domain && 'domain = ?'].filter(Boolean).join(' AND ') || '1=1';
  const args = [status, domain].filter(Boolean);
  const [{ total }] = await query(`SELECT COUNT(*) total FROM signals WHERE ${clause}`, args);
  const rows = await query(`SELECT * FROM signals WHERE ${clause} ORDER BY severity_score DESC, id DESC LIMIT ? OFFSET ?`, [...args, size, (page - 1) * size]);
  return { items: parseRows(rows, ['metrics']), total };
}

export async function listApprovals({ decision, page, page_size: size, domain }) {
  const clause = [decision && 'a.decision = ?', domain && 'i.domain = ?'].filter(Boolean).join(' AND ') || '1=1';
  const args = [decision, domain].filter(Boolean);
  const [{ total }] = await query(`SELECT COUNT(*) total FROM approvals a JOIN incidents i ON i.id = a.incident_id WHERE ${clause}`, args);
  const rows = await query(
    `SELECT a.*, i.incident_number, r.title, r.action_key, r.action_type, r.risk_level, r.priority, r.estimated_cost, r.rationale FROM approvals a
     JOIN incidents i ON i.id = a.incident_id JOIN recovery_recommendations r ON r.id = a.recommendation_id WHERE ${clause} ORDER BY r.priority, a.id LIMIT ? OFFSET ?`,
    [...args, size, (page - 1) * size],
  );
  const items = parseRows(rows, ['rationale']);
  const briefs = {};
  for (const incident of new Set(items.map((i) => i.incident_id))) briefs[incident] = await decisionBrief(incident).catch(() => null);
  return { items: items.map((i) => ({ ...i, decision_brief: briefs[i.incident_id]?.brief ?? null })), total };
}

export async function dashboardOverview(domain) {
  const scope = domain ? 'domain = ?' : '1=1';
  const scoped = domain ? [domain] : [];
  const now = await simNow();
  const dayAgo = new Date(now - 86400000);
  const [counts, status, topSignals, recent] = await Promise.all([
    one(`SELECT (SELECT COUNT(*) FROM feedback) feedback_total, (SELECT COUNT(*) FROM feedback WHERE event_timestamp > ?) feedback_24h,
      (SELECT COUNT(*) FROM signals WHERE status IN ('open','watch')) signals_open, (SELECT COUNT(*) FROM approvals WHERE decision='pending') approvals_pending`, [dayAgo]),
    query(`SELECT status, COUNT(*) count FROM incidents WHERE ${scope} GROUP BY status`, scoped),
    query(`SELECT id, category, status, severity_score, anomaly_score, current_count FROM signals WHERE ${scope} ORDER BY id DESC LIMIT 5`, scoped),
    query(`SELECT * FROM incidents WHERE ${scope} ORDER BY id DESC LIMIT 5`, scoped),
  ]);
  const impact = await one("SELECT COALESCE(SUM(estimated_business_impact),0) total, COALESCE(SUM(affected_customer_count),0) customers FROM incidents WHERE status <> 'resolved' AND " + scope, scoped);
  return {
    sim_now: now, data_label: 'All demo data and metrics are synthetic.', ...counts,
    incidents_by_status: status, open_business_impact: impact.total, open_affected_customers: Number(impact.customers),
    latest_signals: topSignals, latest_incidents: recent.map((r) => incidentDto({ ...r, severity_inputs: parseJson(r.severity_inputs) })),
  };
}

export async function decisionBrief(id) {
  await getIncident(id);
  const row = await one('SELECT id, agent_run_id, brief, generator, grounding_passed, usefulness_rating, created_at FROM decision_briefs WHERE incident_id = ? ORDER BY id DESC LIMIT 1', [id]);
  if (!row) throw notFound('Decision brief');
  return { ...row, brief: parseJson(row.brief), grounding_passed: Boolean(row.grounding_passed) };
}

export function readScorecard() {
  const file = path.join(env.repoRoot, 'ai_services', 'eval', 'scorecard.json');
  if (!fs.existsSync(file)) throw notFound('Scorecard: run POST /api/v1/demo/evaluate first');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
