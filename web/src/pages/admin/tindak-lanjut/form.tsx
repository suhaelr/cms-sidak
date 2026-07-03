import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useFindById } from '@/hooks/use-find-by-id';
import { X } from 'lucide-react';
import SearchableSelect, { optionsFromStrings } from '@/components/shared/SearchableSelect';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import type { FollowUp, Inspection } from '@/lib/api-types';
import { getErrorMessage } from '@/lib/utils';

const emptyForm = () => ({
  inspection_id: '',
  action_type: '',
  deadline: '',
  status: 'belum',
  pic: '',
  notes: '',
});

const TindakLanjutFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState(emptyForm());

  const { data: inspections = [] } = useApiQuery<Inspection[]>('/inspections');
  const { data: item, isLoading } = useFindById<FollowUp>('/followups', id, { enabled: isEdit });

  useEffect(() => {
    if (!isEdit || isLoading) return;
    if (!item) {
      toast({ title: 'Tindak lanjut tidak ditemukan', variant: 'destructive' });
      navigate(adminPaths.tindakLanjut.list);
      return;
    }
    setForm({
      inspection_id: item.inspection_id,
      action_type: item.action_type,
      deadline: item.deadline || '',
      status: item.status,
      pic: item.pic || '',
      notes: item.notes || '',
    });
  }, [item, isEdit, isLoading, navigate, toast]);

  const saveMutation = useApiMutation({
    invalidate: ['/followups'],
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isEdit) {
        await api.patch(`/followups/${id}`, payload);
      } else {
        await api.post('/followups', payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Berhasil' });
      navigate(adminPaths.tindakLanjut.list);
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, deadline: form.deadline || null });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.tindakLanjut.list)}>
        <X className="w-4 h-4" /> Batal
      </AdminHeaderButton>
    ),
  });

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="card-elevated p-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sidak Terkait</label>
          <SearchableSelect
            value={form.inspection_id}
            onValueChange={(inspection_id) => setForm({ ...form, inspection_id })}
            placeholder="Pilih sidak"
            required
            options={[
              { value: '', label: 'Pilih sidak' },
              ...inspections.map((i) => ({
                value: i.id,
                label: `${i.date} — ${i.summary?.slice(0, 40) || 'Tanpa ringkasan'}`,
              })),
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jenis Tindakan</label>
          <input
            value={form.action_type}
            onChange={(e) => setForm({ ...form, action_type: e.target.value })}
            required
            placeholder="Mis: Pembinaan, Pelatihan"
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deadline</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">PIC</label>
          <input
            value={form.pic}
            onChange={(e) => setForm({ ...form, pic: e.target.value })}
            placeholder="Penanggung jawab"
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <SearchableSelect
            value={form.status}
            onValueChange={(status) => setForm({ ...form, status })}
            options={optionsFromStrings(['belum', 'proses', 'selesai', 'perlu_sidak_ulang'])}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
          >
            {isEdit ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TindakLanjutFormPage;
