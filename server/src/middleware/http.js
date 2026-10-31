import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function requestContext(req, res, next) {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const started = Date.now();
  res.on('finish', () => logger.info({ requestId: req.id, method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - started }, 'request'));
  next();
}

export function ok(req, res, data, { status = 200, pagination } = {}) {
  res.status(status).json({ success: true, data, meta: { requestId: req.id, ...(pagination ? { pagination } : {}) } });
}

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new ApiError(422, 'VALIDATION_ERROR', 'Request validation failed',
      result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))));
  }
  req.valid = { ...req.valid, [source]: result.data };
  return next();
};

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status ?? (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) logger.error({ requestId: req.id, code: err.code, message: err.message }, 'request failed');
  res.status(status).json({
    success: false,
    error: {
      code: err instanceof ApiError ? err.code : status === 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
      message: status === 500 ? 'Internal server error' : err.message,
      ...(err.details ? { details: err.details } : {}),
    },
    meta: { requestId: req.id },
  });
}

const limiter = (max) => rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' }, meta: { requestId: req.id },
  }),
});
export const apiLimiter = limiter(env.RATE_LIMIT_MAX_REQUESTS);
export const publicLimiter = limiter(env.STUDENT_RATE_LIMIT_MAX);

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
}).passthrough();

export const pagination = (page, pageSize, total) => ({ page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) });
