import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { useCrud } from '../use-crud';
import type { Kitchen } from '@/lib/api-types';

const KitchensListPage = () => {
  const { items, loading, remove } = useCrud<Kitchen>('/kitchens');
  const navigate = useNavigate();

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.masterData.create('kitchens'))}>
        <Plus className="w-4 h-4" /> Tambah
      </AdminHeaderButton>
    ),
  });

  return (
    <div className="card-elevated p-5">
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Kode</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nama</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((k) => (
                <tr key={k.id} className="border-b hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{k.code}</td>
                  <td className="px-3 py-2">{k.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${k.status === 'active' ? 'bg-secondary/25 text-primary' : 'bg-destructive/15 text-destructive'}`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 flex gap-1">
                    <button
                      onClick={() => navigate(adminPaths.masterData.edit('kitchens', k.id))}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Hapus?')) remove(k.id);
                      }}
                      className="p-1 hover:bg-destructive/10 text-destructive rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchensListPage;
