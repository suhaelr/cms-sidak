import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useApiQuery } from '@/hooks/use-api-query';
import { useInvalidateApi } from '@/hooks/use-invalidate-api';
import StatusBadge from '@/components/shared/StatusBadge';
import { ListFilterSelect, ListToolbar } from '@/components/admin/ListToolbar';
import TablePagination from '@/components/admin/TablePagination';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import type { NewsArticle, NewsCategory } from '@/lib/api-types';
import { getBadgeColorStyle, getCategoryLabel } from '@/lib/news-utils';

type BeritaFilters = {
  category: string;
  status: string;
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'published', label: 'Terbit' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Arsip' },
];

const BeritaListPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const invalidate = useInvalidateApi();

  const { data: categories = [] } = useApiQuery<NewsCategory[]>('/news-categories');

  const {
    items,
    count,
    page,
    setPage,
    totalPages,
    loading,
    search,
    setSearch,
    filters,
    setFilter,
  } = usePaginatedList<NewsArticle, BeritaFilters>({
    endpoint: '/news',
    limit: 10,
    defaultFilters: { category: '', status: '' },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/news/${id}`),
    onSuccess: () => {
      invalidate('/news');
      toast({ title: 'Berhasil dihapus' });
    },
  });

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.berita.create)}>
        <Plus className="w-4 h-4" /> Tambah Berita
      </AdminHeaderButton>
    ),
  });

  const categoryOptions = [
    { value: '', label: 'Semua Kategori' },
    ...categories.map((c) => ({ value: c.slug, label: c.short_label })),
  ];

  return (
    <div className="card-elevated overflow-hidden">
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari judul artikel..."
        count={count}
        countLabel={(n) => `${n} artikel`}
      >
        <ListFilterSelect
          value={filters.category}
          onChange={(value) => setFilter('category', value)}
          options={categoryOptions}
          aria-label="Filter kategori"
        />
        <ListFilterSelect
          value={filters.status}
          onChange={(value) => setFilter('status', value)}
          options={STATUS_OPTIONS}
          aria-label="Filter status"
        />
      </ListToolbar>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{n.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge-status text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${getBadgeColorStyle(categories.find((c) => c.slug === n.category)?.badge_color || 'muted')}`}
                    >
                      {getCategoryLabel(n.category, categories)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={n.status || 'draft'} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(n.published_at || n.created_at || '').toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(adminPaths.berita.edit(n.id))}
                        className="p-1.5 hover:bg-muted rounded"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Hapus berita ini?')) deleteMutation.mutate(n.id);
                        }}
                        className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                        aria-label="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {search || filters.category || filters.status
                      ? 'Tidak ada artikel yang cocok'
                      : 'Belum ada berita'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default BeritaListPage;
