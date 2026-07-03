import { Elysia } from 'elysia';
import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { inspections as inspectionsDocs } from '../../openapi/docs';
import {
  guardAdmin,
  isAdmin,
  resolvePublishedAt,
  snakeRow,
} from '../../lib/route-helpers';
import {
  loadFindingsByInspectionIds,
  loadKitchensByIds,
} from '../../services/batch-load';
import { resolveRegionLabel, resolveRegionLabels } from '../../services/wilayah-gateway';

export const inspectionsRoutes = new Elysia({ name: 'inspections-routes' })
  .use(authPlugin)
  .group('/inspections', (app) =>
    app
      .get('/', async ({ user, query }) => {
        const admin = isAdmin(user);
        const conditions = [];
        if (!admin || query.public_only === 'true') {
          conditions.push(eq(schema.inspections.publicationStatus, 'published'));
        }
        const rows = await db
          .select()
          .from(schema.inspections)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(schema.inspections.date));

        const kitchenIds = rows.map((r) => r.kitchenId).filter((id): id is string => !!id);
        const [kitchenMap, findingsMap, regionMap] = await Promise.all([
          loadKitchensByIds(kitchenIds),
          loadFindingsByInspectionIds(rows.map((r) => r.id)),
          resolveRegionLabels(rows.map((r) => r.regionId)),
        ]);

        return rows.map((insp) => {
          const region = insp.regionId ? regionMap.get(insp.regionId) ?? null : null;
          const kitchen = insp.kitchenId ? kitchenMap.get(insp.kitchenId) : null;
          return {
            ...snakeRow(insp as Record<string, unknown>),
            regions: region ? { name: region.name } : null,
            sppg_kitchens: kitchen ? { code: kitchen.code, name: kitchen.name } : null,
            findings: findingsMap.get(insp.id) ?? [],
          };
        });
      }, inspectionsDocs.list)
      .get('/:id', async ({ params, user, set }) => {
        const [insp] = await db.select().from(schema.inspections).where(eq(schema.inspections.id, params.id)).limit(1);
        if (!insp) { set.status = 404; return { error: 'Not found' }; }
        if (insp.publicationStatus !== 'published' && !isAdmin(user)) {
          set.status = 403; return { error: 'Forbidden' };
        }

        const [findingRows, region, kitchenMap] = await Promise.all([
          db.select().from(schema.findings).where(eq(schema.findings.inspectionId, insp.id)),
          insp.regionId ? resolveRegionLabel(insp.regionId) : Promise.resolve(null),
          insp.kitchenId ? loadKitchensByIds([insp.kitchenId]) : Promise.resolve(new Map()),
        ]);
        const kitchen = insp.kitchenId ? kitchenMap.get(insp.kitchenId) : null;

        return {
          ...snakeRow(insp as Record<string, unknown>),
          regions: region ? { name: region.name, kode_dagri: insp.regionId } : null,
          sppg_kitchens: kitchen ? snakeRow(kitchen as Record<string, unknown>) : null,
          findings: findingRows.map((f) => snakeRow(f as Record<string, unknown>)),
        };
      }, inspectionsDocs.get)
      .post('/', async ({ user, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.insert(schema.inspections).values({
          date: body.date,
          regionId: body.region_id || null,
          kitchenId: body.kitchen_id || null,
          summary: body.summary,
          publicationStatus: body.publication_status || 'draft',
          showIdentity: body.show_identity ?? false,
          showMedia: body.show_media ?? false,
          createdBy: user!.id,
          publishedAt: body.publication_status === 'published' ? new Date() : null,
        }).returning();
        if (body.findings?.length) {
          await db.insert(schema.findings).values(
            body.findings.map((f: { category: string; severity: string; description: string; recommendation?: string }) => ({
              inspectionId: row.id,
              category: f.category,
              severity: f.severity,
              description: f.description,
              recommendation: f.recommendation,
            })),
          );
        }
        return snakeRow(row as Record<string, unknown>);
      }, inspectionsDocs.create)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.update(schema.inspections).set({
          date: body.date,
          regionId: body.region_id,
          kitchenId: body.kitchen_id,
          summary: body.summary,
          publicationStatus: body.publication_status,
          showIdentity: body.show_identity,
          showMedia: body.show_media,
          publishedAt: resolvePublishedAt(body.publication_status === 'published', body.published_at),
        }).where(eq(schema.inspections.id, params.id)).returning();
        return snakeRow(row as Record<string, unknown>);
      }, inspectionsDocs.update)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        await db.delete(schema.inspections).where(eq(schema.inspections.id, params.id));
        return { success: true };
      }, inspectionsDocs.delete),
  );
