import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, ChevronLeft, ChevronRight, Calendar, Eye, Share2,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/use-api-query';
import { useFeatureFlag } from '@/contexts/FeatureFlagsContext';
import {
  timeAgo, formatNewsDate, getCategoryStyle, stripHtml,
  HOME_FILTERS, matchesHomeFilter, getCategoryLabel, type HomeFilter, type NewsCategoryRef,
} from '@/lib/news-utils';
import ArticleCoverImage from '@/components/shared/ArticleCoverImage';
import type { NewsCategory } from '@/lib/api-types';
import { useSEO } from '@/hooks/use-seo';

interface Slide {
  id: string;
  image_url: string;
  title: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  content?: string;
  cover_image?: string;
  published_at?: string;
  author?: string;
  is_highlight?: boolean;
  is_breaking?: boolean;
}

const parseCategoryFilter = (value: string | null): HomeFilter => {
  const allowed = ['Semua', 'Sidak', 'Kajian', 'Berita', 'Video'] as const;
  if (value && allowed.includes(value as HomeFilter)) return value as HomeFilter;
  return 'Semua';
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const [currentSlide, setCurrentSlide] = useState(0);
  const filter = parseCategoryFilter(searchParams.get('kategori'));
  const socialMediaEnabled = useFeatureFlag('menu_social_media');
  const homeFilters = socialMediaEnabled ? HOME_FILTERS : HOME_FILTERS.filter((f) => f !== 'Video');

  useSEO({
    title: 'Portal Pengawasan SPPG',
    description: 'Portal resmi Badan Gizi Nasional untuk transparansi hasil inspeksi dapur SPPG pada Program Makan Bergizi Gratis.',
  });

  const { data: stats, isLoading: statsLoading } = useApiQuery<{ slides: Slide[] }>('/home/stats', { auth: false });
  const { data: articles = [], isLoading: newsLoading } = useApiQuery<Article[]>('/news?public_only=true', { auth: false });
  const { data: categories = [], isLoading: catsLoading } = useApiQuery<NewsCategory[]>('/news-categories', { auth: false });

  const slides = stats?.slides ?? [];
  const loading = statsLoading || newsLoading || catsLoading;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const categoryRefs: NewsCategoryRef[] = categories;
  const filtered = articles.filter((a) => matchesHomeFilter(a.category, filter, categoryRefs));
  const beritaPilihan = articles.filter((a) => a.is_highlight);
  const breakingArticles = articles.filter((a) => a.is_breaking);
  const breakingHeadline = breakingArticles.map((a) => a.title).join(' • ');
  const featured = articles[0];
  const heroArticle = articles[currentSlide] || featured;

  const prevSlide = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);

  const CategoryTag = ({ category }: { category: string }) => (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getCategoryStyle(category, categoryRefs)}`}>
      {getCategoryLabel(category, categoryRefs)}
    </span>
  );

  const NewsCard = ({ article }: { article: Article }) => (
    <Link to={`/berita/${article.slug}`} className="group block">
      <div className="aspect-[16/10] rounded-lg overflow-hidden bg-muted mb-3">
        <ArticleCoverImage src={article.cover_image} alt={article.title} hoverScale />
      </div>
      <CategoryTag category={article.category} />
      <h3 className="font-bold text-foreground mt-2 mb-1.5 line-clamp-2 group-hover:text-[#1a4a8a] transition-colors leading-snug">
        {article.title}
      </h3>
    <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2 mb-3">
      {stripHtml(article.content || '').substring(0, 120)}...
    </p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {article.published_at && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatNewsDate(article.published_at)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {pseudoCount(article.slug, 100, 999)}
        </span>
        <span className="flex items-center gap-1">
          <Share2 className="w-3 h-3" />
          {pseudoCount(article.slug, 5, 80)}
        </span>
      </div>
    </Link>
  );

  return (
    <>
      {breakingArticles.length > 0 && (
        <div className="bg-[#D32F2F] text-white overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-stretch">
            <span className="flex-shrink-0 bg-[#b71c1c] px-4 py-2 text-xs font-extrabold uppercase tracking-widest flex items-center">
              Breaking
            </span>
            <div className="flex-1 overflow-hidden py-2">
              <p className="animate-marquee whitespace-nowrap text-sm font-medium px-4">
                {breakingHeadline}
                <span className="mx-8 opacity-50">•</span>
                {breakingHeadline}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero carousel */}
      <section className="relative bg-[#001F3F] overflow-hidden">
        <div className="relative h-[320px] sm:h-[420px] lg:h-[480px]">
          {slides.length > 0 ? (
            slides.map((slide, i) => (
              <div
                key={slide.id}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: i === currentSlide ? 1 : 0 }}
              >
                <img src={slide.image_url} alt={slide.title || 'Hero'} className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#001F3F] to-[#1a4a8a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="Slide berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-20">
            {heroArticle && (
              <Link to={`/berita/${heroArticle.slug}`} className="block max-w-3xl group">
                <CategoryTag category={heroArticle.category} />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-3 mb-2 leading-tight group-hover:text-white/90 transition-colors">
                  {slideTitle(slides[currentSlide], heroArticle)}
                </h1>
                <p className="text-sm text-white/70">
                  Tim Redaksi BGN
                  {heroArticle.published_at && (
                    <> &bull; {formatNewsDate(heroArticle.published_at)}</>
                  )}
                </p>
              </Link>
            )}
          </div>

          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/40 w-2 hover:bg-white/60'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* News grid */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-extrabold uppercase tracking-wide text-foreground">
                Berita Terkini
              </h2>
              <div className="flex flex-wrap gap-1.5 lg:hidden">
                {homeFilters.map((f) => (
                  <Link
                    key={f}
                    to={f === 'Semua' ? '/' : `/?kategori=${encodeURIComponent(f)}`}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      filter === f
                        ? 'bg-[#001F3F] text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {f}
                  </Link>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="text-center py-12 text-muted-foreground">Memuat berita...</p>
            ) : filter === 'Video' ? (
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
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.slice(0, 6).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">Belum ada berita dalam kategori ini</p>
            )}

            <Link
              to={filter === 'Semua' ? '/berita' : `/berita?kategori=${encodeURIComponent(filter)}`}
              className="mt-8 flex items-center justify-center gap-2 w-full py-3.5 bg-muted hover:bg-muted/70 text-foreground font-semibold rounded-lg transition-colors text-sm"
            >
              Lihat Semua Berita <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-foreground mb-4 pb-2 border-b-2 border-[#001F3F]">
                Berita Pilihan
              </h2>
              <div className="space-y-4">
                {beritaPilihan.slice(0, 5).map((article) => (
                  <Link key={article.id} to={`/berita/${article.slug}`} className="flex gap-3 group">
                    <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                      <ArticleCoverImage src={article.cover_image} alt={article.title} iconSize="xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CategoryTag category={article.category} />
                      <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-2 group-hover:text-[#1a4a8a] transition-colors leading-snug">
                        {article.title}
                      </h3>
                      {article.published_at && (
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(article.published_at)}</p>
                      )}
                    </div>
                  </Link>
                ))}
                {!loading && beritaPilihan.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada berita pilihan</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-foreground mb-4 pb-2 border-b-2 border-[#001F3F]">
                Terpopuler
              </h2>
              <ol className="space-y-4">
                {articles.slice(0, 5).map((article, i) => (
                  <li key={article.id}>
                    <Link to={`/berita/${article.slug}`} className="flex gap-3 group">
                      <span className="text-2xl font-extrabold text-[#001F3F]/20 leading-none w-6 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-[#1a4a8a] transition-colors leading-snug">
                          {article.title}
                        </h3>
                        {article.published_at && (
                          <p className="text-xs text-muted-foreground mt-1">{timeAgo(article.published_at)}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

function slideTitle(slide: Slide | undefined, article: Article) {
  return slide?.title || article.title;
}

function pseudoCount(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 10000;
  return min + (hash % (max - min + 1));
}

export default Index;
