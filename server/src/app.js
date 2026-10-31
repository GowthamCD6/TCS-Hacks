import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiLimiter, errorHandler, notFoundHandler, ok, requestContext, wrap } from './middleware/http.js';
import { query } from './repositories/db.js';
import { mockRouter } from './routes/mock.js';
import { router as v1 } from './routes/v1.js';
import { aiHealth } from './services/aiClient.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((o) => o.trim()), credentials: true }));
  app.use(requestContext);
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', wrap(async (req, res) => {
    if (env.MOCK_MODE) return ok(req, res, { status: 'ok', mock_mode: true });
    let db = 'ok';
    try { await query('SELECT 1'); } catch { db = 'unreachable'; }
    return ok(req, res, { status: db === 'ok' ? 'ok' : 'degraded', mock_mode: false, database: db, ai_service: (await aiHealth()).status });
  }));

  app.use('/api/v1', apiLimiter, env.MOCK_MODE ? mockRouter() : v1);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
