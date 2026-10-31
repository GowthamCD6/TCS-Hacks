import { json, one, parseJson, query } from './db.js';
import { notFound } from '../utils/errors.js';
import { assertTransition } from '../services/lifecycle.js';
import { audit } from '../services/audit.js';
import { simNow } from '../services/clock.js';

export const ACTIVE_STATUSES = ['detected', 'investigating', 'awaiting_approval', 'approved', 'executing', 'monitoring', 'reopened', 'escalated'];

export async function getIncident(id, conn) {
  const isNumeric = typeof id === 'number' || (!isNaN(Number(id)) && String(id).trim() !== '' && !String(id).includes('-'));
  const row = isNumeric
    ? await one('SELECT * FROM incidents WHERE id = ?', [Number(id)], conn)
    : await one('SELECT * FROM incidents WHERE incident_number = ?', [String(id)], conn);
  if (!row) throw notFound('Incident');
  return { ...row, metadata: parseJson(row.metadata) ?? {}, severity_inputs: parseJson(row.severity_inputs) };
}

export async function createIncident({ title, description, category, windowStart, severity, severityInputs, signalId, synthetic, domain = 'payments' }, conn) {
  const now = await simNow(conn);
  const metadata = { window_start: windowStart, telemetry_available: true, fix_deployed: false, rejected_actions: [], open_contradictions: 0, mitigations: [], signal_id: signalId ?? null };
  const res = await query(
    `INSERT INTO incidents (incident_number, title, description, issue_category, status, severity, severity_inputs, first_detected_at, last_updated_at, metadata, is_synthetic, domain)
     VALUES (?,?,?,?, 'detected', ?,?,?,?,?,?,?)`,
    [`TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, description ?? null, category, severity ?? null, json(severityInputs), now, now, json(metadata), synthetic ? 1 : 0, domain], conn,
  );
  const id = res.insertId;
  const number = `RIQ-${now.getUTCFullYear()}-${String(id).padStart(4, '0')}`;
  await query('UPDATE incidents SET incident_number = ? WHERE id = ?', [number, id], conn);
  await audit(null, 'incident.created', 'incident', id, { number, category }, conn);
  return id;
}

export async function setStatus(id, to, actor, conn, extra = {}) {
  const inc = await getIncident(id, conn);
  assertTransition(inc.status, to);
  const now = await simNow(conn);
  await query('UPDATE incidents SET status = ?, last_updated_at = ?, closed_at = ?, resolution_summary = COALESCE(?, resolution_summary) WHERE id = ?',
    [to, now, to === 'resolved' ? now : null, extra.resolution_summary ?? null, id], conn);
  if (inc.status !== to) await audit(actor, 'incident.status_changed', 'incident', id, { from: inc.status, to, ...extra }, conn);
}

export async function patchMetadata(id, patch, conn) {
  const inc = await getIncident(id, conn);
  await query('UPDATE incidents SET metadata = ? WHERE id = ?', [json({ ...inc.metadata, ...patch }), id], conn);
}
