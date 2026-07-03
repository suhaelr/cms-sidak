import { Elysia } from 'elysia';
import { eq, asc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { kitchens as kitchensDocs } from '../../openapi/docs';
import { snakeToCamel } from '../../lib/body-map';
import { guardAdmin, snakeRow } from '../../lib/route-helpers';

export const kitchensRoutes = new Elysia({ name: 'kitchens-routes' })
  .use(authPlugin)
  .group('/kitchens', (app) =>
    app
      .get('/', async () => {
        const rows = await db.select().from(schema.sppgKitchens).orderBy(asc(schema.sppgKitchens.name));
        return rows.map((r) => snakeRow(r as Record<string, unknown>));
      }, kitchensDocs.list)
      .post('/', async ({ user, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const mapped = snakeToCamel(body as Record<string, unknown>);
        const [row] = await db.insert(schema.sppgKitchens).values({
          code: mapped.code as string,
          name: mapped.name as string,
          address: mapped.address as string | undefined,
          regionId: mapped.regionId as string | undefined,
          status: (mapped.status as string) || 'active',
        }).returning();
        return snakeRow(row as Record<string, unknown>);
      }, kitchensDocs.create)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const mapped = snakeToCamel(body as Record<string, unknown>);
        const [row] = await db.update(schema.sppgKitchens).set(mapped).where(eq(schema.sppgKitchens.id, params.id)).returning();
        return snakeRow(row as Record<string, unknown>);
      }, kitchensDocs.update)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        await db.delete(schema.sppgKitchens).where(eq(schema.sppgKitchens.id, params.id));
        return { success: true };
      }, kitchensDocs.delete),
  );
