import { Elysia } from 'elysia';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { followups as followupsDocs } from '../../openapi/docs';
import { guardAdmin, isAdmin, snakeRow } from '../../lib/route-helpers';
import { loadInspectionsByIds, loadKitchensByIds } from '../../services/batch-load';

export const followupsRoutes = new Elysia({ name: 'followups-routes' })
  .use(authPlugin)
  .group('/followups', (app) =>
    app
      .get('/', async ({ user, set }) => {
        if (!isAdmin(user)) { set.status = 403; return { error: 'Forbidden' }; }
        const rows = await db.select().from(schema.followups).orderBy(desc(schema.followups.createdAt));

        const inspectionIds = rows.map((f) => f.inspectionId);
        const inspectionMap = await loadInspectionsByIds(inspectionIds);
        const kitchenIds = [...inspectionMap.values()]
          .map((i) => i.kitchenId)
          .filter((id): id is string => !!id);
        const kitchenMap = await loadKitchensByIds(kitchenIds);

        return rows.map((f) => {
          const insp = inspectionMap.get(f.inspectionId);
          const kitchen = insp?.kitchenId ? kitchenMap.get(insp.kitchenId) : null;
          return {
            ...snakeRow(f as Record<string, unknown>),
            inspections: insp
              ? {
                  date: insp.date,
                  summary: insp.summary,
                  sppg_kitchens: kitchen ? { code: kitchen.code } : null,
                }
              : null,
          };
        });
      }, followupsDocs.list)
      .post('/', async ({ user, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.insert(schema.followups).values({
          inspectionId: body.inspection_id,
          findingId: body.finding_id,
          actionType: body.action_type,
          deadline: body.deadline,
          status: body.status || 'belum',
          pic: body.pic,
          notes: body.notes,
        }).returning();
        return snakeRow(row as Record<string, unknown>);
      }, followupsDocs.create)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.update(schema.followups).set({
          inspectionId: body.inspection_id,
          findingId: body.finding_id,
          actionType: body.action_type,
          deadline: body.deadline,
          status: body.status,
          pic: body.pic,
          notes: body.notes,
        }).where(eq(schema.followups.id, params.id)).returning();
        return snakeRow(row as Record<string, unknown>);
      }, followupsDocs.update)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        await db.delete(schema.followups).where(eq(schema.followups.id, params.id));
        return { success: true };
      }, followupsDocs.delete),
  );
