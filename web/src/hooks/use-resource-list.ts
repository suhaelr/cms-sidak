import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { useInvalidateApi } from '@/hooks/use-invalidate-api';

export function useResourceList<T>(endpoint: string, auth = true) {
  const pathname = endpoint.split('?')[0];
  const invalidate = useInvalidateApi();

  const query = useApiQuery<T[]>(endpoint, { auth });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`${pathname}/${id}`, auth),
    onSuccess: () => invalidate(pathname),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    remove,
  };
}
