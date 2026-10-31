import { json, one, parseJson, query, tx } from '../repositories/db.js';
import { getIncident, patchMetadata, setStatus } from '../repositories/incidents.js';
import { ApiError, conflict, notFound } from '../utils/errors.js';
import { callAi } from './aiClient.js';
import { audit } from './audit.js';
import { simNow } from './clock.js';
import { reassess } from './investigation.js';
import { recordRecoveryChain } from './knowledgeGraph.js';
import { KPI_DEFINITIONS } from './kpi.js';

const SIMULATED = { simulated: true, note: 'No real money, message or production flag was touched.' };

// Every adapter only records what would have happened.
const ADAPTERS = {
  simulate_product_action: async (rec) => ({
    action: rec.action_key,
    owner: parseJson(rec.rationale)?.owner,
    ...(rec.action_key === 'replacement_offer' ? { offers_sent: parseJson(rec.rationale)?.target_count ?? 0, reply_options: { 1: 'replacement', 2: 'refund' } } : {}),
  }),
  simulate_feature_flag_change: async (rec) => ({ flag_change: rec.action_key, target: 'mobile-payments-config' }),
  simulate_support_ticket: async (rec) => ({ ticket_reference: `SIM-TKT-${rec.id}` }),
  simulate_customer_notification: async (rec) => ({ template: 'payment_issue_apology', recipients: parseJson(rec.rationale)?.target_count ?? 0 }),
  simulate_coupon: async (rec) => ({ coupon: 'SIM-SORRY100', recipients: parseJson(rec.rationale)?.target_count ?? 0 }),
  simulate_refund: async (rec, inc, now) => {
    const eligibility = await callAi('/internal/refunds/eligibility', {
      as_of: now.toISOString(), category: inc.issue_category, window_start: inc.metadata.court?.analysis_start ?? inc.metadata.window_start, telemetry_available: inc.metadata.telemetry_available !== false,
    });
    if (eligibility.blocked_reason) throw conflict(eligibility.blocked_reason);
    for (const e of eligibility.eligible) {
      await query(
        `INSERT INTO operational_events (event_type, event_timestamp, customer_id, order_id, payment_status, amount, metadata, is_synthetic)
         VALUES ('payment_refunded',?,?,?,'refunded',?,?,1)`,
        [now, e.customer_id, e.order_id, e.amount, json({ simulated: true, recommendation_id: rec.id })],
      );
    }
    return { refunded_orders: eligibility.eligible.length, refunded_amount: eligibility.eligible_amount, policy: eligibility.policy };
  },
};

export async function executeRecommendation(incidentId, recommendationId, actor) {
  const inc = await getIncident(incidentId);
  const rec = await one('SELECT * FROM recovery_recommendations WHERE id = ? AND incident_id = ?', [recommendationId, incidentId]);
  if (!rec) throw notFound('Recommendation');
  const existing = await one('SELECT * FROM recovery_actions WHERE recommendation_id = ?', [recommendationId]);
  if (existing) return { ...existing, execution_result: parseJson(existing.execution_result), idempotent_replay: true };
  if (rec.requires_approval) {
    const approval = await one('SELECT decision FROM approvals WHERE recommendation_id = ?', [recommendationId]);
    if (approval?.decision !== 'approved') throw new ApiError(403, 'APPROVAL_REQUIRED', 'A human must approve this action before it can run');
  } else if (!['proposed', 'approved'].includes(rec.status)) {
    throw conflict(`Recommendation is ${rec.status}`);
  }
  if (['resolved', 'rejected'].includes(inc.status)) throw conflict(`Incident is ${inc.status}`);

  const now = await simNow();
  const startFrom = inc.status === 'awaiting_approval' ? 'approved' : null;
  if (startFrom) await setStatus(incidentId, 'approved', actor);
  await setStatus(incidentId, 'executing', actor);
  try {
    const result = { ...(await ADAPTERS[rec.action_type](rec, inc, now)), ...SIMULATED };
    const actionId = await tx(async (conn) => {
      const res = await query(
        'INSERT INTO recovery_actions (incident_id, recommendation_id, action_type, status, target_reference, execution_result, executed_at) VALUES (?,?,?,?,?,?,?)',
        [incidentId, recommendationId, rec.action_type, 'completed', rec.action_key, json(result), now], conn,
      );
      await query("UPDATE recovery_recommendations SET status='executed' WHERE id=?", [recommendationId], conn);
      await patchMetadata(incidentId, {
        mitigations: [...new Set([...(inc.metadata.mitigations ?? []), rec.action_key])],
        ...(rec.action_key === 'escalate_gateway' ? { open_contradictions: 0 } : {}),
      }, conn);
      await setStatus(incidentId, 'monitoring', actor, conn);
      await audit(actor, 'action.executed', 'recovery_action', res.insertId, { action_key: rec.action_key, simulated: true }, conn);
      return res.insertId;
    });
    const run = await one('SELECT MAX(id) id FROM agent_runs WHERE incident_id = ?', [incidentId]);
    const approval = await one('SELECT id FROM approvals WHERE recommendation_id = ?', [recommendationId]);
    await recordRecoveryChain(incidentId, rec, approval?.id, actionId, KPI_DEFINITIONS.filter((k) => (k.domain ?? 'payments') === inc.domain).map((k) => k.name), run.id);
    return { id: actionId, incident_id: incidentId, recommendation_id: recommendationId, action_type: rec.action_type, status: 'completed', target_reference: rec.action_key, execution_result: result, executed_at: now };
  } catch (err) {
    await query("UPDATE incidents SET status='approved' WHERE id=?", [incidentId]);
    throw err;
  }
}

