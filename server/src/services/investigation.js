import { json, parseJson, query, tx } from '../repositories/db.js';
import { getIncident, patchMetadata, setStatus } from '../repositories/incidents.js';
import { callAi } from './aiClient.js';
import { audit } from './audit.js';
import { simNow } from './clock.js';
import { canTransition } from './lifecycle.js';
import { persistGraph } from './knowledgeGraph.js';
import { recordBaselineKpis } from './kpi.js';

const roundConfidence = (v) => (v == null ? null : Number(v));

function agentRequest(inc, asOf, extra = {}) {
  const m = inc.metadata;
  return {
    as_of: asOf.toISOString(),
    domain: inc.domain,
    category: inc.issue_category,
    window_start: m.window_start,
    telemetry_available: m.telemetry_available !== false,
    fix_deployed: Boolean(m.fix_deployed),
    rejected_actions: m.rejected_actions ?? [],
    ...extra,
  };
}

async function persistClusters(id, clusters, conn) {
  await query('DELETE FROM issue_clusters WHERE incident_id = ?', [id], conn);
  for (const c of clusters.clusters) {
    await query(
      `INSERT INTO issue_clusters (incident_id, label, description, cluster_key, feedback_count, severity_score, first_seen_at, last_seen_at, metadata)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, c.label.slice(0, 255), c.representative_issue, `${id}:${c.cluster_id}`, c.size, c.severity_indicators.share_of_complaints,
        new Date(`${c.time_window.first_seen}Z`), new Date(`${c.time_window.last_seen}Z`),
        json({ feedback_ids: c.feedback_ids, confidence: c.confidence, severity_indicators: c.severity_indicators, method: clusters.method, embedding: clusters.embedding })], conn,
    );
  }
}

async function persistSegments(id, segments, conn) {
  await query('DELETE FROM incident_segments WHERE incident_id = ?', [id], conn);
  for (const s of segments.segments) {
    await query(
      `INSERT INTO incident_segments (incident_id, dimension, segment_value, affected_customers, total_customers, issue_rate, comparison_rate, lift_ratio, p_value, significant, limitations)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, s.dimension, s.segment_value, s.affected_customers, s.total_customers, s.issue_rate, s.comparison_rate, s.lift_ratio, s.p_value, s.significant ? 1 : 0, s.limitations], conn,
    );
  }
}

async function persistCourt(id, court, conn) {
  for (const h of court.hypotheses) {
    await query(
      `INSERT INTO root_cause_hypotheses (incident_id, hypothesis_key, hypothesis, status, confidence_score, explanation, evidence_summary) VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE hypothesis=VALUES(hypothesis), status=VALUES(status), confidence_score=VALUES(confidence_score), explanation=VALUES(explanation), evidence_summary=VALUES(evidence_summary)`,
      [id, h.hypothesis_key, h.hypothesis, h.status, h.confidence_score, h.explanation,
        json({ supporting: h.supporting_evidence, contradicting: h.contradicting_evidence, missing: h.missing_evidence, references: h.evidence_references })], conn,
    );
    const [row] = await query('SELECT id FROM root_cause_hypotheses WHERE incident_id = ? AND hypothesis_key = ?', [id, h.hypothesis_key], conn);
    for (const [name, t] of Object.entries(h.tests)) {
      await query(
        `INSERT INTO investigation_tests (incident_id, hypothesis_id, test_name, status, result, explanation) VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), result=VALUES(result), explanation=VALUES(explanation)`,
        [id, row.id, name, t.status, json({ ...t.result, reused: Boolean(t.reused) }), t.explanation], conn,
      );
    }
  }
}

