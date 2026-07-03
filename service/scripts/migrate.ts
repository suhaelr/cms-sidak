import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import { env } from '../src/config';

async function migrate() {
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  await sql`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  const migrationsDir = join(import.meta.dir, '../src/db/migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const [applied] = await sql<{ name: string }[]>`SELECT name FROM _migrations WHERE name = ${file}`;
    if (applied) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    if (file === '0000_init.sql') {
      const [exists] = await sql<{ reg: string | null }[]>`SELECT to_regclass('public.users') AS reg`;
      if (exists?.reg) {
        console.log(`Skipping ${file} (schema already exists)`);
        await sql`INSERT INTO _migrations (name) VALUES (${file})`;
        continue;
      }
    }

    const content = readFileSync(join(migrationsDir, file), 'utf-8');
    console.log(`Applying ${file}...`);
    await sql.unsafe(content);
    await sql`INSERT INTO _migrations (name) VALUES (${file})`;
  }

  await sql.end();
  console.log('Migrations applied successfully');
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
