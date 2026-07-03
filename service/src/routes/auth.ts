import { Elysia, t } from 'elysia';
import { eq, and, gt } from 'drizzle-orm';
import { db, schema } from '../db';
import {
  hashPassword,
  verifyPassword,
  generateRefreshToken,
  hashToken,
} from '../lib/auth';
import { getOryConfig, getOryTokenUrl, isOryConfigured, verifyOryToken, exchangeOryRefreshToken } from '../lib/ory';
import { getUserById, getUserByOryId, jitProvisionOryUser } from '../services/user-service';
import { authPlugin } from '../middleware/auth';
import { env, isLocalAuthEnabled, isOryAuthEnabled } from '../config';
import { auth as authDocs } from '../openapi/docs';
import { clientIp, verifyTurnstile } from '../lib/turnstile';

const ACCESS_TTL = 60 * 60 * 24 * 7;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(authPlugin)
  .get('/ory/config', () => {
    if (!isOryAuthEnabled || !isOryConfigured()) return { enabled: false };
    return getOryConfig();
  }, authDocs.oryConfig)
  .post(
    '/ory/callback',
    async ({ body, jwt }) => {
      if (!isOryAuthEnabled || !isOryConfigured()) {
        return { error: 'Ory SSO not configured' };
      }
      const tokenUrl = getOryTokenUrl();
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: body.code,
        redirect_uri: body.redirectUri || env.ORY_OIDC_REDIRECT_URI,
        code_verifier: body.codeVerifier,
        client_id: env.ORY_OIDC_CLIENT_ID || '',
      });
      if (env.ORY_OIDC_CLIENT_SECRET) {
        params.set('client_secret', env.ORY_OIDC_CLIENT_SECRET);
      }
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      const tokenData = (await res.json()) as {
        access_token?: string;
        refresh_token?: string;
        error?: string;
        error_description?: string;
      };
      if (!res.ok) {
        return { error: tokenData.error_description || tokenData.error || 'Token exchange failed' };
      }
      if (!tokenData.access_token) {
        return { error: 'Token exchange failed: no access_token' };
      }

      const oryPayload = await verifyOryToken(tokenData.access_token);
      if (!oryPayload?.sub) {
        return { error: 'Gagal memverifikasi token SSO' };
      }

      const appRoles = oryPayload.appRoles || [];

      let user = await getUserByOryId(oryPayload.sub);
      if (!user && oryPayload.email) {
        user = await jitProvisionOryUser(
          oryPayload.sub,
          oryPayload.email,
          (oryPayload.name as string) || oryPayload.email,
          appRoles,
        );
      } else if (user) {
        user = await jitProvisionOryUser(
          oryPayload.sub,
          user.email,
          user.fullName,
          appRoles,
        );
      }

      if (!user) {
        return {
          error: oryPayload.email
            ? 'Akun SSO belum terdaftar'
            : 'Email tidak ditemukan pada token SSO. Pastikan scope openid profile email aktif.',
        };
      }

      if (!user.roles.length) {
        return { error: 'Akun SSO belum memiliki peran yang diizinkan' };
      }

      const accessToken = await jwt.sign({
        sub: user.id,
        roles: user.roles,
        exp: Math.floor(Date.now() / 1000) + ACCESS_TTL,
      });

      const refreshToken = generateRefreshToken();
      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      });

      return {
        accessToken,
        oryAccessToken: tokenData.access_token,
        oryRefreshToken: tokenData.refresh_token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          roles: user.roles,
        },
      };
    },
    {
      ...authDocs.oryCallback,
      body: t.Object({
        code: t.String({ description: 'Authorization code from Ory redirect' }),
        codeVerifier: t.String({ description: 'PKCE code verifier' }),
        redirectUri: t.Optional(t.String({ description: 'Must match registered redirect URI' })),
      }),
    },
  )
  .post(
    '/login',
    async ({ body, jwt, set, request }) => {
      if (!isLocalAuthEnabled) {
        set.status = 403;
        return { error: 'Local auth disabled' };
      }

      if (!(await verifyTurnstile(body.turnstile_token, clientIp(request)))) {
        set.status = 400;
        return { error: 'Verifikasi CAPTCHA gagal atau kedaluwarsa' };
      }

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, body.email))
        .limit(1);

      if (!user?.passwordHash || !(await verifyPassword(body.password, user.passwordHash))) {
        set.status = 401;
        return { error: 'Email atau password salah' };
      }

      const authUser = await getUserById(user.id);
      const accessToken = await jwt.sign({
        sub: user.id,
        roles: authUser?.roles || [],
        exp: Math.floor(Date.now() / 1000) + ACCESS_TTL,
      });

      const refreshToken = generateRefreshToken();
      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          roles: authUser?.roles || [],
        },
      };
    },
    {
      ...authDocs.login,
      body: t.Object({
        email: t.String({ description: 'User email', examples: ['superadmin@bgn.go.id'] }),
        password: t.String({ description: 'User password', examples: ['demo123'] }),
        turnstile_token: t.Optional(t.String({ description: 'Cloudflare Turnstile response token' })),
      }),
    },
  )
  .post(
    '/register',
    async ({ body, set }) => {
      if (!isLocalAuthEnabled) {
        set.status = 403;
        return { error: 'Local registration disabled' };
      }
      const existing = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, body.email))
        .limit(1);
      if (existing.length) {
        set.status = 400;
        return { error: 'Email sudah terdaftar' };
      }

      const passwordHash = await hashPassword(body.password);
      const [user] = await db
        .insert(schema.users)
        .values({
          email: body.email,
          passwordHash,
          fullName: body.fullName,
          authProvider: 'local',
        })
        .returning();

      return { success: true, user_id: user.id };
    },
    {
      ...authDocs.register,
      body: t.Object({
        email: t.String(),
        password: t.String(),
        fullName: t.String(),
      }),
    },
  )
  .post(
    '/refresh',
    async ({ body, jwt, set }) => {
      const tokenHash = hashToken(body.refreshToken);
      const [stored] = await db
        .select()
        .from(schema.refreshTokens)
        .where(
          and(
            eq(schema.refreshTokens.tokenHash, tokenHash),
            gt(schema.refreshTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!stored) {
        set.status = 401;
        return { error: 'Invalid refresh token' };
      }

      const authUser = await getUserById(stored.userId);
      const accessToken = await jwt.sign({
        sub: stored.userId,
        roles: authUser?.roles || [],
        exp: Math.floor(Date.now() / 1000) + ACCESS_TTL,
      });

      let oryAccessToken: string | undefined;
      let oryRefreshToken: string | undefined;

      if (body.oryRefreshToken && isOryConfigured()) {
        const oryData = await exchangeOryRefreshToken(body.oryRefreshToken);
        if (oryData.access_token) {
          oryAccessToken = oryData.access_token;
          oryRefreshToken = oryData.refresh_token || body.oryRefreshToken;
        }
      }

      return {
        accessToken,
        ...(oryAccessToken ? { oryAccessToken, oryRefreshToken } : {}),
      };
    },
    {
      ...authDocs.refresh,
      body: t.Object({
        refreshToken: t.String({ description: 'Refresh token from login response' }),
        oryRefreshToken: t.Optional(t.String({ description: 'Deprecated — no longer used' })),
      }),
    },
  )
  .post(
    '/logout',
    async ({ body, user }) => {
      if (body.refreshToken) {
        await db
          .delete(schema.refreshTokens)
          .where(eq(schema.refreshTokens.tokenHash, hashToken(body.refreshToken)));
      }
      return { success: true, user_id: user?.id };
    },
    {
      ...authDocs.logout,
      body: t.Object({
        refreshToken: t.Optional(t.String({ description: 'Refresh token to invalidate' })),
      }),
    },
  )
  .get('/me', ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        auth_provider: user.authProvider,
        roles: user.roles,
      },
    };
  }, authDocs.me);
