import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DEFAULT_QUERY_STALE_TIME } from '@/lib/query-client';
import { apiQueryKey } from '@/lib/query-keys';

type UseApiQueryOptions<T> = {
  auth?: boolean;
  enabled?: boolean;
  staleTime?: number;
} & Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn' | 'staleTime'>;

export function useApiQuery<T>(path: string, options: UseApiQueryOptions<T> = {}) {
  const { auth = true, enabled = true, staleTime = DEFAULT_QUERY_STALE_TIME, ...rest } = options;

  return useQuery({
    queryKey: apiQueryKey(path, auth),
    queryFn: () => api.get<T>(path, auth),
    enabled,
    staleTime,
    ...rest,
  });
}
