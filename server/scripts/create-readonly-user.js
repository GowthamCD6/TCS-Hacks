// Creates the read-only database user for the AI service and writes AI_DB_URL to ai_services/.env.
// Usage: node scripts/create-readonly-user.js <username>
// TiDB Cloud usernames need the cluster prefix, which is taken from DB_USER automatically.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../src/config/env.js';
import { closePool, query } from '../src/repositories/db.js';

const prefix = env.DB_USER.includes('.') ? `${env.DB_USER.split('.')[0]}.` : '';
const username = `${prefix}${process.argv[2] ?? 'recoveriq_ro'}`;
const password = crypto.randomBytes(18).toString('hex');

await query('CREATE USER IF NOT EXISTS ?@\'%\' IDENTIFIED BY ?', [username, password]);
await query('ALTER USER ?@\'%\' IDENTIFIED BY ?', [username, password]);
await query(`GRANT SELECT ON \`${env.DB_NAME}\`.* TO ?@'%'`, [username]);

const file = path.join(env.repoRoot, 'ai_services', '.env');
const url = `mysql://${encodeURIComponent(username)}:${password}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter((l) => !l.startsWith('AI_DB_URL=')) : [];
fs.writeFileSync(file, [...existing.filter(Boolean), `AI_DB_URL=${url}`, ''].join('\n'));
console.log(`Read-only user ready. AI_DB_URL written to ai_services/.env (password not shown).`);
await closePool();
