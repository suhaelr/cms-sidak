import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { X } from 'lucide-react';
import SearchableSelect, { optionsFromStrings } from '@/components/shared/SearchableSelect';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import type { Inspection, Kitchen, Sanction } from '@/lib/api-types';
import { getErrorMessage } from '@/lib/utils';

const emptyForm = () => ({
  kitchen_id: '',
  inspection_id: '',
  violation_summary: '',
  sanction_type: 'Peringatan',
  date: new Date().toISOString().split('T')[0],
  status: 'aktif',
  follow_up_status: 'belum',
  is_public: false,
  show_identity: false,
});

const SanksiFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState(emptyForm());

  const { data: kitchens = [] } = useApiQuery<Kitchen[]>('/kitchens');
  const { data: inspections = [] } = useApiQuery<Inspection[]>('/inspections');
  const { data: sanction, isLoading, isError } = useApiQuery<Sanction>(`/sanctions/${id}`, {
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isEdit || !sanction) return;
    setForm({
      kitchen_id: sanction.kitchen_id || '',
      inspection_id: sanction.inspection_id || '',
      violation_summary: sanction.violation_summary,
      sanction_type: sanction.sanction_type,
      date: sanction.date,
      status: sanction.status,
      follow_up_status: sanction.follow_up_status,
      is_public: sanction.is_public,
      show_identity: sanction.show_identity,
    });
  }, [sanction, isEdit]);

  useEffect(() => {
    if (!isEdit || isLoading || !isError) return;
    toast({ title: 'Gagal memuat sanksi', variant: 'destructive' });
    navigate(adminPaths.sanksi.list);
  }, [isEdit, isLoading, isError, navigate, toast]);

  const saveMutation = useApiMutation({
    invalidate: ['/sanctions'],
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isEdit) {
        await api.patch(`/sanctions/${id}`, payload);
      } else {
        await api.post('/sanctions', payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Berhasil' });
      navigate(adminPaths.sanksi.list);
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      kitchen_id: form.kitchen_id || null,
      inspection_id: form.inspection_id || null,
    });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.sanksi.list)}>
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
          <label className="block text-sm font-medium mb-1">Dapur SPPG</label>
          <SearchableSelect
            value={form.kitchen_id}
            onValueChange={(kitchen_id) => setForm({ ...form, kitchen_id })}
            placeholder="Pilih dapur"
            options={[
              { value: '', label: 'Pilih dapur' },
              ...kitchens.map((k) => ({ value: k.id, label: `${k.code} - ${k.name}` })),
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sidak Terkait</label>
          <SearchableSelect
            value={form.inspection_id}
            onValueChange={(inspection_id) => setForm({ ...form, inspection_id })}
            placeholder="Pilih sidak"
            options={[
              { value: '', label: 'Pilih sidak' },
              ...inspections.map((i) => ({
                value: i.id,
                label: `${i.date} — ${i.summary?.slice(0, 40) || 'Tanpa ringkasan'}`,
              })),
            ]}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Ringkasan Pelanggaran</label>
          <textarea
            value={form.violation_summary}
            onChange={(e) => setForm({ ...form, violation_summary: e.target.value })}
            required
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jenis Sanksi</label>
          <SearchableSelect
            value={form.sanction_type}
            onValueChange={(sanction_type) => setForm({ ...form, sanction_type })}
            options={optionsFromStrings(['Peringatan', 'Pembinaan', 'Tutup Sementara', 'Pencabutan Izin'])}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal Penetapan</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <SearchableSelect
            value={form.status}
            onValueChange={(status) => setForm({ ...form, status })}
            options={optionsFromStrings(['aktif', 'tindak_lanjut', 'selesai', 'dicabut'])}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status Tindak Lanjut</label>
          <SearchableSelect
            value={form.follow_up_status}
            onValueChange={(follow_up_status) => setForm({ ...form, follow_up_status })}
            options={optionsFromStrings(['belum', 'proses', 'selesai'])}
          />
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            />{' '}
            Tampilkan ke publik
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.show_identity}
              onChange={(e) => setForm({ ...form, show_identity: e.target.checked })}
            />{' '}
            Tampilkan identitas
          </label>
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

export default SanksiFormPage;
