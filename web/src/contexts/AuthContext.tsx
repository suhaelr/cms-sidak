import { createContext, useContext, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api,
  getAccessToken,
  setTokens,
  clearTokens,
  getRefreshToken,
  refreshSession,
  isTokenExpiringSoon,
  type ApiUser,
  type AppRole,
} from '@/lib/api';
import { apiQueryKey } from '@/lib/query-keys';

interface OryConfig {
  enabled: boolean;
  authorizationEndpoint?: string;
  issuer?: string;
  clientId?: string;
  redirectUri?: string;
  scopes?: string;
}

interface AuthContextType {
  user: ApiUser | null;
  roles: AppRole[];
  loading: boolean;
  oryEnabled: boolean;
  signIn: (email: string, password: string, turnstileToken?: string) => Promise<{ error: string | null }>;
  signInWithOry: () => Promise<void>;
  completeOryLogin: (code: string, state: string | null) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  authMode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'both';

function generateRandomString(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier(): string {
  return generateRandomString();
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function fetchMe(): Promise<ApiUser | null> {
  const token = getAccessToken();
  if (!token) return null;

  if (isTokenExpiringSoon(token)) {
    const refreshed = await refreshSession();
    if (!refreshed && !getAccessToken()) return null;
  }

  try {
    const data = await api.get<{ user: ApiUser }>('/auth/me');
    return data.user;
  } catch {
    const refreshed = await refreshSession();
    if (refreshed) {
      try {
        const data = await api.get<{ user: ApiUser }>('/auth/me');
        return data.user;
      } catch {
        // fall through
      }
    }
    clearTokens();
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const hasToken = Boolean(getAccessToken());

  const { data: user = null, isLoading: meLoading } = useQuery({
    queryKey: apiQueryKey('/auth/me'),
    queryFn: fetchMe,
    enabled: hasToken,
    staleTime: 60_000,
    retry: false,
  });

  const { data: oryConfig, isLoading: oryLoading } = useQuery({
    queryKey: apiQueryKey('/auth/ory/config', false),
    queryFn: () => api.get<OryConfig>('/auth/ory/config', false),
    enabled: AUTH_MODE !== 'local',
    staleTime: 5 * 60 * 1000,
  });

  const oryEnabled = AUTH_MODE !== 'local' && !!oryConfig?.enabled;
  const loading = (hasToken && meLoading) || (AUTH_MODE !== 'local' && oryLoading);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!getAccessToken()) return;
      if (isTokenExpiringSoon(getAccessToken())) {
        void refreshSession();
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const invalidateAuth = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: apiQueryKey('/auth/me') });
  }, [queryClient]);

  const signInMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      turnstileToken,
    }: {
      email: string;
      password: string;
      turnstileToken?: string;
    }) => {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: ApiUser;
      }>('/auth/login', { email, password, turnstile_token: turnstileToken }, false);
      setTokens(data.accessToken, data.refreshToken);
      return data.user;
    },
    onSuccess: () => invalidateAuth(),
  });

  const signIn = async (email: string, password: string, turnstileToken?: string) => {
    try {
      await signInMutation.mutateAsync({ email, password, turnstileToken });
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Login gagal' };
    }
  };

  const signInWithOry = async () => {
    const config = oryConfig ?? await api.get<OryConfig>('/auth/ory/config', false);

    const authEndpoint = config.authorizationEndpoint || (config.issuer ? `${config.issuer.replace(/\/$/, '')}/oauth2/auth` : '');
    if (!config.enabled || !authEndpoint || !config.clientId) {
      throw new Error('Ory SSO tidak dikonfigurasi');
    }

    const verifier = generateCodeVerifier();
    const state = generateRandomString();
    sessionStorage.setItem('ory_code_verifier', verifier);
    sessionStorage.setItem('ory_oauth_state', state);
    const challenge = await generateCodeChallenge(verifier);

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      scope: config.scopes || 'openid profile email offline_access',
      redirect_uri: config.redirectUri || `${window.location.origin}/admin/login/callback`,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${authEndpoint}?${params}`;
  };

  const completeOryLogin = async (code: string, state: string | null): Promise<{ error: string | null }> => {
    const verifier = sessionStorage.getItem('ory_code_verifier');
    const savedState = sessionStorage.getItem('ory_oauth_state');

    if (!verifier) return { error: 'Sesi login SSO tidak ditemukan. Silakan coba lagi.' };
    if (!state || !savedState || state !== savedState) {
      return { error: 'State tidak valid. Silakan coba login lagi.' };
    }

    try {
      const data = await api.post<{
        accessToken?: string;
        oryAccessToken?: string;
        oryRefreshToken?: string;
        refreshToken?: string;
        user?: ApiUser;
        error?: string;
      }>(
        '/auth/ory/callback',
        { code, codeVerifier: verifier },
        false,
      );
      sessionStorage.removeItem('ory_code_verifier');
      sessionStorage.removeItem('ory_oauth_state');

      if (data.error || !data.accessToken || !data.user) {
        return { error: data.error || 'Pertukaran token gagal' };
      }

      setTokens(data.accessToken, data.refreshToken);
      invalidateAuth();
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Login SSO gagal' };
    }
  };

  const signOut = async () => {
    const refreshToken = getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore
    }
    clearTokens();
    queryClient.setQueryData(apiQueryKey('/auth/me'), null);
  };

  const roles = user?.roles || [];
  const isAdmin = roles.length > 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        loading,
        oryEnabled,
        signIn,
        signInWithOry,
        completeOryLogin,
        signOut,
        isAdmin,
        authMode: AUTH_MODE,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
