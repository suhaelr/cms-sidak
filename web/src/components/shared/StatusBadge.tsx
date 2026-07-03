interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  selesai: 'badge-selesai',
  proses: 'badge-proses',
  belum: 'badge-belum',
  perlu_sidak_ulang: 'badge-belum',
  ringan: 'badge-ringan',
  sedang: 'badge-sedang',
  berat: 'badge-berat',
  published: 'badge-selesai',
  approved: 'badge-selesai',
  verified: 'badge-proses',
  submitted: 'badge-proses',
  draft: 'bg-muted text-muted-foreground',
  aktif: 'badge-belum',
  tindak_lanjut: 'badge-proses',
  dicabut: 'badge-sedang',
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'badge-sedang',
  resolved: 'badge-selesai',
  rejected: 'badge-belum',
  archived: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  selesai: 'Selesai', proses: 'Proses', belum: 'Belum', perlu_sidak_ulang: 'Perlu Sidak Ulang',
  ringan: 'Ringan', sedang: 'Sedang', berat: 'Berat',
  published: 'Published', approved: 'Approved', verified: 'Verified', submitted: 'Submitted', draft: 'Draft',
  aktif: 'Aktif', tindak_lanjut: 'Tindak Lanjut', dicabut: 'Dicabut',
  new: 'Baru', in_progress: 'Diproses', resolved: 'Selesai', rejected: 'Ditolak', archived: 'Diarsipkan',
};

const StatusBadge = ({ status, size = 'sm' }: StatusBadgeProps) => {
  const style = statusStyles[status] || 'bg-muted text-muted-foreground';
  const label = statusLabels[status] || status;

  return (
    <span className={`badge-status ${style} ${size === 'md' ? 'px-3 py-1 text-sm' : ''}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
