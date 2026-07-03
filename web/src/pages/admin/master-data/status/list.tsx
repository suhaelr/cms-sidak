import { ToggleLeft } from 'lucide-react';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

const StatusListPage = () => {
  useAdminHeader();

  const statusGroups = [
    {
      label: 'Status Pengaduan',
      items: [
        { key: 'new', label: 'Baru' },
        { key: 'verified', label: 'Terverifikasi' },
        { key: 'in_progress', label: 'Dalam Proses' },
        { key: 'resolved', label: 'Selesai' },
      ],
    },
    {
      label: 'Status Publikasi Sidak',
      items: [
        { key: 'draft', label: 'Draft' },
        { key: 'verified', label: 'Terverifikasi' },
        { key: 'published', label: 'Dipublikasikan' },
      ],
    },
    {
      label: 'Status Sanksi',
      items: [
        { key: 'aktif', label: 'Aktif' },
        { key: 'selesai', label: 'Selesai' },
      ],
    },
    {
      label: 'Status Tindak Lanjut',
      items: [
        { key: 'belum', label: 'Belum' },
        { key: 'proses', label: 'Dalam Proses' },
        { key: 'selesai', label: 'Selesai' },
      ],
    },
    {
      label: 'Status Dapur SPPG',
      items: [
        { key: 'sedang_sanksi', label: 'Sedang dalam Sanksi' },
        { key: 'selesai_sanksi', label: 'Selesai menjalani sanksi' },
        { key: 'tidak_sanksi', label: 'Tidak dalam Sanksi' },
      ],
    },
  ];

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ToggleLeft className="w-4 h-4" /> Daftar Status
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Referensi status yang digunakan di seluruh sistem.</p>
      <div className="space-y-6">
        {statusGroups.map((group) => (
          <div key={group.label}>
            <h4 className="text-sm font-medium text-foreground mb-2">{group.label}</h4>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span key={item.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">({item.key})</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusListPage;
