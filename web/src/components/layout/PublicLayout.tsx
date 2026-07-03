import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, Instagram, Facebook, LogOut, Sun, Moon, ChevronDown, User } from 'lucide-react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { PUBLIC_MENU_FLAG_BY_PATH } from '@/lib/feature-flags';
import bgnLogo from '@/assets/sidak-bgn-logo.png';
import SearchModal from '@/components/shared/SearchModal';
import BeritaCategoryNav from '@/components/shared/BeritaCategoryNav';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import LoginModal from '@/components/shared/LoginModal';

const navItems = [
  { label: 'Beranda', path: '/' },
  { label: 'Berita', path: '/berita' },
  { label: 'Social Media', path: '/social-media', flag: PUBLIC_MENU_FLAG_BY_PATH['/social-media'] },
  { label: 'Dokumentasi Sidak', path: '/dokumentasi-sidak', flag: PUBLIC_MENU_FLAG_BY_PATH['/dokumentasi-sidak'] },
  { label: 'Daftar Sanksi', path: '/daftar-sanksi', flag: PUBLIC_MENU_FLAG_BY_PATH['/daftar-sanksi'] },
  { label: 'Download Dokumen', path: '/download-dokumen', flag: PUBLIC_MENU_FLAG_BY_PATH['/download-dokumen'] },
  { label: 'Kanal Pengaduan', path: '/kanal-pengaduan', flag: PUBLIC_MENU_FLAG_BY_PATH['/kanal-pengaduan'] },
];

const isNavActive = (pathname: string, path: string) => {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
};

const profilLinks = [
  { label: 'Tentang BGN', href: 'https://bgn.go.id/' },
  { label: 'Visi & Misi', href: 'https://bgn.go.id/vision-mission' },
  { label: 'Tugas & Fungsi', href: 'https://bgn.go.id/functions-duties' },
  { label: 'Pejabat BGN', href: 'https://bgn.go.id/team' },
];

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { isEnabled } = useFeatureFlags();
  const visibleNavItems = navItems.filter((item) => !item.flag || isEnabled(item.flag));
  const isNewsSection = location.pathname === '/' || location.pathname === '/berita' || location.pathname.startsWith('/berita/');

  const openSearch = () => {
    setMobileOpen(false);
    setSearchOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-background">
      {/* Main navbar */}
      <header className="bg-[#001F3F] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img src={bgnLogo} alt="Logo BGN" className="w-9 h-9 rounded" />
              <div className="hidden xl:block">
                <div className="font-bold text-sm leading-tight">SidakBGN</div>
                <div className="text-[10px] text-white/60">Portal Pengawasan SPPG</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center min-w-0 overflow-x-auto">
              {isNewsSection ? (
                <BeritaCategoryNav variant="header" />
              ) : (
                visibleNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2.5 py-1.5 rounded-md text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                      isNavActive(location.pathname, item.path)
                        ? 'bg-[#1a4a8a] text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </nav>

            <div className="hidden md:flex items-center gap-4 flex-shrink-0">
              <button
                type="button"
                onClick={openSearch}
                className="relative pl-9 pr-3 py-1.5 w-36 lg:w-44 text-sm bg-white/10 border border-white/20 rounded-full text-white/50 text-left hover:bg-white/15 focus:outline-none focus:ring-1 focus:ring-white/40 transition-colors"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
                Cari berita
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={profileDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm uppercase select-none">
                      {(user.full_name || user.email || '?').charAt(0)}
                    </div>
                    <span className="hidden xl:inline text-xs font-semibold max-w-[120px] truncate">
                      {user.full_name || user.email}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  </button>

                  {profileDropdownOpen && (
                    <>
                      {/* Backdrop to close */}
                      <div className="fixed inset-0 z-45" onClick={() => setProfileDropdownOpen(false)} />
                      
                      <div className="absolute right-0 mt-2 w-56 rounded-lg bg-card text-card-foreground border border-border shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-xs text-muted-foreground font-medium">Masuk sebagai</p>
                          <p className="text-sm font-bold truncate mt-0.5">{user.full_name || 'User'}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            setTheme(theme === 'dark' ? 'light' : 'dark');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-muted text-left transition-colors"
                        >
                          {theme === 'dark' ? (
                            <>
                              <Sun className="w-4 h-4 text-amber-500" />
                              <span>Mode Terang</span>
                            </>
                          ) : (
                            <>
                              <Moon className="w-4 h-4 text-indigo-500" />
                              <span>Mode Gelap</span>
                            </>
                          )}
                        </button>

                        <hr className="border-border my-1" />

                        <button
                          onClick={async () => {
                            setProfileDropdownOpen(false);
                            await signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/5 text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="px-4 py-1.5 rounded-full bg-secondary hover:opacity-90 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Masuk
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md text-white hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#001a35] px-4 py-3 space-y-1">
            {isNewsSection ? (
              <div className="flex flex-wrap gap-1.5 pb-2">
                <BeritaCategoryNav variant="header" className="gap-1.5" />
              </div>
            ) : (
              visibleNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-md text-sm font-medium ${
                    isNavActive(location.pathname, item.path) ? 'bg-[#1a4a8a] text-white' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))
            )}
            <div className="pt-2">
              <button
                type="button"
                onClick={openSearch}
                className="w-full relative pl-10 pr-4 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white/50 text-left hover:bg-white/15 focus:outline-none transition-colors"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                Cari berita
              </button>
            </div>

            {user ? (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="px-3 py-1.5">
                  <p className="text-[10px] text-white/50">Masuk sebagai</p>
                  <p className="text-sm font-bold text-white truncate">{user.full_name || user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 text-left"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Mode Terang</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span>Mode Gelap</span>
                    </>
                  )}
                </button>
                <button
                  onClick={async () => {
                    setMobileOpen(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-bold text-red-400 hover:bg-red-500/10 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-white/10">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setLoginOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-bold bg-[#1a4a8a] text-white hover:opacity-90"
                >
                  Masuk Akun
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#001F3F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={bgnLogo} alt="Logo BGN" className="w-10 h-10 rounded" />
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Portal resmi Badan Gizi Nasional untuk transparansi hasil inspeksi dapur SPPG
                pada Program Makan Bergizi Gratis.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-4">Navigasi</h3>
              <ul className="space-y-2 text-sm text-white/60">
                {visibleNavItems.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-4">Profil BGN</h3>
              <ul className="space-y-2 text-sm text-white/60">
                {profilLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-4">Hubungi Kami</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li>Jl. HR Rasuna Said Kav. B-9, Jakarta</li>
                <li>(021) 1234-5678</li>
                <li>info@bgn.go.id</li>
              </ul>
              <h3 className="font-semibold text-sm uppercase tracking-wide mt-6 mb-3">Media Sosial</h3>
              <div className="flex flex-wrap gap-3 text-sm text-white/60">
                <a href="#" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" /> @bgn_official
                </a>
                <a href="#" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Facebook className="w-4 h-4" /> BGN Indonesia
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-white/40">
            <span>© 2026 Badan Gizi Nasional. Seluruh hak dilindungi.</span>
            <Link to="/admin" className="text-white/30 hover:text-white/60 transition-colors">
              CMS Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
