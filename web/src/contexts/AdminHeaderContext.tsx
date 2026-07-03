import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/sidak': 'Sidak Management',
  '/admin/tindak-lanjut': 'Tindak Lanjut',
  '/admin/sanksi': 'Manajemen Sanksi',
  '/admin/berita': 'Berita',
  '/admin/komentar': 'Moderasi Komentar',
  '/admin/dokumen': 'Manajemen Dokumen',
  '/admin/pengaduan': 'Manajemen Pengaduan',
  '/admin/master-data': 'Master Data',
  '/admin/hero-slides': 'Hero Slides',
  '/admin/users': 'Pengguna & Peran',
};

const MODULE_TITLES: Record<string, { list: string; create: string; edit: string }> = {
  berita: { list: 'Berita', create: 'Tulis Artikel', edit: 'Edit Artikel' },
  sidak: { list: 'Sidak Management', create: 'Buat Sidak', edit: 'Edit Sidak' },
  sanksi: { list: 'Manajemen Sanksi', create: 'Tambah Sanksi', edit: 'Edit Sanksi' },
  dokumen: { list: 'Manajemen Dokumen', create: 'Tambah Dokumen', edit: 'Edit Dokumen' },
  'tindak-lanjut': { list: 'Tindak Lanjut', create: 'Tambah Tindak Lanjut', edit: 'Edit Tindak Lanjut' },
  pengaduan: { list: 'Manajemen Pengaduan', create: 'Detail Pengaduan', edit: 'Detail Pengaduan' },
  users: { list: 'Pengguna & Peran', create: 'Buat Pengguna', edit: 'Edit Pengguna' },
  'hero-slides': { list: 'Hero Slides', create: 'Tambah Slide', edit: 'Edit Slide' },
};

const MASTER_DATA_TAB_LABELS: Record<string, string> = {
  kitchens: 'Dapur SPPG',
  'news-categories': 'Kategori Berita',
  'finding-categories': 'Kategori Temuan',
  'sanction-types': 'Jenis Sanksi',
  status: 'Status',
};

export function resolveAdminTitle(pathname: string): string {
  const exact = ADMIN_PAGE_TITLES[pathname];
  if (exact) return exact;

  const parts = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const [module, ...rest] = parts;

  if (module === 'master-data') {
    const [tab, action, sub] = rest;
    if (!tab) return 'Master Data';
    const tabLabel = MASTER_DATA_TAB_LABELS[tab] ?? tab;
    if (action === 'create') return `Tambah ${tabLabel}`;
    if (sub === 'edit') return `Edit ${tabLabel}`;
    if (tab === 'status') return 'Daftar Status';
    return tabLabel;
  }

  const titles = module ? MODULE_TITLES[module] : undefined;
  if (!titles) return 'Admin';

  if (rest[0] === 'create') return titles.create;
  if (rest[1] === 'edit') return titles.edit;
  if (module === 'pengaduan' && rest.length === 1) return titles.edit;

  return titles.list;
}

type PageHeader = {
  title?: string;
  cta?: ReactNode | null;
};

type AdminHeaderContextValue = {
  setPageHeader: (header: PageHeader) => void;
};

const AdminHeaderContext = createContext<AdminHeaderContextValue | null>(null);

export function AdminHeaderProvider({
  children,
  renderHeader,
}: {
  children: ReactNode;
  renderHeader: (props: { title: string; cta: ReactNode | null }) => ReactNode;
}) {
  const location = useLocation();
  const [pageHeader, setPageHeader] = useState<PageHeader>({});

  const title = pageHeader.title ?? resolveAdminTitle(location.pathname);
  const cta = pageHeader.cta ?? null;

  const contextValue = useMemo(() => ({ setPageHeader }), []);

  return (
    <AdminHeaderContext.Provider value={contextValue}>
      {renderHeader({ title, cta })}
      {children}
    </AdminHeaderContext.Provider>
  );
}

export function useAdminHeader({ title, cta }: PageHeader = {}, deps: DependencyList = []) {
  const ctx = useContext(AdminHeaderContext);
  if (!ctx) {
    throw new Error('useAdminHeader must be used within AdminHeaderProvider');
  }

  const { setPageHeader } = ctx;

  useEffect(() => {
    setPageHeader({ title, cta });
    return () => setPageHeader({});
    // cta is intentionally omitted — pass values that affect the CTA via deps (e.g. showForm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageHeader, title, ...deps]);
}

export function AdminHeaderButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
