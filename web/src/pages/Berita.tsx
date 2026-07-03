import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Star, TrendingUp, Clock, ArrowRight, type LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/use-api-query';
import {
  stripHtml, getCategoryLabel, getCategoryStyle, timeAgo,
  matchesHomeFilter, matchesProvinceKode, type HomeFilter,
} from '@/lib/news-utils';
import ArticleCoverImage from '@/components/shared/ArticleCoverImage';
import BeritaCategoryNav from '@/components/shared/BeritaCategoryNav';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { useFeatureFlag } from '@/contexts/FeatureFlagsContext';
import type { NewsCategory } from '@/lib/api-types';
import { useSEO } from '@/hooks/use-seo';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  content?: string;
  cover_image?: string;
  published_at?: string;
  region_id?: string | null;
}

interface Region {
  id: string;
  name: string;
}

const parseCategoryFilter = (value: string | null): HomeFilter => {
  const allowed = ['Semua', 'Sidak', 'Kajian', 'Berita', 'Video'] as const;
  if (value && allowed.includes(value as HomeFilter)) return value as HomeFilter;
  return 'Semua';
};

const Berita = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const categoryFilter = parseCategoryFilter(searchParams.get('kategori'));
  const [region, setRegion] = useState('');
  const socialMediaEnabled = useFeatureFlag('menu_social_media');

  useSEO({
    title: 'Berita Pengawasan SPPG',
    description: 'Daftar berita, kajian, dan hasil pengawasan program Makan Bergizi Gratis oleh Badan Gizi Nasional.',
  });

  const { data: articles = [], isLoading: loading } = useApiQuery<Article[]>('/news?public_only=true', { auth: false });
  const { data: categories = [] } = useApiQuery<NewsCategory[]>('/news-categories', { auth: false });
  const { data: regRes, isLoading: regionsLoading } = useApiQuery<{ data: Region[] }>('/regions?type=province', { auth: false });
  const regions = regRes?.data ?? [];

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const categoryBadge = (slug: string) => (
    <span className={`badge-status text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${getCategoryStyle(slug, categories)}`}>
      {getCategoryLabel(slug, categories)}
    </span>
  );

  const filtered = articles.filter((a) => {
    if (!matchesHomeFilter(a.category, categoryFilter, categories)) return false;
    if (region && !matchesProvinceKode(a.region_id, region)) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !stripHtml(a.content || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const beritaPilihan = filtered.slice(0, 2);
  const beritaPopuler = filtered.slice(2, 5);
  const beritaTerbaru = filtered.slice(5);

  const SectionHeader = ({ icon: Icon, title }: { icon: LucideIcon; title: string }) => (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
  );

  const ArticleCardLarge = ({ article }: { article: Article }) => (
    <Link to={`/berita/${article.slug}`} className="card-elevated overflow-hidden hover:shadow-lg transition-shadow group block">
      <div className="h-52 bg-muted">
        <ArticleCoverImage src={article.cover_image} alt={article.title} variant="primary" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {categoryBadge(article.category)}
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-secondary transition-colors line-clamp-2">{article.title}</h3>
        <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-3">{stripHtml(article.content || '').slice(0, 150)}...</p>
        <div className="flex justify-end mt-2">
          <span className="text-xs text-secondary">{article.published_at ? timeAgo(article.published_at) : ''}</span>
        </div>
      </div>
    </Link>
  );

  const ArticleCardHorizontal = ({ article, index }: { article: Article; index: number }) => (
    <Link to={`/berita/${article.slug}`} className="card-elevated overflow-hidden hover:shadow-lg transition-shadow group flex flex-row">
      <div className="w-10 flex-shrink-0 flex items-center justify-center bg-primary/5 border-r border-border">
        <span className="text-lg font-bold text-primary/60">{index + 1}</span>
      </div>
      <div className="w-28 h-28 md:w-36 md:h-auto flex-shrink-0 bg-muted">
        <ArticleCoverImage src={article.cover_image} alt={article.title} iconSize="sm" variant="primary" />
      </div>
      <div className="p-4 flex flex-col justify-center min-w-0 flex-1">
        <span className="text-xs text-secondary font-medium mb-1">{getCategoryLabel(article.category, categories)}</span>
        <h3 className="font-semibold text-foreground mb-1 group-hover:text-secondary transition-colors line-clamp-2 text-sm">{article.title}</h3>
        <div className="flex justify-end mt-1">
          <span className="text-xs text-secondary">{article.published_at ? timeAgo(article.published_at) : ''}</span>
        </div>
      </div>
    </Link>
  );

  const ArticleCardSmall = ({ article }: { article: Article }) => (
    <Link to={`/berita/${article.slug}`} className="card-elevated overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="h-40 bg-muted">
        <ArticleCoverImage src={article.cover_image} alt={article.title} iconSize="md" variant="primary" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {categoryBadge(article.category)}
        </div>
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-secondary transition-colors line-clamp-2">{article.title}</h3>
        <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2">{stripHtml(article.content || '').slice(0, 120)}...</p>
        <div className="flex justify-end mt-2">
          <span className="text-xs text-secondary">{article.published_at ? timeAgo(article.published_at) : ''}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Berita</h1>
          <p className="text-muted-foreground dark:text-slate-400">Informasi terkini seputar pengawasan SPPG dan Program MBG</p>
        </div>
        <BeritaCategoryNav variant="inline" className="lg:hidden" />
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari berita..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <SearchableSelect
          value={region}
          onValueChange={setRegion}
          placeholder={regionsLoading ? 'Memuat wilayah...' : 'Semua Wilayah'}
          disabled={regionsLoading}
          className="min-w-[180px]"
          options={[
            { value: '', label: 'Semua Wilayah' },
            ...regions.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat berita...</div>
      ) : categoryFilter === 'Video' ? (
        <div className="text-center py-12">
          {socialMediaEnabled ? (
            <>
              <p className="text-muted-foreground mb-4">Lihat konten video di halaman Social Media</p>
              <Link to="/social-media" className="inline-flex items-center gap-2 text-[#1a4a8a] font-semibold hover:underline">
                Buka Video <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground">Konten video belum tersedia</p>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p className="text-muted-foreground">Tidak ada berita ditemukan.</p></div>
      ) : (
        <div className="space-y-10">
          {beritaPilihan.length > 0 && (
            <section>
              <SectionHeader icon={Star} title="Berita Pilihan" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {beritaPilihan.map((article) => (
                  <ArticleCardLarge key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          {beritaPopuler.length > 0 && (
            <section>
              <SectionHeader icon={TrendingUp} title="Berita Populer" />
              <div className="grid grid-cols-1 gap-3">
                {beritaPopuler.map((article, idx) => (
                  <ArticleCardHorizontal key={article.id} article={article} index={idx} />
                ))}
              </div>
            </section>
          )}

          {beritaTerbaru.length > 0 && (
            <section>
              <SectionHeader icon={Clock} title="Berita Terbaru" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {beritaTerbaru.map((article) => (
                  <ArticleCardSmall key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Berita;
