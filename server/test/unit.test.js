import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
const { canTransition, assertTransition } = await import('../src/services/lifecycle.js');
const { contentHash } = await import('../src/services/ingestion.js');
const { buildDiff } = await import('../src/services/investigation.js');
const { buildGraph } = await import('../src/services/graph.js');
const { nextValue } = await import('../src/services/kpi.js');
const { feedbackBody, websiteFeedbackBody, resetBody } = await import('../src/validators/schemas.js');

test('lifecycle follows the controlled path', () => {
  const path = ['detected', 'investigating', 'awaiting_approval', 'approved', 'executing', 'monitoring', 'resolved'];
  for (let i = 1; i < path.length; i += 1) assert.ok(canTransition(path[i - 1], path[i]));
});

test('an incident cannot jump straight to resolved', () => {
  for (const from of ['detected', 'awaiting_approval', 'approved', 'executing']) assert.throws(() => assertTransition(from, 'resolved'));
});

test('a resolved incident can only reopen', () => {
  assert.ok(canTransition('resolved', 'reopened'));
  assert.equal(canTransition('resolved', 'monitoring'), false);
});

test('feedback validation rejects empty text and bad ratings', () => {
  assert.equal(feedbackBody.safeParse({ text: '   ' }).success, false);
  assert.equal(feedbackBody.safeParse({ text: 'ok', rating: 9 }).success, false);
  assert.equal(feedbackBody.safeParse({ text: 'ok', rating: 4 }).success, true);
});

test('feedback validation strips control characters', () => {
  assert.equal(feedbackBody.parse({ text: 'a\u0000b' }).text, 'ab');
});

test('contact details need consent', () => {
  assert.equal(websiteFeedbackBody.safeParse({ rating: 2, comment: 'x', contact_email: 'a@b.co' }).success, false);
  assert.equal(websiteFeedbackBody.safeParse({ rating: 2, comment: 'x', contact_email: 'a@b.co', contact_consent: true }).success, true);
});

test('demo reset needs explicit confirmation', () => {
  assert.equal(resetBody.safeParse({}).success, false);
  assert.equal(resetBody.safeParse({ DEMO_RESET_CONFIRM: 'yes' }).success, true);
});

test('identical content hashes identically for idempotency', () => {
  const a = { source: 'api', text: 'x', customer_id: 'c' };
  assert.equal(contentHash(a), contentHash({ ...a }));
  assert.notEqual(contentHash(a), contentHash({ ...a, text: 'y' }));
});

const snap = (over = {}) => ({ verdict: 'A', confidence: 0.9, affected_customer_count: 1, complaints: 1, top_segment_lift: 2, hypotheses: { h: { status: 'supported', confidence: 0.9 } }, recommendations: ['r'], ...over });

test('reassessment diff explains what changed', () => {
  const d = buildDiff(snap(), snap({ confidence: 0.6, hypotheses: { h: { status: 'inconclusive', confidence: 0.6 } }, recommendations: ['s'] }));
  assert.deepEqual(d.recommendations_added, ['s']);
  assert.deepEqual(d.recommendations_removed, ['r']);
  assert.ok(d.what_changed.some((c) => c.includes('supported to inconclusive')));
});

test('reassessment diff says so when nothing changed', () => {
  assert.match(buildDiff(snap(), snap()).what_changed[0], /did not change/);
});

test('graph has the React Flow shape and resolvable edges', () => {
  const g = buildGraph({
    incident: { id: 1, incident_number: 'RIQ-1', title: 't', status: 'monitoring' },
    signal: { id: 2, category: 'payment' },
    clusters: [{ id: 3, label: 'c', feedback_count: 5 }],
    segments: [{ id: 4, segment_value: 's', significant: true }],
    hypotheses: [{ id: 5, hypothesis: 'h', status: 'supported' }],
    recommendations: [{ id: 6, title: 'r', status: 'executed' }],
    actions: [{ id: 7, recommendation_id: 6, target_reference: 'a', status: 'completed' }],
    kpis: [{ name: 'k', latest_value: 1, target_value: 2 }],
  });
  const ids = new Set(g.nodes.map((n) => n.id));
  assert.ok(g.nodes.every((n) => n.position && n.data.label));
  assert.ok(g.edges.every((e) => ids.has(e.source) && ids.has(e.target)));
});

test('KPI generator heals only with a fix and is deterministic', () => {
  const healed = nextValue('payment_without_order_rate', 2, true, 'seed', 2);
  const stuck = nextValue('payment_without_order_rate', 2, false, 'seed', 2);
  assert.ok(healed < 1.5 && stuck > 1.7);
  assert.equal(healed, nextValue('payment_without_order_rate', 2, true, 'seed', 2));
});
