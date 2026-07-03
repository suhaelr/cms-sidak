import { Elysia, t } from 'elysia';
import { getReactions, incrementLike, incrementDislike } from '../../services/article-reactions';

export const articleReactionsRoutes = new Elysia({ name: 'article-reactions-routes' })
  .group('/articles', (app) =>
    app
      .get('/:slug/reactions', async ({ params }) => {
        return getReactions(params.slug);
      }, {
        detail: { tags: ['News'], summary: 'Get article reaction counts' },
        params: t.Object({ slug: t.String() }),
      })
      .post('/:slug/like', async ({ params }) => {
        return incrementLike(params.slug);
      }, {
        detail: { tags: ['News'], summary: 'Like an article' },
        params: t.Object({ slug: t.String() }),
      })
      .post('/:slug/dislike', async ({ params }) => {
        return incrementDislike(params.slug);
      }, {
        detail: { tags: ['News'], summary: 'Dislike an article' },
        params: t.Object({ slug: t.String() }),
      }),
  );
