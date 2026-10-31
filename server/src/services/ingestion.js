import crypto from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { json, one, query } from '../repositories/db.js';
import { ApiError, notFound } from '../utils/errors.js';
import { feedbackBody, operationalEventBody } from '../validators/schemas.js';
import { callAi } from './aiClient.js';
import { simNow } from './clock.js';

const MAX_JOB_ATTEMPTS = 3;
const LLM_BATCH_LIMIT = 50;
const BULK_BATCH = 1000;

export const contentHash = ({ source, customer_id: c, order_id: o, text, timestamp }) => crypto
  .createHash('sha256').update([source, c ?? '', o ?? '', text, timestamp ?? ''].join('|')).digest('hex');

async function customerIdFor(ref, conn) {
  if (!ref) return null;
  return (await one('SELECT id FROM customers WHERE external_customer_id = ?', [ref], conn))?.id ?? null;
}

// The unique (source, source_record_id) key is what makes webhook retries harmless.
export async function storeFeedback(input, { synthetic = false, conn } = {}) {
  const sourceRecordId = input.source_record_id ?? contentHash(input);
  const customerId = await customerIdFor(input.customer_id, conn);
  const metadata = { ...input.metadata, ...(input.customer_id && !customerId ? { unmatched_customer_ref: input.customer_id } : {}) };
  const when = input.timestamp ? new Date(input.timestamp) : await simNow(conn);
  const res = await query(
    `INSERT IGNORE INTO feedback (source, source_record_id, customer_id, order_id, channel, rating, text, metadata, event_timestamp, is_synthetic)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [input.source, sourceRecordId, customerId, input.order_id ?? null, input.channel, input.rating ?? null, input.text, json(metadata), when, synthetic ? 1 : 0], conn,
  );
  if (res.affectedRows) return { id: res.insertId, duplicate: false };
  const existing = await one('SELECT id FROM feedback WHERE source = ? AND source_record_id = ?', [input.source, sourceRecordId], conn);
  return { id: existing.id, duplicate: true };
}

export const createJob = async (source, feedbackIds, counts = {}) => (await query(
  'INSERT INTO ingestion_jobs (source, status, total_records, duplicate_records, failed_records, error_summary, payload) VALUES (?,?,?,?,?,?,?)',
  [source, feedbackIds.length ? 'pending' : 'completed', counts.total ?? feedbackIds.length, counts.duplicates ?? 0, counts.failed ?? 0,
    json(counts.errors?.length ? counts.errors : null), json({ feedback_ids: feedbackIds })],
)).insertId;

export async function ingestOne(input, jobSource = input.source) {
  const stored = await storeFeedback(input);
  const jobId = stored.duplicate ? null : await createJob(jobSource, [stored.id]);
  return { feedback_id: stored.id, duplicate: stored.duplicate, job_id: jobId, processing_status: stored.duplicate ? 'already_received' : 'pending' };
}

export async function ingestMany(source, records) {
  const ids = [];
  const errors = [];
  let duplicates = 0;
  for (const { row, input } of records) {
    const parsed = feedbackBody.safeParse(input);
    if (!parsed.success) {
      errors.push({ row, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
      continue;
    }
    const stored = await storeFeedback(parsed.data);
    if (stored.duplicate) duplicates += 1;
    else ids.push(stored.id);
  }
  const jobId = await createJob(source, ids, { total: records.length, duplicates, failed: errors.length, errors: errors.slice(0, 50) });
  return { job_id: jobId, total_records: records.length, accepted: ids.length, duplicates, failed: errors.length, errors: errors.slice(0, 50) };
}

export const CSV_TEMPLATE = 'text,rating,customer_id,order_id,channel,timestamp,source_record_id\n'
  + '"SYNTHETIC EXAMPLE: money deducted but no order was created",1,SYN-C00001,SYN-O0000001,support_ticket,2026-10-13T10:00:00Z,example-1\n';

export function importCsv(buffer, mapping = {}) {
  let rows;
  try {
    rows = parse(buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });
  } catch (err) {
    throw new ApiError(422, 'INVALID_CSV', `CSV could not be parsed: ${err.message}`);
  }
  if (rows.length > 5000) throw new ApiError(413, 'CSV_TOO_LARGE', 'CSV is limited to 5000 rows');
  const field = (r, name) => r[mapping[name] ?? name] || undefined;
  return ingestMany('csv', rows.map((r, i) => ({
    row: i + 2,
    input: {
      source: 'csv',
      channel: field(r, 'channel') ?? 'csv',
      text: field(r, 'text') ?? '',
      rating: field(r, 'rating') ? Number(field(r, 'rating')) : undefined,
      customer_id: field(r, 'customer_id'),
      order_id: field(r, 'order_id'),
      timestamp: field(r, 'timestamp'),
      source_record_id: field(r, 'source_record_id'),
    },
  })));
}

const ADAPTERS = {
  support_tickets: { source: 'support_ticket_import', channel: 'support_ticket' },
  app_store: { source: 'app_store_import', channel: 'app_review' },
  social: { source: 'social_import', channel: 'social' },
  contact_center: { source: 'contact_center_import', channel: 'call_transcript' },
};

// Simulated adapters: they normalise a supplied payload and do not call any real platform.
export function importExternal(platform, records) {
  const adapter = ADAPTERS[platform];
  if (!adapter) throw notFound(`Adapter ${platform}`);
  return ingestMany(adapter.source, records.map((r, i) => ({
    row: i + 1,
    input: { ...adapter, source_record_id: r.id, text: r.text, rating: r.rating, customer_id: r.customer_id, order_id: r.order_id, timestamp: r.timestamp, metadata: { simulated_adapter: platform } },
  })));
}

export async function storeOperationalEvent(body) {
  const b = operationalEventBody.parse(body);
  const when = b.event_timestamp ? new Date(b.event_timestamp) : await simNow();
  const res = await query(
    `INSERT INTO operational_events (event_type, event_timestamp, customer_id, order_id, payment_status, payment_method, amount, platform, device_os, app_version, city, metadata,
       bank, payment_gateway, psp_app, os, os_version, device_model, network_type, http_status, latency_ms, error_code)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [b.event_type, when, await customerIdFor(b.customer_id), b.order_id ?? null, b.payment_status ?? null, b.payment_method ?? null, b.amount ?? null,
      b.platform ?? null, b.device_os ?? null, b.app_version ?? null, b.city ?? null, json(b.metadata),
      b.bank ?? null, b.payment_gateway ?? null, b.psp_app ?? null, b.os ?? null, b.os_version ?? null, b.device_model ?? null, b.network_type ?? null,
      b.http_status ?? null, b.latency_ms ?? null, b.error_code ?? null],
  );
  return { id: res.insertId };
}

