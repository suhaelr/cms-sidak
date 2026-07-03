import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { useResourceList } from '@/hooks/use-resource-list';
import type { Inspection } from '@/lib/api-types';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-info/50 text-primary',
  verified: 'bg-warning/30 text-primary',
  approved: 'bg-secondary/25 text-primary',
  published: 'bg-primary/10 text-primary',
};

const SidakListPage = () => {
  const { items, isLoading, remove } = useResourceList<Inspection>('/inspections');
  const navigate = useNavigate();

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.sidak.create)}>
        <Plus className="w-4 h-4" /> Buat Sidak
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
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Wilayah</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dapur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 text-xs">{i.date}</td>
                <td className="px-4 py-3">{i.regions?.name || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{i.sppg_kitchens?.code || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[i.publication_status] || ''}`}>
                    {i.publication_status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-1">
                  <button
                    onClick={() => navigate(adminPaths.sidak.edit(i.id))}
                    className="p-1.5 hover:bg-muted rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Hapus sidak ini?')) remove.mutate(i.id);
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
                  Belum ada sidak
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SidakListPage;
