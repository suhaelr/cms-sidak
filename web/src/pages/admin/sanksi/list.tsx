import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { useResourceList } from '@/hooks/use-resource-list';
import type { Sanction } from '@/lib/api-types';

const SanksiListPage = () => {
  const { items, isLoading, remove } = useResourceList<Sanction>('/sanctions');
  const navigate = useNavigate();

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.sanksi.create)}>
        <Plus className="w-4 h-4" /> Tambah Sanksi
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
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">SPPG</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jenis</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Publik</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{s.sppg_kitchens?.code || '—'}</td>
                <td className="px-4 py-3">
                  <span className="badge-status bg-destructive/10 text-destructive">{s.sanction_type}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{s.date}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.follow_up_status} />
                </td>
                <td className="px-4 py-3">{s.is_public ? '✅' : '—'}</td>
                <td className="px-4 py-3 flex gap-1">
                  <button
                    onClick={() => navigate(adminPaths.sanksi.edit(s.id))}
                    className="p-1.5 hover:bg-muted rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Hapus?')) remove.mutate(s.id);
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
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada sanksi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SanksiListPage;
