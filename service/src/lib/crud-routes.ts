import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { db } from '../db';
import { snakeToCamel } from './body-map';
import { guardAdmin, snakeRow } from './route-helpers';

export function crudTable(
  app: Elysia,
  table: PgTable & { id: PgColumn },
  docs?: { list: object; create: object; update: object; delete: object },
) {
  return app
    .get('/', async () => {
      const rows = await db.select().from(table);
      return rows.map((r: Record<string, unknown>) => snakeRow(r));
    }, docs?.list)
    .post('/', async ({ user, body, set }) => {
      if (!guardAdmin(user, set)) return { error: 'Forbidden' };
      const [row] = await db.insert(table).values(snakeToCamel(body as Record<string, unknown>)).returning();
      return snakeRow(row as Record<string, unknown>);
    }, docs?.create)
    .patch('/:id', async ({ user, params, body, set }) => {
      if (!guardAdmin(user, set)) return { error: 'Forbidden' };
      const [row] = await db.update(table).set(snakeToCamel(body as Record<string, unknown>)).where(eq(table.id, params.id)).returning();
      return snakeRow(row as Record<string, unknown>);
    }, docs?.update)
    .delete('/:id', async ({ user, params, set }) => {
      if (!guardAdmin(user, set)) return { error: 'Forbidden' };
      await db.delete(table).where(eq(table.id, params.id));
      return { success: true };
    }, docs?.delete);
}
