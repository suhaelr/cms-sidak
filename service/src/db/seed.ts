import { db, schema } from '../db/index';
import { hashPassword } from '../lib/auth';
import { DEMO_NEWS } from './seed-news';

const DEMO_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', email: 'superadmin@bgn.go.id', fullName: 'Super Admin', role: 'super_admin' as const },
  { id: '22222222-2222-2222-2222-222222222222', email: 'adminpusat@bgn.go.id', fullName: 'Admin Pusat', role: 'admin_pusat' as const },
  { id: '33333333-3333-3333-3333-333333333333', email: 'adminwilayah@bgn.go.id', fullName: 'Admin Wilayah', role: 'admin_wilayah' as const },
  { id: '44444444-4444-4444-4444-444444444444', email: 'inspektor@bgn.go.id', fullName: 'Inspektor', role: 'inspektor' as const },
  { id: '55555555-5555-5555-5555-555555555555', email: 'verifikator@bgn.go.id', fullName: 'Verifikator', role: 'verifikator' as const },
];

const HERO_SLIDES = [
  { title: 'Inspeksi Dapur SPPG Jakarta', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80', sortOrder: 1 },
  { title: 'Pemeriksaan Kualitas Bahan Makanan', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80', sortOrder: 2 },
  { title: 'Sidak Kebersihan Dapur Program MBG', imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1920&q=80', sortOrder: 3 },
  { title: 'Monitoring Proses Pengolahan Makanan', imageUrl: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1920&q=80', sortOrder: 4 },
  { title: 'Verifikasi Standar Gizi Makanan', imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1920&q=80', sortOrder: 5 },
];

export async function seed() {
  const passwordHash = await hashPassword('demo123');

  for (const demo of DEMO_USERS) {
    await db
      .insert(schema.users)
      .values({
        id: demo.id,
        email: demo.email,
        fullName: demo.fullName,
        passwordHash,
        authProvider: 'local',
      })
      .onConflictDoNothing();

    await db
      .insert(schema.userRoles)
      .values({ userId: demo.id, role: demo.role })
      .onConflictDoNothing();
  }

  for (const slide of HERO_SLIDES) {
    const existing = await db.select().from(schema.heroSlides).limit(1);
    if (existing.length) break;
    await db.insert(schema.heroSlides).values(slide);
  }

  const superAdminId = DEMO_USERS[0].id;
  for (const article of DEMO_NEWS) {
    await db
      .insert(schema.news)
      .values({
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category,
        content: article.content,
        coverImage: article.coverImage,
        regionId: article.regionId,
        publishedAt: article.publishedAt,
        status: article.status,
        isHighlight: article.isHighlight,
        isBreaking: article.isBreaking,
        tags: article.tags,
        createdBy: superAdminId,
      })
      .onConflictDoNothing({ target: schema.news.slug });
  }

  console.log('Seed complete: 5 demo users (password: demo123) + hero slides + 20 news articles');
}

if (import.meta.main) {
  seed().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
