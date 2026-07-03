import { Elysia, t } from 'elysia';
import { authPlugin } from '../../middleware/auth';
import {
  getApprovedComments,
  createComment,
  getCommentsByStatus,
  updateCommentStatus,
  deleteComment,
  voteComment,
} from '../../services/news-comments';
import { guardAdmin, snakeRow } from '../../lib/route-helpers';

export const newsCommentsRoutes = new Elysia({ name: 'news-comments-routes' })
  .use(authPlugin)
  .group('/news', (app) =>
    app
      // Get approved comments for an article (public)
      .get('/:slug/comments', async ({ params }) => {
        const rows = await getApprovedComments(params.slug);
        return rows.map((r) => snakeRow(r as Record<string, unknown>));
      }, {
        detail: { tags: ['News'], summary: 'Get approved comments for a news article' },
        params: t.Object({ slug: t.String() }),
      })
      // Add a comment to an article (requires auth)
      .post('/:slug/comments', async ({ params, user, body, set }) => {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        const comment = await createComment(params.slug, user.id, body.content, body.is_anonymous);
        return snakeRow(comment as unknown as Record<string, unknown>);
      }, {
        detail: { tags: ['News'], summary: 'Add a comment to an article' },
        params: t.Object({ slug: t.String() }),
        body: t.Object({
          content: t.String({ minLength: 1 }),
          is_anonymous: t.Optional(t.Boolean()),
        }),
      })
  )
  .group('/admin/news-comments', (app) =>
    app
      // List comments for moderation (needs admin)
      .get('/', async ({ user, query, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        
        const status = query.status;
        const rows = await getCommentsByStatus(status);
        return rows.map((r) => snakeRow(r as Record<string, unknown>));
      }, {
        detail: { tags: ['News'], summary: 'List comments for moderation' },
        query: t.Object({
          status: t.Optional(t.String()),
        }),
      })
      // Approve / reject comment (needs admin)
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        
        const row = await updateCommentStatus(params.id, body.status as 'approved' | 'rejected');
        if (!row) {
          set.status = 404;
          return { error: 'Comment not found' };
        }
        return snakeRow(row as unknown as Record<string, unknown>);
      }, {
        detail: { tags: ['News'], summary: 'Update comment status (approve/reject)' },
        params: t.Object({ id: t.String() }),
        body: t.Object({
          status: t.Union([t.Literal('approved'), t.Literal('rejected')]),
        }),
      })
      // Delete comment (needs admin)
      .delete('/:id', async ({ user, params, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        
        const row = await deleteComment(params.id);
        if (!row) {
          set.status = 404;
          return { error: 'Comment not found' };
        }
        return { success: true };
      }, {
        detail: { tags: ['News'], summary: 'Delete comment' },
        params: t.Object({ id: t.String() }),
      })
  )
  // Vote a comment (public, localStorage protected in front-end)
  .post('/news-comments/:commentId/vote', async ({ params, body }) => {
    const comment = await voteComment(params.commentId, body.type);
    return snakeRow(comment as unknown as Record<string, unknown>);
  }, {
    detail: { tags: ['News'], summary: 'Vote (like/dislike/unlike/undislike) a comment' },
    params: t.Object({ commentId: t.String() }),
    body: t.Object({
      type: t.Union([
        t.Literal('like'),
        t.Literal('dislike'),
        t.Literal('unlike'),
        t.Literal('undislike'),
      ]),
    }),
  });
