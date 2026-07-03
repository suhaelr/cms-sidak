import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Tag, AlertTriangle, ToggleLeft, Newspaper } from 'lucide-react';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';

export const MASTER_DATA_TABS = [
  { key: 'kitchens', label: 'Dapur SPPG', icon: Building2 },
  { key: 'news-categories', label: 'Kategori Berita', icon: Newspaper },
  { key: 'finding-categories', label: 'Kategori Temuan', icon: Tag },
  { key: 'sanction-types', label: 'Jenis Sanksi', icon: AlertTriangle },
  { key: 'status', label: 'Status', icon: ToggleLeft },
] as const;

export type MasterDataTab = (typeof MASTER_DATA_TABS)[number]['key'];

export function getActiveTab(pathname: string): MasterDataTab {
  const match = pathname.match(/\/admin\/master-data\/([^/]+)/);
  const tab = match?.[1] as MasterDataTab | undefined;
  return MASTER_DATA_TABS.some((t) => t.key === tab) ? tab! : 'kitchens';
}

const MasterDataLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(location.pathname);
  const isFormRoute = location.pathname.includes('/create') || location.pathname.includes('/edit');

  useAdminHeader();

  if (location.pathname === '/admin/master-data') {
    return <Navigate to={adminPaths.masterData.list('kitchens')} replace />;
  }

  return (
    <div>
      {!isFormRoute && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {MASTER_DATA_TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => navigate(adminPaths.masterData.list(t.key))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      )}
      <Outlet />
    </div>
  );
};

export default MasterDataLayout;
