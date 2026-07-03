import { env } from '../config';

/** Keep in sync with sidak-bgn-web/src/lib/feature-flags.ts */
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

const DEFAULT_FLAGS = Object.fromEntries(
  MENU_FEATURE_FLAGS.map((name) => [name, true]),
) as FeatureFlagMap;

type UnleashFeaturesResponse = {
  features?: Array<{ name: string; enabled: boolean }>;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'UNLEASH-APPNAME': env.UNLEASH_APP_NAME,
  };

  if (env.UNLEASH_INSTANCE_ID) {
    headers['UNLEASH-INSTANCEID'] = env.UNLEASH_INSTANCE_ID;
  } else if (env.UNLEASH_API_TOKEN) {
    headers.Authorization = env.UNLEASH_API_TOKEN;
  }

  return headers;
}

async function fetchUnleashFlags(): Promise<FeatureFlagMap> {
  const baseUrl = normalizeBaseUrl(env.UNLEASH_URL!);
  const res = await fetch(`${baseUrl}/client/features`, {
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Unleash API responded ${res.status}`);
  }

  const data = (await res.json()) as UnleashFeaturesResponse;
  const remote = new Map((data.features ?? []).map((f) => [f.name, f.enabled]));

  return Object.fromEntries(
    MENU_FEATURE_FLAGS.map((name) => [name, remote.get(name) ?? false]),
  ) as FeatureFlagMap;
}

class FeatureFlagService {
  private cache: FeatureFlagMap = { ...DEFAULT_FLAGS };
  private lastRefresh = 0;
  private refreshPromise: Promise<FeatureFlagMap> | null = null;

  isEnabled(): boolean {
    return env.FEATURE_FLAGS_ENABLED && !!env.UNLEASH_URL;
  }

  getFlags(): FeatureFlagMap {
    return { ...this.cache };
  }

  async refresh(force = false): Promise<FeatureFlagMap> {
    if (!this.isEnabled()) {
      this.cache = { ...DEFAULT_FLAGS };
      return this.getFlags();
    }

    const now = Date.now();
    const ttlMs = env.FEATURE_FLAGS_REFRESH_SECONDS * 1000;
    if (!force && now - this.lastRefresh < ttlMs) {
      return this.getFlags();
    }

    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        this.cache = await fetchUnleashFlags();
        this.lastRefresh = Date.now();
      } catch (err) {
        console.warn('[feature-flags] refresh failed, using cached/default values:', err);
        if (this.lastRefresh === 0) {
          this.cache = { ...DEFAULT_FLAGS };
        }
      } finally {
        this.refreshPromise = null;
      }
      return this.getFlags();
    })();

    return this.refreshPromise;
  }
}

export const featureFlags = new FeatureFlagService();
