import { json, query } from '../repositories/db.js';

export const audit = (actor, action, resourceType, resourceId, details, conn) => query(
  'INSERT INTO audit_logs (actor_type, actor_id, action, resource_type, resource_id, details) VALUES (?,?,?,?,?,?)',
  [actor?.type ?? 'system', actor?.id ?? null, action, resourceType, resourceId == null ? null : String(resourceId), json(details)], conn,
);
