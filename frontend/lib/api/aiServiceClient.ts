/**
 * Shared fetch helper for the standalone ai-service (FastAPI, default
 * :8000) — separate from the Nest `api` client in ./client.ts, which is
 * Nest-specific (Bearer auth, {data} envelope). ai-service has no auth and
 * returns plain JSON. gaitClient.ts and activityClient.ts both build on
 * this rather than each rolling their own fetch/error handling.
 */

export const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? 'http://localhost:8000';

export class AiServiceApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AiServiceApiError';
  }
}

interface FastApiErrorBody {
  detail?: string | { msg?: string }[];
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as FastApiErrorBody;
    if (Array.isArray(body.detail)) return body.detail.map((d) => d.msg ?? JSON.stringify(d)).join(', ');
    if (body.detail) return body.detail;
  } catch {
    // no JSON body
  }
  return res.statusText || `Request failed with status ${res.status}`;
}

export async function aiServiceRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${AI_SERVICE_URL}${path}`, init);
  } catch {
    throw new AiServiceApiError(
      0,
      `Could not reach the ai-service at ${AI_SERVICE_URL} — is it running? (docker compose up ai-service)`,
    );
  }
  if (!res.ok) {
    throw new AiServiceApiError(res.status, await parseErrorMessage(res));
  }
  return res.json() as Promise<T>;
}

export type AlertKind = 'gait_watch' | 'suspicious_activity';
export type AlertSeverity = 'warning' | 'critical';

export interface Alert {
  id: string;
  timestamp: string;
  kind: AlertKind;
  label: string;
  severity: AlertSeverity;
  message: string;
  metadata: Record<string, unknown>;
}

export const alertsApi = {
  list: () => aiServiceRequest<{ alerts: Alert[] }>('/alerts'),
};
