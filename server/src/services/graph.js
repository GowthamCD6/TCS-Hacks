// React Flow shape: nodes { id, type, position, data }, edges { id, source, target, label, data }.
const COLUMN = { signal: 0, incident: 1, cluster: 2, segment: 2, release: 2, hypothesis: 3, recommendation: 4, action: 5, kpi: 6 };
const X_GAP = 320;
const Y_GAP = 120;

export function buildGraph({ incident, signal, clusters, segments, hypotheses, recommendations, actions, kpis }) {
  const nodes = [];
  const edges = [];
  const rows = {};
  const addNode = (id, kind, label, data = {}) => {
    const col = COLUMN[kind];
    rows[col] = (rows[col] ?? 0) + 1;
    nodes.push({ id, type: kind, position: { x: col * X_GAP, y: (rows[col] - 1) * Y_GAP }, data: { label, ...data } });
  };
  const addEdge = (source, target, label, data = {}) => edges.push({ id: `${source}->${target}`, source, target, label, data });

  const root = `incident-${incident.id}`;
  addNode(root, 'incident', incident.incident_number, { title: incident.title, status: incident.status, severity: incident.severity, confidence: incident.confidence_score });
  if (signal) {
    addNode(`signal-${signal.id}`, 'signal', `${signal.category} signal`, { anomaly_score: signal.anomaly_score, current_count: signal.current_count });
    addEdge(`signal-${signal.id}`, root, 'raised');
  }
  for (const c of clusters) {
    addNode(`cluster-${c.id}`, 'cluster', c.label, { feedback_count: c.feedback_count });
    addEdge(root, `cluster-${c.id}`, 'groups');
  }
  for (const s of segments.filter((x) => x.significant).slice(0, 4)) {
    addNode(`segment-${s.id}`, 'segment', s.segment_value, { lift_ratio: s.lift_ratio, issue_rate: s.issue_rate, dimension: s.dimension });
    addEdge(root, `segment-${s.id}`, 'concentrated in');
  }
  for (const h of hypotheses) {
    addNode(`hypothesis-${h.id}`, 'hypothesis', h.hypothesis, { key: h.hypothesis_key, status: h.status, confidence: h.confidence_score });
    addEdge(root, `hypothesis-${h.id}`, 'tested', { status: h.status });
  }
  const leader = hypotheses.find((h) => h.status === 'supported') ?? hypotheses[0];
  for (const r of recommendations.filter((x) => x.status !== 'superseded')) {
    addNode(`recommendation-${r.id}`, 'recommendation', r.title, { priority: r.priority, status: r.status, risk_level: r.risk_level });
    if (leader) addEdge(`hypothesis-${leader.id}`, `recommendation-${r.id}`, 'justifies');
  }
  for (const a of actions) {
    addNode(`action-${a.id}`, 'action', a.target_reference, { action_type: a.action_type, status: a.status, simulated: true });
    addEdge(`recommendation-${a.recommendation_id}`, `action-${a.id}`, 'executed as');
    for (const k of kpis) addEdge(`action-${a.id}`, `kpi-${k.name}`, 'measured by');
  }
  for (const k of kpis) addNode(`kpi-${k.name}`, 'kpi', k.name, { latest_value: k.latest_value, target_value: k.target_value, unit: k.unit });
  return { nodes, edges };
}
