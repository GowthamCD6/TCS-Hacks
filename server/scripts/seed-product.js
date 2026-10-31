// Loads the product domain dataset. Generate it first: python -m ai_services.synthetic.product
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../src/config/env.js';
import { closePool, json, query } from '../src/repositories/db.js';
import { seedKpiDefinitions } from '../src/services/kpi.js';

const dir = path.join(env.repoRoot, 'ai_services', 'data', 'synthetic_product');
const read = (name) => fs.readFileSync(path.join(dir, `${name}.jsonl`), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const ts = (v) => (v ? new Date(v) : null);

async function load(table, cols, rows) {
  for (let i = 0; i < rows.length; i += 1000) await query(`INSERT IGNORE INTO ${table} (${cols.join(',')}) VALUES ?`, [rows.slice(i, i + 1000)]);
  console.log(`${table} ${rows.length}`);
}

if (!fs.existsSync(path.join(dir, 'meta.json'))) {
  console.error('No dataset found. Run: python -m ai_services.synthetic.product');
  process.exit(1);
}
await load('product_batches', ['batch_id', 'supplier', 'started_at', 'units_produced', 'units_sold'], read('batches').map((b) => [b.batch_id, b.supplier, ts(b.started_at), b.units_produced, b.units_sold]));
await load('product_orders', ['order_id', 'batch_id', 'supplier', 'city', 'order_date', 'delivery_date', 'buyer_type', 'campaign_id', 'firmware', 'courier_incident', 'price'],
  read('orders').map((o) => [o.order_id, o.batch_id, o.supplier, o.city, ts(o.order_date), ts(o.delivery_date), o.buyer_type, o.campaign_id, o.firmware, o.courier_incident, o.price]));
await load('product_firmware_releases', ['version', 'released_at'], read('firmware_releases').map((f) => [f.version, ts(f.released_at)]));
await load('product_campaigns', ['campaign_id', 'name', 'started_at', 'ended_at'], read('campaigns').map((c) => [c.campaign_id, c.name, ts(c.started_at), ts(c.ended_at)]));
await query('DELETE FROM product_returns');
await query('DELETE FROM product_tickets');
await query('DELETE FROM product_courier_incidents');
await load('product_returns', ['order_id', 'reason_code', 'returned_at'], read('returns').map((r) => [r.order_id, r.reason_code, ts(r.returned_at)]));
await load('product_tickets', ['order_id', 'topic', 'text', 'opened_at'], read('tickets').map((t) => [t.order_id, t.topic, t.text, ts(t.opened_at)]));
await load('product_courier_incidents', ['incident_ref', 'city', 'started_at', 'ended_at'], read('courier_incidents').map((c) => [c.incident_ref, c.city, ts(c.started_at), ts(c.ended_at)]));
await load('feedback', ['source', 'source_record_id', 'order_id', 'channel', 'rating', 'text', 'metadata', 'event_timestamp', 'is_synthetic', 'domain'],
  read('feedback').map((f) => ['product_review', f.source_record_id, f.order_id, 'marketplace_review', f.rating, f.text, json(f.metadata), ts(f.event_timestamp), 1, 'product']));
await seedKpiDefinitions();
await closePool();
console.log('Product seed complete. Orders, returns and tickets are synthetic.');
