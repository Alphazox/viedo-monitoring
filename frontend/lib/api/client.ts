import type { TokenResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';
const REFRESH_TOKEN_STORAGE_KEY = 'video-analytics.refreshToken';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// In-memory only — never persisted, so a page reload always re-derives it
// from a refresh-token exchange rather than trusting stale localStorage.
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** AuthProvider registers a callback here to react to an un-recoverable 401 (e.g. redirect to /login). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function storeRefreshToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

async function rawFetch(path: string, init: RequestInit, token: string | null): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

async function refreshAccessToken(): Promise<string | null> {
  const storedRefresh = getStoredRefreshToken();
  if (!storedRefresh) return null;

  const res = await rawFetch(
    '/auth/refresh',
    { method: 'POST', body: JSON.stringify({ refreshToken: storedRefresh }) },
    null,
  );
  if (!res.ok) {
    storeRefreshToken(null);
    return null;
  }

  const { data } = (await res.json()) as { data: TokenResponse };
  accessToken = data.accessToken;
  storeRefreshToken(data.refreshToken);
  return data.accessToken;
}

interface ApiErrorBody {
  message?: string | string[];
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (body.message) return body.message;
  } catch {
    // no JSON body
  }
  return res.statusText || `Request failed with status ${res.status}`;
}

const PUBLIC_PATHS = new Set(['/auth/login', '/auth/refresh']);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, init, accessToken);

  if (res.status === 401 && !PUBLIC_PATHS.has(path)) {
    refreshInFlight ??= refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
    const refreshed = await refreshInFlight;

    if (refreshed) {
      res = await rawFetch(path, init, refreshed);
    } else {
      onUnauthorized?.();
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

function withQuery(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | number | boolean | undefined>) =>
    request<T>(withQuery(path, query)),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * A plain <video>/hls.js request can't attach an Authorization header and
 * can't recover from a 401 the way `request()` does — the token gets baked
 * into the URL once, up front. Access tokens only live 15 minutes, so call
 * this right before building any media URL to mint a fresh one; otherwise a
 * player opened after the token's silently expired just shows a black frame
 * with no error, since the browser never surfaces *why* the request failed.
 */
export async function ensureFreshAccessToken(): Promise<void> {
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    throw new ApiError(401, 'Your session has expired — please sign in again.');
  }
}

/**
 * Appends the in-memory access token as a query param — the only way a plain
 * <video> tag or hls.js's playlist/segment requests can authenticate, since
 * neither can attach an Authorization header. The API's JwtStrategy accepts
 * this as a fallback (see backend auth/strategies/jwt.strategy.ts).
 */
export function withAccessToken(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const qs = withQuery(path, query);
  const sep = qs.includes('?') ? '&' : '?';
  return `${API_BASE_URL}${qs}${sep}access_token=${encodeURIComponent(accessToken ?? '')}`;
}

/** Multipart upload via XHR (not fetch) so onProgress can report upload percentage. */
export function uploadFile<T>(
  path: string,
  file: File,
  query: Record<string, string | undefined> = {},
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${withQuery(path, query)}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    }
    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((JSON.parse(xhr.responseText) as { data: T }).data);
        return;
      }
      let message = xhr.statusText || `Request failed with status ${xhr.status}`;
      try {
        const body = JSON.parse(xhr.responseText) as ApiErrorBody;
        if (Array.isArray(body.message)) message = body.message.join(', ');
        else if (body.message) message = body.message;
      } catch {
        // no JSON body
      }
      reject(new ApiError(xhr.status, message));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}
