import { Elysia, t } from 'elysia';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db';
import { hashPassword } from '../lib/auth';
import { authPlugin, requireSuperAdminUser } from '../middleware/auth';
import { users as usersDocs } from '../openapi/docs';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(authPlugin)
  .get('/', async ({ user, set }) => {
    try {
      requireSuperAdminUser(user);
    } catch {
      set.status = 403;
      return { error: 'Forbidden: Super Admin only' };
    }

    const allUsers = await db.select().from(schema.users);
    const allRoles = await db.select().from(schema.userRoles);

    const users = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.fullName,
      roles: allRoles.filter((r) => r.userId === u.id).map((r) => r.role),
      created_at: u.createdAt,
      auth_provider: u.authProvider,
    }));

    return { users };
  }, usersDocs.list)
  .post(
    '/',
    async ({ user, body, set }) => {
      try {
        requireSuperAdminUser(user);
      } catch {
        set.status = 403;
        return { error: 'Forbidden: Super Admin only' };
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
      const [created] = await db
        .insert(schema.users)
        .values({
          email: body.email,
          passwordHash,
          fullName: body.full_name,
          authProvider: 'local',
        })
        .returning();

      if (body.role) {
        await db.insert(schema.userRoles).values({
          userId: created.id,
          role: body.role,
        });
      }

      return { success: true, user_id: created.id };
    },
    {
      ...usersDocs.create,
      body: t.Object({
        email: t.String(),
        password: t.String(),
        full_name: t.String(),
        role: t.Optional(
          t.Union([
            t.Literal('super_admin'),
            t.Literal('admin_pusat'),
            t.Literal('admin_wilayah'),
            t.Literal('inspektor'),
            t.Literal('verifikator'),
          ]),
        ),
      }),
    },
  )
  .post(
    '/:id/roles',
    async ({ user, params, body, set }) => {
      try {
        requireSuperAdminUser(user);
      } catch {
        set.status = 403;
        return { error: 'Forbidden: Super Admin only' };
      }

      if (!body.role) {
        set.status = 400;
        return { error: 'Role required' };
      }

      if (body.remove) {
        await db
          .delete(schema.userRoles)
          .where(
            and(
              eq(schema.userRoles.userId, params.id),
              eq(schema.userRoles.role, body.role),
            ),
          );
      } else {
        await db
          .insert(schema.userRoles)
          .values({ userId: params.id, role: body.role })
          .onConflictDoNothing();
      }

      return { success: true };
    },
    {
      ...usersDocs.updateRole,
      params: t.Object({ id: t.String({ description: 'User UUID' }) }),
      body: t.Object({
        role: t.Optional(
          t.Union([
            t.Literal('super_admin'),
            t.Literal('admin_pusat'),
            t.Literal('admin_wilayah'),
            t.Literal('inspektor'),
            t.Literal('verifikator'),
          ]),
        ),
        remove: t.Optional(t.Boolean({ description: 'Set true to remove the role' })),
      }),
    },
  )
  .delete('/:id', async ({ user, params, set }) => {
    try {
      requireSuperAdminUser(user);
    } catch {
      set.status = 403;
      return { error: 'Forbidden: Super Admin only' };
    }

    if (user?.id === params.id) {
      set.status = 400;
      return { error: 'Tidak bisa menghapus akun sendiri' };
    }

    await db.delete(schema.users).where(eq(schema.users.id, params.id));
    return { success: true };
  }, {
    ...usersDocs.delete,
    params: t.Object({ id: t.String({ description: 'User UUID' }) }),
  });
