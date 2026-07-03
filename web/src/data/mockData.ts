export interface Region {
  id: string;
  name: string;
  type: 'province' | 'city';
  parentId?: string;
}

export interface Kitchen {
  id: string;
  code: string;
  name: string;
  address: string;
  regionId: string;
  status: 'active' | 'suspended' | 'closed';
}

export interface Inspection {
  id: string;
  date: string;
  regionId: string;
  kitchenId: string;
  kitchenCode: string;
  kitchenName: string;
  regionName: string;
  summary: string;
  publicationStatus: 'draft' | 'submitted' | 'verified' | 'approved' | 'published';
  showIdentity: boolean;
  showMedia: boolean;
  findingsCount: number;
  severity: 'ringan' | 'sedang' | 'berat';
  followUpStatus: 'belum' | 'proses' | 'selesai' | 'perlu_sidak_ulang';
  createdBy: string;
}

export interface Finding {
  id: string;
  inspectionId: string;
  category: string;
  severity: 'ringan' | 'sedang' | 'berat';
  description: string;
  recommendation: string;
}

export interface FollowUp {
  id: string;
  inspectionId: string;
  actionType: string;
  deadline: string;
  status: 'belum' | 'proses' | 'selesai' | 'perlu_sidak_ulang';
  pic: string;
  notes: string;
  date: string;
}

export interface Sanction {
  id: string;
  inspectionId: string;
  kitchenCode: string;
  regionName: string;
  violationSummary: string;
  sanctionType: string;
  date: string;
  status: 'aktif' | 'selesai' | 'banding';
  isPublic: boolean;
  showIdentity: boolean;
  followUpStatus: 'belum' | 'proses' | 'selesai';
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: 'Temuan' | 'Edukasi' | 'Tindak Lanjut' | 'Kebijakan';
  excerpt: string;
  content: string;
  coverImage: string;
  regionName?: string;
  publishedAt: string;
  tags: string[];
}

export interface Document {
  id: string;
  title: string;
  category: 'Juknis' | 'SOP' | 'Surat Edaran' | 'Template' | 'Laporan Ringkas';
  version: string;
  date: string;
  fileUrl: string;
  fileSize: string;
}

export interface Complaint {
  id: string;
  ticketNo: string;
  name?: string;
  contact: string;
  regionName: string;
  topic: string;
  content: string;
  status: 'baru' | 'diverifikasi' | 'diproses' | 'selesai' | 'ditolak';
  publicMessage?: string;
  createdAt: string;
}

// SEED DATA
export const regions: Region[] = [
  { id: 'r1', name: 'DKI Jakarta', type: 'province' },
  { id: 'r2', name: 'Jawa Barat', type: 'province' },
  { id: 'r3', name: 'Jawa Tengah', type: 'province' },
  { id: 'r4', name: 'Jawa Timur', type: 'province' },
  { id: 'r5', name: 'Bali', type: 'province' },
  { id: 'r1a', name: 'Jakarta Selatan', type: 'city', parentId: 'r1' },
  { id: 'r1b', name: 'Jakarta Timur', type: 'city', parentId: 'r1' },
  { id: 'r2a', name: 'Kota Bandung', type: 'city', parentId: 'r2' },
  { id: 'r2b', name: 'Kota Bogor', type: 'city', parentId: 'r2' },
  { id: 'r3a', name: 'Kota Semarang', type: 'city', parentId: 'r3' },
];

