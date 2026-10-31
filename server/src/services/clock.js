import { one, query } from '../repositories/db.js';

export async function simNow(conn) {
  const row = await one('SELECT sim_now FROM sim_clock WHERE id = 1', [], conn);
  return row?.sim_now ?? new Date();
}

export const setSimNow = (ts, conn) => query(
  'INSERT INTO sim_clock (id, sim_now) VALUES (1, ?) ON DUPLICATE KEY UPDATE sim_now = VALUES(sim_now)', [ts], conn,
);
