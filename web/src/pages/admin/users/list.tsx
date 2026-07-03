import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useApiQuery } from '@/hooks/use-api-query';
import { useInvalidateApi } from '@/hooks/use-invalidate-api';
import { UserPlus, Trash2, Shield, X } from 'lucide-react';
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

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  created_at: string;
}

const UsersListPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const invalidate = useInvalidateApi();

  const { data, isLoading } = useApiQuery<{ users: UserItem[]; error?: string }>(
    '/users',
    { enabled: Boolean(user) },
  );
  const users = data?.users ?? [];

  const invalidateUsers = useCallback(() => invalidate('/users'), [invalidate]);

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete<{ success?: boolean; error?: string }>(`/users/${userId}`),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Berhasil', description: 'Pengguna berhasil dihapus' });
        invalidateUsers();
      } else {
        toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
      }
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role, remove }: { userId: string; role: string; remove: boolean }) =>
      api.post<{ success?: boolean; error?: string }>(`/users/${userId}/roles`, { role, remove }),
    onSuccess: (result, { remove }) => {
      if (result.success) {
        toast({ title: 'Berhasil', description: `Role ${remove ? 'dihapus' : 'ditambahkan'}` });
        invalidateUsers();
      } else {
        toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
      }
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const handleDelete = (userId: string, email: string) => {
    if (!confirm(`Yakin ingin menghapus pengguna ${email}?`)) return;
    deleteMutation.mutate(userId);
  };

  const handleToggleRole = (userId: string, role: string, hasRole: boolean) => {
    roleMutation.mutate({ userId, role, remove: hasRole });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.users.create)}>
        <UserPlus className="w-4 h-4" /> Tambah Pengguna
      </AdminHeaderButton>
    ),
  });

  return (
    <div className="card-elevated overflow-x-auto">
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat data pengguna...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">Belum ada pengguna</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dibuat</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{u.full_name || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length > 0 ? (
                      u.roles.map((role) => (
                        <button
                          key={role}
                          onClick={() => handleToggleRole(u.id, role, true)}
                          title="Klik untuk hapus role"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Shield className="w-3 h-3" />
                          {ROLES.find((r) => r.value === role)?.label || role}
                          <X className="w-3 h-3" />
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Tidak ada role</span>
                    )}
                    <SearchableSelect
                      value=""
                      onValueChange={(role) => {
                        if (role) handleToggleRole(u.id, role, false);
                      }}
                      placeholder="+ Role"
                      size="sm"
                      options={ROLES.filter((r) => !u.roles.includes(r.value))}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(u.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(u.id, u.email || '')}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Hapus pengguna"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UsersListPage;
