import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: process.env.ENV_FILE || path.join(serverRoot, '.env'), quiet: true });

const bool = (fallback) => z.string().optional().transform((v) => (v === undefined ? fallback : v === 'true'));

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.string().default('development'),
  LOG_LEVEL: z.string().default('info'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  AI_SERVICE_TOKEN: z.string().default(''),
  AI_TIMEOUT_MS: z.coerce.number().default(180000),
  MOCK_MODE: bool(false),
  JWT_SECRET: z.string().default(''),
  JWT_EXPIRES_IN: z.string().default('12h'),
  OWNER_API_TOKEN: z.string().default(''),
  WEBHOOK_TOKEN: z.string().default(''),
  DEMO_APPROVER_EMAIL: z.string().default('approver@recoveriq.demo'),
  DEMO_APPROVER_PASSWORD: z.string().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120),
  STUDENT_RATE_LIMIT_MAX: z.coerce.number().default(60),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default(''),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default(''),
  DB_SSL: bool(false),
  DB_SSL_CA: z.string().default('isrgrootx1.pem'),
  WORKER_ENABLED: bool(true),
  WORKER_INTERVAL_MS: z.coerce.number().default(5000),
  PYTHON_BIN: z.string().default('python'),
});

const parsed = schema.parse(process.env);
export const env = { ...parsed, serverRoot, repoRoot: path.resolve(serverRoot, '..') };
