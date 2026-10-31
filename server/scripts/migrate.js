// Applies additive migrations. Aborts if a RecoverIQ table name already exists with a different shape.
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../src/config/env.js';
import { closePool, query } from '../src/repositories/db.js';

const dir = path.join(env.serverRoot, 'db', 'migrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const stripComments = (sql) => sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');

await query(`CREATE TABLE IF NOT EXISTS recoveriq_migrations (
  name VARCHAR(128) PRIMARY KEY, applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3))`);
const applied = new Set((await query('SELECT name FROM recoveriq_migrations')).map((r) => r.name));
const pending = files.filter((f) => !applied.has(f));

for (const file of pending) {
  const statements = stripComments(fs.readFileSync(path.join(dir, file), 'utf8')).split(/;\s*$/m).map((s) => s.trim()).filter(Boolean);
  const existing = new Set((await query('SHOW TABLES')).map((r) => Object.values(r)[0]));
  const collisions = statements.map((s) => /CREATE TABLE IF NOT EXISTS (\w+)/.exec(s)?.[1]).filter((t) => t && existing.has(t));
  if (collisions.length && !process.argv.includes('--allow-existing')) {
    console.error(`Aborting ${file}: these tables already exist and were not created by RecoverIQ: ${collisions.join(', ')}`);
    console.error('Nothing was changed. Inspect them, then re-run with --allow-existing only if they are compatible.');
    process.exitCode = 1;
    break;
  }
  for (const statement of statements) await query(statement);
  await query('INSERT INTO recoveriq_migrations (name) VALUES (?)', [file]);
  console.log(`applied ${file} (${statements.length} statements)`);
}
if (!pending.length) console.log('no pending migrations');
await closePool();
