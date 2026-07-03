import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { useInvalidateApi } from '@/hooks/use-invalidate-api';
import { getErrorMessage } from '@/lib/utils';

export function useCrud<T extends { id: string }>(endpoint: string) {
  const pathname = endpoint.split('?')[0];
  const { toast } = useToast();
  const invalidate = useInvalidateApi();

  const { data: items = [], isLoading, refetch } = useApiQuery<T[]>(endpoint);

  const createMutation = useMutation({
    mutationFn: (item: Partial<T>) => api.post(endpoint, item),
    onSuccess: () => {
      invalidate(pathname);
      toast({ title: 'Berhasil', description: 'Data berhasil ditambahkan' });
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, item }: { id: string; item: Partial<T> }) =>
      api.patch(`${pathname}/${id}`, item),
    onSuccess: () => {
      invalidate(pathname);
      toast({ title: 'Berhasil', description: 'Data berhasil diperbarui' });
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${pathname}/${id}`),
    onSuccess: () => {
      invalidate(pathname);
      toast({ title: 'Berhasil', description: 'Data berhasil dihapus' });
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const create = async (item: Partial<T>) => {
    try {
      await createMutation.mutateAsync(item);
      return true;
    } catch {
      return false;
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    try {
      await updateMutation.mutateAsync({ id, item });
      return true;
    } catch {
      return false;
    }
  };

  const remove = async (id: string) => {
    try {
      await removeMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return { items, loading: isLoading, load: refetch, create, update, remove };
}
