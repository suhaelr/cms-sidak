import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useFindById } from '@/hooks/use-find-by-id';
import { X } from 'lucide-react';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { slugFromLabel } from '@/lib/news-utils';
import type { NewsCategory } from '@/lib/api-types';
import { getErrorMessage } from '@/lib/utils';

const badgeColorOptions = [
  { value: 'sky', label: 'Biru' },
  { value: 'violet', label: 'Ungu' },
  { value: 'emerald', label: 'Hijau' },
  { value: 'lime', label: 'Hijau Muda' },
  { value: 'amber', label: 'Kuning' },
  { value: 'rose', label: 'Merah Muda' },
];

const NewsCategoriesFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editing, setEditing] = useState<NewsCategory | null>(null);
  const [form, setForm] = useState({ full_label: '', short_label: '', slug: '', badge_color: 'sky' });

  const { data: item, isLoading } = useFindById<NewsCategory>('/news-categories', id, {
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isEdit || isLoading) return;
    if (!item) {
      toast({ title: 'Data tidak ditemukan', variant: 'destructive' });
      navigate(adminPaths.masterData.list('news-categories'));
      return;
    }
    setEditing(item);
    setForm({
      full_label: item.full_label,
      short_label: item.short_label,
      slug: item.slug,
      badge_color: item.badge_color,
    });
  }, [item, isEdit, isLoading, navigate, toast]);

  const saveMutation = useApiMutation({
    invalidate: ['/news-categories'],
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isEdit) {
        await api.patch(`/news-categories/${id}`, payload);
      } else {
        await api.post('/news-categories', payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Berhasil' });
      navigate(adminPaths.masterData.list('news-categories'));
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const onFullLabelChange = (full_label: string) => {
    const patch: typeof form = { ...form, full_label };
    if (!isEdit) {
      patch.short_label = full_label
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .slice(0, 20);
      patch.slug = slugFromLabel(full_label);
    }
    setForm(patch);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      full_label: form.full_label.trim(),
      short_label: form.short_label.trim(),
      slug: form.slug.trim(),
      badge_color: form.badge_color,
    });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.masterData.list('news-categories'))}>
        <X className="w-4 h-4" /> Batal
      </AdminHeaderButton>
    ),
  });

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="card-elevated p-6">
      <form onSubmit={handleSubmit} className="border border-dashed border-border rounded-xl p-5 bg-muted/20">
        <h4 className="font-semibold text-foreground mb-4">
          {isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Label Lengkap <span className="text-destructive">*</span>
            </label>
            <input
              value={form.full_label}
              onChange={(e) => onFullLabelChange(e.target.value)}
              placeholder="cth: Sidak SPPG"
              required
              className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Label Singkat (Nav) <span className="text-destructive">*</span>
            </label>
            <input
              value={form.short_label}
              onChange={(e) => setForm({ ...form, short_label: e.target.value })}
              placeholder="cth: Sidak"
              required
              className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              ID / Slug <span className="text-destructive">*</span>
            </label>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
              }
              placeholder="cth: info_khusus"
              required
              disabled={isEdit}
              className="w-full px-3 py-2 text-sm bg-background border rounded-lg disabled:opacity-60 disabled:cursor-not-allowed font-mono"
            />
          </div>
        </div>
        {!editing?.is_builtin && (
          <div className="mb-4 max-w-xs">
            <label className="block text-sm font-medium mb-1.5">Warna Badge</label>
            <SearchableSelect
              value={form.badge_color}
              onValueChange={(badge_color) => setForm({ ...form, badge_color })}
              options={badgeColorOptions}
            />
          </div>
        )}
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
          Simpan
        </button>
      </form>
    </div>
  );
};

export default NewsCategoriesFormPage;
