import { env } from '../config';
import { getGatewayClientToken } from '../lib/gateway-client-token';

const GATEWAY_BASE = `${env.GATEWAY_URL.replace(/\/$/, '')}/api/utils/region`;

interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface ListEnvelope<T> {
  data: T[];
  meta: PaginationMeta;
}

interface PaginatedBlock<T> {
  data: T[];
  meta: PaginationMeta;
}

interface ProvinsiRow {
  kode_prov_dagri: string | null;
  provinsi: string;
}

interface KabkoRow {
  kode_kabko_dagri: string | null;
  kabko: string;
  kode_prov_dagri?: string | null;
}

interface KecamatanRow {
  kode_kec_dagri: string | null;
  kecamatan: string;
}

interface KelurahanRow {
  kode_kel_dagri: string | null;
  kelurahan: string;
}

interface WilayahHierarchy {
  provinsi: ProvinsiRow;
  kabupaten_kota: KabkoRow;
  kecamatan: KecamatanRow;
  kelurahan: KelurahanRow;
}

export interface RegionListItem {
  id: string;
  name: string;
  type: 'province' | 'city' | 'district' | 'village';
  kode_dagri: string;
  parent_id?: string | null;
}

export interface RegionChainNode {
  name: string;
  type: 'province' | 'city' | 'district' | 'village';
  parent: RegionChainNode | null;
}

const hierarchyCache = new Map<string, { at: number; value: WilayahHierarchy | null }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Strip separators for comparisons and hierarchy query params (kel ≤ 10 digits). */
export function normalizeKodeDagri(kode: string): string {
  return kode.trim().replace(/\D/g, '');
}

/** Kemendagri dagri format for gateway path lookups (e.g. 3204 → 32.04). */
export function toDagriKode(digits: string): string {
  const len = digits.length;
  if (len <= 2) return digits;
  if (len <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (len <= 6) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  if (len <= 10) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  throw new Error(`Kode dagri too long: ${digits}`);
}

/** Kode as expected by SIPGN gateway detail/list-by-parent paths. */
export function gatewayKode(kode: string): string {
  const trimmed = kode.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('.')) return trimmed;
  const digits = normalizeKodeDagri(trimmed);
  if (!digits) return trimmed;
  return toDagriKode(digits);
}

function kodeEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalizeKodeDagri(a) === normalizeKodeDagri(b);
}

function hierarchyParams(kode: string): URLSearchParams {
  const normalized = normalizeKodeDagri(kode);
  if (!normalized) {
    throw new Error('Invalid kode dagri');
  }

  const params = new URLSearchParams({ kode_sumber: 'dagri' });
  const len = normalized.length;
  if (len <= 2) params.set('kode_prov', normalized);
  else if (len <= 4) params.set('kode_kabko', normalized);
  else if (len <= 6) params.set('kode_kec', normalized);
  else if (len <= 10) params.set('kode_kel', normalized);
  else throw new Error(`Kode dagri too long: ${kode}`);
  return params;
}

/** Split a dagri kode into WilayahSelect values without calling hirarki. */
export function parseWilayahKode(kode: string): {
  provinsi: string;
  kabkota: string;
  kecamatan: string;
  desa: string;
} | null {
  const digits = normalizeKodeDagri(kode);
  if (digits.length < 2) return null;

  const provinsi = toDagriKode(digits.slice(0, 2));
  if (digits.length === 2) {
    return { provinsi, kabkota: '', kecamatan: '', desa: '' };
  }

  const kabkota = toDagriKode(digits.slice(0, 4));
  if (digits.length <= 4) {
    return { provinsi, kabkota, kecamatan: '', desa: '' };
  }

  const kecamatan = toDagriKode(digits.slice(0, 6));
  if (digits.length <= 6) {
    return { provinsi, kabkota, kecamatan, desa: '' };
  }

  return {
    provinsi,
    kabkota,
    kecamatan,
    desa: gatewayKode(kode),
  };
}

function isGatewayNotFound(err: unknown): boolean {
  return err instanceof Error && /\(404\)|NOT_FOUND/i.test(err.message);
}

export class WilayahAuthError extends Error {
  constructor() {
    super('Wilayah gateway credentials not configured — set ORY_OIDC client credentials or GATEWAY_ACCESS_TOKEN');
    this.name = 'WilayahAuthError';
  }
}

