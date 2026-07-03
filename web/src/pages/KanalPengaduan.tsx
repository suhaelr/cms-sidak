import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Send, Search, CheckCircle, Upload, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { TurnstileWidget, isTurnstileEnabled } from '@/components/shared/TurnstileWidget';
import SearchableSelect, { optionsFromStrings } from '@/components/shared/SearchableSelect';
import WilayahSelect from '@/components/shared/WilayahSelect';

const topics = ['Program MBG', 'Dapur SPPG', 'Keamanan Pangan', 'Lainnya'];

interface Kitchen {
  id: string;
  code: string;
  name: string;
}

interface ComplaintStatus {
  status: string;
  public_status_message?: string;
  updated_at: string;
}

import { useSEO } from '@/hooks/use-seo';

const KanalPengaduan = () => {
  useSEO({
    title: 'Kanal Pengaduan Masyarakat',
    description: 'Laporkan segala bentuk keluhan, saran, atau temuan pelanggaran operasional dapur SPPG program Makan Bergizi Gratis.',
  });

  const [submitted, setSubmitted] = useState(false);
  const [ticketNo, setTicketNo] = useState('');
  const [checkTicket, setCheckTicket] = useState('');
  const [checkContact, setCheckContact] = useState('');
  const [regionId, setRegionId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [form, setForm] = useState({
    nama: '', contact: '', sppg: '', topik: '', isi: '', agreed: false, attachment_url: '',
  });

  const { data: kitchens = [] } = useApiQuery<Kitchen[]>('/kitchens', { auth: false });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.upload(file, 'pengaduan', true),
    onSuccess: ({ url }) => setForm((f) => ({ ...f, attachment_url: url })),
    onError: (err) => {
      alert('Gagal upload: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const ticket = `ADU-2026-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
      await api.post('/complaints', {
        ticket_no: ticket,
        name: form.nama,
        contact: form.contact,
        topic: form.topik,
        content: form.isi,
        attachment_url: form.attachment_url || null,
        region_id: regionId,
        turnstile_token: turnstileToken || undefined,
      }, false);
      return ticket;
    },
    onSuccess: (ticket) => {
      setTicketNo(ticket);
      setSubmitted(true);
    },
    onError: (error) => {
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
      alert('Gagal mengirim pengaduan: ' + (error instanceof Error ? error.message : 'Terjadi kesalahan'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      api.get<ComplaintStatus>(
        `/complaints/status?ticket_no=${encodeURIComponent(checkTicket)}&contact=${encodeURIComponent(checkContact)}`,
        false,
      ),
    onSuccess: (data) => setCheckResult(data),
    onError: () => setCheckResult(null),
  });

  const handleUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.contact || !form.topik || !form.isi || !form.agreed) return;
    if (isTurnstileEnabled && !turnstileToken) return;
    submitMutation.mutate();
  };

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    statusMutation.mutate();
  };

  const loading = submitMutation.isPending;
  const uploading = uploadMutation.isPending;
  const checkResult = statusMutation.data ?? null;

  const statusLabels: Record<string, string> = { new: 'Baru', verified: 'Terverifikasi', in_progress: 'Dalam Proses', resolved: 'Selesai', rejected: 'Ditolak' };

  if (submitted) {
    return (
      <div className="page-container">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Pengaduan Berhasil Dikirim</h1>
          <p className="text-muted-foreground mb-6">Simpan nomor tiket berikut untuk memeriksa status pengaduan Anda.</p>
          <div className="card-elevated p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Nomor Tiket</p>
            <p className="text-2xl font-bold text-primary">{ticketNo}</p>
          </div>
          <button onClick={() => { setSubmitted(false); setTurnstileToken(null); setTurnstileKey((k) => k + 1); setRegionId(null); setForm({ nama: '', contact: '', sppg: '', topik: '', isi: '', agreed: false, attachment_url: '' }); }}
            className="text-primary hover:underline text-sm">
            Kirim pengaduan baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-foreground mb-2">Kanal Pengaduan</h1>
      <p className="text-muted-foreground mb-6">Sampaikan laporan atau pengaduan terkait Program MBG dan dapur SPPG</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card-elevated p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Formulir Pengaduan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nama <span className="text-destructive">*</span></label>
                <input type="text" value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} placeholder="Nama lengkap Anda" required className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email atau No. HP <span className="text-destructive">*</span></label>
                <input type="text" value={form.contact} onChange={(e) => setForm({...form, contact: e.target.value})} placeholder="email@contoh.com atau 08xxxxxxxxxx" required className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <WilayahSelect regionId={regionId} onRegionIdChange={setRegionId} />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Dapur SPPG/Pemilik Dapur</label>
                <SearchableSelect
                  value={form.sppg}
                  onValueChange={(sppg) => setForm({ ...form, sppg })}
                  placeholder="Pilih Dapur SPPG/Pemilik Dapur (opsional)"
                  options={[
                    { value: '', label: 'Pilih Dapur SPPG/Pemilik Dapur (opsional)' },
                    ...kitchens.map((k) => ({ value: k.id, label: `${k.code} - ${k.name}` })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Topik <span className="text-destructive">*</span></label>
                <SearchableSelect
                  value={form.topik}
                  onValueChange={(topik) => setForm({ ...form, topik })}
                  placeholder="Pilih Topik"
                  required
                  options={[
                    { value: '', label: 'Pilih Topik' },
                    ...optionsFromStrings(topics),
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Isi Laporan <span className="text-destructive">*</span></label>
                <textarea value={form.isi} onChange={(e) => setForm({...form, isi: e.target.value})} required rows={5} placeholder="Jelaskan pengaduan Anda secara detail..." className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>

              {/* Upload bukti foto/video */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Upload Bukti Foto/Video</label>
                {form.attachment_url ? (
                  <div className="relative border rounded-lg overflow-hidden">
                    {form.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={form.attachment_url} alt="Bukti" className="w-full h-40 object-cover" />
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 text-sm">
                        <span className="truncate flex-1">{form.attachment_url.split('/').pop()}</span>
                      </div>
                    )}
                    <button type="button" onClick={() => setForm(f => ({ ...f, attachment_url: '' }))} className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById('bukti-upload')?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) handleUpload(file); }}
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Mengupload...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                        <Upload className="w-6 h-6" />
                        <span>Klik atau drag foto/video ke sini</span>
                        <span className="text-xs">Format: JPG, PNG, MP4 (maks 20MB)</span>
                      </div>
                    )}
                    <input id="bukti-upload" type="file" accept="image/*,video/*" onChange={e => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} className="hidden" />
                  </div>
                )}
              </div>

              <TurnstileWidget
                key={turnstileKey}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreed} onChange={(e) => setForm({...form, agreed: e.target.checked})} className="mt-1" required />
                <span className="text-sm text-foreground">Saya menyatakan laporan ini benar dan dapat dipertanggungjawabkan.</span>
              </label>
              <button type="submit" disabled={loading || !form.agreed || !form.nama || !form.contact || !form.topik || !form.isi || (isTurnstileEnabled && !turnstileToken)} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />} Kirim Pengaduan
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card-elevated p-6 mb-6">
            <h3 className="font-bold text-foreground mb-3">Cek Status Pengaduan</h3>
            <form onSubmit={handleCheckStatus} className="space-y-3">
              <input type="text" value={checkTicket} onChange={(e) => setCheckTicket(e.target.value)} placeholder="Nomor tiket (ADU-...)" className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="text" value={checkContact} onChange={(e) => setCheckContact(e.target.value)} placeholder="Email/No. HP" className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="submit" className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors">
                <Search className="w-4 h-4 inline mr-1" /> Cek Status
              </button>
            </form>
            {checkResult && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">Status: <strong className="text-foreground">{statusLabels[checkResult.status] || checkResult.status}</strong></p>
                {checkResult.public_status_message && <p className="text-xs mt-1">{checkResult.public_status_message}</p>}
                <p className="text-xs text-muted-foreground mt-1">Terakhir diperbarui: {new Date(checkResult.updated_at).toLocaleDateString('id-ID')}</p>
              </div>
            )}
            {checkResult === null && checkTicket && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">Pengaduan tidak ditemukan.</div>
            )}
          </div>

          <div className="card-elevated p-6">
            <h3 className="font-bold text-foreground mb-3">Informasi Penting</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Pengaduan diproses dalam 3-14 hari kerja</li>
              <li>• Identitas pelapor dilindungi sesuai peraturan</li>
              <li>• Laporan palsu dapat dikenakan sanksi hukum</li>
              <li>• Sertakan bukti foto/video untuk mempercepat proses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanalPengaduan;
