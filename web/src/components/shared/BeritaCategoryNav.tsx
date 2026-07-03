import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useFeatureFlag } from '@/contexts/FeatureFlagsContext';
import { HOME_FILTERS, type HomeFilter } from '@/lib/news-utils';

const isActiveFilter = (filter: HomeFilter, current: string) =>
  (current || 'Semua') === filter;

const filterHref = (filter: HomeFilter, pathname: string) => {
  const base = pathname === '/' ? '/' : '/berita';
  return filter === 'Semua' ? base : `${base}?kategori=${encodeURIComponent(filter)}`;
};

interface BeritaCategoryNavProps {
  variant?: 'header' | 'inline';
  className?: string;
}

const BeritaCategoryNav = ({ variant = 'inline', className = '' }: BeritaCategoryNavProps) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const socialMediaEnabled = useFeatureFlag('menu_social_media');
  const filters = socialMediaEnabled
    ? HOME_FILTERS
    : HOME_FILTERS.filter((f) => f !== 'Video');
  const active = searchParams.get('kategori') || 'Semua';
  const onFilteredPage = location.pathname === '/berita' || location.pathname === '/';

  const pillClass = (filter: HomeFilter) => {
    const selected = onFilteredPage && isActiveFilter(filter, active);
    if (variant === 'header') {
      return `px-2.5 py-1.5 rounded-md text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
        selected
          ? 'bg-[#1a4a8a] text-white'
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`;
    }
    return `px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
      selected
        ? 'bg-[#001F3F] text-white'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`;
  };

  return (
    <nav className={`flex items-center gap-0.5 flex-wrap ${className}`} aria-label="Kategori berita">
      {filters.map((filter) => (
        <Link key={filter} to={filterHref(filter, location.pathname)} className={pillClass(filter)}>
          {filter}
        </Link>
      ))}
    </nav>
  );
};

export default BeritaCategoryNav;