export const inspections: Inspection[] = [
  {
    id: 'ins-001', date: '2026-02-20', regionId: 'r1a', kitchenId: 'k1', kitchenCode: 'SPPG-JKT-001',
    kitchenName: 'Dapur SPPG Jakarta Selatan 1', regionName: 'Jakarta Selatan, DKI Jakarta',
    summary: 'Sidak rutin menemukan beberapa ketidaksesuaian pada penyimpanan bahan makanan dan kebersihan area produksi.',
    publicationStatus: 'published', showIdentity: false, showMedia: true,
    findingsCount: 4, severity: 'sedang', followUpStatus: 'proses', createdBy: 'Inspektor Ahmad',
  },
  {
    id: 'ins-002', date: '2026-02-18', regionId: 'r2a', kitchenId: 'k2', kitchenCode: 'SPPG-BDG-003',
    kitchenName: 'Dapur SPPG Bandung 3', regionName: 'Kota Bandung, Jawa Barat',
    summary: 'Pemeriksaan mendalam terhadap standar keamanan pangan. Ditemukan penyimpangan suhu penyimpanan.',
    publicationStatus: 'published', showIdentity: true, showMedia: true,
    findingsCount: 3, severity: 'berat', followUpStatus: 'belum', createdBy: 'Inspektor Budi',
  },
  {
    id: 'ins-003', date: '2026-02-15', regionId: 'r3a', kitchenId: 'k3', kitchenCode: 'SPPG-SMG-002',
    kitchenName: 'Dapur SPPG Semarang 2', regionName: 'Kota Semarang, Jawa Tengah',
    summary: 'Sidak menunjukkan kepatuhan baik terhadap juknis. Temuan minor pada dokumentasi.',
    publicationStatus: 'published', showIdentity: true, showMedia: true,
    findingsCount: 1, severity: 'ringan', followUpStatus: 'selesai', createdBy: 'Inspektor Citra',
  },
  {
    id: 'ins-004', date: '2026-02-10', regionId: 'r1b', kitchenId: 'k4', kitchenCode: 'SPPG-JKT-005',
    kitchenName: 'Dapur SPPG Jakarta Timur 5', regionName: 'Jakarta Timur, DKI Jakarta',
    summary: 'Temuan terkait kebersihan peralatan dan kesesuaian menu dengan standar gizi.',
    publicationStatus: 'published', showIdentity: false, showMedia: false,
    findingsCount: 5, severity: 'sedang', followUpStatus: 'proses', createdBy: 'Inspektor Dian',
  },
  {
    id: 'ins-005', date: '2026-02-05', regionId: 'r2b', kitchenId: 'k5', kitchenCode: 'SPPG-BGR-001',
    kitchenName: 'Dapur SPPG Bogor 1', regionName: 'Kota Bogor, Jawa Barat',
    summary: 'Sidak mendadak menemukan pelanggaran serius pada pengelolaan limbah dan sanitasi.',
    publicationStatus: 'published', showIdentity: false, showMedia: true,
    findingsCount: 7, severity: 'berat', followUpStatus: 'perlu_sidak_ulang', createdBy: 'Inspektor Eko',
  },
];

export const findings: Finding[] = [
  { id: 'f1', inspectionId: 'ins-001', category: 'Higienitas', severity: 'sedang', description: 'Area penyimpanan bahan makanan tidak sesuai standar suhu.', recommendation: 'Perbaikan sistem pendingin dan monitoring suhu harian.' },
  { id: 'f2', inspectionId: 'ins-001', category: 'Keamanan Pangan', severity: 'ringan', description: 'Label expired pada beberapa bumbu kemasan.', recommendation: 'Penerapan sistem FIFO dan pengecekan rutin.' },
  { id: 'f3', inspectionId: 'ins-001', category: 'Kepatuhan Juknis', severity: 'sedang', description: 'Dokumentasi harian tidak lengkap.', recommendation: 'Pelatihan ulang terkait pencatatan harian.' },
  { id: 'f4', inspectionId: 'ins-001', category: 'Higienitas', severity: 'sedang', description: 'Peralatan masak tidak disanitasi sesuai SOP.', recommendation: 'Pengadaan alat sanitasi tambahan dan jadwal pembersihan.' },
  { id: 'f5', inspectionId: 'ins-002', category: 'Keamanan Pangan', severity: 'berat', description: 'Suhu penyimpanan daging di atas batas aman (>8°C).', recommendation: 'Penghentian sementara penggunaan cold storage dan perbaikan.' },
  { id: 'f6', inspectionId: 'ins-002', category: 'Higienitas', severity: 'sedang', description: 'APD pekerja tidak lengkap.', recommendation: 'Pengadaan APD dan pengawasan ketat.' },
  { id: 'f7', inspectionId: 'ins-002', category: 'Kepatuhan Juknis', severity: 'berat', description: 'Menu tidak sesuai dengan panduan gizi standar.', recommendation: 'Revisi menu dan konsultasi ahli gizi.' },
  { id: 'f8', inspectionId: 'ins-003', category: 'Kepatuhan Juknis', severity: 'ringan', description: 'Form checklist harian belum diperbarui ke versi terbaru.', recommendation: 'Update form ke versi terbaru.' },
  { id: 'f9', inspectionId: 'ins-005', category: 'Keamanan Pangan', severity: 'berat', description: 'Pengelolaan limbah tidak sesuai standar lingkungan.', recommendation: 'Perbaikan sistem pembuangan limbah segera.' },
  { id: 'f10', inspectionId: 'ins-005', category: 'Higienitas', severity: 'berat', description: 'Sanitasi ruangan dapur sangat buruk.', recommendation: 'Penutupan sementara dan renovasi menyeluruh.' },
];