async function persistEvidence(id, evidence, conn) {
  const existing = new Set((await query('SELECT source_table, source_record_id, supports_hypothesis FROM incident_evidence WHERE incident_id = ?', [id], conn))
    .map((e) => `${e.source_table}:${e.source_record_id}:${e.supports_hypothesis}`));
  for (const e of evidence) {
    const key = `${e.source_table}:${e.source_record_id}:${e.supports_hypothesis}`;
    if (existing.has(key)) continue;
    existing.add(key);
    await query(
      `INSERT INTO incident_evidence (incident_id, evidence_type, source_table, source_record_id, description, evidence_timestamp, relevance_score, supports_hypothesis)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, e.evidence_type, e.source_table, e.source_record_id, e.description, e.evidence_timestamp ? new Date(`${e.evidence_timestamp}Z`) : null, e.relevance_score, e.supports_hypothesis], conn,
    );
  }
}

// Decided or executed recommendations stay as history; only undecided ones are replaced.
async function persistRecommendations(id, recs, conn) {
  const current = await query('SELECT id, action_key, status FROM recovery_recommendations WHERE incident_id = ?', [id], conn);
  const wanted = new Set(recs.recommendations.map((r) => r.action_key));
  for (const c of current) {
    if (c.status === 'proposed' && !wanted.has(c.action_key)) {
      await query("UPDATE recovery_recommendations SET status='superseded' WHERE id=?", [c.id], conn);
      await query("UPDATE approvals SET decision='superseded' WHERE recommendation_id=? AND decision='pending'", [c.id], conn);
    }
  }
  let pending = 0;
  for (const r of recs.recommendations) {
    const live = current.find((c) => c.action_key === r.action_key && c.status !== 'superseded');
    if (live) {
      if (live.status === 'proposed') {
        await query('UPDATE recovery_recommendations SET priority=?, score=?, estimated_cost=?, rationale=? WHERE id=?', [r.priority, r.score, r.estimated_cost, json(r.rationale), live.id], conn);
        if (r.requires_approval) pending += 1;
      }
      continue;
    }
    const res = await query(
      `INSERT INTO recovery_recommendations (incident_id, action_key, action_type, title, description, priority, score, estimated_cost, expected_benefit, risk_level, requires_approval, rationale)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, r.action_key, r.action_type, r.title, r.description, r.priority, r.score, r.estimated_cost, r.expected_benefit, r.risk_level, r.requires_approval ? 1 : 0, json(r.rationale)], conn,
    );
    if (r.requires_approval) {
      await query('INSERT INTO approvals (incident_id, recommendation_id, requested_by) VALUES (?,?,?)', [id, res.insertId, 'investigator-agent'], conn);
      pending += 1;
    }
  }
  return pending;
}

async function persistRun(id, inc, runId, result, conn) {
  const now = await simNow(conn);
  for (const s of result.steps) {
    await query(
      `INSERT INTO agent_steps (agent_run_id, step_number, agent_name, tool_name, input_summary, output_summary, evidence_references, status, duration_ms) VALUES (?,?,?,?,?,?,?,?,?)`,
      [runId, s.step_number, s.agent_name, s.tool_name, json(s.input_summary), json(s.output_summary), json(s.evidence_references), s.status, s.duration_ms], conn,
    );
  }
  await persistClusters(id, result.clusters, conn);
  await persistSegments(id, result.segments, conn);
  await persistCourt(id, result.court, conn);
  await persistEvidence(id, result.evidence, conn);
  const pending = await persistRecommendations(id, result.recommendations, conn);

  const inputs = { ...(inc.severity_inputs ?? {}), confidence: result.court.confidence_score };
  const severity = ['affected_customers_share', 'growth_factor', 'harm_weight', 'confidence'].every((k) => inputs[k] != null)
    ? Math.min(1, inputs.affected_customers_share * inputs.growth_factor * inputs.harm_weight * inputs.confidence) : inc.severity;
  const verdictStatement = result.court.verdict;
  await query(
    `UPDATE incidents SET confidence_score=?, root_cause_verdict=?, affected_customer_count=?, estimated_business_impact=?, severity=?, severity_inputs=?, partially_analyzed=?, last_updated_at=? WHERE id=?`,
    [result.court.confidence_score, verdictStatement, result.impact.affected_customer_count, result.impact.estimated_business_impact, severity, json(inputs), result.partially_analyzed ? 1 : 0, now, id], conn,
  );
  await patchMetadata(id, {
    impact: result.impact,
    shared_components: result.shared_components,
    explanation: result.explanation,
    court: { verdict: result.court.verdict, verdict_key: result.court.verdict_key, verdict_status: result.court.verdict_status, confidence_score: result.court.confidence_score, reasons: result.court.reasons, onset: result.court.onset, funnel: result.court.funnel, analysis_start: result.court.analysis_start, limitations: result.court.limitations, tests_rerun: result.court.tests_rerun, tests_reused: result.court.tests_reused },
    policy_checks: result.recommendations.policy_checks,
    eligible_refund_orders: result.recommendations.eligible_refund_orders,
  }, conn);
  if (result.kg) await persistGraph(id, runId, result.kg, conn);
  if (result.decision_brief) {
    const { brief, generator, grounding } = result.decision_brief;
    await query('INSERT INTO decision_briefs (incident_id, agent_run_id, brief, generator, grounding_passed) VALUES (?,?,?,?,?)', [id, runId, json(brief), generator, grounding.passed ? 1 : 0], conn);
    await audit(null, 'notification.simulated', 'incident', id, { channels: ['slack', 'email'], headline: brief.headline, simulated: true }, conn);
  }
  await query('UPDATE agent_runs SET status=?, final_summary=?, completed_at=? WHERE id=?', ['completed', json({ verdict: verdictStatement, confidence: result.court.confidence_score, explanation: result.explanation, partially_analyzed: result.partially_analyzed, llm_tokens: result.llm_tokens, duration_ms: result.duration_ms }), now, runId], conn);
  return pending;
}

