import { Elysia } from 'elysia';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authPlugin } from '../../middleware/auth';
import { dashboard as dashboardDocs } from '../../openapi/docs';
import { isAdmin, snakeRow } from '../../lib/route-helpers';
import { loadKitchensByIds } from '../../services/batch-load';
import { resolveRegionLabels } from '../../services/wilayah-gateway';

export const dashboardRoutes = new Elysia({ name: 'dashboard-routes' })
  .use(authPlugin)
  .get('/dashboard/stats', async ({ user, set }) => {
    if (!isAdmin(user)) { set.status = 403; return { error: 'Forbidden' }; }

    const [
      [inspections],
      [findings],
      [followupsDone],
      [sanctionsActive],
      [complaintsNew],
      [documentsPublic],
      inspectionDates,
      recentInspections,
      recentComplaints,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(schema.inspections),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.findings),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.followups).where(eq(schema.followups.status, 'selesai')),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.sanctions).where(eq(schema.sanctions.status, 'aktif')),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.complaints).where(eq(schema.complaints.status, 'new')),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.documents).where(eq(schema.documents.isPublic, true)),
      db.select({ date: schema.inspections.date }).from(schema.inspections),
      db.select().from(schema.inspections).orderBy(desc(schema.inspections.createdAt)).limit(4),
      db.select().from(schema.complaints).orderBy(desc(schema.complaints.createdAt)).limit(4),
    ]);

    return {
      counts: {
        inspections: inspections.count,
        findings: findings.count,
        followups_done: followupsDone.count,
        sanctions_active: sanctionsActive.count,
        complaints_new: complaintsNew.count,
        documents_public: documentsPublic.count,
      },
      inspection_dates: inspectionDates.map((d) => d.date),
      recent_inspections: recentInspections,
      recent_complaints: recentComplaints,
    };
  }, dashboardDocs.stats)
  .get('/home/stats', async () => {
    const [
      [inspections],
      [findings],
      [sanctions],
      [complaints],
      followUpStatsRows,
      findingRows,
      slides,
      publishedInspections,
      publishedNews,
      sanctionRows,
      inspectionDates,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(schema.inspections),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.findings),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.sanctions),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.complaints),
      db
        .select({ status: schema.followups.status, count: sql<number>`count(*)::int` })
        .from(schema.followups)
        .groupBy(schema.followups.status),
      db.select({ category: schema.findings.category }).from(schema.findings),
      db.select().from(schema.heroSlides).where(eq(schema.heroSlides.isActive, true)).orderBy(asc(schema.heroSlides.sortOrder)),
      db.select().from(schema.inspections)
        .where(eq(schema.inspections.publicationStatus, 'published'))
        .orderBy(desc(schema.inspections.date)).limit(6),
      db.select().from(schema.news)
        .where(eq(schema.news.status, 'published'))
        .orderBy(desc(schema.news.publishedAt)).limit(4),
      db.select().from(schema.sanctions).where(eq(schema.sanctions.isPublic, true)),
      db.select({ date: schema.inspections.date }).from(schema.inspections),
    ]);

    const followUpStats = { selesai: 0, proses: 0, belum: 0 };
    for (const row of followUpStatsRows) {
      if (row.status === 'selesai') followUpStats.selesai = row.count;
      else if (row.status === 'proses') followUpStats.proses = row.count;
      else followUpStats.belum = row.count;
    }

    const kitchenIds = sanctionRows.map((s) => s.kitchenId).filter((id): id is string => !!id);
    const kitchenMap = await loadKitchensByIds(kitchenIds);
    const regionMap = await resolveRegionLabels([...kitchenMap.values()].map((k) => k.regionId));

    const enrichedSanctions = sanctionRows.map((s) => {
      const kitchen = s.kitchenId ? kitchenMap.get(s.kitchenId) : null;
      const region = kitchen?.regionId ? regionMap.get(kitchen.regionId) ?? null : null;
      return {
        ...snakeRow(s as Record<string, unknown>),
        sppg_kitchens: kitchen ? { name: kitchen.name, regions: region } : null,
      };
    });

    return {
      slides: slides.map((s) => snakeRow(s as Record<string, unknown>)),
      total_inspections: inspections.count,
      total_findings: findings.count,
      follow_up_stats: followUpStats,
      total_sanctions: sanctions.count,
      complaint_count: complaints.count,
      finding_categories: findingRows,
      inspection_dates: inspectionDates.map((d) => d.date),
      latest_inspections: publishedInspections,
      latest_news: publishedNews,
      sanctions: enrichedSanctions,
    };
  }, dashboardDocs.home);
