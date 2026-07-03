import { useMemo } from 'react';
import { useApiQuery } from '@/hooks/use-api-query';

export function useFindById<T extends { id: string }>(
  endpoint: string,
  id: string | undefined,
  options?: { auth?: boolean; enabled?: boolean },
) {
  const { data: items = [], isLoading, isFetching } = useApiQuery<T[]>(endpoint, {
    auth: options?.auth,
    enabled: options?.enabled ?? Boolean(id),
  });

  const data = useMemo(
    () => (id ? items.find((item) => item.id === id) ?? null : null),
    [items, id],
  );

  return { data, isLoading: isLoading || isFetching };
}
