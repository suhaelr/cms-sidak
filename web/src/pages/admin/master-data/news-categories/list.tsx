import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { getBadgeColorStyle } from '@/lib/news-utils';
import { useCrud } from '../use-crud';
import type { NewsCategory } from '@/lib/api-types';

const NewsCategoriesListPage = () => {
  const { items, loading, remove } = useCrud<NewsCategory>('/news-categories');
  const navigate = useNavigate();

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.masterData.create('news-categories'))}>
        <Plus className="w-4 h-4" /> Tambah Kategori
      </AdminHeaderButton>
    ),
  });

  return (
    <div className="card-elevated p-5">
      <p className="text-sm text-muted-foreground mb-5">{items.length} kategori terdaftar</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Nama Kategori
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  ID / Slug
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Artikel
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Tipe
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${getBadgeColorStyle(c.badge_color)}`}
                      >
                        {c.short_label}
                      </span>
                      <span className="font-medium">{c.full_label}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{c.slug}</code>
                  </td>
                  <td className="px-4 py-3 font-semibold">{c.article_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.is_builtin ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}
                    >
                      {c.is_builtin ? 'Bawaan' : 'Kustom'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(adminPaths.masterData.edit('news-categories', c.id))}
                        className="px-3 py-1 text-xs font-medium border rounded-md hover:bg-muted"
                      >
                        Edit
                      </button>
                      {!c.is_builtin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus kategori "${c.full_label}"?`)) remove(c.id);
                          }}
                          className="px-3 py-1 text-xs font-medium border border-destructive/30 text-destructive rounded-md hover:bg-destructive/10"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada kategori</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsCategoriesListPage;
