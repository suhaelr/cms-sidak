import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { UserPlus, X } from 'lucide-react';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import { getErrorMessage } from '@/lib/utils';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin_pusat', label: 'Admin Pusat' },
  { value: 'admin_wilayah', label: 'Admin Wilayah' },
  { value: 'inspektor', label: 'Inspektor' },
  { value: 'verifikator', label: 'Verifikator' },
];

const UsersFormPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'inspektor',
  });

  const createMutation = useApiMutation({
    invalidate: ['/users'],
    mutationFn: async (payload: typeof newUser) => {
      return api.post<{ success?: boolean; error?: string }>('/users', {
        email: payload.email,
        password: payload.password,
        full_name: payload.full_name,
        role: payload.role,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: 'Berhasil', description: 'Pengguna baru berhasil dibuat' });
        navigate(adminPaths.users.list);
      } else {
        toast({ title: 'Gagal', description: data.error || 'Gagal membuat pengguna', variant: 'destructive' });
      }
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error) || 'Gagal membuat pengguna', variant: 'destructive' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newUser);
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.users.list)}>
        <X className="w-4 h-4" /> Batal
      </AdminHeaderButton>
    ),
  });

  return (
    <div className="card-elevated p-6">
      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5" /> Buat Pengguna Baru
      </h2>
      <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nama Lengkap</label>
          <input
            type="text"
            value={newUser.full_name}
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            required
            placeholder="Nama lengkap"
            className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            placeholder="email@bgn.go.id"
            className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Password</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
            minLength={6}
            placeholder="Min. 6 karakter"
            className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Role</label>
          <SearchableSelect
            value={newUser.role}
            onValueChange={(role) => setNewUser({ ...newUser, role })}
            options={ROLES}
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Buat Pengguna
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsersFormPage;
