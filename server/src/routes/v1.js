import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { env } from '../config/env.js';
import { requireApprover, requireWebhookToken } from '../middleware/auth.js';
import { ok, pageQuery, pagination, publicLimiter, validate, wrap } from '../middleware/http.js';
import { one } from '../repositories/db.js';
import { createIncident } from '../repositories/incidents.js';
import { approve, executeRecommendation, reject, requestApproval } from '../services/actions.js';
import { callAi } from '../services/aiClient.js';
import { simNow } from '../services/clock.js';
import { evaluate, resetDemo } from '../services/demo.js';
import { investigateSignal, runDetection } from '../services/detection.js';
import { injectEvidence, runScenario, SCENARIO_NAMES } from '../services/evidence.js';
import { CSV_TEMPLATE, importCsv, importExternal, ingestOne, storeOperationalEvent } from '../services/ingestion.js';
import { investigate, reassess } from '../services/investigation.js';
import { advanceClock, kpiReport, recordReply } from '../services/kpi.js';
import * as q from '../services/queries.js';
import { ApiError } from '../utils/errors.js';
import * as s from '../validators/schemas.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const incidentId = async (req) => {
  const param = req.params.id;
  if (!isNaN(Number(param)) && String(param).trim() !== '' && !String(param).includes('-')) {
    return Number(param);
  }
  const inc = await one('SELECT id FROM incidents WHERE incident_number = ?', [String(param)]);
  return inc?.id || Number(param) || 1;
};
const paged = (fn) => wrap(async (req, res) => {
  const params = req.valid.query;
  const { items, total } = await fn(params);
  ok(req, res, items, { pagination: pagination(params.page, params.page_size, total) });
});
const page = validate(pageQuery, 'query');

export const router = Router();

// Auth
router.post('/auth/login', publicLimiter, validate(s.loginBody), wrap(async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await one('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
  const token = jwt.sign({ name: user.display_name, role: user.role }, env.JWT_SECRET, { subject: String(user.id), expiresIn: env.JWT_EXPIRES_IN });
  ok(req, res, { token, user: { id: user.id, display_name: user.display_name, role: user.role } });
}));

// Feedback and ingestion
router.post('/feedback', publicLimiter, validate(s.feedbackBody), wrap(async (req, res) => {
  const result = await ingestOne(req.valid.body);
  ok(req, res, result, { status: result.duplicate ? 200 : 202 });
}));
router.post('/feedback/website', publicLimiter, validate(s.websiteFeedbackBody), wrap(async (req, res) => {
  const b = req.valid.body;
  const result = await ingestOne({
    source: 'website', channel: 'website_form', rating: b.rating, text: b.comment, order_id: b.order_reference,
    metadata: b.contact_email ? { contact_email: b.contact_email, contact_consent: true } : {},
  });
  ok(req, res, result, { status: result.duplicate ? 200 : 202 });
}));
router.post('/ingestion/google-forms', publicLimiter, requireWebhookToken, validate(s.googleFormBody), wrap(async (req, res) => {
  const b = req.valid.body;
  const result = await ingestOne({
    source: 'google_forms', source_record_id: b.response_id, channel: 'google_form', rating: b.rating, text: b.comment,
    order_id: b.order_reference, customer_id: b.customer_reference, timestamp: b.submitted_at,
  });
  ok(req, res, result, { status: result.duplicate ? 200 : 202 });
}));
router.get('/feedback', page, paged(q.listFeedback));
router.get('/feedback/:id', wrap(async (req, res) => ok(req, res, await q.getFeedback(Number(req.params.id)))));
router.get('/ingestion/csv/template', (_req, res) => res.type('text/csv').attachment('recoveriq_feedback_template.csv').send(CSV_TEMPLATE));
router.post('/ingestion/csv', publicLimiter, upload.single('file'), wrap(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'VALIDATION_ERROR', 'Upload a CSV in the "file" form field');
  let mapping = {};
  try { mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {}; } catch { throw new ApiError(422, 'VALIDATION_ERROR', 'mapping must be JSON'); }
  ok(req, res, await importCsv(req.file.buffer, mapping), { status: 202 });
}));
router.post('/ingestion/import/:platform', requireApprover, validate(s.externalImportBody), wrap(async (req, res) => {
  ok(req, res, await importExternal(req.params.platform, req.valid.body.records), { status: 202 });
}));
router.get('/ingestion/jobs/:id', wrap(async (req, res) => ok(req, res, await q.getJob(Number(req.params.id)))));
router.post('/operational-events', publicLimiter, validate(s.operationalEventBody), wrap(async (req, res) => {
  ok(req, res, await storeOperationalEvent(req.valid.body), { status: 201 });
}));

// Dashboard and signals
router.get('/dashboard/overview', wrap(async (req, res) => ok(req, res, await q.dashboardOverview(req.query.domain))));
router.get('/signals', page, paged(q.listSignals));
router.post('/signals/:id/investigate', requireApprover, wrap(async (req, res) => {
  const id = await investigateSignal(Number(req.params.id), req.actor);
  ok(req, res, await q.incidentDetail(id));
}));

