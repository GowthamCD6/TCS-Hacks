// MOCK_MODE: serves recorded responses from src/mocks so the UI can run with no database or AI service.
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { env } from '../config/env.js';
import { ok } from '../middleware/http.js';

const dir = path.join(env.serverRoot, 'src', 'mocks');

export function mockRouter() {
  const router = Router();
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  for (const entry of manifest) {
    const body = JSON.parse(fs.readFileSync(path.join(dir, entry.file), 'utf8'));
    router[entry.method.toLowerCase()](entry.route, (req, res) => ok(req, res, body.data, { status: entry.status ?? 200, pagination: body.pagination }));
  }
  return router;
}
