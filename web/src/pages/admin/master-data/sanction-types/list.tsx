import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { useCrud } from '../use-crud';
import type { SanctionType } from '@/lib/api-types';

const SanctionTypesListPage = () => {
  const { items, loading, remove } = useCrud<SanctionType>('/sanction-types');
  const navigate = useNavigate();

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.masterData.create('sanction-types'))}>
        <Plus className="w-4 h-4" /> Tambah
      </AdminHeaderButton>
    ),
  });

  return (
    <div className="card-elevated p-5">
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : (
        <div className="space-y-1">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded hover:bg-muted/30 text-sm">
              <div>
                <span className="font-medium">{s.name}</span>
                {s.description && <span className="text-muted-foreground ml-2">— {s.description}</span>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => navigate(adminPaths.masterData.edit('sanction-types', s.id))}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Hapus?')) remove(s.id);
                  }}
                  className="p-1 hover:bg-destructive/10 text-destructive rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SanctionTypesListPage;
