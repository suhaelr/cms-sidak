import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buildListQuery, parseListResponse } from '@/lib/list-query';
import { apiListKey } from '@/lib/query-keys';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

type UsePaginatedListOptions<TFilters extends Record<string, string>> = {
  endpoint: string;
  limit?: number;
  defaultFilters?: TFilters;
  debounceMs?: number;
  auth?: boolean;
};

export function usePaginatedList<T, TFilters extends Record<string, string> = Record<string, never>>({
  endpoint,
  limit = 10,
  defaultFilters = {} as TFilters,
  debounceMs = 300,
  auth = true,
}: UsePaginatedListOptions<TFilters>) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, debounceMs);
  const [filters, setFiltersState] = useState<TFilters>(defaultFilters);
  const [page, setPage] = useState(1);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      ...filters,
    }),
    [page, limit, debouncedSearch, filters],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: apiListKey(endpoint, listParams, auth),
    queryFn: async () => {
      const query = buildListQuery(listParams);
      const response = await api.get<unknown>(`${endpoint}${query}`, auth);
      return parseListResponse<T>(response, page, limit);
    },
  });

  const items = data?.items ?? [];
  const count = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const setFilters = useCallback((next: Partial<TFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
    setPage(1);
  }, []);

  return {
    items,
    count,
    page,
    setPage,
    totalPages,
    limit,
    loading: isLoading,
    load: refetch,
    search,
    setSearch,
    filters,
    setFilter,
    setFilters,
  };
}
