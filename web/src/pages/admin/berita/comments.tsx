import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiQuery } from '@/hooks/use-api-query';
import { useInvalidateApi } from '@/hooks/use-invalidate-api';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { Check, X, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import type { NewsComment } from '@/lib/api-types';

const CommentModerationPage = () => {
  const { toast } = useToast();
  const invalidate = useInvalidateApi();
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const { data: comments = [], isLoading } = useApiQuery<NewsComment[]>(
    `/admin/news-comments${statusFilter ? `?status=${statusFilter}` : ''}`,
    { auth: true }
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      api.patch(`/admin/news-comments/${id}`, { status }, true),
    onSuccess: (_, variables) => {
      invalidate('/admin/news-comments');
      toast({
        title: 'Status Diperbarui',
        description: `Komentar berhasil ${variables.status === 'approved' ? 'disetujui' : 'ditolak'}.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal memperbarui status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/news-comments/${id}`, true),
    onSuccess: () => {
      invalidate('/admin/news-comments');
      toast({ title: 'Komentar Dihapus' });
    },
    onError: (error) => {
      toast({
        title: 'Gagal menghapus komentar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useAdminHeader();

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'rejected' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus komentar ini secara permanen?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800">Disetujui</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-800">Ditolak</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800">Menunggu</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="card-elevated p-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-[#001F3F] text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            Menunggu Persetujuan
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'bg-[#001F3F] text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            Disetujui
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-[#001F3F] text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            Ditolak
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-[#001F3F] text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            Semua Komentar
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {comments.length} komentar ditemukan
        </p>
      </div>

      {/* Komentar List */}
      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Memuat komentar...</div>
        ) : comments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground w-1/4">Artikel & Penulis</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground">Komentar</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground w-32">Status</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground w-40">Tanggal</th>
                  <th className="text-right px-6 py-4 font-medium text-muted-foreground w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 valign-top align-top">
                      <div className="space-y-1">
                        <span className="font-semibold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate block max-w-[220px]">
                          {comment.article_slug}
                        </span>
                        <div className="font-medium text-foreground flex items-center gap-1.5">
                          {comment.user?.full_name || 'Tanpa Nama'}
                          {comment.is_anonymous && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-slate-200 text-slate-600 rounded font-bold uppercase">
                              Anonim
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {comment.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-foreground/80 break-words whitespace-pre-wrap max-w-lg">
                        {comment.content}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {getStatusBadge(comment.status)}
                    </td>
                    <td className="px-6 py-4 align-top text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex gap-1.5 justify-end">
                        {comment.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(comment.id)}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded border border-transparent hover:border-emerald-200 transition-colors"
                            title="Setujui"
                            aria-label="Setujui"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {comment.status !== 'rejected' && (
                          <button
                            onClick={() => handleReject(comment.id)}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded border border-transparent hover:border-rose-200 transition-colors"
                            title="Tolak"
                            aria-label="Tolak"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1.5 hover:bg-destructive/10 text-destructive rounded border border-transparent hover:border-destructive/20 transition-colors"
                          title="Hapus"
                          aria-label="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <MessageSquare className="w-8 h-8 text-muted-foreground/60" />
            <div>
              <p className="font-semibold text-foreground">Tidak ada komentar</p>
              <p className="text-sm">Belum ada komentar untuk filter status ini.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentModerationPage;
