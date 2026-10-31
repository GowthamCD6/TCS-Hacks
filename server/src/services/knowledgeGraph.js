// Node is the only writer of the knowledge graph. Edges are superseded, never deleted, so runs can be compared.
import { json, parseJson, query } from '../repositories/db.js';

const COLUMN = { signal: 0, incident: 1, issue_cluster: 2, segment: 2, release: 2, funnel_stage: 3, hypothesis: 3, court_test: 4, recommendation: 5, approval: 6, action: 7, kpi: 8 };
const X_GAP = 300;
const Y_GAP = 100;

const sameFact = (a, b) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

async function upsertNode(n, incidentId, runId, conn) {
  await query(
    `INSERT INTO kg_nodes (incident_id, node_type, natural_key, label, props, fact_kind, source_table, source_id, confidence, run_id) VALUES (?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE label=VALUES(label), props=VALUES(props), fact_kind=VALUES(fact_kind), confidence=VALUES(confidence), run_id=VALUES(run_id)`,
    [n.incident_scoped ? incidentId : null, n.node_type, n.natural_key, n.label, json(n.props), n.fact_kind, n.source_table, n.source_id, n.confidence, runId], conn,
  );
  const [row] = await query('SELECT id FROM kg_nodes WHERE node_type = ? AND natural_key = ?', [n.node_type, n.natural_key], conn);
  return row.id;
}

export async function persistGraph(incidentId, runId, graph, conn) {
  const ids = new Map();
  for (const n of graph.nodes) ids.set(`${n.node_type}|${n.natural_key}`, await upsertNode(n, incidentId, runId, conn));
  const live = await query('SELECT id, src_id, dst_id, edge_type, props FROM kg_edges WHERE incident_id = ? AND superseded_by IS NULL', [incidentId], conn);
  const byKey = new Map(live.map((e) => [`${e.src_id}|${e.dst_id}|${e.edge_type}`, e]));
  const kept = new Set();
  for (const e of graph.edges) {
    const src = ids.get(e.src.join('|'));
    const dst = ids.get(e.dst.join('|'));
    if (!src || !dst) continue;
    const key = `${src}|${dst}|${e.edge_type}`;
    const old = byKey.get(key);
    if (old && sameFact(parseJson(old.props), e.props)) { kept.add(old.id); continue; }
    const res = await query(
      'INSERT INTO kg_edges (incident_id, src_id, dst_id, edge_type, fact_kind, props, evidence_ids, run_id) VALUES (?,?,?,?,?,?,?,?)',
      [incidentId, src, dst, e.edge_type, e.fact_kind, json(e.props), json(e.evidence_ids), runId], conn,
    );
    if (old) {
      await query('UPDATE kg_edges SET superseded_by = ?, superseded_at_run = ? WHERE id = ?', [res.insertId, runId, old.id], conn);
      kept.add(old.id);
    }
  }
  // Facts the new run no longer asserts point at themselves, so they leave the live graph but stay in history.
  for (const e of live) {
    if (!kept.has(e.id) && e.edge_type !== 'REQUIRES' && e.edge_type !== 'AUTHORISES' && e.edge_type !== 'MEASURED_BY') {
      await query('UPDATE kg_edges SET superseded_by = id, superseded_at_run = ? WHERE id = ?', [runId, e.id], conn);
    }
  }
}

export async function recordRecoveryChain(incidentId, rec, approvalId, actionId, kpiNames, runId) {
  const node = async (type, key, label, kind) => upsertNode({ node_type: type, natural_key: `i${incidentId}:${key}`, label, props: {}, fact_kind: kind, incident_scoped: true }, incidentId, runId);
  const edge = (src, dst, type) => query(
    'INSERT INTO kg_edges (incident_id, src_id, dst_id, edge_type, fact_kind, run_id) VALUES (?,?,?,?,?,?)', [incidentId, src, dst, type, 'observed', runId],
  );
  const recNode = await node('recommendation', rec.action_key, rec.title, 'derived');
  const actionNode = await node('action', `${actionId}`, rec.action_key, 'observed');
  if (approvalId) {
    const approvalNode = await node('approval', `${approvalId}`, `Approval ${approvalId}`, 'observed');
    await edge(recNode, approvalNode, 'REQUIRES');
    await edge(approvalNode, actionNode, 'AUTHORISES');
  }
  for (const name of kpiNames) await edge(actionNode, await node('kpi', name, name, 'observed'), 'MEASURED_BY');
}

// An edge belongs to a run's graph if it existed by then and had not yet been replaced.
const stateAt = (rows, run) => rows.filter((e) => e.run_id <= run && (e.superseded_at_run == null || e.superseded_at_run > run));

export async function knowledgeGraph(incidentId, diff) {
  const rows = await query(
    `SELECT e.*, s.natural_key src_key, d.natural_key dst_key FROM kg_edges e JOIN kg_nodes s ON s.id = e.src_id JOIN kg_nodes d ON d.id = e.dst_id WHERE e.incident_id = ? ORDER BY e.id`, [incidentId],
  );
  const edges = rows.map((e) => ({ ...e, props: parseJson(e.props), evidence_ids: parseJson(e.evidence_ids) }));
  const nodeIds = [...new Set(edges.filter((e) => e.superseded_by == null).flatMap((e) => [e.src_id, e.dst_id]))];
  const nodes = nodeIds.length ? await query('SELECT * FROM kg_nodes WHERE id IN (?)', [nodeIds]) : [];
  const rowsByCol = {};
  const flowNodes = nodes.map((n) => {
    const col = COLUMN[n.node_type] ?? 9;
    rowsByCol[col] = (rowsByCol[col] ?? 0) + 1;
    return {
      id: `kg-${n.id}`, type: n.node_type, position: { x: col * X_GAP, y: (rowsByCol[col] - 1) * Y_GAP },
      data: { label: n.label, fact_kind: n.fact_kind, confidence: n.confidence, props: parseJson(n.props), source_table: n.source_table, source_id: n.source_id },
    };
  });
  const flowEdges = edges.filter((e) => e.superseded_by == null).map((e) => ({
    id: `kge-${e.id}`, source: `kg-${e.src_id}`, target: `kg-${e.dst_id}`, label: e.edge_type,
    data: { fact_kind: e.fact_kind, props: e.props, evidence_ids: e.evidence_ids, run_id: e.run_id },
  }));
  const result = { nodes: flowNodes, edges: flowEdges, runs: [...new Set(edges.map((e) => e.run_id))] };
  if (diff) {
    const [a, b] = diff.split(',').map(Number);
    const key = (e) => `${e.src_id}|${e.dst_id}|${e.edge_type}`;
    const before = new Map(stateAt(edges, a).map((e) => [key(e), e]));
    const after = new Map(stateAt(edges, b).map((e) => [key(e), e]));
    const brief = (e) => ({ from: e.src_key, to: e.dst_key, edge_type: e.edge_type, fact_kind: e.fact_kind, props: e.props });
    result.diff = {
      run_a: a,
      run_b: b,
      added: [...after].filter(([k]) => !before.has(k)).map(([, e]) => brief(e)),
      removed: [...before].filter(([k]) => !after.has(k)).map(([, e]) => brief(e)),
      changed: [...after].filter(([k, e]) => before.has(k) && !sameFact(before.get(k).props, e.props)).map(([k, e]) => ({ ...brief(e), before: before.get(k).props })),
    };
  }
  return result;
}
