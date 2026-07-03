import { ex } from './examples';
import { crudCreate, crudDelete, crudGet, crudList, crudUpdate, doc, err, ok } from './helper';

export const system = {
  health: doc('Health check', 'Returns API health status. No authentication required.', 'System', {
    responses: ok('Service is healthy', ex.health),
  }),
};

export const auth = {
  oryConfig: doc(
    'Get Ory SSO configuration',
    'Returns OIDC settings for the frontend SSO login flow (issuer, client ID, redirect URI).',
    'Auth',
    { responses: ok('Ory config (or disabled)', ex.oryConfig) },
  ),
  oryCallback: doc(
    'Exchange Ory authorization code',
    'BFF endpoint that exchanges an OIDC authorization code + PKCE verifier for access tokens. Keeps client_secret off the browser.',
    'Auth',
    {
      responses: {
        200: { description: 'Token response from Hydra', value: { access_token: 'eyJ...', refresh_token: 'ory_rt_...' } },
        ...err(400, 'Token exchange failed'),
      },
    },
  ),
  login: doc(
    'Local login',
    'Authenticate with email and password. Returns JWT access token, refresh token, and user profile with roles.',
    'Auth',
    {
      responses: {
        ...ok('Login successful', ex.loginResponse),
        ...err(401, 'Email atau password salah'),
        ...err(403, 'Local auth disabled'),
      },
    },
  ),
  register: doc(
    'Register local account',
    'Create a new local user account. Disabled when AUTH_MODE=ory.',
    'Auth',
    {
      responses: {
        ...ok('Registration successful', ex.successUserId),
        ...err(400, 'Email sudah terdaftar'),
        ...err(403, 'Local registration disabled'),
      },
    },
  ),
  refresh: doc(
    'Refresh access token',
    'Exchange a valid refresh token for a new JWT access token.',
    'Auth',
    {
      responses: {
        ...ok('New access token', ex.refreshResponse),
        ...err(401, 'Invalid refresh token'),
      },
    },
  ),
  logout: doc(
    'Logout',
    'Invalidate the refresh token. Client should also clear stored access token.',
    'Auth',
    {
      auth: true,
      responses: ok('Logged out', { success: true, user_id: ex.meResponse.user.id }),
    },
  ),
  me: doc(
    'Current user profile',
    'Returns the authenticated user and their roles. Works with local JWT or Ory access token.',
    'Auth',
    {
      auth: true,
      responses: {
        ...ok('Current user', ex.meResponse),
        ...err(401, 'Unauthorized'),
      },
    },
  ),
};

export const users = {
  list: doc(
    'List all users',
    'Returns all users with roles. Super admin only.',
    'Users',
    {
      auth: true,
      responses: {
        ...ok('User list', ex.usersList),
        ...err(403, 'Forbidden: Super Admin only'),
      },
    },
  ),
  create: doc(
    'Create user',
    'Create a local user with optional initial role. Super admin only.',
    'Users',
    {
      auth: true,
      responses: {
        ...ok('User created', ex.successUserId),
        ...err(400, 'Email sudah terdaftar'),
        ...err(403, 'Forbidden: Super Admin only'),
      },
    },
  ),
  updateRole: doc(
    'Assign or remove role',
    'Add or remove an app role for a user. Super admin only.',
    'Users',
    {
      auth: true,
      responses: {
        ...ok('Role updated', ex.success),
        ...err(403, 'Forbidden: Super Admin only'),
      },
    },
  ),
  delete: doc(
    'Delete user',
    'Permanently delete a local user. Cannot delete own account. Super admin only.',
    'Users',
    {
      auth: true,
      responses: {
        ...ok('User deleted', ex.success),
        ...err(400, 'Tidak bisa menghapus akun sendiri'),
        ...err(403, 'Forbidden: Super Admin only'),
      },
    },
  ),
};