async function runAgent(id, runType, extra, actor) {
  const inc = await getIncident(id);
  const prevStatus = inc.status;
  const now = await simNow();
  const run = await query('INSERT INTO agent_runs (incident_id, run_type, status, input_summary, started_at) VALUES (?,?,?,?,?)',
    [id, runType, 'running', json({ category: inc.issue_category, as_of: now, ...(extra.evidence_kinds ? { evidence_kinds: extra.evidence_kinds } : {}) }), now]);
  const runId = run.insertId;
  const moving = canTransition(prevStatus, 'investigating');
  if (moving) await setStatus(id, 'investigating', actor);
  try {
    const result = await callAi(runType === 'reassessment' ? '/internal/incidents/reassess' : '/internal/agent/run', agentRequest(inc, now, { incident_id: id, run_type: runType, ...extra }));
    await tx(async (conn) => {
      const pending = await persistRun(id, inc, runId, result, conn);
      const current = await getIncident(id, conn);
      // Reassessing a monitored incident must not silently throw away its monitoring state.
      if (current.status === 'investigating') {
        const prior = ['approved', 'monitoring'].includes(prevStatus) ? prevStatus : null;
        if (pending > 0 && prior !== 'approved') await setStatus(id, 'awaiting_approval', actor, conn);
        else if (prior === 'approved') await query("UPDATE incidents SET status='approved' WHERE id=?", [id], conn);
        else if (prior === 'monitoring') await query("UPDATE incidents SET status='monitoring' WHERE id=?", [id], conn);
        else await setStatus(id, 'awaiting_approval', actor, conn);
      }
      await audit(actor, `agent.${runType}_completed`, 'incident', id, { run_id: runId, confidence: result.court.confidence_score }, conn);
    });
    await recordBaselineKpis(id, result.kpi_baseline);
    return { runId, result };
  } catch (err) {
    await query('UPDATE agent_runs SET status=?, error_message=?, completed_at=? WHERE id=?', ['failed', err.message.slice(0, 500), now, runId]);
    // Nothing fabricated: the case stays open and is flagged as not fully analysed.
    await query('UPDATE incidents SET partially_analyzed=1 WHERE id=?', [id]);
    if (moving) await query('UPDATE incidents SET status=? WHERE id=?', [prevStatus, id]);
    throw err;
  }
}

export const investigate = (id, actor) => runAgent(id, 'investigation', {}, actor);

