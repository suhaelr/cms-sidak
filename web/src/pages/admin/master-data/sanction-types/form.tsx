import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useFindById } from '@/hooks/use-find-by-id';
import { X } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import type { SanctionType } from '@/lib/api-types';
import { getErrorMessage } from '@/lib/utils';

const SanctionTypesFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', description: '' });

  const { data: item, isLoading } = useFindById<SanctionType>('/sanction-types', id, {
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isEdit || isLoading) return;
    if (!item) {
      toast({ title: 'Data tidak ditemukan', variant: 'destructive' });
      navigate(adminPaths.masterData.list('sanction-types'));
      return;
    }
    setForm({ name: item.name, description: item.description || '' });
  }, [item, isEdit, isLoading, navigate, toast]);

  const saveMutation = useApiMutation({
    invalidate: ['/sanction-types'],
    mutationFn: async (payload: typeof form) => {
      if (isEdit) {
        await api.patch(`/sanction-types/${id}`, payload);
      } else {
        await api.post('/sanction-types', payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Berhasil' });
      navigate(adminPaths.masterData.list('sanction-types'));
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.masterData.list('sanction-types'))}>
        <X className="w-4 h-4" /> Batal
      </AdminHeaderButton>
    ),
  });

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="card-elevated p-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nama jenis sanksi"
          required
          className="flex-1 px-3 py-2 text-sm bg-background border rounded-lg"
        />
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Deskripsi"
          className="flex-1 px-3 py-2 text-sm bg-background border rounded-lg"
        />
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          {isEdit ? 'Simpan' : 'Tambah'}
        </button>
      </form>
    </div>
  );
};

export default SanctionTypesFormPage;
