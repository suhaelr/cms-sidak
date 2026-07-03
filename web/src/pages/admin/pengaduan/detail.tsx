import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useFindById } from '@/hooks/use-find-by-id';
import StatusBadge from '@/components/shared/StatusBadge';
import { X } from 'lucide-react';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import type { Complaint, ComplaintUpdates } from '@/lib/api-types';
import { getErrorMessage } from '@/lib/utils';

const STATUS_OPTIONS = ['new', 'verified', 'in_progress', 'resolved', 'rejected'];
const STATUS_LABELS: Record<string, string> = {
  new: 'Baru',
  verified: 'Terverifikasi',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  rejected: 'Ditolak',
};

const PengaduanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [internalNotes, setInternalNotes] = useState('');
  const [publicMessage, setPublicMessage] = useState('');

  const { data: selected, isLoading } = useFindById<Complaint>('/complaints', id);

  useEffect(() => {
    if (isLoading) return;
    if (!selected) {
      toast({ title: 'Pengaduan tidak ditemukan', variant: 'destructive' });
      navigate(adminPaths.pengaduan.list);
      return;
    }
    setInternalNotes(selected.internal_notes || '');
    setPublicMessage(selected.public_status_message || '');
  }, [selected, isLoading, navigate, toast]);

  const updateMutation = useApiMutation({
    invalidate: ['/complaints'],
    mutationFn: async ({ complaintId, updates }: { complaintId: string; updates: ComplaintUpdates }) => {
      await api.patch(`/complaints/${complaintId}`, updates);
    },
    onSuccess: () => {
      toast({ title: 'Status diperbarui' });
      navigate(adminPaths.pengaduan.list);
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const updateStatus = (status: string) => {
    if (!selected) return;
    const updates: ComplaintUpdates = { status };
    if (publicMessage) updates.public_status_message = publicMessage;
    if (internalNotes) updates.internal_notes = internalNotes;
    updateMutation.mutate({ complaintId: selected.id, updates });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.pengaduan.list)}>
        <X className="w-4 h-4" /> Kembali
      </AdminHeaderButton>
    ),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  if (!selected) return null;

  return (
    <div className="card-elevated p-6">
      <h3 className="font-semibold mb-3">Detail Pengaduan: {selected.ticket_no}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-muted-foreground">Nama:</span> {selected.name || 'Anonim'}
        </div>
        <div>
          <span className="text-muted-foreground">Kontak:</span> {selected.contact}
        </div>
        <div>
          <span className="text-muted-foreground">Topik:</span> {selected.topic}
        </div>
        <div>
          <span className="text-muted-foreground">Status:</span>{' '}
          <StatusBadge status={selected.status} />
        </div>
        <div className="sm:col-span-2">
          <span className="text-muted-foreground">Isi:</span>
          <p className="mt-1 bg-muted/30 p-3 rounded">{selected.content}</p>
        </div>
        <div className="sm:col-span-2">
          <span className="text-muted-foreground">Lampiran:</span>
          <div className="mt-1">
            {selected.attachment_url ? (
              selected.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <a href={selected.attachment_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={selected.attachment_url}
                    alt="Bukti pengaduan"
                    className="max-h-64 rounded-lg border object-contain"
                  />
                </a>
              ) : selected.attachment_url.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={selected.attachment_url} controls className="max-h-64 rounded-lg border w-full" />
              ) : (
                <a
                  href={selected.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                >
                  📎 Lihat Lampiran
                </a>
              )
            ) : (
              <p className="text-muted-foreground italic text-xs mt-1">Tidak ada lampiran</p>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Catatan Internal</label>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
            placeholder="Catatan internal (tidak dilihat publik)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pesan Publik</label>
          <textarea
            value={publicMessage}
            onChange={(e) => setPublicMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
            placeholder="Pesan yang bisa dilihat pelapor"
          />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selected.status === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PengaduanDetailPage;
