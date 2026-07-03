import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/use-api-query';
import StatusBadge from '@/components/shared/StatusBadge';
import SearchableSelect, { optionsFromStrings } from '@/components/shared/SearchableSelect';
import type { Region, RegionsResponse, Sanction } from '@/lib/api-types';
import { useSEO } from '@/hooks/use-seo';

const DISCLAIMER_TEXT = 'Ditampilkan sesuai ketentuan peraturan yang berlaku dan prinsip kehati-hatian serta perlindungan data.';

const DaftarSanksi = () => {
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useSEO({
    title: 'Daftar Sanksi SPPG',
    description: 'Daftar sanksi administratif dan tindakan disiplin terhadap pelanggaran operasional dapur SPPG program Makan Bergizi Gratis.',
  });

  const { data: items = [], isLoading: loading } = useApiQuery<Sanction[]>(
    '/sanctions?public_only=true',
    { auth: false },
  );
  const { data: regRes, isLoading: regionsLoading } = useApiQuery<RegionsResponse>(
    '/regions?type=province',
    { auth: false },
  );
  const regions = regRes?.data ?? [];

  const filtered = items.filter((s) => {
    if (regionFilter && s.sppg_kitchens?.regions?.name !== regionFilter) return false;
    if (typeFilter && s.sanction_type !== typeFilter) return false;
    if (statusFilter && s.follow_up_status !== statusFilter) return false;
    return true;
  });

  const sanctionTypes = [...new Set(items.map((s) => s.sanction_type))];

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-foreground mb-2">Daftar Sanksi</h1>
      <p className="text-muted-foreground mb-6">Daftar sanksi yang ditetapkan terhadap dapur SPPG berdasarkan hasil sidak</p>

      <div className="filter-bar">
        <SearchableSelect
          value={regionFilter}
          onValueChange={setRegionFilter}
          placeholder={regionsLoading ? 'Memuat wilayah...' : 'Semua Wilayah'}
          disabled={regionsLoading}
          className="min-w-[180px]"
          options={[
            { value: '', label: 'Semua Wilayah' },
            ...regions.map((r: Region) => ({ value: r.name, label: r.name })),
          ]}
        />
        <SearchableSelect
          value={typeFilter}
          onValueChange={setTypeFilter}
          placeholder="Semua Jenis"
          className="min-w-[160px]"
          options={[
            { value: '', label: 'Semua Jenis' },
            ...sanctionTypes.map((t) => ({ value: t, label: t })),
          ]}
        />
        <SearchableSelect
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="Semua Status"
          className="min-w-[160px]"
          options={optionsFromStrings(['', 'Aktif', 'Selesai', 'Dibatalkan'])}
        />
      </div>

      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">{DISCLAIMER_TEXT}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data sanksi...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p className="text-muted-foreground">Tidak ada sanksi ditemukan.</p></div>
      ) : (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dapur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Wilayah</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jenis</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{s.sppg_kitchens?.code || '—'}</td>
                  <td className="px-4 py-3">{s.sppg_kitchens?.regions?.name || '—'}</td>
                  <td className="px-4 py-3">{s.sanction_type}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.follow_up_status || 'Aktif'} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.sanction_date ? new Date(s.sanction_date).toLocaleDateString('id-ID') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/sanksi/${s.id}`} className="text-secondary hover:underline text-xs font-medium">
                      Lihat detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DaftarSanksi;