export const uploads = {
  upload: doc(
    'Upload file to S3',
    'Multipart upload. Admin auth required unless `public=true` is sent (for complaint attachments). Returns public URL.',
    'Uploads',
    {
      responses: {
        ...ok('File uploaded', ex.uploadResponse),
        ...err(400, 'No file provided'),
        ...err(401, 'Unauthorized'),
      },
    },
  ),
};

export const regions = {
  list: doc(
    'List regions',
    'Paginated wilayah from BGN SIPGN gateway. Filter by `type` (province|city|district|village), `parent_id` (kode dagri), `search`, `page`, `limit`. Values use kode dagri as `id`.',
    'Regions',
    { responses: ok('Region list with count', ex.regionsList) },
  ),
  get: doc(
    'Get region by kode dagri',
    'Lookup a single wilayah by kode dagri.',
    'Regions',
    { responses: ok('Region', ex.region) },
  ),
};

export const kitchens = {
  list: crudList('kitchen', 'Kitchens', [ex.kitchen]),
  create: crudCreate('kitchen', 'Kitchens', ex.kitchen),
  update: crudUpdate('kitchen', 'Kitchens', ex.kitchen),
  delete: crudDelete('kitchen', 'Kitchens'),
};

export const findingCategories = {
  list: crudList('finding category', 'Master Data', [ex.findingCategory]),
  create: crudCreate('finding category', 'Master Data', ex.findingCategory),
  update: crudUpdate('finding category', 'Master Data', ex.findingCategory),
  delete: crudDelete('finding category', 'Master Data'),
};

export const sanctionTypes = {
  list: crudList('sanction type', 'Master Data', [{ id: '...', name: 'Teguran tertulis', description: null, created_at: '2026-01-01T00:00:00.000Z' }]),
  create: crudCreate('sanction type', 'Master Data', { id: '...', name: 'Teguran tertulis' }),
  update: crudUpdate('sanction type', 'Master Data', { id: '...', name: 'Teguran tertulis' }),
  delete: crudDelete('sanction type', 'Master Data'),
};

export const newsCategories = {
  list: crudList('news category', 'Master Data', [ex.newsCategory]),
  create: crudCreate('news category', 'Master Data', ex.newsCategory),
  update: crudUpdate('news category', 'Master Data', ex.newsCategory),
  delete: crudDelete('news category', 'Master Data'),
};

export const inspections = {
  list: doc(
    'List inspections',
    'List sidak records. Public callers only see `publication_status=published` unless admin. Use `?public_only=true` to force public filter.',
    'Inspections',
    {
      responses: ok('Inspection list with relations', [ex.inspection]),
    },
  ),
  get: doc('Get inspection by ID', 'Returns inspection with region, kitchen, and findings. Published only for public.', 'Inspections', {
    responses: {
      ...ok('Inspection detail', ex.inspection),
      ...err(403, 'Forbidden'),
      ...err(404, 'Not found'),
    },
  }),
  create: doc(
    'Create inspection',
    'Create sidak with optional inline findings array. Requires admin.',
    'Inspections',
    {
      auth: true,
      responses: {
        ...ok('Created inspection', ex.inspection),
        ...err(403, 'Forbidden'),
      },
    },
  ),
  update: crudUpdate('inspection', 'Inspections', ex.inspection),
  delete: crudDelete('inspection', 'Inspections'),
};

export const followups = {
  list: doc('List follow-ups', 'Admin only. Returns tindak lanjut with parent inspection info.', 'Followups', {
    auth: true,
    responses: {
      ...ok('Follow-up list', [ex.followup]),
      ...err(403, 'Forbidden'),
    },
  }),
  create: crudCreate('follow-up', 'Followups', ex.followup),
  update: crudUpdate('follow-up', 'Followups', ex.followup),
  delete: crudDelete('follow-up', 'Followups'),
};

