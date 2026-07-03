import { env } from '../config';
import { getOryTokenUrl } from './ory';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;
let inflight: Promise<string> | null = null;

const EXPIRY_BUFFER_MS = 60_000;

function decodeJwtExp(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function requestClientCredentialsToken(): Promise<string> {
  if (env.GATEWAY_ACCESS_TOKEN) return env.GATEWAY_ACCESS_TOKEN;

  const tokenUrl = getOryTokenUrl();
  const clientId = env.ORY_OIDC_CLIENT_ID;
  const clientSecret = env.ORY_OIDC_CLIENT_SECRET;

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error(
      'Wilayah gateway credentials not configured — set ORY_OIDC_CLIENT_ID, ORY_OIDC_CLIENT_SECRET, and ORY_AUTHORIZATION_ENDPOINT (or GATEWAY_ACCESS_TOKEN for dev)',
    );
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  if (env.GATEWAY_OIDC_SCOPE) {
    params.set('scope', env.GATEWAY_OIDC_SCOPE);
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || `Client credentials token request failed (${res.status})`,
    );
  }

  const jwtExp = decodeJwtExp(data.access_token);
  const expiresAt = jwtExp ?? Date.now() + (data.expires_in ?? 3600) * 1000;
  cache = { token: data.access_token, expiresAt };
  return data.access_token;
}

/** Machine-to-machine Ory token for SIPGN /api/utils/region* calls. */
export async function getGatewayClientToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now() + EXPIRY_BUFFER_MS) {
    return cache.token;
  }

  if (!inflight) {
    inflight = requestClientCredentialsToken().finally(() => {
      inflight = null;
    });
  }

  return inflight;
}
