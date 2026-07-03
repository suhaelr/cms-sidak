import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import type { AppRole } from '../db/schema';
import type { AuthUser } from '../types/auth';

export async function syncUserRoles(userId: string, roles: AppRole[]): Promise<void> {
  const current = await loadUserRoles(userId);
  if (roles.length === current.length && roles.every((role) => current.includes(role))) {
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(schema.userRoles).where(eq(schema.userRoles.userId, userId));
    if (roles.length) {
      await tx.insert(schema.userRoles).values(roles.map((role) => ({ userId, role })));
    }
  });
}

export async function loadUserRoles(userId: string): Promise<AppRole[]> {
  const rows = await db
    .select({ role: schema.userRoles.role })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.userId, userId));
  return rows.map((r) => r.role);
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) return null;
  const roles = await loadUserRoles(user.id);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    authProvider: user.authProvider,
    roles,
  };
}

export async function getUserByOryId(oryId: string): Promise<AuthUser | null> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.oryIdentityId, oryId))
    .limit(1);
  if (!user) return null;
  const roles = await loadUserRoles(user.id);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    authProvider: user.authProvider,
    roles,
  };
}

export async function jitProvisionOryUser(
  oryId: string,
  email: string,
  fullName: string,
  appRoles: AppRole[] = [],
): Promise<AuthUser> {
  const existing = await getUserByOryId(oryId);
  if (existing) {
    await syncUserRoles(existing.id, appRoles);
    return (await getUserById(existing.id))!;
  }

  const [byEmail] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (byEmail) {
    await db
      .update(schema.users)
      .set({ oryIdentityId: oryId, authProvider: 'ory', updatedAt: new Date() })
      .where(eq(schema.users.id, byEmail.id));
    await syncUserRoles(byEmail.id, appRoles);
    return (await getUserById(byEmail.id))!;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      email,
      fullName: fullName || email,
      oryIdentityId: oryId,
      authProvider: 'ory',
    })
    .returning();

  await syncUserRoles(created.id, appRoles);
  return (await getUserById(created.id))!;
}
