import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  Calendar, Eye, Share2, Clock, ChevronRight, Link2, Check,
  Dot, ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import { useApiQuery } from '@/hooks/use-api-query';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  isHtmlContent, getCategoryLabel, getCategoryStyle, timeAgo, formatNewsDate,
  stripHtml, type NewsCategoryRef,
} from '@/lib/news-utils';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import ArticleCoverImage from '@/components/shared/ArticleCoverImage';
import LoginModal from '@/components/shared/LoginModal';
import { useSEO } from '@/hooks/use-seo';
import type { NewsArticle, NewsCategory, NewsComment } from '@/lib/api-types';

interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  content?: string;
  cover_image?: string | null;
  published_at?: string | null;
}

function splitExcerpt(content: string): { excerpt: string; body: string } {
  const match = content.match(/^<p>([\s\S]*?)<\/p>\s*/i);
  if (match) {
    const excerpt = stripHtml(match[1]);
    if (excerpt.length <= 300) {
      return { excerpt, body: content.slice(match[0].length) };
    }
  }
  return { excerpt: '', body: content };
}

function formatLongDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function estimateReadTime(content: string) {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, words / 200);
  return minutes < 10 ? `${minutes.toFixed(1)} mnt dibaca` : `${Math.round(minutes)} mnt dibaca`;
}

function pseudoCount(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 10000;
  return min + (hash % (max - min + 1));
}