export const sanctions = {
  list: doc(
    'List sanctions',
    'Public sees `is_public=true` only. Admins see all. Use `?public_only=true` to force public filter.',
    'Sanctions',
    { responses: ok('Sanction list', [ex.sanction]) },
  ),
  get: crudGet('sanction', 'Sanctions', ex.sanction),
  create: crudCreate('sanction', 'Sanctions', ex.sanction),
  update: crudUpdate('sanction', 'Sanctions', ex.sanction),
  delete: crudDelete('sanction', 'Sanctions'),
};

export const complaints = {
  status: doc(
    'Check complaint status',
    'Public lookup by ticket number and contact. Returns only the matching complaint (privacy-safe).',
    'Complaints',
    {
      responses: {
        ...ok('Complaint status', ex.complaint),
        ...err(400, 'ticket_no and contact required'),
        ...err(404, 'Not found'),
      },
    },
  ),
  list: doc('List complaints', 'Admin only. Includes nested region hierarchy.', 'Complaints', {
    auth: true,
    responses: {
      ...ok('Complaint list', [{ ...ex.complaint, regions: { name: 'DKI Jakarta', type: 'province' } }]),
      ...err(403, 'Forbidden'),
    },
  }),
  create: doc(
    'Submit complaint',
    'Public endpoint to submit a new pengaduan. No auth required.',
    'Complaints',
    { responses: ok('Complaint created', ex.complaint) },
  ),
  update: doc(
    'Update complaint',
    'Admin updates status, public message, and internal notes.',
    'Complaints',
    {
      auth: true,
      responses: {
        ...ok('Updated complaint', { ...ex.complaint, status: 'in_progress' }),
        ...err(403, 'Forbidden'),
      },
    },
  ),
};

export const news = {
  list: doc(
    'List news articles',
    'Public sees published only. Admins see all. Use `?public_only=true` for public filter. Use `?highlight_only=true` for Berita Pilihan sidebar. Use `?breaking_only=true` for breaking news ticker. Pagination: `?page=1&limit=10` returns `{ data, count, page, limit, total_pages }`. Filters: `?search=`, `?category=`, `?status=` (admin only).',
    'News',
    { responses: ok('News list', [ex.news]) },
  ),
  getBySlug: doc(
    'Get news by slug',
    'Returns a published article with region and up to 3 related articles in the same category.',
    'News',
    {
      responses: {
        ...ok('News article', { ...ex.news, related: [] }),
        ...err(404, 'Not found'),
      },
    },
  ),
  create: crudCreate('news article', 'News', ex.news),
  update: crudUpdate('news article', 'News', ex.news),
  delete: crudDelete('news article', 'News'),
};

export const documents = {
  list: doc(
    'List documents',
    'Public sees `is_public=true` only. Use `?public_only=true` to force public filter.',
    'Documents',
    { responses: ok('Document list', [ex.document]) },
  ),
  create: crudCreate('document', 'Documents', ex.document),
  update: crudUpdate('document', 'Documents', ex.document),
  delete: crudDelete('document', 'Documents'),
};

export const heroSlides = {
  list: doc(
    'List hero slides',
    'Public sees active slides only. Use `?public_only=true` for homepage carousel.',
    'Hero Slides',
    { responses: ok('Hero slide list', [ex.heroSlide]) },
  ),
  create: crudCreate('hero slide', 'Hero Slides', ex.heroSlide),
  update: crudUpdate('hero slide', 'Hero Slides', ex.heroSlide),
  delete: crudDelete('hero slide', 'Hero Slides'),
};

export const dashboard = {
  stats: doc(
    'Admin dashboard statistics',
    'Aggregated counts, inspection dates for charts, and recent inspections/complaints. Admin only.',
    'Dashboard',
    {
      auth: true,
      responses: {
        ...ok('Dashboard stats', ex.dashboardStats),
        ...err(403, 'Forbidden'),
      },
    },
  ),
  home: doc(
    'Public homepage statistics',
    'Aggregated data for the public landing page: slides, counts, charts, latest content. No auth required.',
    'Dashboard',
    { responses: ok('Homepage stats', ex.homeStats) },
  ),
};