async function loadApproval(id) {
  const a = await one('SELECT a.*, r.action_key FROM approvals a JOIN recovery_recommendations r ON r.id = a.recommendation_id WHERE a.id = ?', [id]);
  if (!a) throw notFound('Approval');
  if (a.decision !== 'pending') throw conflict(`Approval was already ${a.decision}`);
  return a;
}

export async function requestApproval(recommendationId, comments, actor) {
  const rec = await one('SELECT id, incident_id FROM recovery_recommendations WHERE id = ?', [recommendationId]);
  if (!rec) throw notFound('Recommendation');
  const existing = await one('SELECT id, decision FROM approvals WHERE recommendation_id = ?', [recommendationId]);
  if (existing) return existing;
  const res = await query('INSERT INTO approvals (incident_id, recommendation_id, requested_by, comments) VALUES (?,?,?,?)', [rec.incident_id, recommendationId, actor?.name ?? 'system', comments ?? null]);
  return { id: res.insertId, decision: 'pending' };
}

export async function approve(id, comments, actor) {
  const a = await loadApproval(id);
  await tx(async (conn) => {
    await query("UPDATE approvals SET decision='approved', reviewed_by=?, comments=?, reviewed_at=? WHERE id=?", [actor.name, comments ?? null, await simNow(conn), id], conn);
    await query("UPDATE recovery_recommendations SET status='approved' WHERE id=?", [a.recommendation_id], conn);
    const inc = await getIncident(a.incident_id, conn);
    if (inc.status === 'awaiting_approval') await setStatus(a.incident_id, 'approved', actor, conn);
    await audit(actor, 'approval.approved', 'approval', id, { action_key: a.action_key }, conn);
  });
  return { id, decision: 'approved', incident_status: (await getIncident(a.incident_id)).status };
}

export async function reject(id, comments, actor) {
  const a = await loadApproval(id);
  const inc = await getIncident(a.incident_id);
  await tx(async (conn) => {
    await query("UPDATE approvals SET decision='rejected', reviewed_by=?, comments=?, reviewed_at=? WHERE id=?", [actor.name, comments ?? null, await simNow(conn), id], conn);
    await query("UPDATE recovery_recommendations SET status='rejected' WHERE id=?", [a.recommendation_id], conn);
    await patchMetadata(a.incident_id, { rejected_actions: [...new Set([...(inc.metadata.rejected_actions ?? []), a.action_key])] }, conn);
    await audit(actor, 'approval.rejected', 'approval', id, { action_key: a.action_key }, conn);
  });
  const diff = await reassess(a.incident_id, ['approval_rejected'], actor, `Approver rejected ${a.action_key}`);
  diff.what_changed = [`${a.action_key} was rejected by the approver and removed from the plan.`,
    ...diff.what_changed.filter((c) => !c.startsWith('The new evidence did not change'))];
  const alternatives = await query(
    "SELECT id, action_key, title, rationale FROM recovery_recommendations WHERE incident_id = ? AND status = 'proposed'", [a.incident_id],
  );
  const alternative = alternatives.map((r) => ({ ...r, rationale: parseJson(r.rationale) })).find((r) => r.rationale?.alternative?.replaces === a.action_key);
  const open = await one(
    "SELECT COUNT(*) n FROM recovery_recommendations WHERE incident_id = ? AND status IN ('proposed','approved')", [a.incident_id],
  );
  if (!open.n) await setStatus(a.incident_id, 'rejected', actor);
  return {
    id, decision: 'rejected', incident_status: (await getIncident(a.incident_id)).status,
    alternative: alternative ? { recommendation_id: alternative.id, action_key: alternative.action_key, title: alternative.title, trade_off: alternative.rationale.alternative.trade_off } : null,
    reassessment: diff,
  };
}
