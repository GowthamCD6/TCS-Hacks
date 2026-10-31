// Explicit reset: removes synthetic incidents and scenario rows, then rewinds the simulated clock.
import { closePool } from '../src/repositories/db.js';
import { resetDemo } from '../src/services/demo.js';

if (process.env.DEMO_RESET_CONFIRM !== 'yes') {
  console.error('Refusing to reset. Set DEMO_RESET_CONFIRM=yes to delete synthetic incidents and scenario rows.');
  process.exit(1);
}
console.log(await resetDemo({ type: 'system', id: 'demo-reset-script' }));
await closePool();
