export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    Array.isArray((value as PaginatedResponse<T>).data)
  );
}

export function parseListResponse<T>(response: unknown, page: number, limit: number) {
  if (isPaginatedResponse<T>(response)) {
    return {
      items: response.data,
      count: response.count ?? response.data.length,
      totalPages: response.total_pages ?? Math.max(1, Math.ceil((response.count ?? 0) / limit)),
    };
  }

  if (Array.isArray(response)) {
    const count = response.length;
    const offset = (page - 1) * limit;
    return {
      items: response.slice(offset, offset + limit) as T[],
      count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    };
  }

  return { items: [] as T[], count: 0, totalPages: 1 };
}

export function buildListQuery(params: Record<string, string | number | undefined | null>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
