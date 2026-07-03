import { Elysia } from 'elysia';
import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { sanctions as sanctionsDocs } from '../../openapi/docs';
import { guardAdmin, isAdmin, snakeRow } from '../../lib/route-helpers';
import { loadKitchensByIds } from '../../services/batch-load';
import { resolveRegionLabels } from '../../services/wilayah-gateway';

export const sanctionsRoutes = new Elysia({ name: 'sanctions-routes' })
  .use(authPlugin)
  .group('/sanctions', (app) =>
    app
      .get('/', async ({ user, query }) => {
        const admin = isAdmin(user);
        const conditions = [];
        if (!admin || query.public_only === 'true') conditions.push(eq(schema.sanctions.isPublic, true));
        const rows = await db.select().from(schema.sanctions)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(schema.sanctions.date));

        const kitchenIds = rows.map((s) => s.kitchenId).filter((id): id is string => !!id);
        const kitchenMap = await loadKitchensByIds(kitchenIds);
        const regionIds = [...kitchenMap.values()].map((k) => k.regionId);
        const regionMap = await resolveRegionLabels(regionIds);

        return rows.map((s) => {
          const kitchen = s.kitchenId ? kitchenMap.get(s.kitchenId) : null;
          const region = kitchen?.regionId ? regionMap.get(kitchen.regionId) ?? null : null;
          return {
            ...snakeRow(s as Record<string, unknown>),
            sppg_kitchens: kitchen
              ? { code: kitchen.code, name: kitchen.name, regions: region }
              : null,
          };
        });
      }, sanctionsDocs.list)
      .get('/:id', async ({ params, user, set }) => {
        const [s] = await db.select().from(schema.sanctions).where(eq(schema.sanctions.id, params.id)).limit(1);
        if (!s) { set.status = 404; return { error: 'Not found' }; }
        if (!s.isPublic && !isAdmin(user)) { set.status = 403; return { error: 'Forbidden' }; }
        return snakeRow(s as Record<string, unknown>);
      }, sanctionsDocs.get)
      .post('/', async ({ user, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.insert(schema.sanctions).values({
          inspectionId: body.inspection_id,
          kitchenId: body.kitchen_id,
          violationSummary: body.violation_summary,
          sanctionType: body.sanction_type,
          date: body.date,
          status: body.status || 'aktif',
          followUpStatus: body.follow_up_status || 'belum',
          isPublic: body.is_public ?? false,
          showIdentity: body.show_identity ?? false,
        }).returning();
        return snakeRow(row as Record<string, unknown>);
      }, sanctionsDocs.create)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.update(schema.sanctions).set({
          inspectionId: body.inspection_id,
          kitchenId: body.kitchen_id,
          violationSummary: body.violation_summary,
          sanctionType: body.sanction_type,
          date: body.date,
          status: body.status,
          followUpStatus: body.follow_up_status,
          isPublic: body.is_public,
          showIdentity: body.show_identity,
        }).where(eq(schema.sanctions.id, params.id)).returning();
        return snakeRow(row as Record<string, unknown>);
      }, sanctionsDocs.update)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        await db.delete(schema.sanctions).where(eq(schema.sanctions.id, params.id));
        return { success: true };
      }, sanctionsDocs.delete),
  );
