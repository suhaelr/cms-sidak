import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import { Download } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { useResourceList } from '@/hooks/use-resource-list';
import * as XLSX from 'xlsx';
import type { Complaint, RegionRef } from '@/lib/api-types';

const STATUS_LABELS: Record<string, string> = {
  new: 'Baru',
  verified: 'Terverifikasi',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  rejected: 'Ditolak',
};

const buildRegionParts = (region: RegionRef | null | undefined) => {
  const result = { desa: '-', kecamatan: '-', kabkota: '-', provinsi: '-' };
  if (!region) return result;
  const flatList: { name: string; type: string }[] = [];
  let cur = region;
  while (cur) {
    flatList.push({ name: cur.name, type: cur.type });
    cur = cur.parent;
  }
  for (const r of flatList) {
    if (r.type === 'village') result.desa = r.name;
    else if (r.type === 'district') result.kecamatan = r.name;
    else if (r.type === 'city') result.kabkota = r.name;
    else if (r.type === 'province') result.provinsi = r.name;
  }
  return result;
};

const PengaduanListPage = () => {
  const { items, isLoading } = useResourceList<Complaint>('/complaints');
  const { toast } = useToast();
  const navigate = useNavigate();

  const exportToExcel = () => {
    if (items.length === 0) {
      toast({ title: 'Tidak ada data', description: 'Belum ada pengaduan untuk diunduh', variant: 'destructive' });
      return;
    }
    const rows = items.map((c, i) => {
      const rp = buildRegionParts(c.regions);
      return {
        No: i + 1,
        'No Tiket': c.ticket_no,
        Nama: c.name || 'Anonim',
        Kontak: c.contact,
        'Desa/Kelurahan': rp.desa,
        Kecamatan: rp.kecamatan,
        'Kab/Kota': rp.kabkota,
        Provinsi: rp.provinsi,
        Topik: c.topic,
        'Isi Pengaduan': c.content,
        Lampiran: c.attachment_url || '-',
        Status: STATUS_LABELS[c.status] || c.status,
        'Catatan Internal': c.internal_notes || '-',
        'Pesan Status Publik': c.public_status_message || '-',
        'Tanggal Masuk': new Date(c.created_at).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        'Terakhir Diperbarui': new Date(c.updated_at).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
      { wch: 20 }, { wch: 22 }, { wch: 22 },
      { wch: 18 }, { wch: 50 }, { wch: 40 }, { wch: 14 }, { wch: 30 },
      { wch: 30 }, { wch: 20 }, { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pengaduan');
    XLSX.writeFile(wb, `Pengaduan_SidakBGN_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: 'Berhasil', description: 'File Excel berhasil diunduh' });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={exportToExcel}>
        <Download className="w-4 h-4" /> Unduh Excel
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
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tiket</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Topik</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kontak</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr
                key={c.id}
                className="border-b hover:bg-muted/30 cursor-pointer"
                onClick={() => navigate(adminPaths.pengaduan.detail(c.id))}
              >
                <td className="px-4 py-3 font-medium font-mono text-xs">{c.ticket_no}</td>
                <td className="px-4 py-3">{c.topic}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.contact}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(c.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada pengaduan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PengaduanListPage;
