import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/use-api-query';
import SearchableSelect, { optionsFromStrings } from '@/components/shared/SearchableSelect';
import type { Document } from '@/lib/api-types';
import { useSEO } from '@/hooks/use-seo';

const categories = ['Semua', 'Juknis', 'SOP', 'Surat Edaran', 'Template', 'Laporan Ringkas'];
const categoryIcons: Record<string, string> = {
  'Juknis': '📋', 'SOP': '📖', 'Surat Edaran': '📩', 'Template': '📝', 'Laporan Ringkas': '📊',
};

const DownloadDokumen = () => {
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');

  useSEO({
    title: 'Download Regulasi & Dokumen',
    description: 'Unduh dokumen regulasi, petunjuk teknis (juknis), SOP, dan berkas panduan operasional dapur SPPG Badan Gizi Nasional.',
  });

  const { data: docs = [], isLoading: loading } = useApiQuery<Document[]>(
    '/documents?public_only=true',
    { auth: false },
  );

  const filtered = docs.filter((d) => {
    if (category !== 'Semua' && d.category !== category) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-foreground mb-2">Download Dokumen</h1>
      <p className="text-muted-foreground mb-6">Dokumen resmi terkait pengawasan SPPG dan Program MBG</p>

      <div className="filter-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari dokumen..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <SearchableSelect
          value={category}
          onValueChange={setCategory}
          className="min-w-[160px]"
          options={optionsFromStrings(categories)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat dokumen...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p className="text-muted-foreground">Tidak ada dokumen ditemukan.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <div key={doc.id} className="card-elevated p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                {categoryIcons[doc.category] || '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{doc.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="badge-status bg-primary/10 text-primary">{doc.category}</span>
                  <span>Versi {doc.version}</span>
                  {doc.published_at && <span>{new Date(doc.published_at).toLocaleDateString('id-ID')}</span>}
                </div>
              </div>
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0">
                  <Download className="w-4 h-4" /><span className="hidden sm:inline">Unduh</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadDokumen;
