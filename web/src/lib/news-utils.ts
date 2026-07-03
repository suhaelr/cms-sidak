export const timeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} bulan lalu`;
  return `${Math.floor(diffMonth / 12)} tahun lalu`;
};

export const formatNewsDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export const isHtmlContent = (content: string) => /<[a-z][\s\S]*>/i.test(content);

export interface NewsCategoryRef {
  slug: string;
  full_label: string;
  short_label: string;
  badge_color: string;
  is_builtin?: boolean;
}

const badgeColorStyles: Record<string, string> = {
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  lime: 'bg-lime-100 text-lime-700',
  rose: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-700',
  muted: 'bg-muted text-muted-foreground',
};

const legacyCategoryStyles: Record<string, string> = {
  Temuan: 'bg-sky-100 text-sky-700',
  Edukasi: 'bg-violet-100 text-violet-700',
  'Tindak Lanjut': 'bg-emerald-100 text-emerald-700',
  Kebijakan: 'bg-emerald-100 text-emerald-700',
  Sidak: 'bg-sky-100 text-sky-700',
  Kajian: 'bg-violet-100 text-violet-700',
  Berita: 'bg-emerald-100 text-emerald-700',
  Video: 'bg-rose-100 text-rose-700',
};

export const getBadgeColorStyle = (color: string) =>
  badgeColorStyles[color] || badgeColorStyles.muted;

export const getCategoryStyle = (category: string, categories?: NewsCategoryRef[]) => {
  const match = categories?.find((c) => c.slug === category);
  if (match) return getBadgeColorStyle(match.badge_color);
  return legacyCategoryStyles[category] || 'bg-muted text-muted-foreground';
};

export const getCategoryLabel = (slug: string, categories?: NewsCategoryRef[]) => {
  const match = categories?.find((c) => c.slug === slug);
  if (match) return match.short_label;
  return slug;
};

export const getCategoryFullLabel = (slug: string, categories?: NewsCategoryRef[]) => {
  const match = categories?.find((c) => c.slug === slug);
  if (match) return match.full_label;
  return slug;
};

export const HOME_FILTERS = ['Semua', 'Sidak', 'Kajian', 'Berita', 'Video'] as const;
export type HomeFilter = (typeof HOME_FILTERS)[number];

const builtinFilterMap: Record<Exclude<HomeFilter, 'Semua' | 'Video'>, string> = {
  Sidak: 'sidak',
  Kajian: 'laporan',
  Berita: 'berita_umum',
};

export const matchesHomeFilter = (
  categorySlug: string,
  filter: HomeFilter,
  categories?: NewsCategoryRef[],
) => {
  if (filter === 'Semua') return true;
  if (filter === 'Video') return false;
  const builtinSlug = builtinFilterMap[filter];
  if (categorySlug === builtinSlug) return true;
  if (filter === 'Berita' && categories) {
    const cat = categories.find((c) => c.slug === categorySlug);
    return !!cat && !cat.is_builtin;
  }
  return false;
};

export const slugFromLabel = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

/** Compare wilayah kode dagri values ignoring dots/padding (e.g. "31" matches "31.00"). */
export const normalizeKodeDagri = (kode: string) => kode.trim().replace(/\D/g, '');

export const matchesProvinceKode = (
  regionId: string | null | undefined,
  provinceKode: string,
) => {
  if (!regionId || !provinceKode) return false;
  const region = normalizeKodeDagri(regionId);
  const province = normalizeKodeDagri(provinceKode);
  if (!region || !province) return false;
  return region === province || region.startsWith(province) || province.startsWith(region.slice(0, 2));
};

export const provinceNameForRegion = (
  regionId: string | null | undefined,
  provinces: { id: string; name: string }[],
) => {
  if (!regionId) return null;
  const match = provinces.find((p) => matchesProvinceKode(regionId, p.id));
  return match?.name ?? null;
};
