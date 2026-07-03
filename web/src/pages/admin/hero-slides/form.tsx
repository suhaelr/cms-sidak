import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useFindById } from '@/hooks/use-find-by-id';
import { Save, X } from 'lucide-react';
import FileUpload from '@/components/shared/FileUpload';
import { toast } from 'sonner';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { getErrorMessage } from '@/lib/utils';

interface HeroSlide {
  id: string;
  title: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const HeroSlidesFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', image_url: '', sort_order: 0 });

  const { data: slide, isLoading } = useFindById<HeroSlide>('/hero-slides', id, { enabled: isEdit });

  useEffect(() => {
    if (!isEdit || isLoading) return;
    if (!slide) {
      toast.error('Slide tidak ditemukan');
      navigate(adminPaths.heroSlides.list);
      return;
    }
    setForm({
      title: slide.title || '',
      image_url: slide.image_url,
      sort_order: slide.sort_order,
    });
  }, [slide, isEdit, isLoading, navigate]);

  const saveMutation = useApiMutation({
    invalidate: ['/hero-slides'],
    mutationFn: async (payload: typeof form) => {
      if (isEdit) {
        await api.patch(`/hero-slides/${id}`, payload);
      } else {
        await api.post('/hero-slides', payload);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Slide berhasil diperbarui' : 'Slide berhasil ditambahkan');
      navigate(adminPaths.heroSlides.list);
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  });

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.heroSlides.list)}>
        <X className="w-4 h-4" /> Batal
      </AdminHeaderButton>
    ),
  });

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="card-elevated p-6">
      <h3 className="font-semibold text-foreground mb-4">
        {isEdit ? 'Edit Slide' : 'Tambah Slide Baru'}
      </h3>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Judul (opsional)</label>
          <input
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Judul slide"
          />
        </div>
        <FileUpload
          value={form.image_url}
          onChange={(url) => setForm({ ...form, image_url: url })}
          folder="hero-slides"
          label="Gambar Slide"
          accept="image/*"
        />
        <div>
          <label className="block text-sm font-medium mb-1">Urutan</label>
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.image_url || saveMutation.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-4 h-4 inline mr-1" /> Simpan
          </button>
          <button
            onClick={() => navigate(adminPaths.heroSlides.list)}
            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSlidesFormPage;
