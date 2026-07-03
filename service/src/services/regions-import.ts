import { db, schema } from '../db';
import { eq, and, sql, ilike, desc, asc } from 'drizzle-orm';

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

type RegionInsert = typeof schema.regions.$inferInsert;

async function countRegions(type?: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.regions)
    .where(type ? eq(schema.regions.type, type) : undefined);
  return row?.count ?? 0;
}

async function insertInBatches(rows: RegionInsert[], batchSize = 500) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await db.insert(schema.regions).values(batch);
    inserted += batch.length;
  }
  return inserted;
}

export async function clearVillages() {
  await db.delete(schema.regions).where(eq(schema.regions.type, 'village'));
  return { ok: true };
}

export async function importProvinces() {
  await db.delete(schema.regions).where(sql`true`);
  const provinces = await fetchJSON(`${BASE_URL}/provinces.json`);
  const rows = provinces.map((p: { id: string; name: string }) => ({
    name: p.name,
    type: 'province',
    legacyId: parseInt(p.id),
  }));
  if (rows.length) await db.insert(schema.regions).values(rows);
  return { ok: true, inserted: rows.length, next: 'cities' };
}

export async function ensureRegionHierarchy() {
  const seeded = { provinces: 0, cities: 0, districts: 0 };

  if ((await countRegions('province')) === 0) {
    const provinces = await fetchJSON(`${BASE_URL}/provinces.json`);
    const rows = provinces.map((p: { id: string; name: string }) => ({
      name: p.name,
      type: 'province',
      legacyId: parseInt(p.id),
    }));
    seeded.provinces = rows.length ? await insertInBatches(rows) : 0;
  }

  if ((await countRegions('city')) === 0) {
    seeded.cities = (await importCities()).inserted;
  }

  if ((await countRegions('district')) === 0) {
    seeded.districts = (await importDistricts()).inserted;
  }

  return { ok: true, seeded };
}

export async function importCities() {
  const dbProvinces = await db
    .select({ id: schema.regions.id, legacyId: schema.regions.legacyId })
    .from(schema.regions)
    .where(eq(schema.regions.type, 'province'));
  const parentMap: Record<number, string> = {};
  for (const p of dbProvinces) {
    if (p.legacyId) parentMap[p.legacyId] = p.id;
  }

  const provinces = await fetchJSON(`${BASE_URL}/provinces.json`);
  let allCities: Array<{
    name: string;
    type: string;
    legacyId: number;
    parentId: string | null;
  }> = [];

  for (const prov of provinces) {
    const cities = await fetchJSON(`${BASE_URL}/regencies/${prov.id}.json`);
    allCities = allCities.concat(
      cities.map((c: { id: string; name: string; province_id: string }) => ({
        name: c.name,
        type: 'city',
        legacyId: parseInt(c.id),
        parentId: parentMap[parseInt(c.province_id)] || null,
      })),
    );
  }

  const inserted = await insertInBatches(allCities);
  return { ok: true, inserted, next: 'districts' };
}

export async function importDistricts() {
  const dbCities = await db
    .select({ id: schema.regions.id, legacyId: schema.regions.legacyId })
    .from(schema.regions)
    .where(eq(schema.regions.type, 'city'));
  const parentMap: Record<number, string> = {};
  for (const c of dbCities) {
    if (c.legacyId) parentMap[c.legacyId] = c.id;
  }

  const provinces = await fetchJSON(`${BASE_URL}/provinces.json`);
  const allDistricts: Array<{
    name: string;
    type: string;
    legacyId: number;
    parentId: string | null;
  }> = [];

  for (const prov of provinces) {
    const cities = await fetchJSON(`${BASE_URL}/regencies/${prov.id}.json`);
    for (const city of cities) {
      try {
        const districts = await fetchJSON(`${BASE_URL}/districts/${city.id}.json`);
        for (const d of districts) {
          allDistricts.push({
            name: d.name,
            type: 'district',
            legacyId: parseInt(d.id),
            parentId: parentMap[parseInt(d.regency_id)] || null,
          });
        }
      } catch {
        // skip
      }
    }
  }

  const inserted = await insertInBatches(allDistricts);
  return { ok: true, inserted, next: 'villages' };
}