// Incidents
router.get('/incidents', page, paged(q.listIncidents));
router.post('/incidents', requireApprover, validate(s.incidentBody), wrap(async (req, res) => {
  const b = req.valid.body;
  const now = await simNow();
  const id = await createIncident({ title: b.title, description: b.description, category: b.issue_category, windowStart: b.window_start ?? new Date(now - 3 * 86400000).toISOString() });
  ok(req, res, await q.incidentDetail(id), { status: 201 });
}));
router.get('/incidents/:id', wrap(async (req, res) => ok(req, res, await q.incidentDetail(await incidentId(req)))));
router.get('/incidents/:id/graph', wrap(async (req, res) => ok(req, res, await q.incidentGraph(await incidentId(req), req.query.diff, req.query.domain))));
router.get('/incidents/:id/shared-components', wrap(async (req, res) => ok(req, res, (await q.incidentDetail(await incidentId(req))).shared_components)));
router.get('/incidents/:id/funnel', wrap(async (req, res) => ok(req, res, (await q.incidentDetail(await incidentId(req))).court?.funnel ?? { telemetry_available: false, stages: [], breakpoint: null })));
router.get('/incidents/:id/reconciliation', wrap(async (req, res) => ok(req, res, (await q.incidentDetail(await incidentId(req))).impact?.reconciliation ?? { telemetry_available: false, states: null, overdue: [] })));
router.post('/incidents/:id/replies', requireApprover, validate(s.replyBody), wrap(async (req, res) => {
  ok(req, res, await recordReply(await incidentId(req), req.valid.body.reply, req.valid.body.count));
}));
router.get('/models', wrap(async (req, res) => ok(req, res, await callAi('/internal/models'))));
router.get('/incidents/:id/evidence', wrap(async (req, res) => ok(req, res, await q.evidenceFor(await incidentId(req)))));
router.get('/incidents/:id/hypotheses', wrap(async (req, res) => ok(req, res, await q.hypothesesFor(await incidentId(req)))));
router.post('/incidents/:id/investigate', requireApprover, wrap(async (req, res) => {
  await investigate(await incidentId(req), req.actor);
  ok(req, res, await q.incidentDetail(await incidentId(req)));
}));
router.post('/incidents/:id/reassess', requireApprover, wrap(async (req, res) => {
  ok(req, res, await reassess(await incidentId(req), ['new_complaints'], req.actor, 'Manual reassessment'));
}));
router.get('/incidents/:id/agent-trace', wrap(async (req, res) => ok(req, res, await q.agentTrace(await incidentId(req)))));
router.get('/incidents/:id/impact', wrap(async (req, res) => ok(req, res, (await q.incidentDetail(await incidentId(req))).impact)));
router.get('/incidents/:id/recommendations', wrap(async (req, res) => ok(req, res, await q.recommendationsFor(await incidentId(req)))));
router.get('/incidents/:id/actions', wrap(async (req, res) => ok(req, res, await q.actionsFor(await incidentId(req)))));
router.post('/incidents/:id/actions/:recommendationId/execute', requireApprover, wrap(async (req, res) => {
  ok(req, res, await executeRecommendation(await incidentId(req), Number(req.params.recommendationId), req.actor));
}));
router.get('/incidents/:id/kpis', wrap(async (req, res) => ok(req, res, await kpiReport(await incidentId(req)))));
router.post('/incidents/:id/evidence', requireApprover, validate(s.evidenceBody), wrap(async (req, res) => {
  ok(req, res, await injectEvidence(await incidentId(req), req.valid.body, req.actor), { status: 201 });
}));
router.get('/incidents/:id/decision-brief', wrap(async (req, res) => ok(req, res, await q.decisionBrief(await incidentId(req)))));
router.get('/incidents/:id/timeline', wrap(async (req, res) => ok(req, res, await q.timeline(await incidentId(req)))));

// Approvals
router.get('/approvals', page, paged(q.listApprovals));
router.post('/approvals', requireApprover, validate(s.requestApprovalBody), wrap(async (req, res) => {
  ok(req, res, await requestApproval(req.valid.body.recommendation_id, req.valid.body.comments, req.actor), { status: 201 });
}));
router.post('/approvals/:id/approve', requireApprover, validate(s.decisionBody), wrap(async (req, res) => {
  ok(req, res, await approve(Number(req.params.id), req.valid.body.comments, req.actor));
}));
router.post('/approvals/:id/reject', requireApprover, validate(s.decisionBody), wrap(async (req, res) => {
  ok(req, res, await reject(Number(req.params.id), req.valid.body.comments, req.actor));
}));

// Demo controls and evaluation
router.post('/demo/run-detection', requireApprover, wrap(async (req, res) => ok(req, res, await runDetection({ actor: req.actor, domain: req.query.domain === 'product' ? 'product' : 'payments' }))));
router.post('/demo/reset', requireApprover, validate(s.resetBody), wrap(async (req, res) => ok(req, res, await resetDemo(req.actor))));
router.post('/demo/advance-clock', requireApprover, validate(s.advanceClockBody), wrap(async (req, res) => ok(req, res, await advanceClock(req.valid.body.minutes, req.actor))));
router.get('/demo/scenarios', (req, res) => ok(req, res, SCENARIO_NAMES));
router.post('/demo/scenario/:name', requireApprover, wrap(async (req, res) => ok(req, res, await runScenario(req.params.name, req.actor))));
router.get('/demo/clock', wrap(async (req, res) => ok(req, res, { sim_now: await simNow() })));
router.post('/demo/evaluate', requireApprover, wrap(async (req, res) => ok(req, res, await evaluate())));
router.get('/simulation-test', wrap(async (req, res) => ok(req, res, q.readScorecard())));
router.get('/evaluation/scorecard', wrap(async (req, res) => ok(req, res, q.readScorecard())));

