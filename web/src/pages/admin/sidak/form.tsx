import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { X } from 'lucide-react';
import SearchableSelect from '@/components/shared/SearchableSelect';
import WilayahSelect from '@/components/shared/WilayahSelect';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import type { Finding, Inspection, Kitchen } from '@/lib/api-types';
import { getErrorMessage } from '@/lib/utils';

const emptyForm = () => ({
  date: new Date().toISOString().split('T')[0],
  region_id: '',
  kitchen_id: '',
  summary: '',
  publication_status: 'draft',
  show_identity: false,
  show_media: false,
});

const SidakFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState(emptyForm());
  const [findings, setFindings] = useState<Omit<Finding, 'id' | 'inspection_id'>[]>([]);
  const [newFinding, setNewFinding] = useState({
    category: '',
    severity: 'ringan',
    description: '',
    recommendation: '',
  });

  const { data: kitchens = [] } = useApiQuery<Kitchen[]>('/kitchens');
  const { data: inspection, isLoading, isError } = useApiQuery<Inspection>(
    `/inspections/${id}`,
    { enabled: isEdit },
  );

  useEffect(() => {
    if (!isEdit || !inspection) return;
    setForm({
      date: inspection.date,
      region_id: inspection.region_id || '',
      kitchen_id: inspection.kitchen_id || '',
      summary: inspection.summary || '',
      publication_status: inspection.publication_status,
      show_identity: inspection.show_identity,
      show_media: inspection.show_media,
    });
  }, [inspection, isEdit]);

  useEffect(() => {
    if (!isEdit || !isError) return;
    toast({ title: 'Gagal memuat sidak', variant: 'destructive' });
    navigate(adminPaths.sidak.list);
  }, [isEdit, isError, navigate, toast]);

  const saveMutation = useApiMutation({
    invalidate: ['/inspections'],
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isEdit) {
        await api.patch(`/inspections/${id}`, payload);
      } else {
        await api.post('/inspections', payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Berhasil' });
      navigate(adminPaths.sidak.list);
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date: form.date,
      region_id: form.region_id || null,
      kitchen_id: form.kitchen_id || null,
      summary: form.summary,
      publication_status: form.publication_status,
      show_identity: form.show_identity,
      show_media: form.show_media,
      ...(isEdit ? {} : { findings: findings.length > 0 ? findings : undefined }),
    };
    saveMutation.mutate(payload);
  };

  const addFinding = () => {
    if (!newFinding.category || !newFinding.description) return;
    setFindings([...findings, { ...newFinding }]);
    setNewFinding({ category: '', severity: 'ringan', description: '', recommendation: '' });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.sidak.list)}>
        <X className="w-4 h-4" /> Batal
      </AdminHeaderButton>
    ),
  });

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="card-elevated p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium mb-1">Wilayah</label>
            <WilayahSelect
              key={id ?? 'new'}
              regionId={form.region_id || null}
              onRegionIdChange={(regionId) => setForm({ ...form, region_id: regionId || '' })}
            />
          </div>
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
            <label className="block text-sm font-medium mb-1">Status</label>
            <SearchableSelect
              value={form.publication_status}
              onValueChange={(publication_status) => setForm({ ...form, publication_status })}
              options={['draft', 'submitted', 'verified', 'approved', 'published'].map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.show_identity}
                onChange={(e) => setForm({ ...form, show_identity: e.target.checked })}
              />{' '}
              Tampilkan identitas
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.show_media}
                onChange={(e) => setForm({ ...form, show_media: e.target.checked })}
              />{' '}
              Tampilkan media
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ringkasan</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>

        {!isEdit && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Temuan</h3>
            {findings.map((f, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 text-sm bg-muted/30 px-3 py-2 rounded">
                <span className="font-medium">{f.category}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${f.severity === 'berat' ? 'bg-destructive/15 text-destructive' : f.severity === 'sedang' ? 'bg-warning/30 text-primary' : 'bg-secondary/25 text-primary'}`}
                >
                  {f.severity}
                </span>
                <span className="text-muted-foreground flex-1 truncate">{f.description}</span>
                <button
                  type="button"
                  onClick={() => setFindings(findings.filter((_, j) => j !== i))}
                  className="text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                value={newFinding.category}
                onChange={(e) => setNewFinding({ ...newFinding, category: e.target.value })}
                placeholder="Kategori"
                className="px-3 py-2 text-sm bg-background border rounded-lg"
              />
              <SearchableSelect
                value={newFinding.severity}
                onValueChange={(severity) => setNewFinding({ ...newFinding, severity })}
                options={[
                  { value: 'ringan', label: 'Ringan' },
                  { value: 'sedang', label: 'Sedang' },
                  { value: 'berat', label: 'Berat' },
                ]}
              />
              <input
                value={newFinding.description}
                onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })}
                placeholder="Deskripsi temuan"
                className="px-3 py-2 text-sm bg-background border rounded-lg"
              />
              <button
                type="button"
                onClick={addFinding}
                className="px-3 py-2 bg-muted text-sm rounded-lg hover:bg-muted/80"
              >
                + Temuan
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
        >
          {isEdit ? 'Simpan Perubahan' : 'Buat Sidak'}
        </button>
      </form>
    </div>
  );
};

export default SidakFormPage;
