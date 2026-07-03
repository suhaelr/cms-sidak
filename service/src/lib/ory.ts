import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../config';
import type { AppRole } from '../db/schema';
import { extractSsoRoles, flattenIdentityClaims, mapSsoRolesToAppRoles } from './ory-roles';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/** OAuth2 server base URL derived from authorization endpoint or explicit SSO URL. */
export function getOrySsoUrl(): string {
  if (env.ORY_AUTHORIZATION_ENDPOINT) {
    const url = new URL(env.ORY_AUTHORIZATION_ENDPOINT);
    const path = url.pathname.replace(/\/oauth2\/auth\/?$/, '');
    return `${url.origin}${path}`.replace(/\/$/, '');
  }
  const url = env.ORY_SSO_URL || env.ORY_HYDRA_PUBLIC_URL;
  return url?.replace(/\/$/, '') || '';
}

export function getOryAuthorizationEndpoint(): string {
  if (env.ORY_AUTHORIZATION_ENDPOINT) return env.ORY_AUTHORIZATION_ENDPOINT;
  const base = getOrySsoUrl();
  return base ? `${base}/oauth2/auth` : '';
}

export function getOryIntrospectionUrl(): string {
  if (env.ORY_TOKEN_INTROSPECTION_URL) return env.ORY_TOKEN_INTROSPECTION_URL;
  const base = getOrySsoUrl();
  return base ? `${base}/oauth2/introspect` : '';
}

export function getOryTokenUrl(): string {
  const base = getOrySsoUrl();
  return base ? `${base}/oauth2/token` : '';
}

function getUserinfoUrl(): string {
  const base = getOrySsoUrl();
  return base ? `${base}/userinfo` : '';
}

function getJwksUrl(): string {
  if (env.ORY_JWKS_URL) return env.ORY_JWKS_URL;
  const base = getOrySsoUrl();
  return base ? `${base}/.well-known/jwks.json` : '';
}

function getJwks() {
  const jwksUrl = getJwksUrl();
  if (!jwksUrl) return null;
  if (!jwks) jwks = createRemoteJWKSet(new URL(jwksUrl));
  return jwks;
}

export interface OryTokenPayload extends JWTPayload {
  sub?: string;
  email?: string;
  name?: string;
  appRoles?: AppRole[];
}

function mergeClaims(...sources: Array<Record<string, unknown> | null | undefined>): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const src of sources) {
    if (src) Object.assign(merged, src);
  }
  return merged;
}

function toOryPayload(claims: Record<string, unknown>): OryTokenPayload | null {
  const flat = flattenIdentityClaims(claims);
  const sub = typeof flat.sub === 'string' ? flat.sub : undefined;
  if (!sub) return null;

  const email =
    (typeof flat.email === 'string' && flat.email) ||
    (typeof flat.preferred_username === 'string' && flat.preferred_username) ||
    undefined;
  const name = typeof flat.name === 'string' ? flat.name : undefined;
  const appRoles = mapSsoRolesToAppRoles(extractSsoRoles(flat));

  return { sub, email, name, appRoles, ...flat };
}

async function fetchUserInfo(token: string): Promise<Record<string, unknown> | null> {
  const userinfoUrl = getUserinfoUrl();
  if (!userinfoUrl) return null;

  const res = await fetch(userinfoUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  return (await res.json()) as Record<string, unknown>;
}

async function introspectToken(token: string): Promise<Record<string, unknown> | null> {
  const introspectionUrl = getOryIntrospectionUrl();
  if (!introspectionUrl || !env.ORY_OIDC_CLIENT_ID || !env.ORY_OIDC_CLIENT_SECRET) {
    return null;
  }

  const body = new URLSearchParams({
    token,
    client_id: env.ORY_OIDC_CLIENT_ID,
    client_secret: env.ORY_OIDC_CLIENT_SECRET,
  });

  const res = await fetch(introspectionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) return null;

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('json')) return null;

  const data = (await res.json()) as Record<string, unknown> & { active?: boolean; sub?: string };
  if (!data.active || !data.sub) return null;

  return data;
}

export async function verifyOryToken(token: string): Promise<OryTokenPayload | null> {
  let jwtClaims: Record<string, unknown> | null = null;

  const jwksSet = getJwks();
  if (jwksSet) {
    try {
      const { payload } = await jwtVerify(token, jwksSet, {
        issuer: getOrySsoUrl() || undefined,
      });
      jwtClaims = payload as Record<string, unknown>;
    } catch {
      // opaque token or invalid JWT — try other methods
    }
  }

  const introspected = await introspectToken(token);
  const userinfo = await fetchUserInfo(token);
  const claims = mergeClaims(jwtClaims, introspected, userinfo);

  return toOryPayload(claims);
}

export function isOryConfigured(): boolean {
  return !!(
    getOryAuthorizationEndpoint() &&
    env.ORY_OIDC_CLIENT_ID &&
    env.ORY_OIDC_CLIENT_SECRET
  );
}

export function getOryConfig() {
  return {
    authorizationEndpoint: getOryAuthorizationEndpoint(),
    clientId: env.ORY_OIDC_CLIENT_ID || '',
    redirectUri: env.ORY_OIDC_REDIRECT_URI,
    scopes: 'openid profile email offline_access roles',
    enabled: isOryConfigured(),
  };
}

export interface OryTokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeOryRefreshToken(refreshToken: string): Promise<OryTokenResponse> {
  const tokenUrl = getOryTokenUrl();
  if (!tokenUrl || !env.ORY_OIDC_CLIENT_ID) {
    return { error: 'Ory SSO not configured' };
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: env.ORY_OIDC_CLIENT_ID,
  });
  if (env.ORY_OIDC_CLIENT_SECRET) {
    params.set('client_secret', env.ORY_OIDC_CLIENT_SECRET);
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const tokenData = (await res.json()) as OryTokenResponse;
  if (!res.ok) {
    return {
      error: tokenData.error_description || tokenData.error || 'Ory token refresh failed',
    };
  }
  return tokenData;
}
