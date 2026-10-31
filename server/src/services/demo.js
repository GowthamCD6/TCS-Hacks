import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
import { one, query } from '../repositories/db.js';
import { ApiError } from '../utils/errors.js';
import { audit } from './audit.js';
import { setSimNow } from './clock.js';
import { readScorecard } from './queries.js';

const run = promisify(execFile);
const dataDir = path.join(env.repoRoot, 'ai_services', 'data', 'synthetic');
const INCIDENT_CHILDREN = ['kg_edges', 'kg_nodes', 'decision_briefs', 'customer_messages', 'agent_steps', 'agent_runs', 'approvals', 'recovery_actions', 'recovery_recommendations', 'investigation_tests', 'root_cause_hypotheses',
  'incident_evidence', 'incident_segments', 'issue_clusters', 'kpi_measurements', 'incident_reassessments'];

// Removes only synthetic rows and the synthetic incidents built on them. Real ingested data is kept.
export async function resetDemo(actor) {
  const incidents = (await query('SELECT id FROM incidents WHERE is_synthetic = 1')).map((r) => r.id);
  const removed = { incidents: incidents.length };
  if (incidents.length) {
    for (const table of INCIDENT_CHILDREN) {
      if (table === 'agent_steps') await query('DELETE s FROM agent_steps s JOIN agent_runs r ON r.id = s.agent_run_id WHERE r.incident_id IN (?)', [incidents]);
      else await query(`DELETE FROM ${table} WHERE incident_id IN (?)`, [incidents]);
    }
    await query('UPDATE signals SET incident_id = NULL WHERE incident_id IN (?)', [incidents]);
    await query('DELETE FROM incidents WHERE id IN (?)', [incidents]);
  }
  await query('DELETE FROM signals WHERE is_synthetic = 1');
  // Rows added by scenarios and simulated actions go; the seeded dataset returns to its pristine state.
  await query("DELETE FROM operational_events WHERE is_synthetic = 1 AND (event_type = 'payment_refunded' OR JSON_EXTRACT(metadata, '$.scenario') IS NOT NULL OR app_version = '2.3.1')");
  await query("DELETE FROM feedback WHERE is_synthetic = 1 AND source <> 'synthetic' AND domain = 'payments'");
  await query("DELETE FROM orders WHERE is_synthetic = 1 AND external_order_id LIKE 'SYN-IOS-%'");
  await query("DELETE FROM product_releases WHERE is_synthetic = 1 AND version = '2.3.1'");
  const meta = path.join(dataDir, 'meta.json');
  if (fs.existsSync(meta)) await setSimNow(new Date(JSON.parse(fs.readFileSync(meta, 'utf8')).sim_now));
  await audit(actor, 'demo.reset', 'demo', null, removed);
  return { ...removed, kept: 'Non-synthetic records were not touched.' };
}

export async function evaluate() {
  if (!(await one('SELECT id FROM incidents LIMIT 1'))) throw new ApiError(409, 'CONFLICT', 'Run detection before evaluating');
  try {
    await run(env.PYTHON_BIN, ['-m', 'ai_services.eval.run_eval'], { cwd: env.repoRoot, timeout: 180000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  } catch (err) {
    throw new ApiError(502, 'EVALUATION_FAILED', `Evaluation script failed: ${String(err.stderr ?? err.message).slice(-300)}`);
  }
  return readScorecard();
}
