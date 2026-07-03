import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { env } from '../config';
import { verifyOryToken } from '../lib/ory';
import { getUserById, getUserByOryId, jitProvisionOryUser } from '../services/user-service';
import type { AuthUser } from '../types/auth';

async function resolveUserFromToken(
  token: string,
  jwtVerify: (t: string) => Promise<false | Record<string, unknown>>,
): Promise<AuthUser | null> {
  // Try local JWT first
  const localPayload = await jwtVerify(token);
  if (localPayload && typeof localPayload.sub === 'string') {
    return getUserById(localPayload.sub);
  }

  // Try Ory token
  const oryPayload = await verifyOryToken(token);
  if (!oryPayload?.sub) return null;

  let user = await getUserByOryId(oryPayload.sub);
  const appRoles = oryPayload.appRoles || [];

  if (!user && oryPayload.email) {
    user = await jitProvisionOryUser(
      oryPayload.sub,
      oryPayload.email,
      (oryPayload.name as string) || oryPayload.email,
      appRoles,
    );
  } else if (user && appRoles.length) {
    const rolesChanged =
      appRoles.length !== user.roles.length ||
      appRoles.some((role) => !user!.roles.includes(role));
    if (rolesChanged) {
      user = await jitProvisionOryUser(
        oryPayload.sub,
        user.email,
        user.fullName,
        appRoles,
      );
    }
  }
  return user;
}

export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      iss: env.JWT_ISSUER,
    }),
  )
  .derive({ as: 'scoped' }, async ({ headers, jwt }) => {
    const authHeader = headers.authorization;
    let user: AuthUser | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      user = await resolveUserFromToken(token, (t) => jwt.verify(t));
    }

    return { user };
  });

export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) throw new Error('Unauthorized');
  return user;
}

export function requireAdminUser(user: AuthUser | null): AuthUser {
  const u = requireAuth(user);
  if (!u.roles.length) throw new Error('Forbidden');
  return u;
}

export function requireSuperAdminUser(user: AuthUser | null): AuthUser {
  const u = requireAuth(user);
  if (!u.roles.includes('super_admin')) throw new Error('Forbidden');
  return u;
}
