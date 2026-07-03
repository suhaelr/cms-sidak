import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { env } from './config';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { uploadsRoutes, regionsRoutes } from './routes/uploads-regions';
import { resourcesRoutes } from './routes/resources';
import { featureFlagsRoutes } from './routes/feature-flags';
import { system } from './openapi/docs';
import { ensureBucket } from './lib/s3';
import { checkDatabase } from './db';

const api = new Elysia({ prefix: '/api' })
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )
  .get(
    '/health',
    async () => ({
      status: 'ok',
      database: { connected: await checkDatabase() },
    }),
    system.health,
  )
  .use(authRoutes)
  .use(usersRoutes)
  .use(uploadsRoutes)
  .use(regionsRoutes)
  .use(resourcesRoutes)
  .use(featureFlagsRoutes)
  .onError(({ error, set }) => {
    const message = error instanceof Error ? error.message : 'Internal error';
    if (message === 'Unauthorized' || message === 'Forbidden') {
      set.status = message === 'Unauthorized' ? 401 : 403;
    } else {
      set.status = 500;
    }
    return { error: message };
  });

const app = new Elysia()
  .use(
    openapi({
      path: '/docs',
      specPath: '/docs/openapi.json',
      provider: 'scalar',
      documentation: {
        info: {
          title: 'Sidak Pantau Terpadu API',
          description: 'REST API for Sidak BGN — auth, inspections, sanctions, complaints, and admin resources.',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${env.PORT}/api`,
            description: 'Local development',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Local JWT access token or Ory SSO access token',
            },
          },
        },
        security: [{ bearerAuth: [] }],
        tags: [
          { name: 'System', description: 'Health and status' },
          { name: 'Auth', description: 'Login, register, refresh, Ory SSO' },
          { name: 'Users', description: 'User management (super admin)' },
          { name: 'Uploads', description: 'S3 file uploads' },
          { name: 'Regions', description: 'Wilayah Indonesia via BGN SIPGN gateway (kode dagri)' },
          { name: 'Inspections', description: 'Sidak / inspections' },
          { name: 'Followups', description: 'Tindak lanjut' },
          { name: 'Sanctions', description: 'Sanksi' },
          { name: 'Complaints', description: 'Pengaduan' },
          { name: 'News', description: 'Berita' },
          { name: 'Documents', description: 'Dokumen' },
          { name: 'Hero Slides', description: 'Homepage carousel' },
          { name: 'Kitchens', description: 'Dapur SPPG' },
          { name: 'Master Data', description: 'Reference data' },
          { name: 'Dashboard', description: 'Aggregated stats' },
          { name: 'Feature Flags', description: 'Menu visibility toggles' },
        ],
      },
      scalar: {
        theme: 'kepler',
      },
    }),
  )
  .use(api);

ensureBucket()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`API running at http://localhost:${env.PORT}/api`);
      console.log(`API docs at http://localhost:${env.PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize S3 bucket:', err);
    process.exit(1);
  });

export default app;
