import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck, AlertTriangle, CheckCircle, Clock, XCircle,
  Users, FileText, MessageSquare, Download, Plus, TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import StatusBadge from '@/components/shared/StatusBadge';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useApiQuery } from '@/hooks/use-api-query';
import type { DashboardStats } from '@/lib/api-types';

const quickActions = [
  { label: 'Buat Sidak Baru', icon: Plus, path: '/admin/sidak', color: 'bg-primary text-primary-foreground', flag: 'menu_sidak_management' as const },
  { label: 'Buat Berita', icon: FileText, path: '/admin/berita', color: 'bg-secondary text-secondary-foreground' },
  { label: 'Lihat Pengaduan', icon: MessageSquare, path: '/admin/pengaduan', color: 'bg-warning text-warning-foreground', flag: 'menu_pengaduan' as const },
  { label: 'Export Laporan', icon: Download, path: '#', color: 'bg-accent text-accent-foreground' },
];

const AdminDashboard = () => {
  const { isEnabled } = useFeatureFlags();
  const visibleQuickActions = quickActions.filter((action) => !action.flag || isEnabled(action.flag));

  const { data } = useApiQuery<DashboardStats>('/dashboard/stats');

  const totalInspections = data?.counts.inspections || 0;
  const totalFindings = data?.counts.findings || 0;
  const followUpDone = data?.counts.followups_done || 0;
  const activeSanctions = data?.counts.sanctions_active || 0;
  const newComplaints = data?.counts.complaints_new || 0;
  const publicDocs = data?.counts.documents_public || 0;
  const recentInspections = data?.recent_inspections ?? [];
  const recentComplaints = data?.recent_complaints ?? [];

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts: Record<string, number> = {};
    months.forEach((m) => (counts[m] = 0));
    (data?.inspection_dates || []).forEach((d) => {
      const monthIdx = new Date(d).getMonth();
      counts[months[monthIdx]] = (counts[months[monthIdx]] || 0) + 1;
    });
    return months.map((m) => ({ month: m, sidak: counts[m] }));
  }, [data?.inspection_dates]);

  const fmt = (n: number) => n.toLocaleString('id-ID');

  useAdminHeader();

  const stats = [
    { label: 'Total Sidak', value: fmt(totalInspections), icon: ClipboardCheck, color: 'stat-card-blue' },
    { label: 'Total Temuan', value: fmt(totalFindings), icon: AlertTriangle, color: 'stat-card-amber' },
    { label: 'Tindak Lanjut Selesai', value: fmt(followUpDone), icon: CheckCircle, color: 'stat-card-teal' },
    { label: 'Sanksi Aktif', value: fmt(activeSanctions), icon: XCircle, color: 'stat-card-red' },
    { label: 'Pengaduan Baru', value: fmt(newComplaints), icon: MessageSquare, color: 'stat-card-blue' },
    { label: 'Dokumen Publik', value: fmt(publicDocs), icon: FileText, color: 'stat-card-teal' },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {visibleQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} to={action.path} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${action.color} hover:opacity-90 transition-opacity`}>
              <Icon className="w-4 h-4" /> {action.label}
            </Link>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`stat-card ${stat.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === 'stat-card-blue' ? 'bg-primary/10 text-primary' :
                  stat.color === 'stat-card-teal' ? 'bg-secondary/15 text-primary' :
                  stat.color === 'stat-card-amber' ? 'bg-warning/20 text-primary' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card-elevated p-6">
          <h3 className="font-semibold text-foreground mb-4">Tren Sidak Bulanan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(191, 30%, 86%)" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} stroke="hsl(219, 30%, 45%)" />
              <YAxis fontSize={12} tickLine={false} stroke="hsl(219, 30%, 45%)" />
              <Tooltip />
              <Line type="monotone" dataKey="sidak" stroke="#92d05d" strokeWidth={2} dot={{ fill: '#92d05d' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-semibold text-foreground mb-4">Sidak per Bulan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(191, 30%, 86%)" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} stroke="hsl(219, 30%, 45%)" />
              <YAxis fontSize={12} tickLine={false} stroke="hsl(219, 30%, 45%)" />
              <Tooltip />
              <Bar dataKey="sidak" fill="#071e49" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elevated p-6">
          <h3 className="font-semibold text-foreground mb-4">Sidak Terbaru</h3>
          <div className="space-y-3">
            {recentInspections.length > 0 ? recentInspections.map((ins) => (
              <div key={ins.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground text-sm">{ins.sppg_kitchens?.code || '-'}</p>
                  <p className="text-xs text-muted-foreground">{ins.regions?.name || '-'} — {new Date(ins.date).toLocaleDateString('id-ID')}</p>
                </div>
                <StatusBadge status={ins.publication_status} />
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
            )}
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-semibold text-foreground mb-4">Pengaduan Terbaru</h3>
          <div className="space-y-3">
            {recentComplaints.length > 0 ? recentComplaints.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground text-sm">{c.ticket_no}</p>
                  <p className="text-xs text-muted-foreground">{c.topic} — {c.regions?.name || '-'}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada pengaduan</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
