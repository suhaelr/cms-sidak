import { Elysia } from 'elysia';
import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { documents as documentsDocs } from '../../openapi/docs';
import { guardAdmin, isAdmin, resolvePublishedAt, snakeRow } from '../../lib/route-helpers';

export const documentsRoutes = new Elysia({ name: 'documents-routes' })
  .use(authPlugin)
  .group('/documents', (app) =>
    app
      .get('/', async ({ user, query }) => {
        const admin = isAdmin(user);
        const conditions = [];
        if (!admin || query.public_only === 'true') conditions.push(eq(schema.documents.isPublic, true));
        const rows = await db.select().from(schema.documents)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(schema.documents.publishedAt));
        return rows.map((r) => snakeRow(r as Record<string, unknown>));
      }, documentsDocs.list)
      .post('/', async ({ user, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.insert(schema.documents).values({
          title: body.title,
          category: body.category,
          version: body.version || '1.0',
          fileUrl: body.file_url,
          isPublic: body.is_public ?? false,
          publishedAt: body.is_public ? new Date() : null,
        }).returning();
        return snakeRow(row as Record<string, unknown>);
      }, documentsDocs.create)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.update(schema.documents).set({
          title: body.title,
          category: body.category,
          version: body.version,
          fileUrl: body.file_url,
          isPublic: body.is_public,
          publishedAt: resolvePublishedAt(!!body.is_public, body.published_at),
        }).where(eq(schema.documents.id, params.id)).returning();
        return snakeRow(row as Record<string, unknown>);
      }, documentsDocs.update)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        await db.delete(schema.documents).where(eq(schema.documents.id, params.id));
        return { success: true };
      }, documentsDocs.delete),
  );
