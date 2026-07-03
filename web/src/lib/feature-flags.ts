/** Keep in sync with sidak-bgn-service/src/lib/feature-flags.ts */
export const MENU_FEATURE_FLAGS = [
  'menu_sidak_management',
  'menu_tindak_lanjut',
  'menu_sanksi',
  'menu_dokumen',
  'menu_pengaduan',
  'menu_social_media',
] as const;

export type MenuFeatureFlag = (typeof MENU_FEATURE_FLAGS)[number];
export type FeatureFlagMap = Record<MenuFeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAGS = Object.fromEntries(
  MENU_FEATURE_FLAGS.map((name) => [name, true]),
) as FeatureFlagMap;

export type FeatureFlagsResponse = {
  enabled: boolean;
  flags: FeatureFlagMap;
};

export const ADMIN_MENU_FLAG_BY_PATH: Record<string, MenuFeatureFlag> = {
  '/admin/sidak': 'menu_sidak_management',
  '/admin/tindak-lanjut': 'menu_tindak_lanjut',
  '/admin/sanksi': 'menu_sanksi',
  '/admin/dokumen': 'menu_dokumen',
  '/admin/pengaduan': 'menu_pengaduan',
};

export const PUBLIC_MENU_FLAG_BY_PATH: Record<string, MenuFeatureFlag> = {
  '/dokumentasi-sidak': 'menu_sidak_management',
  '/daftar-sanksi': 'menu_sanksi',
  '/download-dokumen': 'menu_dokumen',
  '/kanal-pengaduan': 'menu_pengaduan',
  '/social-media': 'menu_social_media',
};

export function isMenuPathEnabled(pathname: string, flags: FeatureFlagMap, map: Record<string, MenuFeatureFlag>): boolean {
  const prefix = Object.keys(map).find(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`),
  );
  if (!prefix) return true;
  return flags[map[prefix]] ?? true;
}

export function isAdminMenuEnabled(pathname: string, flags: FeatureFlagMap): boolean {
  return isMenuPathEnabled(pathname, flags, ADMIN_MENU_FLAG_BY_PATH);
}

export function isPublicMenuEnabled(pathname: string, flags: FeatureFlagMap): boolean {
  return isMenuPathEnabled(pathname, flags, PUBLIC_MENU_FLAG_BY_PATH);
}
