const id = '11111111-1111-1111-1111-111111111111';
const regionKode = '31';
const kitchenId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const inspectionId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

export const ex = {
  health: { status: 'ok', database: { connected: true } },

  oryConfig: {
    enabled: true,
    authorizationEndpoint: 'https://hydra.example.com/oauth2/auth',
    clientId: 'sidak-pantau',
    redirectUri: 'http://localhost:8080/admin/login/callback',
    scopes: 'openid profile email offline_access',
  },

  loginBody: { email: 'superadmin@bgn.go.id', password: 'demo123' },
  loginResponse: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'd3f9594c2bc42853584c4003b5463428c207affcdcad29d4a2736f1b8a93f2a4',
    user: {
      id,
      email: 'superadmin@bgn.go.id',
      full_name: 'Super Admin',
      roles: ['super_admin'],
    },
  },

  meResponse: {
    user: {
      id,
      email: 'superadmin@bgn.go.id',
      full_name: 'Super Admin',
      auth_provider: 'local',
      roles: ['super_admin'],
    },
  },

  success: { success: true },
  successUserId: { success: true, user_id: id },
  error: { error: 'Error message' },
  refreshResponse: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },

  usersList: {
    users: [
      {
        id,
        email: 'superadmin@bgn.go.id',
        full_name: 'Super Admin',
        roles: ['super_admin'],
        created_at: '2026-01-15T08:00:00.000Z',
        auth_provider: 'local',
      },
    ],
  },

  uploadResponse: {
    url: 'http://localhost:9000/uploads/news/1710000000000-abc123.jpg',
    key: 'news/1710000000000-abc123.jpg',
  },

  region: {
    id: regionKode,
    name: 'DKI Jakarta',
    type: 'province',
    kode_dagri: regionKode,
    parent_id: null,
  },

  regionsList: {
    data: [
      {
        id: regionKode,
        name: 'DKI Jakarta',
        type: 'province',
        kode_dagri: regionKode,
        parent_id: null,
      },
    ],
    count: 1,
  },

  kitchen: {
    id: kitchenId,
    code: 'SPPG-JKT-001',
    name: 'Dapur SPPG Jakarta Pusat',
    address: 'Jl. Contoh No. 1',
    region_id: regionKode,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },

  findingCategory: {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Higienitas',
    description: 'Kebersihan dapur dan peralatan',
    created_at: '2026-01-01T00:00:00.000Z',
  },

  newsCategory: {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    slug: 'sidak',
    full_label: 'Sidak SPPG',
    short_label: 'SIDAK',
    badge_color: 'sky',
    is_builtin: true,
    sort_order: 1,
    article_count: 7,
    created_at: '2026-01-01T00:00:00.000Z',
  },

  inspection: {
    id: inspectionId,
    date: '2026-03-15',
    region_id: regionKode,
    kitchen_id: kitchenId,
    summary: 'Sidak rutin bulan Maret',
    publication_status: 'published',
    show_identity: false,
    show_media: true,
    created_by: id,
    published_at: '2026-03-16T10:00:00.000Z',
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-16T10:00:00.000Z',
    regions: { name: 'DKI Jakarta' },
    sppg_kitchens: { code: 'SPPG-JKT-001', name: 'Dapur SPPG Jakarta Pusat' },
    findings: [{ severity: 'ringan' }],
  },

  followup: {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    inspection_id: inspectionId,
    finding_id: null,
    action_type: 'Perbaikan sanitasi',
    deadline: '2026-04-01',
    status: 'proses',
    pic: 'Tim Inspeksi',
    notes: 'Dalam proses perbaikan',
    created_at: '2026-03-16T10:00:00.000Z',
    updated_at: '2026-03-16T10:00:00.000Z',
    inspections: {
      date: '2026-03-15',
      summary: 'Sidak rutin bulan Maret',
      sppg_kitchens: { code: 'SPPG-JKT-001' },
    },
  },

  sanction: {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    inspection_id: inspectionId,
    kitchen_id: kitchenId,
    violation_summary: 'Kebersihan tidak memenuhi standar',
    sanction_type: 'Teguran tertulis',
    date: '2026-03-15',
    status: 'aktif',
    follow_up_status: 'proses',
    is_public: true,
    show_identity: false,
    created_at: '2026-03-16T10:00:00.000Z',
    updated_at: '2026-03-16T10:00:00.000Z',
    sppg_kitchens: {
      code: 'SPPG-JKT-001',
      name: 'Dapur SPPG Jakarta Pusat',
      regions: { name: 'DKI Jakarta' },
    },
  },

  complaint: {
    id: '12121212-1212-1212-1212-121212121212',
    ticket_no: 'PGD-20260316-001',
    name: 'Budi Santoso',
    contact: '081234567890',
    region_id: regionKode,
    topic: 'Kualitas makanan',
    content: 'Makanan kurang higienis di dapur terdekat',
    attachment_url: null,
    status: 'new',
    public_status_message: null,
    internal_notes: null,
    created_at: '2026-03-16T09:00:00.000Z',
    updated_at: '2026-03-16T09:00:00.000Z',
  },

  news: {
    id: '13131313-1313-1313-1313-131313131313',
    title: 'Sidak Rutin MBG Jakarta',
    slug: 'sidak-rutin-mbg-jakarta',
    category: 'Sidak',
    content: 'Konten berita lengkap...',
    cover_image: 'https://example.com/cover.jpg',
    region_id: regionKode,
    published_at: '2026-03-10T08:00:00.000Z',
    status: 'published',
    is_highlight: false,
    is_breaking: false,
    tags: ['sidak', 'jakarta', 'gizi'],
    created_by: id,
    created_at: '2026-03-10T08:00:00.000Z',
    updated_at: '2026-03-10T08:00:00.000Z',
    regions: { name: 'DKI Jakarta' },
  },

  document: {
    id: '14141414-1414-1414-1414-141414141414',
    title: 'Panduan Standar Higienitas Dapur',
    category: 'Panduan',
    version: '1.0',
    file_url: 'https://example.com/docs/panduan.pdf',
    is_public: true,
    published_at: '2026-02-01T00:00:00.000Z',
    created_at: '2026-02-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
  },

  heroSlide: {
    id: '15151515-1515-1515-1515-151515151515',
    title: 'Inspeksi Dapur SPPG Jakarta',
    image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
    sort_order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },

  dashboardStats: {
    counts: {
      inspections: 120,
      findings: 340,
      followups_done: 85,
      sanctions_active: 12,
      complaints_new: 5,
      documents_public: 8,
    },
    inspection_dates: ['2026-01-15', '2026-02-20'],
    recent_inspections: [],
    recent_complaints: [],
  },

  homeStats: {
    slides: [
      {
        id: '15151515-1515-1515-1515-151515151515',
        title: 'Inspeksi Dapur SPPG Jakarta',
        image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
        sort_order: 1,
        is_active: true,
      },
    ],
    total_inspections: 120,
    total_findings: 340,
    follow_up_stats: { selesai: 85, proses: 30, belum: 15 },
    total_sanctions: 45,
    complaint_count: 22,
    finding_categories: [{ category: 'Higienitas' }],
    inspection_dates: ['2026-01-15'],
    latest_inspections: [],
    latest_news: [],
    sanctions: [],
  },
};
