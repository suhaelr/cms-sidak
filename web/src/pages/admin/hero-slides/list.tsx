import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { apiResourceKey } from '@/lib/query-keys';
import { Plus, Trash2, GripVertical, Eye, EyeOff, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';

interface HeroSlide {
  id: string;
  title: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const HeroSlidesListPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: slides = [], isLoading } = useQuery({
    queryKey: apiResourceKey('/hero-slides'),
    queryFn: async () => api.get<HeroSlide[]>('/hero-slides'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await api.patch(`/hero-slides/${id}`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiResourceKey('/hero-slides') });
      toast.success('Status slide diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hero-slides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiResourceKey('/hero-slides') });
      toast.success('Slide berhasil dihapus');
    },
  });

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.heroSlides.create)}>
        <Plus className="w-4 h-4" /> Tambah Slide
      </AdminHeaderButton>
    ),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Memuat...</div>;
  }

  if (slides.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Belum ada slide</div>;
  }

  return (
    <div className="space-y-3">
      {slides.map((slide) => (
        <div key={slide.id} className="card-elevated p-4">
          <div className="flex items-center gap-4">
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="w-24 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
              <img src={slide.image_url} alt={slide.title || 'Slide'} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{slide.title || '(Tanpa judul)'}</p>
              <p className="text-xs text-muted-foreground">Urutan: {slide.sort_order}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateMutation.mutate({ id: slide.id, is_active: !slide.is_active })}
                className={`p-2 rounded-lg text-sm ${slide.is_active ? 'text-success' : 'text-muted-foreground'}`}
                title={slide.is_active ? 'Aktif' : 'Nonaktif'}
              >
                {slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => navigate(adminPaths.heroSlides.edit(slide.id))}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Hapus slide ini?')) deleteMutation.mutate(slide.id);
                }}
                className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeroSlidesListPage;
