import { Elysia } from 'elysia';
import { eq, asc, sql } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { newsCategories as newsCategoriesDocs } from '../../openapi/docs';
import { guardAdmin, snakeRow } from '../../lib/route-helpers';

export const newsCategoriesRoutes = new Elysia({ name: 'news-categories-routes' })
  .use(authPlugin)
  .group('/news-categories', (app) =>
    app
      .get('/', async () => {
        const [rows, counts] = await Promise.all([
          db.select().from(schema.newsCategories).orderBy(asc(schema.newsCategories.sortOrder)),
          db
            .select({ category: schema.news.category, count: sql<number>`count(*)::int` })
            .from(schema.news)
            .groupBy(schema.news.category),
        ]);
        const countMap = Object.fromEntries(counts.map((c) => [c.category, c.count]));
        return rows.map((r) => ({
          ...snakeRow(r as Record<string, unknown>),
          article_count: countMap[r.slug] ?? 0,
        }));
      }, newsCategoriesDocs.list)
      .post('/', async ({ user, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const slug = (body.slug as string)?.trim();
        if (!slug || !/^[a-z0-9_]+$/.test(slug)) {
          set.status = 400;
          return { error: 'Slug hanya boleh huruf kecil, angka, dan underscore' };
        }
        const [existing] = await db.select().from(schema.newsCategories).where(eq(schema.newsCategories.slug, slug)).limit(1);
        if (existing) { set.status = 409; return { error: 'Slug sudah digunakan' }; }
        const maxOrder = await db.select({ max: sql<number>`coalesce(max(${schema.newsCategories.sortOrder}), 0)` }).from(schema.newsCategories);
        const [row] = await db.insert(schema.newsCategories).values({
          slug,
          fullLabel: body.full_label as string,
          shortLabel: body.short_label as string,
          badgeColor: (body.badge_color as string) || 'muted',
          isBuiltin: false,
          sortOrder: (maxOrder[0]?.max ?? 0) + 1,
        }).returning();
        return { ...snakeRow(row as Record<string, unknown>), article_count: 0 };
      }, newsCategoriesDocs.create)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [current] = await db.select().from(schema.newsCategories).where(eq(schema.newsCategories.id, params.id)).limit(1);
        if (!current) { set.status = 404; return { error: 'Not found' }; }
        const updates: Record<string, unknown> = {};
        if (body.full_label !== undefined) updates.fullLabel = body.full_label;
        if (body.short_label !== undefined) updates.shortLabel = body.short_label;
        if (body.badge_color !== undefined) updates.badgeColor = body.badge_color;
        const [row] = await db.update(schema.newsCategories).set(updates).where(eq(schema.newsCategories.id, params.id)).returning();
        const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.news).where(eq(schema.news.category, row.slug));
        return { ...snakeRow(row as Record<string, unknown>), article_count: countRow?.count ?? 0 };
      }, newsCategoriesDocs.update)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [current] = await db.select().from(schema.newsCategories).where(eq(schema.newsCategories.id, params.id)).limit(1);
        if (!current) { set.status = 404; return { error: 'Not found' }; }
        if (current.isBuiltin) { set.status = 403; return { error: 'Kategori bawaan tidak dapat dihapus' }; }
        const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.news).where(eq(schema.news.category, current.slug));
        if ((countRow?.count ?? 0) > 0) {
          set.status = 409;
          return { error: 'Kategori masih digunakan oleh artikel' };
        }
        await db.delete(schema.newsCategories).where(eq(schema.newsCategories.id, params.id));
        return { success: true };
      }, newsCategoriesDocs.delete),
  );
