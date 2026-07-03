import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useFindById } from '@/hooks/use-find-by-id';
import { X } from 'lucide-react';
import SearchableSelect from '@/components/shared/SearchableSelect';
import WilayahSelect from '@/components/shared/WilayahSelect';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import type { Kitchen } from '@/lib/api-types';
import { getErrorMessage } from '@/lib/utils';

const emptyForm = () => ({
  code: '',
  name: '',
  address: '',
  region_id: '',
  status: 'active',
});

const KitchensFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm());

  const { data: item, isLoading } = useFindById<Kitchen>('/kitchens', id, { enabled: isEdit });

  useEffect(() => {
    if (!isEdit || isLoading) return;
    if (!item) {
      toast({ title: 'Data tidak ditemukan', variant: 'destructive' });
      navigate(adminPaths.masterData.list('kitchens'));
      return;
    }
    setForm({
      code: item.code,
      name: item.name,
      address: item.address || '',
      region_id: item.region_id || '',
      status: item.status,
    });
  }, [item, isEdit, isLoading, navigate, toast]);

  const saveMutation = useApiMutation({
    invalidate: ['/kitchens'],
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isEdit) {
        await api.patch(`/kitchens/${id}`, payload);
      } else {
        await api.post('/kitchens', payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Berhasil' });
      navigate(adminPaths.masterData.list('kitchens'));
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, region_id: form.region_id || null });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.masterData.list('kitchens'))}>
        <X className="w-4 h-4" /> Batal
      </AdminHeaderButton>
    ),
  });

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="card-elevated p-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Kode SPPG"
          required
          className="px-3 py-2 text-sm bg-background border rounded-lg"
        />
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nama dapur"
          required
          className="px-3 py-2 text-sm bg-background border rounded-lg"
        />
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Alamat"
          className="px-3 py-2 text-sm bg-background border rounded-lg sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <WilayahSelect
            key={id ?? 'new'}
            regionId={form.region_id || null}
            onRegionIdChange={(regionId) => setForm({ ...form, region_id: regionId || '' })}
          />
        </div>
        <SearchableSelect
          value={form.status}
          onValueChange={(status) => setForm({ ...form, status })}
          options={[
            { value: 'tidak_sanksi', label: 'Tidak dalam Sanksi' },
            { value: 'sedang_sanksi', label: 'Sedang dalam Sanksi' },
            { value: 'selesai_sanksi', label: 'Selesai menjalani sanksi' },
          ]}
        />
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          {isEdit ? 'Simpan' : 'Tambah'}
        </button>
      </form>
    </div>
  );
};

export default KitchensFormPage;
