import { Elysia, t } from 'elysia';
import { authPlugin, requireAdminUser } from '../middleware/auth';
import { buildUploadKey, uploadFile } from '../lib/s3';
import {
  getWilayahFormValues,
  getWilayahRegionByKode,
  listWilayahRegions,
  WilayahAuthError,
} from '../services/wilayah-gateway';
import { regions as regionsDocs, uploads as uploadsDocs } from '../openapi/docs';

function wilayahErrorResponse(err: unknown, set: { status?: number | string }) {
  if (err instanceof WilayahAuthError) {
    set.status = 401;
    return { error: err.message };
  }
  set.status = 502;
  return { error: err instanceof Error ? err.message : 'Wilayah gateway unavailable' };
}

export const uploadsRoutes = new Elysia({ prefix: '/uploads' })
  .use(authPlugin)
  .post('/', async ({ user, request, set }) => {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const folder = (form.get('folder') as string) || 'uploads';
    const isPublic = form.get('public') === 'true';

    if (!isPublic) {
      try {
        requireAdminUser(user);
      } catch {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
    }

    if (!file) {
      set.status = 400;
      return { error: 'No file provided' };
    }

    const key = buildUploadKey(folder, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(key, buffer, file.type || 'application/octet-stream');
    return { url, key };
  }, uploadsDocs.upload);

export const regionsRoutes = new Elysia({ prefix: '/regions' })
  .use(authPlugin)
  .get('/', async ({ query, set }) => {
    try {
      const result = await listWilayahRegions(
        {
          type: query.type,
          parentId: query.parent_id,
          search: query.search,
          page: query.page ? parseInt(query.page) : 1,
          limit: query.limit ? parseInt(query.limit) : 50,
        },
      );
      return { data: result.data, count: result.count };
    } catch (err) {
      return wilayahErrorResponse(err, set);
    }
  }, {
    ...regionsDocs.list,
    query: t.Object({
      type: t.Optional(t.String({ description: 'province | city | district | village' })),
      parent_id: t.Optional(t.String({ description: 'Parent kode dagri' })),
      search: t.Optional(t.String({ description: 'Search by name' })),
      page: t.Optional(t.String({ description: 'Page number (default 1)' })),
      limit: t.Optional(t.String({ description: 'Page size (default 50, max 100)' })),
    }),
  })
  .get('/hierarchy/:kode', async ({ params, set }) => {
    try {
      const values = await getWilayahFormValues(params.kode);
      if (!values) {
        set.status = 404;
        return { error: 'Not found' };
      }
      return values;
    } catch (err) {
      return wilayahErrorResponse(err, set);
    }
  }, {
    params: t.Object({ kode: t.String({ description: 'Kode dagri at any level' }) }),
  })
  .get('/:id', async ({ params, set }) => {
    try {
      const row = await getWilayahRegionByKode(params.id);
      if (!row) {
        set.status = 404;
        return { error: 'Not found' };
      }
      return row;
    } catch (err) {
      return wilayahErrorResponse(err, set);
    }
  }, {
    ...regionsDocs.get,
    params: t.Object({ id: t.String({ description: 'Kode dagri' }) }),
  });
