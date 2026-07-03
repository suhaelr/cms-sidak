import { Elysia } from 'elysia';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { findingCategories as findingCategoriesDocs, sanctionTypes as sanctionTypesDocs } from '../../openapi/docs';
import { crudTable } from '../../lib/crud-routes';

export const masterDataRoutes = new Elysia({ name: 'master-data-routes' })
  .use(authPlugin)
  .group('/finding-categories', (app) => crudTable(app, schema.findingCategories, findingCategoriesDocs))
  .group('/sanction-types', (app) => crudTable(app, schema.sanctionTypes, sanctionTypesDocs));
