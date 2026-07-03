import { rowToSnake } from './serialize';
import { gatewayKode } from '../services/wilayah-gateway';
import type { AuthUser } from '../types/auth';
import { requireAdminUser } from '../middleware/auth';

export function snakeRow(row: Record<string, unknown>) {
  return rowToSnake(row);
}

export function isAdmin(user: AuthUser | null) {
  return !!user?.roles?.length;
}

export function toRegionId(value?: string | null): string | null {
  if (!value) return null;
  try {
    return gatewayKode(value);
  } catch {
    return null;
  }
}

export function toTimestamp(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function resolvePublishedAt(isPublished: boolean, publishedAt: unknown): Date | null {
  const parsed = toTimestamp(publishedAt);
  if (parsed) return parsed;
  return isPublished ? new Date() : null;
}

export function parsePaginationQuery(query: Record<string, string | undefined>) {
  const hasPagination = query.page != null || query.limit != null;
  const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || '10', 10) || 10));
  return { hasPagination, page, limit, offset: (page - 1) * limit };
}

export function paginatedResponse<T>(rows: T[], count: number, page: number, limit: number) {
  return {
    data: rows,
    count,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(count / limit)),
  };
}

/** Returns admin user or sets 403 on `set` and returns null. */
export function guardAdmin(
  user: AuthUser | null,
  set: { status?: number | string },
): AuthUser | null {
  try {
    return requireAdminUser(user);
  } catch {
    set.status = 403;
    return null;
  }
}
