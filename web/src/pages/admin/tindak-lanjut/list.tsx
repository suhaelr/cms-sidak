import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { useResourceList } from '@/hooks/use-resource-list';
import type { FollowUp } from '@/lib/api-types';

const TindakLanjutListPage = () => {
  const { items, isLoading, remove } = useResourceList<FollowUp>('/followups');
  const navigate = useNavigate();

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.tindakLanjut.create)}>
        <Plus className="w-4 h-4" /> Tambah Tindak Lanjut
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
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sidak</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tindakan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">PIC</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deadline</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 text-xs">
                  {f.inspections?.date || '—'}{' '}
                  <span className="text-muted-foreground font-mono">
                    {f.inspections?.sppg_kitchens?.code || ''}
                  </span>
                </td>
                <td className="px-4 py-3">{f.action_type}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.pic || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{f.deadline || '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={f.status} />
                </td>
                <td className="px-4 py-3 flex gap-1">
                  <button
                    onClick={() => navigate(adminPaths.tindakLanjut.edit(f.id))}
                    className="p-1.5 hover:bg-muted rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Hapus?')) remove.mutate(f.id);
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
                  Belum ada tindak lanjut
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TindakLanjutListPage;