async function gatewayFetch<T>(
  path: string,
  params: Record<string, string | number | undefined | null>,
): Promise<T> {
  let token: string;
  try {
    token = await getGatewayClientToken();
  } catch {
    throw new WilayahAuthError();
  }
  const url = new URL(path.startsWith('http') ? path : `${GATEWAY_BASE}${path.startsWith('/') ? '' : '/'}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new Error(`Wilayah gateway rejected credentials (401): ${text || 'invalid or expired Ory token'}`);
    }
    throw new Error(`Wilayah gateway error (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

function extractPaginated<T>(payload: Record<string, unknown>, keys: string[]): PaginatedBlock<T> | null {
  for (const key of keys) {
    const block = payload[key];
    if (block && typeof block === 'object' && 'data' in (block as object)) {
      return block as PaginatedBlock<T>;
    }
  }
  return null;
}

async function fetchPaginatedList<T>(
  path: string,
  params: Record<string, string | number | undefined | null>,
): Promise<ListEnvelope<T>> {
  const pageSize = Math.min(Number(params.page_size) || 100, 100);
  const requestedPage = Number(params.page) || 1;
  const fetchAll = !params.page;

  if (!fetchAll) {
    const res = await gatewayFetch<ListEnvelope<T>>(path, { ...params, page_size: pageSize });
    return res;
  }

  const all: T[] = [];
  let page = 1;
  let meta: PaginationMeta = {
    page: 1,
    page_size: pageSize,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  };

  while (true) {
    const res = await gatewayFetch<ListEnvelope<T>>(path, { ...params, page, page_size: pageSize });
    all.push(...(res.data || []));
    meta = res.meta;
    if (!res.meta?.has_next) break;
    page += 1;
  }

  return { data: all, meta: { ...meta, page: requestedPage, total: all.length, total_pages: 1, has_next: false } };
}

function toRegionItem(
  type: RegionListItem['type'],
  kode: string | null | undefined,
  name: string,
  parentId?: string | null,
): RegionListItem | null {
  if (!kode) return null;
  return { id: kode, name, type, kode_dagri: kode, parent_id: parentId ?? null };
}

async function listProvinceChildren(
  parentKode: string,
  page: number,
  limit: number,
  search?: string,
): Promise<ListEnvelope<RegionListItem>> {
  const kode = gatewayKode(parentKode);
  const detail = await gatewayFetch<{ data: Record<string, unknown> }>(
    `/v1/provinsi/dagri/${encodeURIComponent(kode)}`,
    { page, page_size: limit, search },
  );

  const paginated = extractPaginated<KabkoRow>(detail.data, ['kabupaten_kota', 'kabko']);
  const rows = paginated?.data ?? [];
  const meta = paginated?.meta ?? {
    page,
    page_size: limit,
    total: rows.length,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };

  const data = rows
    .map((row) => toRegionItem('city', row.kode_kabko_dagri, row.kabko, parentKode))
    .filter((r): r is RegionListItem => !!r);

  return { data, meta };
}

async function listCityChildren(
  parentKode: string,
  page: number,
  limit: number,
  search?: string,
): Promise<ListEnvelope<RegionListItem>> {
  const kode = gatewayKode(parentKode);
  const detail = await gatewayFetch<{ data: Record<string, unknown> }>(
    `/v1/kabupaten-kota/dagri/${encodeURIComponent(kode)}`,
    { page, page_size: limit, search },
  );

  const paginated = extractPaginated<KecamatanRow>(detail.data, ['kecamatan']);
  const rows = paginated?.data ?? [];
  const meta = paginated?.meta ?? {
    page,
    page_size: limit,
    total: rows.length,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };

  const data = rows
    .map((row) => toRegionItem('district', row.kode_kec_dagri, row.kecamatan, parentKode))
    .filter((r): r is RegionListItem => !!r);

  return { data, meta };
}

async function listDistrictChildren(
  parentKode: string,
  page: number,
  limit: number,
  search?: string,
): Promise<ListEnvelope<RegionListItem>> {
  const kode = gatewayKode(parentKode);
  const detail = await gatewayFetch<{ data: Record<string, unknown> }>(
    `/v1/kecamatan/dagri/${encodeURIComponent(kode)}`,
    { page, page_size: limit, search },
  );

  const paginated = extractPaginated<KelurahanRow>(detail.data, ['kelurahan']);
  const rows = paginated?.data ?? [];
  const meta = paginated?.meta ?? {
    page,
    page_size: limit,
    total: rows.length,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };

  const data = rows
    .map((row) => toRegionItem('village', row.kode_kel_dagri, row.kelurahan, parentKode))
    .filter((r): r is RegionListItem => !!r);

  return { data, meta };
}

export async function listWilayahRegions(
  opts: {
    type?: string;
    parentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
): Promise<{ data: RegionListItem[]; count: number }> {
  const type = opts.type || 'province';
  const page = opts.page || 1;
  const limit = Math.min(opts.limit || 50, 100);
  const search = opts.search;

  if (type === 'province') {
    const fetchAll = (opts.limit ?? 50) > 100;
    const res = await fetchPaginatedList<ProvinsiRow>(
      '/v1/provinsi',
      { page: fetchAll ? undefined : page, page_size: limit, search },
    );
    const data = res.data
      .map((row) => toRegionItem('province', row.kode_prov_dagri, row.provinsi))
      .filter((r): r is RegionListItem => !!r);
    return { data, count: res.meta.total };
  }

  if (type === 'city') {
    if (opts.parentId) {
      const res = await listProvinceChildren(gatewayKode(opts.parentId), page, limit, search);
      return { data: res.data, count: res.meta.total };
    }
    const res = await fetchPaginatedList<KabkoRow>(
      '/v1/kabupaten-kota',
      { page: (opts.limit ?? 50) > 100 ? undefined : page, page_size: limit, search },
    );
    const data = res.data
      .map((row) => toRegionItem('city', row.kode_kabko_dagri, row.kabko, row.kode_prov_dagri))
      .filter((r): r is RegionListItem => !!r);
    return { data, count: res.meta.total };
  }

  if (type === 'district') {
    if (!opts.parentId) {
      const res = await fetchPaginatedList<KecamatanRow>(
        '/v1/kecamatan',
        { page: (opts.limit ?? 50) > 100 ? undefined : page, page_size: limit, search },
      );
      const data = res.data
        .map((row) => toRegionItem('district', row.kode_kec_dagri, row.kecamatan, row.kode_kabko_dagri))
        .filter((r): r is RegionListItem => !!r);
      return { data, count: res.meta.total };
    }
    const res = await listCityChildren(gatewayKode(opts.parentId), page, limit, search);
    return { data: res.data, count: res.meta.total };
  }

  if (type === 'village') {
    if (!opts.parentId) {
      const res = await fetchPaginatedList<KelurahanRow>(
        '/v1/kelurahan',
        { page: (opts.limit ?? 50) > 100 ? undefined : page, page_size: limit, search },
      );
      const data = res.data
        .map((row) => toRegionItem('village', row.kode_kel_dagri, row.kelurahan, row.kode_kec_dagri))
        .filter((r): r is RegionListItem => !!r);
      return { data, count: res.meta.total };
    }
    const res = await listDistrictChildren(gatewayKode(opts.parentId), page, limit, search);
    return { data: res.data, count: res.meta.total };
  }

  throw new Error(`Unknown region type: ${type}`);
}

async function fetchHierarchy(kode: string): Promise<WilayahHierarchy | null> {
  const cacheKey = normalizeKodeDagri(kode) || kode;
  const cached = hierarchyCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const digits = normalizeKodeDagri(kode);
  if (!digits) return null;

  const attemptLengths = [...new Set(
    [digits.length, 10, 6, 4, 2].filter((len) => len <= digits.length && len >= 2),
  )].sort((a, b) => b - a);

  for (const len of attemptLengths) {
    try {
      const params = hierarchyParams(digits.slice(0, len));
      const res = await gatewayFetch<{ data: WilayahHierarchy[] }>(`/v1/hirarki?${params}`, {});
      const value = res.data?.[0] ?? null;
      if (value) {
        hierarchyCache.set(cacheKey, { at: Date.now(), value });
        return value;
      }
    } catch (err) {
      if (!isGatewayNotFound(err)) throw err;
    }
  }

  hierarchyCache.set(cacheKey, { at: Date.now(), value: null });
  return null;
}

function node(name: string, type: RegionChainNode['type'], parent: RegionChainNode | null): RegionChainNode {
  return { name, type, parent };
}

export async function buildRegionChainFromKode(
  kodeDagri: string | null,
): Promise<RegionChainNode | null> {
  if (!kodeDagri) return null;

  const h = await fetchHierarchy(kodeDagri);
  if (!h) {
    const parsed = parseWilayahKode(kodeDagri);
    if (parsed?.desa) return { name: parsed.desa, type: 'village', parent: null };
    return { name: kodeDagri, type: 'province', parent: null };
  }

  const provNode = h.provinsi?.provinsi
    ? node(h.provinsi.provinsi, 'province', null)
    : null;
  const kabNode =
    h.kabupaten_kota?.kabko && h.kabupaten_kota.kode_kabko_dagri
      ? node(h.kabupaten_kota.kabko, 'city', provNode)
      : provNode;
  const kecNode =
    h.kecamatan?.kecamatan && h.kecamatan.kode_kec_dagri
      ? node(h.kecamatan.kecamatan, 'district', kabNode)
      : kabNode;
  const kelNode =
    h.kelurahan?.kelurahan && h.kelurahan.kode_kel_dagri
      ? node(h.kelurahan.kelurahan, 'village', kecNode)
      : kecNode;

  const parsed = parseWilayahKode(kodeDagri);
  if (parsed?.desa && !h.kelurahan?.kode_kel_dagri) {
    return node(parsed.desa, 'village', kecNode);
  }

  if (kodeEquals(h.kelurahan?.kode_kel_dagri, kodeDagri)) return kelNode;
  if (kodeEquals(h.kecamatan?.kode_kec_dagri, kodeDagri)) return kecNode;
  if (kodeEquals(h.kabupaten_kota?.kode_kabko_dagri, kodeDagri)) return kabNode;
  if (kodeEquals(h.provinsi?.kode_prov_dagri, kodeDagri)) return provNode;

  return kelNode || kecNode || kabNode || provNode || { name: kodeDagri, type: 'province', parent: null };
}

export async function resolveRegionLabel(
  kodeDagri: string | null,
): Promise<{ name: string } | null> {
  if (!kodeDagri) return null;
  try {
    const chain = await buildRegionChainFromKode(kodeDagri);
    if (!chain) return null;
    return { name: chain.name };
  } catch {
    return null;
  }
}

function uniqueKodes(kodes: Iterable<string | null | undefined>): string[] {
  return [...new Set([...kodes].filter((k): k is string => !!k))];
}

/** Resolve many region labels in parallel with deduplicated gateway calls. */
export async function resolveRegionLabels(
  kodes: Iterable<string | null | undefined>,
): Promise<Map<string, { name: string } | null>> {
  const unique = uniqueKodes(kodes);
  const entries = await Promise.all(
    unique.map(async (kode) => [kode, await resolveRegionLabel(kode)] as const),
  );
  return new Map(entries);
}

/** Build many region chains in parallel with deduplicated gateway calls. */
export async function buildRegionChainsFromKodes(
  kodes: Iterable<string | null | undefined>,
): Promise<Map<string, RegionChainNode | null>> {
  const unique = uniqueKodes(kodes);
  const entries = await Promise.all(
    unique.map(async (kode) => [kode, await buildRegionChainFromKode(kode)] as const),
  );
  return new Map(entries);
}

export async function getWilayahFormValues(
  kode: string,
): Promise<{ provinsi: string; kabkota: string; kecamatan: string; desa: string } | null> {
  const parsed = parseWilayahKode(kode);
  if (!parsed) return null;

  // Hirarki often 404s for kelurahan-level kodes; enrich names when a parent lookup succeeds.
  try {
    const h = await fetchHierarchy(kode);
    if (h) {
      return {
        provinsi: h.provinsi?.kode_prov_dagri || parsed.provinsi,
        kabkota: h.kabupaten_kota?.kode_kabko_dagri || parsed.kabkota,
        kecamatan: h.kecamatan?.kode_kec_dagri || parsed.kecamatan,
        desa: parsed.desa || h.kelurahan?.kode_kel_dagri || '',
      };
    }
  } catch {
    // Parsed structure is enough for WilayahSelect hydration.
  }

  return parsed;
}

export async function getWilayahRegionByKode(
  kode: string,
): Promise<RegionListItem | null> {
  const chain = await buildRegionChainFromKode(kode);
  if (!chain) return null;

  let type: RegionListItem['type'] = 'province';
  if (chain.type) type = chain.type;

  return { id: kode, name: chain.name, type, kode_dagri: kode };
}