export const followUps: FollowUp[] = [
  { id: 'fu1', inspectionId: 'ins-001', actionType: 'Perbaikan Fasilitas', deadline: '2026-03-05', status: 'proses', pic: 'Koordinator Dapur', notes: 'Proses pengadaan alat pendingin baru.', date: '2026-02-22' },
  { id: 'fu2', inspectionId: 'ins-001', actionType: 'Pelatihan', deadline: '2026-03-01', status: 'selesai', pic: 'Supervisor', notes: 'Pelatihan pencatatan harian telah dilaksanakan.', date: '2026-02-25' },
  { id: 'fu3', inspectionId: 'ins-003', actionType: 'Update Dokumen', deadline: '2026-02-20', status: 'selesai', pic: 'Admin Dapur', notes: 'Form checklist telah diperbarui.', date: '2026-02-17' },
  { id: 'fu4', inspectionId: 'ins-005', actionType: 'Penutupan Sementara', deadline: '2026-02-10', status: 'selesai', pic: 'Admin Wilayah', notes: 'Dapur ditutup sementara untuk perbaikan.', date: '2026-02-06' },
  { id: 'fu5', inspectionId: 'ins-005', actionType: 'Renovasi', deadline: '2026-03-15', status: 'proses', pic: 'Kontraktor', notes: 'Renovasi sanitasi sedang berjalan.', date: '2026-02-20' },
];

export const sanctions: Sanction[] = [
  {
    id: 'snc-001', inspectionId: 'ins-002', kitchenCode: 'SPPG-BDG-003', regionName: 'Kota Bandung, Jawa Barat',
    violationSummary: 'Pelanggaran serius terkait penyimpanan suhu daging dan ketidaksesuaian menu gizi.',
    sanctionType: 'Pembinaan', date: '2026-02-19', status: 'aktif', isPublic: true, showIdentity: true, followUpStatus: 'proses',
  },
  {
    id: 'snc-002', inspectionId: 'ins-005', kitchenCode: 'SPPG-BGR-001', regionName: 'Kota Bogor, Jawa Barat',
    violationSummary: 'Pelanggaran berat sanitasi dan pengelolaan limbah.',
    sanctionType: 'Tutup Sementara', date: '2026-02-06', status: 'aktif', isPublic: true, showIdentity: false, followUpStatus: 'proses',
  },
  {
    id: 'snc-003', inspectionId: 'ins-004', kitchenCode: 'SPPG-JKT-005', regionName: 'Jakarta Timur, DKI Jakarta',
    violationSummary: 'Kebersihan peralatan tidak memenuhi standar minimal.',
    sanctionType: 'Peringatan', date: '2026-02-12', status: 'selesai', isPublic: true, showIdentity: false, followUpStatus: 'selesai',
  },
];

