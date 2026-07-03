import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { apiQueryKey } from '@/lib/query-keys';
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlagMap,
  type FeatureFlagsResponse,
  type MenuFeatureFlag,
} from '@/lib/feature-flags';

type FeatureFlagsContextValue = {
  loading: boolean;
  providerEnabled: boolean;
  flags: FeatureFlagMap;
  isEnabled: (flag: MenuFeatureFlag) => boolean;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  loading: false,
  providerEnabled: false,
  flags: DEFAULT_FEATURE_FLAGS,
  isEnabled: () => true,
});

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: apiQueryKey('/feature-flags', false),
    queryFn: () => api.get<FeatureFlagsResponse>('/feature-flags', false),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const flags = data?.flags ?? DEFAULT_FEATURE_FLAGS;
  const providerEnabled = data?.enabled ?? false;

  const value = useMemo<FeatureFlagsContextValue>(
    () => ({
      loading: isLoading,
      providerEnabled,
      flags,
      isEnabled: (flag) => flags[flag] ?? true,
    }),
    [flags, isLoading, providerEnabled],
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function useFeatureFlag(flag: MenuFeatureFlag): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flag);
}
