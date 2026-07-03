/**
 * Migrate data from Supabase export to standalone backend.
 *
 * Usage:
 *   1. Export Supabase public schema: pg_dump --schema=public ...
 *   2. Export auth.users emails and encrypted_password from Supabase
 *   3. Set SOURCE_DATABASE_URL and TARGET_DATABASE_URL
 *   4. bun run scripts/migrate-from-supabase.ts
 */
import postgres from 'postgres';

const source = postgres(process.env.SOURCE_DATABASE_URL!);
const target = postgres(process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL!);

async function main() {
  if (!process.env.SOURCE_DATABASE_URL) {
    console.error('Set SOURCE_DATABASE_URL to your Supabase Postgres connection string');
    process.exit(1);
  }

  console.log('Migrating auth.users -> users...');
  const authUsers = await source`
    SELECT id, email, encrypted_password, raw_user_meta_data
    FROM auth.users
  `;

  for (const u of authUsers) {
    const fullName = (u.raw_user_meta_data as { full_name?: string })?.full_name || '';
    await target`
      INSERT INTO users (id, email, password_hash, full_name, auth_provider)
      VALUES (${u.id}, ${u.email}, ${u.encrypted_password}, ${fullName}, 'local')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `;
  }

  const tables = [
    'user_roles', 'regions', 'sppg_kitchens', 'finding_categories', 'sanction_types',
    'inspections', 'inspection_checklists', 'findings', 'medias', 'followups',
    'sanctions', 'news', 'documents', 'complaints', 'audit_logs', 'hero_slides',
  ];

  for (const table of tables) {
    console.log(`Copying ${table}...`);
    const rows = await source.unsafe(`SELECT * FROM public.${table}`);
    if (!rows.length) continue;

    const cols = Object.keys(rows[0]);
    for (const row of rows) {
      const values = cols.map((c) => row[c]);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      await target.unsafe(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values,
      );
    }
  }

  console.log('Migration complete. Migrate storage files from Supabase bucket to S3 separately.');
  await source.end();
  await target.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