async function applyExtractions(results) {
  for (const r of results) {
    const extraction = {
      component: r.component, pain_point: r.pain_point, financial_loss: r.financial_loss, actionable: r.actionable,
      reference: r.reference, summary: r.summary, extractor: r.extractor, intent: r.intent, intent_confidence: r.intent_confidence,
    };
    await query(
      `UPDATE feedback SET category=?, sentiment=?, urgency=?, language=?, processing_status='processed',
       metadata=JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.extraction', CAST(? AS JSON)) WHERE id=?`,
      [r.category, r.sentiment, r.urgency, r.language, JSON.stringify(extraction), r.feedback_id],
    );
  }
}

export async function analyzeFeedback(ids, mode = 'rules', domain = 'payments') {
  const { results } = await callAi('/internal/feedback/analyze', { feedback_ids: ids, mode, domain });
  await applyExtractions(results);
  return results.length;
}

export async function processJob(job) {
  const ids = (typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload)?.feedback_ids ?? [];
  await query("UPDATE ingestion_jobs SET status='running', attempts=attempts+1 WHERE id=? AND status IN ('pending','retry')", [job.id]);
  try {
    // New records may use the LLM; bulk imports stay on rules to respect the budget.
    const processed = await analyzeFeedback(ids, ids.length <= LLM_BATCH_LIMIT ? 'llm' : 'rules');
    await query("UPDATE ingestion_jobs SET status='completed', processed_records=?, completed_at=? WHERE id=?", [processed, new Date(), job.id]);
  } catch (err) {
    const attempts = job.attempts + 1;
    const status = attempts >= MAX_JOB_ATTEMPTS ? 'failed' : 'retry';
    await query('UPDATE ingestion_jobs SET status=?, error_summary=? WHERE id=?', [status, json({ message: err.message, attempts }), job.id]);
    if (status === 'failed' && ids.length) await query("UPDATE feedback SET processing_status='failed' WHERE id IN (?)", [ids]);
  }
}

export async function processPendingJobs(limit = 5) {
  const jobs = await query("SELECT * FROM ingestion_jobs WHERE status IN ('pending','retry') ORDER BY id LIMIT ?", [limit]);
  for (const job of jobs) await processJob(job);
  return jobs.length;
}

// Used by on-demand detection so the demo never waits for the background worker.
export async function drainPendingFeedback(domain = 'payments') {
  let total = 0;
  for (;;) {
    const rows = await query("SELECT id FROM feedback WHERE processing_status='pending' AND domain=? ORDER BY id LIMIT ?", [domain, BULK_BATCH]);
    if (!rows.length) return total;
    const processed = await analyzeFeedback(rows.map((r) => r.id), 'rules', domain);
    if (!processed) throw new ApiError(502, 'AI_SERVICE_ERROR', 'AI service analysed no feedback');
    total += processed;
  }
}
