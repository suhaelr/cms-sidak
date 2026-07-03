import { Elysia, t } from 'elysia';
import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { complaints as complaintsDocs } from '../../openapi/docs';
import { guardAdmin, isAdmin, snakeRow } from '../../lib/route-helpers';
import { buildRegionChainsFromKodes } from '../../services/wilayah-gateway';
import { clientIp, verifyTurnstile } from '../../lib/turnstile';

export const complaintsRoutes = new Elysia({ name: 'complaints-routes' })
  .use(authPlugin)
  .group('/complaints', (app) =>
    app
      .get('/status', async ({ query, set }) => {
        if (!query.ticket_no || !query.contact) {
          set.status = 400;
          return { error: 'ticket_no and contact required' };
        }
        const [row] = await db.select().from(schema.complaints)
          .where(and(eq(schema.complaints.ticketNo, query.ticket_no), eq(schema.complaints.contact, query.contact)))
          .limit(1);
        if (!row) { set.status = 404; return { error: 'Not found' }; }
        return snakeRow(row as Record<string, unknown>);
      }, complaintsDocs.status)
      .get('/', async ({ user, set }) => {
        if (!isAdmin(user)) { set.status = 403; return { error: 'Forbidden' }; }
        const rows = await db.select().from(schema.complaints).orderBy(desc(schema.complaints.createdAt));
        const regionMap = await buildRegionChainsFromKodes(rows.map((c) => c.regionId));
        return rows.map((c) => ({
          ...snakeRow(c as Record<string, unknown>),
          regions: c.regionId ? regionMap.get(c.regionId) ?? null : null,
        }));
      }, complaintsDocs.list)
      .post('/', async ({ body, request, set }) => {
        if (!(await verifyTurnstile(body.turnstile_token, clientIp(request)))) {
          set.status = 400;
          return { error: 'Verifikasi CAPTCHA gagal atau kedaluwarsa' };
        }
        const [row] = await db.insert(schema.complaints).values({
          ticketNo: body.ticket_no,
          name: body.name,
          contact: body.contact,
          regionId: body.region_id,
          topic: body.topic,
          content: body.content,
          attachmentUrl: body.attachment_url,
          status: 'new',
        }).returning();
        return snakeRow(row as Record<string, unknown>);
      }, {
        ...complaintsDocs.create,
        body: t.Object({
          ticket_no: t.String(),
          name: t.String(),
          contact: t.String(),
          topic: t.String(),
          content: t.String(),
          attachment_url: t.Optional(t.Nullable(t.String())),
          region_id: t.Optional(t.Nullable(t.String())),
          turnstile_token: t.Optional(t.String()),
        }),
      })
      .patch('/:id', async ({ user, params, body, set }) => {
        if (!guardAdmin(user, set)) return { error: 'Forbidden' };
        const [row] = await db.update(schema.complaints).set({
          status: body.status,
          publicStatusMessage: body.public_status_message,
          internalNotes: body.internal_notes,
        }).where(eq(schema.complaints.id, params.id)).returning();
        return snakeRow(row as Record<string, unknown>);
      }, complaintsDocs.update),
  );
