import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

const safeEqual = (a, b) => {
  const x = Buffer.from(a ?? '');
  const y = Buffer.from(b ?? '');
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
};

export function requireApprover(req, _res, next) {
  if (safeEqual(req.get('x-owner-token'), env.OWNER_API_TOKEN)) {
    req.actor = { type: 'service', id: 'owner-token', name: 'Owner token' };
    return next();
  }
  const header = req.get('authorization') ?? '';
  if (header.startsWith('Bearer ') && env.JWT_SECRET) {
    try {
      const claims = jwt.verify(header.slice(7), env.JWT_SECRET);
      req.actor = { type: 'user', id: claims.sub, name: claims.name };
      return next();
    } catch { /* falls through to 401 */ }
  }
  return next(new ApiError(401, 'UNAUTHORIZED', 'Approver authentication required'));
}

export function requireWebhookToken(req, _res, next) {
  if (safeEqual(req.get('x-webhook-token'), env.WEBHOOK_TOKEN)) return next();
  return next(new ApiError(401, 'UNAUTHORIZED', 'Invalid webhook token'));
}