export const newsArticles: NewsArticle[] = [
  {
    id: 'n1', title: 'BGN Intensifkan Sidak Dapur SPPG di Jabodetabek', slug: 'bgn-intensifkan-sidak-jabodetabek',
    category: 'Kebijakan', excerpt: 'Badan Gizi Nasional meningkatkan frekuensi inspeksi mendadak di wilayah Jabodetabek sepanjang Februari 2026.',
    content: 'Badan Gizi Nasional (BGN) mengumumkan peningkatan frekuensi sidak mendadak ke dapur-dapur SPPG di wilayah Jabodetabek. Langkah ini diambil sebagai respons atas temuan-temuan yang ditemukan pada inspeksi sebelumnya. "Kami berkomitmen memastikan setiap dapur SPPG memenuhi standar yang telah ditetapkan," ujar Kepala BGN.',
    coverImage: '', regionName: 'DKI Jakarta', publishedAt: '2026-02-25', tags: ['sidak', 'jabodetabek', 'kebijakan'],
  },
  {
    id: 'n2', title: 'Standar Baru Keamanan Pangan untuk Dapur SPPG', slug: 'standar-baru-keamanan-pangan',
    category: 'Kebijakan', excerpt: 'BGN menerbitkan pedoman terbaru terkait standar keamanan pangan yang wajib dipenuhi seluruh dapur SPPG.',
    content: 'Dalam rangka meningkatkan kualitas dan keamanan pangan pada Program MBG, BGN telah menerbitkan standar baru yang mencakup aspek penyimpanan, pengolahan, dan distribusi makanan.',
    coverImage: '', publishedAt: '2026-02-22', tags: ['standar', 'keamanan pangan'],
  },
  {
    id: 'n3', title: 'Pelatihan Higienitas untuk Petugas Dapur SPPG Se-Jawa', slug: 'pelatihan-higienitas-jawa',
    category: 'Edukasi', excerpt: 'Ratusan petugas dapur SPPG mengikuti pelatihan higienitas dan sanitasi yang diselenggarakan BGN.',
    content: 'Program pelatihan massal ini diikuti oleh lebih dari 500 petugas dapur SPPG dari seluruh Pulau Jawa. Materi mencakup praktik higienitas terbaik, sanitasi peralatan, dan pengelolaan limbah.',
    coverImage: '', regionName: 'Jawa Barat', publishedAt: '2026-02-18', tags: ['pelatihan', 'higienitas', 'edukasi'],
  },
  {
    id: 'n4', title: 'Temuan Sidak: 3 Dapur SPPG Perlu Perbaikan Segera', slug: 'temuan-sidak-perbaikan-segera',
    category: 'Temuan', excerpt: 'Hasil sidak terbaru menunjukkan 3 dapur SPPG di Jawa Barat memerlukan tindakan perbaikan segera.',
    content: 'Tim inspektur BGN menemukan beberapa pelanggaran serius pada tiga dapur SPPG di wilayah Jawa Barat. Tindak lanjut berupa pembinaan dan perbaikan fasilitas telah dimulai.',
    coverImage: '', regionName: 'Jawa Barat', publishedAt: '2026-02-15', tags: ['temuan', 'perbaikan'],
  },
  {
    id: 'n5', title: 'Tindak Lanjut Selesai: Dapur SPPG Semarang Lolos Verifikasi', slug: 'tindak-lanjut-semarang-selesai',
    category: 'Tindak Lanjut', excerpt: 'Dapur SPPG di Semarang berhasil menyelesaikan seluruh rekomendasi perbaikan dari hasil sidak sebelumnya.',
    content: 'Setelah melalui proses tindak lanjut selama 2 minggu, Dapur SPPG Semarang 2 dinyatakan telah memenuhi seluruh standar yang ditetapkan oleh tim verifikator BGN.',
    coverImage: '', regionName: 'Jawa Tengah', publishedAt: '2026-02-12', tags: ['tindak lanjut', 'verifikasi'],
  },
];

export const documents: Document[] = [
  { id: 'd1', title: 'Petunjuk Teknis Pelaksanaan Sidak SPPG', category: 'Juknis', version: 'v2.1', date: '2026-01-15', fileUrl: '#', fileSize: '2.4 MB' },
  { id: 'd2', title: 'SOP Inspeksi Dapur SPPG', category: 'SOP', version: 'v3.0', date: '2026-01-10', fileUrl: '#', fileSize: '1.8 MB' },
  { id: 'd3', title: 'Surat Edaran: Peningkatan Standar Keamanan Pangan', category: 'Surat Edaran', version: 'v1.0', date: '2026-02-01', fileUrl: '#', fileSize: '540 KB' },
  { id: 'd4', title: 'Template Laporan Sidak Harian', category: 'Template', version: 'v1.2', date: '2026-01-20', fileUrl: '#', fileSize: '320 KB' },
  { id: 'd5', title: 'Laporan Ringkas Sidak Januari 2026', category: 'Laporan Ringkas', version: 'v1.0', date: '2026-02-05', fileUrl: '#', fileSize: '3.1 MB' },
];

