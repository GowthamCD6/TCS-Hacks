// Loads the generated synthetic dataset. Additive and idempotent: existing records are never removed.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { closePool, json, query } from '../src/repositories/db.js';
import { setSimNow } from '../src/services/clock.js';
import { seedKpiDefinitions } from '../src/services/kpi.js';

const dir = path.join(env.repoRoot, 'ai_services', 'data', 'synthetic');
const BATCH = 1000;
const FUNNEL_COLS = ['bank', 'payment_gateway', 'psp_app', 'os', 'os_version', 'device_model', 'network_type'];

if (!fs.existsSync(path.join(dir, 'meta.json'))) {
  console.error('No dataset found. Generate it first from the repo root: python -m ai_services.synthetic.generate');
  process.exit(1);
}

async function* batches(name) {
  const lines = readline.createInterface({ input: fs.createReadStream(path.join(dir, `${name}.jsonl`)) });
  let batch = [];
  for await (const line of lines) {
    batch.push(JSON.parse(line));
    if (batch.length === BATCH) { yield batch; batch = []; }
  }
  if (batch.length) yield batch;
}

const ts = (v) => (v ? new Date(v) : null);
const insert = (table, cols, rows) => query(`INSERT IGNORE INTO ${table} (${cols.join(',')}) VALUES ?`, [rows]);

let count = 0;
for await (const b of batches('customers')) {
  await insert('customers', ['external_customer_id', 'city', 'customer_segment', 'platform', 'device_os', 'app_version', 'first_order_at', 'is_synthetic'],
    b.map((c) => [c.external_customer_id, c.city, c.customer_segment, c.platform, c.device_os, c.app_version, ts(c.first_order_at), 1]));
  count += b.length;
}
console.log(`customers ${count}`);
const ids = new Map((await query('SELECT id, external_customer_id FROM customers WHERE is_synthetic = 1')).map((r) => [r.external_customer_id, r.id]));

for (const r of JSON.parse(`[${fs.readFileSync(path.join(dir, 'releases.jsonl'), 'utf8').trim().split('\n').join(',')}]`)) {
  await query('INSERT IGNORE INTO product_releases (version, platform, release_timestamp, description, changes, is_synthetic) VALUES (?,?,?,?,?,1)',
    [r.version, r.platform, ts(r.release_timestamp), r.description, json(r.changes)]);
}

count = 0;
for await (const b of batches('orders')) {
  await insert('orders', ['external_order_id', 'customer_id', 'status', 'amount', 'payment_method', 'platform', 'device_os', 'app_version', 'city', 'ordered_at', 'is_synthetic', ...FUNNEL_COLS],
    b.map((o) => [o.external_order_id, ids.get(o.customer_ref), o.status, o.amount, o.payment_method, o.platform, o.device_os, o.app_version, o.city, ts(o.ordered_at), 1, ...FUNNEL_COLS.map((k) => o[k] ?? null)]));
  count += b.length;
}
console.log(`orders ${count}`);

// Events have no natural unique key, so they are loaded once.
const [{ existing }] = await query("SELECT COUNT(*) existing FROM operational_events WHERE is_synthetic = 1 AND event_type = 'order_draft_created'");
if (!existing) await query("DELETE FROM operational_events WHERE is_synthetic = 1 AND order_id LIKE 'SYN-%'");
count = 0;
if (!existing) {
  for await (const b of batches('events')) {
    await insert('operational_events', ['event_type', 'event_timestamp', 'customer_id', 'order_id', 'payment_status', 'payment_method', 'amount', 'platform', 'device_os', 'app_version', 'city', 'metadata', 'is_synthetic', ...FUNNEL_COLS, 'http_status', 'latency_ms', 'error_code'],
      b.map((e) => [e.event_type, ts(e.event_timestamp), ids.get(e.customer_ref) ?? null, e.order_id ?? null, e.payment_status ?? null, e.payment_method ?? null, e.amount ?? null, e.platform ?? null, e.device_os ?? null, e.app_version ?? null, e.city ?? null, json(e.metadata), 1, ...FUNNEL_COLS.map((k) => e[k] ?? null), e.http_status ?? null, e.latency_ms ?? null, e.error_code ?? null]));
    count += b.length;
  }
}
console.log(`events ${count}${existing ? ' (already loaded)' : ''}`);

count = 0;
for await (const b of batches('feedback')) {
  await insert('feedback', ['source', 'source_record_id', 'customer_id', 'order_id', 'channel', 'rating', 'text', 'language', 'metadata', 'event_timestamp', 'is_synthetic'],
    b.map((f) => [f.source, f.source_record_id, ids.get(f.customer_ref) ?? null, f.order_id, f.channel, f.rating, f.text, f.language, json(f.metadata), ts(f.event_timestamp), 1]));
  count += b.length;
}
console.log(`feedback ${count}`);

await seedKpiDefinitions();
await setSimNow(new Date(JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')).sim_now));
if (env.DEMO_APPROVER_PASSWORD) {
  await query('INSERT INTO users (email, password_hash, display_name, role) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)',
    [env.DEMO_APPROVER_EMAIL, await bcrypt.hash(env.DEMO_APPROVER_PASSWORD, 10), 'Demo Approver', 'approver']);
  console.log('approver user ready');
} else {
  console.log('DEMO_APPROVER_PASSWORD is not set, so no approver user was created');
}
await closePool();
console.log('Seed complete. All seeded data is synthetic.');