export async function listProvincesForVillages() {
  const provinces = await fetchJSON(`${BASE_URL}/provinces.json`);
  return {
    ok: true,
    provinces: provinces.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })),
  };
}

export async function importVillages(provinceId: string) {
  await ensureRegionHierarchy();

  const parentMap: Record<number, string> = {};
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const data = await db
      .select({ id: schema.regions.id, legacyId: schema.regions.legacyId })
      .from(schema.regions)
      .where(and(eq(schema.regions.type, 'district'), sql`${schema.regions.legacyId} IS NOT NULL`))
      .limit(batchSize)
      .offset(from);
    if (!data.length) break;
    for (const d of data) {
      if (d.legacyId) parentMap[d.legacyId] = d.id;
    }
    if (data.length < batchSize) break;
    from += batchSize;
  }

  const cities = await fetchJSON(`${BASE_URL}/regencies/${provinceId}.json`);
  const allVillages: Array<{
    name: string;
    type: string;
    legacyId: number;
    parentId: string | null;
  }> = [];

  for (const city of cities) {
    try {
      const districts = await fetchJSON(`${BASE_URL}/districts/${city.id}.json`);
      for (const district of districts) {
        try {
          const villages = await fetchJSON(`${BASE_URL}/villages/${district.id}.json`);
          for (const v of villages) {
            allVillages.push({
              name: v.name,
              type: 'village',
              legacyId: parseInt(v.id),
              parentId: parentMap[parseInt(v.district_id)] || null,
            });
          }
        } catch {
          // skip
        }
      }
    } catch {
      // skip
    }
  }

  const inserted = await insertInBatches(allVillages);
  return { ok: true, inserted, province_id: provinceId };
}

export async function clearAllRegions() {
  await db.delete(schema.regions).where(sql`true`);
  return { ok: true };
}

export async function importRegionRecords(
  type: string,
  records: Array<{ name: string; legacy_id: number; legacy_parent_id?: number }>,
) {
  const parentTypeMap: Record<string, string> = {
    city: 'province',
    district: 'city',
    village: 'district',
  };

  let parentMap: Record<number, string> = {};
  if (type !== 'province') {
    const parentType = parentTypeMap[type];
    let from = 0;
    const batchSize = 1000;
    const allParents: Array<{ id: string; legacyId: number | null }> = [];
    while (true) {
      const data = await db
        .select({ id: schema.regions.id, legacyId: schema.regions.legacyId })
        .from(schema.regions)
        .where(and(eq(schema.regions.type, parentType), sql`${schema.regions.legacyId} IS NOT NULL`))
        .limit(batchSize)
        .offset(from);
      if (!data.length) break;
      allParents.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }
    parentMap = Object.fromEntries(
      allParents.filter((p) => p.legacyId).map((p) => [p.legacyId!, p.id]),
    );
  }

  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const rows = batch.map((r) => ({
      name: r.name,
      type,
      legacyId: r.legacy_id,
      parentId:
        type !== 'province' && r.legacy_parent_id
          ? parentMap[r.legacy_parent_id] || null
          : null,
    }));
    await db.insert(schema.regions).values(rows);
    inserted += batch.length;
  }
  return { ok: true, inserted };
}

export async function listRegions(opts: {
  type?: string;
  parentId?: string;
  search?: string;
  page?: number;
  limit?: number;
  admin?: boolean;
}) {
  const conditions = [];
  if (opts.type) conditions.push(eq(schema.regions.type, opts.type));
  if (opts.parentId) conditions.push(eq(schema.regions.parentId, opts.parentId));
  if (opts.search) conditions.push(ilike(schema.regions.name, `%${opts.search}%`));

  const limit = opts.limit || 50;
  const offset = ((opts.page || 1) - 1) * limit;

  const rows = await db
    .select()
    .from(schema.regions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(schema.regions.name))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.regions)
    .where(conditions.length ? and(...conditions) : undefined);

  return { data: rows, count };
}
