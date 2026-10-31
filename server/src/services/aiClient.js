import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

export async function callAi(path, body) {
  let res;
  try {
    res = await fetch(`${env.AI_SERVICE_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Service-Token': env.AI_SERVICE_TOKEN },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(env.AI_TIMEOUT_MS),
    });
  } catch (err) {
    throw new ApiError(503, 'AI_SERVICE_UNAVAILABLE', `AI service unreachable (${err.name})`);
  }
  if (!res.ok) throw new ApiError(502, 'AI_SERVICE_ERROR', `AI service returned ${res.status} for ${path}`);
  return res.json();
}

export async function aiHealth() {
  try {
    const res = await fetch(`${env.AI_SERVICE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok ? await res.json() : { status: 'unhealthy' };
  } catch {
    return { status: 'unreachable' };
  }
}
