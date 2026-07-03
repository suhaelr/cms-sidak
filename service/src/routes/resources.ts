import { Elysia } from 'elysia';
import { kitchensRoutes } from './modules/kitchens';
import { masterDataRoutes } from './modules/master-data';
import { newsCategoriesRoutes } from './modules/news-categories';
import { inspectionsRoutes } from './modules/inspections';
import { followupsRoutes } from './modules/followups';
import { sanctionsRoutes } from './modules/sanctions';
import { complaintsRoutes } from './modules/complaints';
import { newsRoutes } from './modules/news';
import { documentsRoutes } from './modules/documents';
import { heroSlidesRoutes } from './modules/hero-slides';
import { dashboardRoutes } from './modules/dashboard';
import { articleReactionsRoutes } from './modules/article-reactions';
import { newsCommentsRoutes } from './modules/news-comments';

export const resourcesRoutes = new Elysia({ name: 'resources-routes' })
  .use(kitchensRoutes)
  .use(masterDataRoutes)
  .use(newsCategoriesRoutes)
  .use(inspectionsRoutes)
  .use(followupsRoutes)
  .use(sanctionsRoutes)
  .use(complaintsRoutes)
  .use(newsRoutes)
  .use(documentsRoutes)
  .use(heroSlidesRoutes)
  .use(dashboardRoutes)
  .use(articleReactionsRoutes)
  .use(newsCommentsRoutes);
