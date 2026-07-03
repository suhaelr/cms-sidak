import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin } from 'lucide-react';
import ArticleCoverImage from '@/components/shared/ArticleCoverImage';
import { useApiQuery } from '@/hooks/use-api-query';
import { timeAgo, getCategoryLabel, getBadgeColorStyle, provinceNameForRegion } from '@/lib/news-utils';
import type { NewsCategory } from '@/lib/api-types';

interface SearchArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image?: string;
  content?: string;
  published_at?: string;
  region_id?: string | null;
}

interface Province {
  id: string;
  name: string;
}

const getSearchCategoryBadge = (category: string, categories: NewsCategory[]) => {
  const match = categories.find((c) => c.slug === category);
  if (match) {
    const style = getBadgeColorStyle(match.badge_color);
    const bg = style.includes('sky') ? 'bg-sky-600'
      : style.includes('violet') ? 'bg-violet-600'
      : style.includes('emerald') ? 'bg-emerald-600'
      : style.includes('lime') ? 'bg-lime-600'
      : 'bg-slate-600';
    return { label: match.short_label, className: bg };
  }
  if (['Temuan', 'Sidak', 'sidak'].includes(category)) {
    return { label: 'SIDAK', className: 'bg-sky-600' };
  }
  if (['Edukasi', 'Kajian', 'laporan'].includes(category)) {
    return { label: 'KAJIAN', className: 'bg-violet-600' };
  }
  return { label: 'BERITA', className: 'bg-emerald-600' };
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 text-inherit rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const SearchModal = ({ open, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: articles = [], isLoading: articlesLoading } = useApiQuery<SearchArticle[]>(
    '/news?public_only=true',
    { auth: false, enabled: open },
  );
  const { data: categories = [], isLoading: catsLoading } = useApiQuery<NewsCategory[]>(
    '/news-categories',
    { auth: false, enabled: open },
  );
  const { data: regRes, isLoading: regionsLoading } = useApiQuery<{ data: Province[] }>(
    '/regions?type=province',
    { auth: false, enabled: open },
  );
  const provinces = regRes?.data ?? [];
  const loading = articlesLoading || catsLoading || regionsLoading;

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return articles.slice(0, 8);
    const q = query.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.content || '').toLowerCase().includes(q),
    ).slice(0, 8);
  }, [articles, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background rounded-xl shadow-2xl border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berita, sidak, kajian..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Memuat...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {query.trim() ? 'Tidak ada hasil ditemukan' : 'Ketik untuk mencari berita'}
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((article) => {
                const badge = getSearchCategoryBadge(article.category, categories);
                const province = provinceNameForRegion(article.region_id, provinces);
                return (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/berita/${article.slug}`);
                        onClose();
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors"
                    >
                      <div className="w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                        <ArticleCoverImage src={article.cover_image} alt={article.title} iconSize="sm" variant="primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wide text-white px-1.5 py-0.5 rounded ${badge.className}`}>
                            {badge.label}
                          </span>
                          {province && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {province}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          <HighlightText text={article.title} query={query} />
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getCategoryLabel(article.category, categories)}
                          {article.published_at ? ` · ${timeAgo(article.published_at)}` : ''}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
