import { demoUsers } from '@/data/mockData';
import { Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const DemoCredentials = () => {
  // Only show in development
  const isDev = import.meta.env.DEV;

  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Halaman Tidak Tersedia</h1>
          <p className="text-muted-foreground mt-2">Halaman ini hanya tersedia di mode pengembangan.</p>
          <Link to="/" className="text-secondary hover:underline mt-4 inline-block">← Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Demo Credentials</h1>
            <p className="text-muted-foreground text-sm">Akun demo untuk pengujian — hanya tersedia di mode development</p>
          </div>
        </div>

        <div className="disclaimer-banner mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p>Halaman ini hanya tampil saat mode development. Jangan gunakan kredensial ini di lingkungan produksi.</p>
        </div>

        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Password</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Akses</th>
              </tr>
            </thead>
            <tbody>
              {demoUsers.map((u) => (
                <tr key={u.email} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.role}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.password}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-4">
          <Link to="/admin/login" className="text-secondary hover:underline text-sm">→ Login Admin</Link>
          <Link to="/" className="text-muted-foreground hover:underline text-sm">← Beranda</Link>
        </div>
      </div>
    </div>
  );
};

export default DemoCredentials;
