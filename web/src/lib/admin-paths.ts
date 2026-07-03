export const adminPaths = {
  berita: {
    list: '/admin/berita',
    create: '/admin/berita/create',
    edit: (id: string) => `/admin/berita/${id}/edit`,
  },
  sidak: {
    list: '/admin/sidak',
    create: '/admin/sidak/create',
    edit: (id: string) => `/admin/sidak/${id}/edit`,
  },
  sanksi: {
    list: '/admin/sanksi',
    create: '/admin/sanksi/create',
    edit: (id: string) => `/admin/sanksi/${id}/edit`,
  },
  dokumen: {
    list: '/admin/dokumen',
    create: '/admin/dokumen/create',
    edit: (id: string) => `/admin/dokumen/${id}/edit`,
  },
  tindakLanjut: {
    list: '/admin/tindak-lanjut',
    create: '/admin/tindak-lanjut/create',
    edit: (id: string) => `/admin/tindak-lanjut/${id}/edit`,
  },
  pengaduan: {
    list: '/admin/pengaduan',
    detail: (id: string) => `/admin/pengaduan/${id}`,
  },
  users: {
    list: '/admin/users',
    create: '/admin/users/create',
  },
  heroSlides: {
    list: '/admin/hero-slides',
    create: '/admin/hero-slides/create',
    edit: (id: string) => `/admin/hero-slides/${id}/edit`,
  },
  masterData: {
    list: (tab: string) => `/admin/master-data/${tab}`,
    create: (tab: string) => `/admin/master-data/${tab}/create`,
    edit: (tab: string, id: string) => `/admin/master-data/${tab}/${id}/edit`,
  },
} as const;
