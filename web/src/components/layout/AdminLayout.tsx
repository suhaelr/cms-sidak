import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { ADMIN_MENU_FLAG_BY_PATH } from '@/lib/feature-flags';
import { AdminHeaderProvider } from '@/contexts/AdminHeaderContext';
import {
  LayoutDashboard, ClipboardCheck, FileSearch, AlertTriangle,
  Newspaper, FileDown, MessageSquare, Database, Users,
  LogOut, Menu, X, Image, ExternalLink, MessageCircle
} from 'lucide-react';
import bgnLogo from '@/assets/sidak-bgn-logo.png';

const sidebarItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Sidak Management', path: '/admin/sidak', icon: ClipboardCheck, flag: ADMIN_MENU_FLAG_BY_PATH['/admin/sidak'] },
  { label: 'Tindak Lanjut', path: '/admin/tindak-lanjut', icon: FileSearch, flag: ADMIN_MENU_FLAG_BY_PATH['/admin/tindak-lanjut'] },
  { label: 'Sanksi', path: '/admin/sanksi', icon: AlertTriangle, flag: ADMIN_MENU_FLAG_BY_PATH['/admin/sanksi'] },
  { label: 'Berita', path: '/admin/berita', icon: Newspaper },
  { label: 'Komentar Berita', path: '/admin/komentar', icon: MessageCircle },
  { label: 'Dokumen', path: '/admin/dokumen', icon: FileDown, flag: ADMIN_MENU_FLAG_BY_PATH['/admin/dokumen'] },
  { label: 'Pengaduan', path: '/admin/pengaduan', icon: MessageSquare, flag: ADMIN_MENU_FLAG_BY_PATH['/admin/pengaduan'] },
  { label: 'Master Data', path: '/admin/master-data', icon: Database },
  { label: 'Hero Slides', path: '/admin/hero-slides', icon: Image },
  { label: 'Pengguna & Peran', path: '/admin/users', icon: Users },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const visibleSidebarItems = sidebarItems.filter((item) => !item.flag || isEnabled(item.flag));

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="admin-theme min-h-screen flex bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-primary/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 h-svh bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img src={bgnLogo} alt="Logo BGN" className="w-9 h-9" />
          <div>
            <div className="font-bold text-sm text-white">SidakBGN</div>
            <div className="text-xs text-sidebar-foreground/60">Admin Dashboard</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 text-sidebar-foreground/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="py-2 flex-1 min-h-0 overflow-y-auto">
          {visibleSidebarItems.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(`${item.path}/`));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 pl-4 pr-5 py-2.5 text-sm transition-colors border-l-[4px] ${
                  active
                    ? 'border-secondary bg-white/10 text-white font-semibold'
                    : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white/80 font-medium'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 pl-4 pr-5 py-2.5 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            Kembali ke Portal Publik
          </Link>

          <div className="flex items-center gap-2 px-4 py-3 border-t border-sidebar-border">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 text-xs font-bold uppercase">
                {(user?.email?.[0] || 'A')}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/50 leading-tight">Selamat datang</p>
                <p className="text-sm text-white font-medium truncate leading-tight">{user?.email || 'Admin'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Keluar"
              title="Keluar"
              className="p-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <AdminHeaderProvider
          renderHeader={({ title, cta }) => (
            <header className="bg-card border-b border-border sticky top-0 z-30">
              <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-1.5 rounded-md hover:bg-muted text-primary shrink-0"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
                </div>
                {cta && <div className="shrink-0">{cta}</div>}
              </div>
            </header>
          )}
        >
          <main className="flex-1 p-4 sm:p-6 lg:px-8">{children}</main>
        </AdminHeaderProvider>
      </div>
    </div>
  );
};

export default AdminLayout;
