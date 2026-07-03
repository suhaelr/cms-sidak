import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, Table } from 'lucide-react';
import { useApiQuery } from '@/hooks/use-api-query';
import StatusBadge from '@/components/shared/StatusBadge';
import SearchableSelect from '@/components/shared/SearchableSelect';
import type { Inspection, Region, RegionsResponse } from '@/lib/api-types';
import { useSEO } from '@/hooks/use-seo';

const DokumentasiSidak = () => {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useSEO({
    title: 'Dokumentasi Inspeksi Sidak',
    description: 'Hasil dan dokumentasi pengawasan lapangan inspeksi dapur SPPG Makan Bergizi Gratis Badan Gizi Nasional.',
  });

  const { data: items = [], isLoading: loading } = useApiQuery<Inspection[]>(
    '/inspections?public_only=true',
    { auth: false },
  );
  const { data: regRes, isLoading: regionsLoading } = useApiQuery<RegionsResponse>(
    '/regions?type=province',
    { auth: false },
  );
  const regions = regRes?.data ?? [];

  const filtered = items.filter((ins) => {
    if (regionFilter && ins.regions?.name !== regionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(ins.sppg_kitchens?.name || '').toLowerCase().includes(q) && !(ins.sppg_kitchens?.code || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-foreground mb-2">Dokumentasi Sidak</h1>
      <p className="text-muted-foreground mb-6">Hasil inspeksi mendadak dapur SPPG yang telah dipublikasikan</p>

      <div className="filter-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari dapur..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
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
        <div className="flex rounded-lg border overflow-hidden">
          <button onClick={() => setViewMode('card')} className={`p-2 ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data sidak...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p className="text-muted-foreground">Tidak ada sidak ditemukan.</p></div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ins) => (
            <Link key={ins.id} to={`/sidak/${ins.id}`} className="card-elevated p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{ins.sppg_kitchens?.code}</p>
                  <h3 className="font-semibold text-foreground">{ins.sppg_kitchens?.name || '—'}</h3>
                </div>
                <StatusBadge status={ins.publication_status} />
              </div>
              <p className="text-sm text-muted-foreground">{ins.regions?.name || '—'}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(ins.date).toLocaleDateString('id-ID')}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dapur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Wilayah</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ins) => (
                <tr key={ins.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs">{new Date(ins.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 font-mono text-xs">{ins.sppg_kitchens?.code || '—'}</td>
                  <td className="px-4 py-3">{ins.regions?.name || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={ins.publication_status} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/sidak/${ins.id}`} className="text-secondary hover:underline text-xs font-medium">Lihat</Link>
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

export default DokumentasiSidak;
