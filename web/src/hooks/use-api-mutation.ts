import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { useInvalidateApi } from '@/hooks/use-invalidate-api';

export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, Error, TVariables, TContext> & {
    invalidate?: string[];
  },
) {
  const invalidate = useInvalidateApi();
  const { invalidate: paths = [], onSuccess, ...rest } = options;

  return useMutation({
    ...rest,
    onSuccess: (...args) => {
      paths.forEach((path) => invalidate(path));
      onSuccess?.(...args);
    },
  });
}