async function snapshot(id) {
  const inc = await getIncident(id);
  const hyps = await query('SELECT id, hypothesis_key, status, confidence_score FROM root_cause_hypotheses WHERE incident_id = ?', [id]);
  const tests = await query('SELECT hypothesis_id, test_name, status, result, explanation FROM investigation_tests WHERE incident_id = ?', [id]);
  const recs = await query("SELECT action_key FROM recovery_recommendations WHERE incident_id = ? AND status NOT IN ('superseded','rejected')", [id]);
  const priorTests = {};
  for (const h of hyps) priorTests[h.hypothesis_key] = {};
  const keyById = Object.fromEntries(hyps.map((h) => [h.id, h.hypothesis_key]));
  for (const t of tests) priorTests[keyById[t.hypothesis_id]][t.test_name] = { status: t.status, explanation: t.explanation, result: parseJson(t.result) };
  return {
    verdict: inc.root_cause_verdict,
    verdict_status: inc.metadata.court?.verdict_status ?? null,
    confidence: roundConfidence(inc.confidence_score),
    affected_customer_count: inc.affected_customer_count,
    complaints: inc.metadata.impact?.measured?.complaints ?? 0,
    top_segment_lift: (await query('SELECT MAX(lift_ratio) lift FROM incident_segments WHERE incident_id = ? AND significant = 1', [id]))[0]?.lift ?? null,
    hypotheses: Object.fromEntries(hyps.map((h) => [h.hypothesis_key, { status: h.status, confidence: roundConfidence(h.confidence_score) }])),
    recommendations: recs.map((r) => r.action_key),
    priorTests,
  };
}

export function buildDiff(before, after) {
  const changes = [];
  const hypotheses = [];
  for (const [key, now] of Object.entries(after.hypotheses)) {
    const was = before.hypotheses[key];
    if (!was || was.status !== now.status || was.confidence !== now.confidence) {
      hypotheses.push({ hypothesis_key: key, before: was ?? null, after: now });
      if (!was) changes.push(`New hypothesis under review: ${key} (${now.status}).`);
      else if (was.status !== now.status) changes.push(`${key} moved from ${was.status} to ${now.status}.`);
    }
  }
  if (before.confidence !== after.confidence) changes.push(`Overall confidence moved from ${before.confidence} to ${after.confidence}.`);
  if (before.verdict !== after.verdict) changes.push(`Verdict changed to: ${after.verdict}`);
  const added = after.recommendations.filter((r) => !before.recommendations.includes(r));
  const removed = before.recommendations.filter((r) => !after.recommendations.includes(r));
  if (added.length) changes.push(`Plan added: ${added.join(', ')}.`);
  if (removed.length) changes.push(`Plan removed: ${removed.join(', ')}.`);
  if (before.affected_customer_count !== after.affected_customer_count) changes.push(`Affected customers moved from ${before.affected_customer_count} to ${after.affected_customer_count}.`);
  if (before.complaints !== after.complaints) changes.push(`Complaints tied to this incident moved from ${before.complaints} to ${after.complaints}.`);
  if (before.top_segment_lift !== after.top_segment_lift) changes.push(`Top segment lift moved from ${before.top_segment_lift} to ${after.top_segment_lift}.`);
  if (!changes.length) changes.push('The new evidence did not change the verdict, confidence or plan.');
  const strip = ({ priorTests, ...rest }) => rest; // eslint-disable-line no-unused-vars
  return { before: strip(before), after: strip(after), hypotheses_changed: hypotheses, recommendations_added: added, recommendations_removed: removed, what_changed: changes };
}

export async function reassess(id, evidenceKinds, actor, trigger) {
  const before = await snapshot(id);
  const { runId, result } = await runAgent(id, 'reassessment', { evidence_kinds: evidenceKinds, prior_tests: before.priorTests }, actor);
  const after = await snapshot(id);
  const diff = { ...buildDiff(before, after), evidence_kinds: evidenceKinds, tests_rerun: result.court.tests_rerun, tests_reused: result.court.tests_reused };
  await query('INSERT INTO incident_reassessments (incident_id, agent_run_id, trigger_summary, diff) VALUES (?,?,?,?)', [id, runId, trigger ?? evidenceKinds.join(', '), json(diff)]);
  return diff;
}
