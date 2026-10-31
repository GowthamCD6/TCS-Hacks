import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: ['password', 'token', 'authorization', 'email', 'phone', 'text', '*.password', '*.token', '*.email', '*.phone', '*.text'],
    censor: '[redacted]',
  },
});
