import { Elysia } from 'elysia';
import { eq, inArray } from 'drizzle-orm';
import { db, schema } from '../db';

export type KitchenSummary = {
  id: string;
  code: string;
  name: string;
  regionId: string | null;
};

export async function loadKitchensByIds(ids: string[]): Promise<Map<string, KitchenSummary>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();

  const rows = await db
    .select({
      id: schema.sppgKitchens.id,
      code: schema.sppgKitchens.code,
      name: schema.sppgKitchens.name,
      regionId: schema.sppgKitchens.regionId,
    })
    .from(schema.sppgKitchens)
    .where(inArray(schema.sppgKitchens.id, unique));

  return new Map(rows.map((r) => [r.id, r]));
}

export async function loadFindingsByInspectionIds(
  inspectionIds: string[],
): Promise<Map<string, { severity: string }[]>> {
  const unique = [...new Set(inspectionIds.filter(Boolean))];
  if (!unique.length) return new Map();

  const rows = await db
    .select({
      inspectionId: schema.findings.inspectionId,
      severity: schema.findings.severity,
    })
    .from(schema.findings)
    .where(inArray(schema.findings.inspectionId, unique));

  const map = new Map<string, { severity: string }[]>();
  for (const row of rows) {
    const list = map.get(row.inspectionId) ?? [];
    list.push({ severity: row.severity });
    map.set(row.inspectionId, list);
  }
  return map;
}

export type InspectionSummary = {
  id: string;
  date: string;
  summary: string | null;
  kitchenId: string | null;
};

export async function loadInspectionsByIds(ids: string[]): Promise<Map<string, InspectionSummary>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();

  const rows = await db
    .select({
      id: schema.inspections.id,
      date: schema.inspections.date,
      summary: schema.inspections.summary,
      kitchenId: schema.inspections.kitchenId,
    })
    .from(schema.inspections)
    .where(inArray(schema.inspections.id, unique));

  return new Map(rows.map((r) => [r.id, r]));
}
