const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export type AppRole = 'super_admin' | 'admin_pusat' | 'admin_wilayah' | 'inspektor' | 'verifikator';

export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  auth_provider?: string;
  roles: AppRole[];
}

const TOKEN_KEY = 'sidak_access_token';
const REFRESH_KEY = 'sidak_refresh_token';
const ORY_TOKEN_KEY = 'sidak_ory_access_token';
const ORY_REFRESH_KEY = 'sidak_ory_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getOryAccessToken(): string | null {
  return localStorage.getItem(ORY_TOKEN_KEY);
}

export function getOryRefreshToken(): string | null {
  return localStorage.getItem(ORY_REFRESH_KEY);
}

export function setTokens(
  accessToken: string,
  refreshToken?: string,
  oryAccessToken?: string,
  oryRefreshToken?: string,
) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (oryAccessToken) localStorage.setItem(ORY_TOKEN_KEY, oryAccessToken);
  if (oryRefreshToken) localStorage.setItem(ORY_REFRESH_KEY, oryRefreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ORY_TOKEN_KEY);
  localStorage.removeItem(ORY_REFRESH_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function getTokenExp(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

export function isTokenExpiringSoon(token: string | null, bufferSec = 90): boolean {
  if (!token) return true;
  const exp = getTokenExp(token);
  if (!exp) return false;
  return exp * 1000 <= Date.now() + bufferSec * 1000;
}

type RefreshResponse = {
  accessToken: string;
  oryAccessToken?: string;
  oryRefreshToken?: string;
  error?: string;
};

let refreshPromise: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const body = { refreshToken };

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as RefreshResponse;
      if (!res.ok || !data.accessToken) {
        clearTokens();
        return false;
      }

      setTokens(data.accessToken, refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function ensureFreshTokens(): Promise<boolean> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) return true;

  if (!isTokenExpiringSoon(accessToken)) return true;
  return refreshSession();
}

function isAuthError(status: number, message: string): boolean {
  if (status === 401) return true;
  return /token is expired|access credentials are invalid|unauthorized/i.test(message);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean; _retried?: boolean } = {},
): Promise<T> {
  const { auth = true, _retried = false, ...init } = options;

  if (auth) {
    await ensureFreshTokens();
  }

  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  const message = (data as { error?: string }).error || `Request failed: ${res.status}`;

  if (!res.ok) {
    if (auth && !_retried && isAuthError(res.status, message)) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiFetch<T>(path, { ...options, _retried: true });
      }
    }
    throw new Error(message);
  }

  return data as T;
}

export async function regionApiFetch<T = unknown>(path: string): Promise<T> {
  return apiFetch<T>(path, { auth: false });
}

export const regionApi = {
  get: <T>(path: string) => regionApiFetch<T>(path),
};

export const api = {
  get: <T>(path: string, auth = true) => apiFetch<T>(path, { auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, auth }),
  patch: <T>(path: string, body: unknown, auth = true) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), auth }),
  delete: <T>(path: string, auth = true) => apiFetch<T>(path, { method: 'DELETE', auth }),
  upload: async (file: File, folder: string, isPublic = false): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    if (isPublic) form.append('public', 'true');
    return apiFetch('/uploads', { method: 'POST', body: form, auth: !isPublic });
  },
};

export async function getOryConfig() {
  return api.get<{
    enabled: boolean;
    authorizationEndpoint?: string;
    issuer?: string;
    clientId?: string;
    redirectUri?: string;
    scopes?: string;
  }>('/auth/ory/config', false);
}

export async function exchangeOryCode(code: string, codeVerifier: string, redirectUri?: string) {
  return api.post<{
    accessToken?: string;
    oryAccessToken?: string;
    oryRefreshToken?: string;
    refreshToken?: string;
    user?: ApiUser;
    error?: string;
  }>(
    '/auth/ory/callback',
    { code, codeVerifier, redirectUri },
    false,
  );
}