export const complaints: Complaint[] = [
  { id: 'c1', ticketNo: 'ADU-2026-000001', name: 'Anonim', contact: '081234567890', regionName: 'Jakarta Selatan', topic: 'Keamanan Pangan', content: 'Makanan yang disajikan berbau tidak sedap.', status: 'selesai', publicMessage: 'Laporan telah ditindaklanjuti dan dapur terkait telah diperbaiki.', createdAt: '2026-02-10' },
  { id: 'c2', ticketNo: 'ADU-2026-000002', contact: 'warga@email.com', regionName: 'Kota Bandung', topic: 'Dapur SPPG', content: 'Kondisi dapur terlihat kotor saat saya lewat.', status: 'diproses', createdAt: '2026-02-18' },
  { id: 'c3', ticketNo: 'ADU-2026-000003', name: 'Budi S.', contact: '085678901234', regionName: 'Kota Bogor', topic: 'Program MBG', content: 'Porsi makanan untuk anak sekolah terlalu sedikit.', status: 'baru', createdAt: '2026-02-24' },
];

export const monthlyInspectionData = [
  { month: 'Jan', sidak: 85 }, { month: 'Feb', sidak: 102 }, { month: 'Mar', sidak: 95 },
  { month: 'Apr', sidak: 110 }, { month: 'Mei', sidak: 125 }, { month: 'Jun', sidak: 98 },
  { month: 'Jul', sidak: 115 }, { month: 'Agt', sidak: 130 }, { month: 'Sep', sidak: 108 },
  { month: 'Okt', sidak: 120 }, { month: 'Nov', sidak: 135 }, { month: 'Des', sidak: 124 },
];

export const findingCategoryData = [
  { name: 'Higienitas', value: 145, fill: 'hsl(215, 60%, 22%)' },
  { name: 'Keamanan Pangan', value: 98, fill: 'hsl(0, 72%, 51%)' },
  { name: 'Kepatuhan Juknis', value: 76, fill: 'hsl(38, 92%, 50%)' },
  { name: 'Sarana Prasarana', value: 54, fill: 'hsl(175, 45%, 35%)' },
  { name: 'Lainnya', value: 32, fill: 'hsl(215, 15%, 47%)' },
];

export const demoUsers = [
  { role: 'Super Admin', email: 'superadmin@bgn.go.id', password: 'demo123', access: 'Akses penuh ke semua fitur' },
  { role: 'Admin Pusat', email: 'adminpusat@bgn.go.id', password: 'demo123', access: 'Approve publish, kelola data nasional' },
  { role: 'Admin Wilayah', email: 'adminwilayah@bgn.go.id', password: 'demo123', access: 'Kelola data di wilayah yang ditugaskan' },
  { role: 'Inspektor', email: 'inspektor@bgn.go.id', password: 'demo123', access: 'Buat sidak, upload bukti' },
  { role: 'Verifikator', email: 'verifikator@bgn.go.id', password: 'demo123', access: 'Verifikasi sidak, rekomendasikan publish' },
];

export const DISCLAIMER_TEXT = 'Ditampilkan sesuai ketentuan peraturan yang berlaku dan prinsip kehati-hatian serta perlindungan data.';

export const statusLabels: Record<string, string> = {
  belum: 'Belum',
  proses: 'Dalam Proses',
  selesai: 'Selesai',
  perlu_sidak_ulang: 'Perlu Sidak Ulang',
  draft: 'Draft',
  submitted: 'Diajukan',
  verified: 'Terverifikasi',
  approved: 'Disetujui',
  published: 'Dipublikasikan',
  aktif: 'Aktif',
  banding: 'Banding',
  baru: 'Baru',
  diverifikasi: 'Diverifikasi',
  diproses: 'Diproses',
  ditolak: 'Ditolak',
  ringan: 'Ringan',
  sedang: 'Sedang',
  berat: 'Berat',
};
