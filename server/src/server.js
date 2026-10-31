import { createApp } from './app.js';
import { env } from './config/env.js';
import { startWorker } from './jobs/worker.js';
import { logger } from './utils/logger.js';

createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT, mock: env.MOCK_MODE }, 'RecoverIQ API listening');
  if (env.WORKER_ENABLED && !env.MOCK_MODE) startWorker();
});
