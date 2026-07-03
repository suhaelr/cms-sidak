import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiResourceKey } from '@/lib/query-keys';

export function useInvalidateApi() {
  const queryClient = useQueryClient();

  return useCallback(
    (...pathnames: string[]) => {
      for (const pathname of pathnames) {
        queryClient.invalidateQueries({ queryKey: apiResourceKey(pathname) });
      }
    },
    [queryClient],
  );
}
