import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { useResourceList } from '@/hooks/use-resource-list';
import type { Document } from '@/lib/api-types';

const DokumenListPage = () => {
  const { items, isLoading, remove } = useResourceList<Document>('/documents');
  const navigate = useNavigate();

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.dokumen.create)}>
        <Plus className="w-4 h-4" /> Tambah Dokumen
      </AdminHeaderButton>
    ),
  });

  return (
    <div className="card-elevated overflow-x-auto">
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Memuat...</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Versi</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Publik</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{d.title}</td>
                <td className="px-4 py-3">
                  <span className="badge-status bg-primary/10 text-primary">{d.category}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{d.version}</td>
                <td className="px-4 py-3">{d.is_public ? '✅' : '—'}</td>
                <td className="px-4 py-3 flex gap-1">
                  <button
                    onClick={() => navigate(adminPaths.dokumen.edit(d.id))}
                    className="p-1.5 hover:bg-muted rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Hapus?')) remove.mutate(d.id);
                    }}
                    className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada dokumen
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DokumenListPage;
