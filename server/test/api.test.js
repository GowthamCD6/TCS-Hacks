// Integration tests. They write rows, so they run only with RIQ_INTEGRATION=1 and a non-production ENV_FILE.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
const enabled = process.env.RIQ_INTEGRATION === '1';
const { env } = await import('../src/config/env.js');
const skip = !enabled || !['127.0.0.1', 'localhost'].includes(env.DB_HOST);
const opts = { skip: skip ? 'needs RIQ_INTEGRATION=1 and a local database' : false };

let app;
let db;
const owner = { 'x-owner-token': env.OWNER_API_TOKEN };
const unique = `test-${Date.now()}`;

before(async () => {
  if (skip) return;
  app = (await import('../src/app.js')).createApp();
  db = await import('../src/repositories/db.js');
});
after(async () => {
  if (skip) return;
  await db.query("DELETE FROM feedback WHERE source IN ('csv','it-test','google_forms','website')");
  await db.closePool();
});

test('health reports dependencies', opts, async () => {
  const res = await request(app).get('/health');
  assert.equal(res.body.data.database, 'ok');
  assert.ok(res.headers['x-request-id']);
});

test('feedback is acknowledged without waiting for analysis', opts, async () => {
  const res = await request(app).post('/api/v1/feedback').send({ source: 'it-test', channel: 'api', text: `${unique} money deducted` });
  assert.equal(res.status, 202);
  assert.equal(res.body.data.processing_status, 'pending');
  assert.ok(res.body.data.job_id);
});

test('invalid feedback returns field errors', opts, async () => {
  const res = await request(app).post('/api/v1/feedback').send({ text: '' });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.equal(res.body.error.details[0].path, 'text');
});

test('a repeated delivery does not duplicate feedback', opts, async () => {
  const body = { source: 'it-test', source_record_id: `${unique}-dup`, channel: 'api', text: 'same delivery' };
  const first = await request(app).post('/api/v1/feedback').send(body);
  const second = await request(app).post('/api/v1/feedback').send(body);
  assert.equal(second.status, 200);
  assert.equal(second.body.data.duplicate, true);
  assert.equal(second.body.data.feedback_id, first.body.data.feedback_id);
});

test('CSV import reports rows, errors and duplicates', opts, async () => {
  const csv = `text,rating,source_record_id\nhello from csv,2,${unique}-1\n,3,${unique}-2\nhello again,9,${unique}-3\n`;
  const send = () => request(app).post('/api/v1/ingestion/csv').attach('file', Buffer.from(csv), 'f.csv');
  const res = await send();
  assert.equal(res.status, 202);
  assert.deepEqual([res.body.data.accepted, res.body.data.failed], [1, 2]);
  assert.equal((await send()).body.data.duplicates, 1);
  const job = await request(app).get(`/api/v1/ingestion/jobs/${res.body.data.job_id}`);
  assert.equal(job.body.data.total_records, 3);
});

test('Google Forms webhook needs its token and dedupes retries', opts, async () => {
  const body = { response_id: `${unique}-gf`, comment: 'from a form', rating: 2 };
  assert.equal((await request(app).post('/api/v1/ingestion/google-forms').send(body)).status, 401);
  const send = () => request(app).post('/api/v1/ingestion/google-forms').set('x-webhook-token', env.WEBHOOK_TOKEN).send(body);
  assert.equal((await send()).status, 202);
  assert.equal((await send()).body.data.duplicate, true);
});

test('operational events are stored and validated', opts, async () => {
  assert.equal((await request(app).post('/api/v1/operational-events').send({ event_type: 'nope' })).status, 422);
  assert.equal((await request(app).post('/api/v1/operational-events').send({ event_type: 'payment_failed', order_id: `${unique}-o` })).status, 201);
  await db.query('DELETE FROM operational_events WHERE order_id = ?', [`${unique}-o`]);
});

test('approver routes refuse anonymous callers', opts, async () => {
  assert.equal((await request(app).post('/api/v1/demo/run-detection')).status, 401);
  assert.equal((await request(app).post('/api/v1/approvals/1/approve').send({})).status, 401);
});

test('login issues a usable token and rejects bad passwords', opts, async () => {
  const email = env.DEMO_APPROVER_EMAIL;
  assert.equal((await request(app).post('/api/v1/auth/login').send({ email, password: 'wrong' })).status, 401);
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: env.DEMO_APPROVER_PASSWORD });
  assert.ok(res.body.data.token);
  const reset = await request(app).post('/api/v1/demo/reset').set('Authorization', `Bearer ${res.body.data.token}`).send({});
  assert.equal(reset.status, 422);
});

test('feedback lists never expose contact fields', opts, async () => {
  const res = await request(app).get('/api/v1/feedback?page_size=5');
  assert.ok(res.body.meta.pagination.total > 0);
  assert.ok(res.body.data.every((f) => !('email' in f) && !('phone' in f)));
});

test('unknown routes and resources use the error envelope', opts, async () => {
  const res = await request(app).get('/api/v1/incidents/999999').set(owner);
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.stack, undefined);
});
