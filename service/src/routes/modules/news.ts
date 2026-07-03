import { Elysia, t } from 'elysia';
import { eq, and, desc, ne, sql, ilike } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { news as newsDocs } from '../../openapi/docs';
import {
  guardAdmin,
  isAdmin,
  paginatedResponse,
  parsePaginationQuery,
  resolvePublishedAt,
  snakeRow,
  toRegionId,
} from '../../lib/route-helpers';
import { resolveRegionLabel } from '../../services/wilayah-gateway';

const newsListColumns = {
  id: schema.news.id,
  title: schema.news.title,
  slug: schema.news.slug,
  category: schema.news.category,
  coverImage: schema.news.coverImage,
  regionId: schema.news.regionId,
  publishedAt: schema.news.publishedAt,
  status: schema.news.status,
  isHighlight: schema.news.isHighlight,
  isBreaking: schema.news.isBreaking,
  tags: schema.news.tags,
  createdAt: schema.news.createdAt,
  updatedAt: schema.news.updatedAt,
};

export const newsRoutes = new Elysia({ name: 'news-routes' })
  .use(authPlugin)
  .group('/news', (app) =>
    app
      .get('/', async ({ user, query }) => {
        const admin = isAdmin(user);
        const isPublicList = !admin || query.public_only === 'true';
        const { hasPagination, page, limit, offset } = parsePaginationQuery(query);
        const conditions = [];
        if (isPublicList) conditions.push(eq(schema.news.status, 'published'));
        if (query.highlight_only === 'true') conditions.push(eq(schema.news.isHighlight, true));
        if (query.breaking_only === 'true') conditions.push(eq(schema.news.isBreaking, true));
        if (query.category) conditions.push(eq(schema.news.category, query.category));
        if (!isPublicList && query.status) conditions.push(eq(schema.news.status, query.status));
        if (query.search?.trim()) conditions.push(ilike(schema.news.title, `%${query.search.trim()}%`));

        const whereClause = conditions.length ? and(...conditions) : undefined;

        if (hasPagination) {
          const [rows, countRow] = await Promise.all([
            isPublicList
              ? db
                  .select({
                    ...newsListColumns,
                    content: sql<string>`left(${schema.news.content}, 600)`.as('content'),
                  })
                  .from(schema.news)
                  .where(whereClause)
                  .orderBy(desc(schema.news.publishedAt))
                  .limit(limit)
                  .offset(offset)
              : db
                  .select()
                  .from(schema.news)
                  .where(whereClause)
                  .orderBy(desc(schema.news.publishedAt))
                  .limit(limit)
                  .offset(offset),
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(schema.news)
              .where(whereClause),
          ]);

          return paginatedResponse(
            rows.map((n) => snakeRow(n as Record<string, unknown>)),
            countRow[0]?.count ?? 0,
            page,
            limit,
          );
        }

        const rows = isPublicList
          ? await db
              .select({
                ...newsListColumns,
                content: sql<string>`left(${schema.news.content}, 600)`.as('content'),
              })
              .from(schema.news)
              .where(whereClause)
              .orderBy(desc(schema.news.publishedAt))
          : await db
              .select()
              .from(schema.news)
              .where(whereClause)
              .orderBy(desc(schema.news.publishedAt));

        return rows.map((n) => snakeRow(n as Record<string, unknown>));
      }, {
        ...newsDocs.list,
        query: t.Object({
          public_only: t.Optional(t.String()),
          highlight_only: t.Optional(t.String()),
          breaking_only: t.Optional(t.String()),
          category: t.Optional(t.String()),
          status: t.Optional(t.String()),
          search: t.Optional(t.String()),
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
      })
      .get('/slug/:slug', async ({ params, set }) => {
        const [row] = await db.select().from(schema.news)
          .where(and(eq(schema.news.slug, params.slug), eq(schema.news.status, 'published'))).limit(1);
        if (!row) { set.status = 404; return { error: 'Not found' }; }

        const [region, allArticles] = await Promise.all([
          row.regionId ? resolveRegionLabel(row.regionId) : Promise.resolve(null),
          db.select().from(schema.news)
            .where(and(eq(schema.news.status, 'published'), ne(schema.news.id, row.id))),
        ]);

        // Scoring-based News Recommendation (without pagination)
        const scored = allArticles.map((art) => {
          let score = 0;
          if (art.category === row.category) {
            score += 5;
          }
          if (Array.isArray(art.tags) && Array.isArray(row.tags)) {
            const commonTags = art.tags.filter((t) => row.tags.includes(t));
            score += commonTags.length * 2;
          }
          if (art.regionId && art.regionId === row.regionId) {
            score += 3;
          }
          return { article: art, score };
        });

        scored.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          const dateA = a.article.publishedAt ? new Date(a.article.publishedAt).getTime() : 0;
          const dateB = b.article.publishedAt ? new Date(b.article.publishedAt).getTime() : 0;
          return dateB - dateA;
        });

        const related = scored.slice(0, 4).map((s) => s.article);

        return {
          ...snakeRow(row as Record<string, unknown>),
          regions: region,
          related: related.map((r) => snakeRow(r as Record<string, unknown>)),
        };
      }, newsDocs.getBySlug)
      .post('/', async ({ user, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.insert(schema.news).values({
          title: body.title,
          slug: body.slug,
          category: body.category,
          content: body.content,
          coverImage: body.cover_image,
          coverImageSource: body.cover_image_source,
          regionId: toRegionId(body.region_id),
          status: body.status || 'draft',
          isHighlight: body.is_highlight ?? false,
          isBreaking: body.is_breaking ?? false,
          tags: Array.isArray(body.tags) ? body.tags : [],
          createdBy: user!.id,
          publishedAt: resolvePublishedAt(body.status === 'published', body.published_at),
        }).returning();
        return snakeRow(row as Record<string, unknown>);
      }, newsDocs.create)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.update(schema.news).set({
          title: body.title,
          slug: body.slug,
          category: body.category,
          content: body.content,
          coverImage: body.cover_image,
          coverImageSource: body.cover_image_source,
          regionId: toRegionId(body.region_id),
          status: body.status,
          isHighlight: body.is_highlight ?? false,
          isBreaking: body.is_breaking ?? false,
          ...(Array.isArray(body.tags) ? { tags: body.tags } : {}),
          publishedAt: resolvePublishedAt(body.status === 'published', body.published_at),
        }).where(eq(schema.news.id, params.id)).returning();
        return snakeRow(row as Record<string, unknown>);
      }, newsDocs.update)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        await db.delete(schema.news).where(eq(schema.news.id, params.id));
        return { success: true };
      }, newsDocs.delete),
  );
