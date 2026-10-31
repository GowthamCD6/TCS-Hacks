import { env } from '../config/env.js';
import { processPendingJobs } from '../services/ingestion.js';
import { logger } from '../utils/logger.js';

// Database-backed queue: jobs survive restarts because their state lives in ingestion_jobs.
export function startWorker() {
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      await processPendingJobs();
    } catch (err) {
      logger.warn({ message: err.message }, 'worker tick failed');
    } finally {
      busy = false;
    }
  }, env.WORKER_INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
}