const BeritaDetail = () => {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);

  const { data: article, isLoading: articleLoading } = useApiQuery<NewsArticle>(
    `/news/slug/${slug}`,
    { auth: false, enabled: Boolean(slug) },
  );
  const { data: categories = [] } = useApiQuery<NewsCategory[]>('/news-categories', { auth: false });
  const { data: allNews = [], isLoading: newsLoading } = useApiQuery<ArticleListItem[]>(
    '/news?public_only=true',
    { auth: false },
  );

  useSEO({
    title: article ? article.title : 'Berita Pengawasan SPPG',
    description: article ? stripHtml(article.content || '').substring(0, 150) : 'Detail berita pengawasan Badan Gizi Nasional.',
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [hasReacted, setHasReacted] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(`reacted_${slug}`) || null;
    }
    return null;
  });

  const { data: reactions, refetch: refetchReactions } = useApiQuery<{ likes: number; dislikes: number }>(
    `/articles/${slug}/reactions`,
    { auth: false, enabled: Boolean(slug) }
  );

  const { data: comments = [], refetch: refetchComments, isLoading: commentsLoading } = useApiQuery<NewsComment[]>(
    `/news/${slug}/comments`,
    { auth: false, enabled: Boolean(slug) }
  );

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/news/${slug}/comments`, { content, is_anonymous: isAnonymous }, true),
    onSuccess: () => {
      toast({
        title: 'Komentar Terkirim',
        description: 'Komentar Anda telah dikirim dan menunggu persetujuan admin.',
      });
      setCommentText('');
      setIsAnonymous(false);
      refetchComments();
    },
    onError: (error) => {
      toast({
        title: 'Gagal mengirim komentar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleVoteComment = async (commentId: string, type: 'like' | 'dislike') => {
    const key = `voted_comment_${commentId}`;
    const existing = localStorage.getItem(key);

    let voteType: 'like' | 'dislike' | 'unlike' | 'undislike' = type;
    if (existing === type) {
      voteType = type === 'like' ? 'unlike' : 'undislike';
      localStorage.removeItem(key);
    } else if (existing) {
      toast({
        title: 'Info',
        description: 'Anda sudah menanggapi komentar ini. Batalkan tanggapan sebelumnya terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    } else {
      localStorage.setItem(key, type);
    }

    try {
      await api.post(`/news-comments/${commentId}/vote`, { type: voteType }, false);
      refetchComments();
    } catch (err: any) {
      if (voteType === type) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, type);
      }
      toast({
        title: 'Gagal',
        description: err.message || 'Gagal menyimpan tanggapan komentar.',
        variant: 'destructive',
      });
    }
  };

  const getCommentVoteState = (commentId: string) => {
    return localStorage.getItem(`voted_comment_${commentId}`) || null;
  };

  const likeMutation = useMutation({
    mutationFn: () => api.post<{ likes: number; dislikes: number }>(`/articles/${slug}/like`, undefined, false),
    onSuccess: () => {
      refetchReactions();
      if (slug) localStorage.setItem(`reacted_${slug}`, 'like');
      setHasReacted('like');
      toast({ title: 'Tersimpan', description: 'Terima kasih atas tanggapan Anda!' });
    },
  });

  const dislikeMutation = useMutation({
    mutationFn: () => api.post<{ likes: number; dislikes: number }>(`/articles/${slug}/dislike`, undefined, false),
    onSuccess: () => {
      refetchReactions();
      if (slug) localStorage.setItem(`reacted_${slug}`, 'dislike');
      setHasReacted('dislike');
      toast({ title: 'Tersimpan', description: 'Terima kasih atas tanggapan Anda!' });
    },
  });

  const loading = articleLoading || newsLoading;
  const related = (article?.related || []) as ArticleListItem[];
  const latest = useMemo(
    () => allNews.filter((n) => n.slug !== slug).slice(0, 5),
    [allNews, slug],
  );

  const categoryRefs: NewsCategoryRef[] = categories;

  const CategoryTag = ({ category }: { category: string }) => (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getCategoryStyle(category, categoryRefs)}`}>
      {getCategoryLabel(category, categoryRefs)}
    </span>
  );

  const SidebarItem = ({ item }: { item: ArticleListItem }) => (
    <Link to={`/berita/${item.slug}`} className="flex gap-3 group">
      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
        <ArticleCoverImage src={item.cover_image} alt={item.title} iconSize="xs" />
      </div>
      <div className="min-w-0 flex-1">
        <CategoryTag category={item.category} />
        <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-2 group-hover:text-[#1a4a8a] transition-colors leading-snug">
          {item.title}
        </h3>
        {item.published_at && (
          <p className="text-xs text-muted-foreground mt-1">{timeAgo(item.published_at)}</p>
        )}
      </div>
    </Link>
  );

  const RelatedCard = ({ item }: { item: ArticleListItem }) => (
    <Link to={`/berita/${item.slug}`} className="card-elevated overflow-hidden hover:shadow-lg transition-shadow group block">
      <div className="aspect-[16/9] bg-muted overflow-hidden">
        <ArticleCoverImage src={item.cover_image} alt={item.title} hoverScale />
      </div>
      <div className="p-5">
        <CategoryTag category={item.category} />
        <h3 className="font-bold text-foreground mt-2 mb-2 line-clamp-2 group-hover:text-[#1a4a8a] transition-colors leading-snug">
          {item.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {stripHtml(item.content || '').slice(0, 150)}...
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {item.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatNewsDate(item.published_at)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {pseudoCount(item.slug, 100, 999)}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            {pseudoCount(item.slug, 5, 80)}
          </span>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center py-12 text-muted-foreground">Memuat berita...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="text-muted-foreground">Berita tidak ditemukan.</p>
          <Link to="/berita" className="mt-4 text-secondary hover:underline">← Kembali ke Berita</Link>
        </div>
      </div>
    );
  }

  const { excerpt, body } = splitExcerpt(article.content || '');
  const displayBody = excerpt ? body : article.content;
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = article.title;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="page-container">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Beranda</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/berita">Berita</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[200px] sm:max-w-xs truncate">{article.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-10">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <CategoryTag category={article.category} />
            {article.is_breaking && (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-red-600 text-red-600">
                Breaking
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
            <span className="font-medium text-foreground">Redaksi BGN</span>
            {article.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatLongDate(article.published_at)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {estimateReadTime(article.content || '')}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {pseudoCount(article.slug, 200, 999)} disaksikan
            </span>
          </div>

          <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted mb-2">
            <ArticleCoverImage src={article.cover_image} alt={article.title} iconSize="xl" />
          </div>
          {article.cover_image_source && (
            <p className="text-xs text-muted-foreground italic mb-6 mt-1 text-right">
              Sumber: {article.cover_image_source}
            </p>
          )}

          {excerpt && (
            <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 rounded-lg p-5 mb-6">
              <p className="text-foreground/90 dark:text-sky-200 leading-relaxed font-medium">{excerpt}</p>
            </div>
          )}

          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            {isHtmlContent(displayBody || '') ? (
              <div dangerouslySetInnerHTML={{ __html: displayBody }} />
            ) : (
              <p className="text-foreground/80 dark:text-slate-300 leading-relaxed whitespace-pre-line">{displayBody}</p>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-sky-100 text-sky-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/60 rounded-lg border border-border">
            <Share2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-foreground">Bagikan:</span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
            >
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
            >
              X / Twitter
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-sm px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin' : 'Salin Tautan'}
            </button>
          </div>

          {/* Reaksi (Like / Dislike) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 p-5 bg-muted/30 rounded-lg border border-border">
            <span className="text-sm font-semibold text-foreground">Apakah artikel ini bermanfaat bagi Anda?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => !hasReacted && likeMutation.mutate()}
                disabled={likeMutation.isPending || !!hasReacted}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                  hasReacted === 'like'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                    : hasReacted === 'dislike'
                    ? 'opacity-40 cursor-not-allowed bg-background border-border text-muted-foreground'
                    : 'bg-background border-border hover:bg-muted text-foreground hover:border-muted-foreground/30'
                }`}
                aria-label="Like"
              >
                <ThumbsUp className={`w-4 h-4 ${hasReacted === 'like' ? 'fill-emerald-600' : ''}`} />
                <span>Bermanfaat ({reactions?.likes ?? 0})</span>
              </button>
              <button
                onClick={() => !hasReacted && dislikeMutation.mutate()}
                disabled={dislikeMutation.isPending || !!hasReacted}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                  hasReacted === 'dislike'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                    : hasReacted === 'like'
                    ? 'opacity-40 cursor-not-allowed bg-background border-border text-muted-foreground'
                    : 'bg-background border-border hover:bg-muted text-foreground hover:border-rose-200 hover:text-rose-700'
                }`}
                aria-label="Dislike"
              >
                <ThumbsDown className={`w-4 h-4 ${hasReacted === 'dislike' ? 'fill-rose-600' : ''}`} />
                <span>Kurang Bermanfaat ({reactions?.dislikes ?? 0})</span>
              </button>
            </div>
          </div>

          {/* Kolom Komentar */}
          <div className="mt-10 pt-8 border-t border-border">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#001F3F]" />
              Komentar ({comments.length})
            </h2>

            {/* Form Menulis Komentar */}
            {user ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commentText.trim()) {
                    commentMutation.mutate(commentText);
                  }
                }}
                className="mb-8 space-y-3 bg-muted/20 p-5 rounded-lg border border-border"
              >
                <div>
                  <label htmlFor="comment-text" className="text-xs font-semibold text-muted-foreground block mb-2">
                    Tulis Komentar sebagai <span className="text-foreground font-bold">{user.full_name || user.email}</span>
                  </label>
                  <textarea
                    id="comment-text"
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Bagikan opini, masukan, atau pertanyaan Anda mengenai berita ini..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={commentMutation.isPending}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    id="anonymous-checkbox"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-[#001F3F] border-gray-300 rounded focus:ring-[#001F3F] cursor-pointer"
                  />
                  <label htmlFor="anonymous-checkbox" className="text-xs font-semibold text-muted-foreground select-none cursor-pointer">
                    Kirim sebagai Anonim (sembunyikan nama & email saya di publik)
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center">
                  <p className="text-xs text-muted-foreground italic">
                    *Komentar akan melalui moderasi admin terlebih dahulu sebelum ditampilkan ke publik.
                  </p>
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || !commentText.trim()}
                    className="inline-flex items-center justify-center rounded-md bg-[#001F3F] text-white px-4 py-2 text-sm font-semibold hover:bg-[#1a4a8a] transition-colors disabled:opacity-50"
                  >
                    {commentMutation.isPending ? 'Mengirim...' : 'Kirim Komentar'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-muted/40 border border-dashed border-border rounded-lg p-6 text-center mb-8">
                <p className="text-sm text-muted-foreground mb-3">
                  Silakan masuk/login terlebih dahulu untuk dapat berpartisipasi menulis komentar di artikel ini.
                </p>
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-md bg-[#001F3F] text-white px-4 py-2 text-sm font-semibold hover:bg-[#1a4a8a] transition-colors"
                >
                  Masuk Akun
                </button>
              </div>
            )}

            {/* Daftar Komentar */}
            <div className="space-y-4">
              {commentsLoading ? (
                <p className="text-sm text-muted-foreground">Memuat komentar...</p>
              ) : comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="p-4 bg-background rounded-lg border border-border flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 select-none">
                      {(c.user?.full_name || c.user?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {c.user?.full_name || c.user?.email || 'Pengguna'}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {timeAgo(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                        {c.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleVoteComment(c.id, 'like')}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                            getCommentVoteState(c.id) === 'like'
                              ? 'bg-secondary/15 text-secondary font-bold animate-in zoom-in-95 duration-150'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{c.likes || 0}</span>
                        </button>
                        <button
                          onClick={() => handleVoteComment(c.id, 'dislike')}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                            getCommentVoteState(c.id) === 'dislike'
                              ? 'bg-destructive/15 text-destructive font-bold animate-in zoom-in-95 duration-150'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>{c.dislikes || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-6">
                  Belum ada komentar pada artikel ini.
                </p>
              )}
            </div>
          </div>
        </article>

        <aside className="lg:pt-1">
          <div className="lg:sticky lg:top-24">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-foreground mb-4 pb-2 border-b-2 border-[#001F3F] flex items-center gap-2">
              <span className="w-1 h-5 bg-[#001F3F] rounded-full" />
              Berita Terbaru
            </h2>
            <div className="space-y-4">
              {latest.map((item) => (
                <SidebarItem key={item.id} item={item} />
              ))}
              {latest.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada berita lain</p>
              )}
            </div>
            <Link
              to="/berita"
              className="mt-5 flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-semibold text-[#001F3F] hover:text-[#1a4a8a] transition-colors"
            >
              Lihat Semua Berita
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12 pt-10 border-t border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">Rekomendasi Berita</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {related.map((item) => (
              <RelatedCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
};

export default BeritaDetail;
