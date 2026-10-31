import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: 8,
      timezone: 'Z',
      decimalNumbers: true,
      ssl: env.DB_SSL ? { ca: fs.readFileSync(path.resolve(env.serverRoot, env.DB_SSL_CA)), minVersion: 'TLSv1.2' } : undefined,
    });
  }
  return pool;
}

export const query = async (sql, params = [], conn = null) => (await (conn ?? getPool()).query(sql, params))[0];
export const one = async (sql, params = [], conn = null) => (await query(sql, params, conn))[0] ?? null;

export async function tx(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export const json = (value) => (value === undefined || value === null ? null : JSON.stringify(value));
export const parseJson = (value) => (typeof value === 'string' ? JSON.parse(value) : value);
export const closePool = async () => { if (pool) { await pool.end(); pool = null; } };
