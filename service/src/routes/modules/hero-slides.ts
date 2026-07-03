import { Elysia } from 'elysia';
import { eq, and, asc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { heroSlides as heroSlidesDocs } from '../../openapi/docs';
import { guardAdmin, isAdmin, snakeRow } from '../../lib/route-helpers';

export const heroSlidesRoutes = new Elysia({ name: 'hero-slides-routes' })
  .use(authPlugin)
  .group('/hero-slides', (app) =>
    app
      .get('/', async ({ user, query }) => {
        const admin = isAdmin(user);
        const conditions = [];
        if (!admin || query.public_only === 'true') conditions.push(eq(schema.heroSlides.isActive, true));
        const rows = await db.select().from(schema.heroSlides)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(asc(schema.heroSlides.sortOrder));
        return rows.map((r) => snakeRow(r as Record<string, unknown>));
      }, heroSlidesDocs.list)
      .post('/', async ({ user, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.insert(schema.heroSlides).values({
          title: body.title,
          imageUrl: body.image_url,
          sortOrder: body.sort_order ?? 0,
          isActive: body.is_active ?? true,
        }).returning();
        return snakeRow(row as Record<string, unknown>);
      }, heroSlidesDocs.create)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.update(schema.heroSlides).set({
          title: body.title,
          imageUrl: body.image_url,
          sortOrder: body.sort_order,
          isActive: body.is_active,
        }).where(eq(schema.heroSlides.id, params.id)).returning();
        return snakeRow(row as Record<string, unknown>);
      }, heroSlidesDocs.update)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        await db.delete(schema.heroSlides).where(eq(schema.heroSlides.id, params.id));
        return { success: true };
      }, heroSlidesDocs.delete),
  );
