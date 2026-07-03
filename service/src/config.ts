import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgres://sidak:sidak@localhost:5433/sidak'),
  JWT_SECRET: z.string().min(16).default('dev-jwt-secret-change-me'),
  JWT_ISSUER: z.string().default('sidak-api'),
  CORS_ORIGIN: z.string().default('http://localhost:8080'),
  AUTH_MODE: z.enum(['local', 'ory', 'both']).default('both'),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('uploads'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_PUBLIC_URL: z.string().default('http://localhost:9000/uploads'),

  // Ory SSO — set authorization endpoint + client credentials (same as other OAuth clients).
  ORY_AUTHORIZATION_ENDPOINT: z.string().optional(),
  ORY_SSO_URL: z.string().optional(),
  ORY_HYDRA_PUBLIC_URL: z.string().optional(),
  ORY_OIDC_CLIENT_ID: z.string().optional(),
  ORY_OIDC_CLIENT_SECRET: z.string().optional(),
  // Optional overrides (defaults derived from ORY_SSO_URL / ORY_HYDRA_PUBLIC_URL)
  ORY_JWKS_URL: z.string().optional(),
  ORY_TOKEN_INTROSPECTION_URL: z.string().optional(),
  ORY_KRATOS_PUBLIC_URL: z.string().optional(),
  ORY_OIDC_REDIRECT_URI: z.string().default('http://localhost:8080/admin/login/callback'),

  // Cloudflare Turnstile — secret key for server-side verification
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // BGN SIPGN API gateway base URL (OAuth2 via Ory client_credentials)
  GATEWAY_URL: z.string().default('https://gateway-sipgn.bgn.go.id'),
  /** Optional scope for client_credentials token (defaults to none). */
  GATEWAY_OIDC_SCOPE: z.string().optional(),
  /** Dev fallback: static Ory access token instead of client_credentials. */
  GATEWAY_ACCESS_TOKEN: z.string().optional(),

  // Feature flags — Unleash-compatible API (GitLab Feature Flags or standalone Unleash)
  FEATURE_FLAGS_ENABLED: z.coerce.boolean().default(false),
  /** Base URL, e.g. https://gitlab.com/api/v4/feature_flags/unleash/123 or https://unleash.example.com/api */
  UNLEASH_URL: z.string().optional(),
  /** GitLab Feature Flags instance ID (UNLEASH-INSTANCEID header) */
  UNLEASH_INSTANCE_ID: z.string().optional(),
  /** Standalone Unleash API token (Authorization header). Use instead of UNLEASH_INSTANCE_ID. */
  UNLEASH_API_TOKEN: z.string().optional(),
  /** Environment name — must match the flag strategy environment in GitLab/Unleash */
  UNLEASH_APP_NAME: z.string().default('production'),
  FEATURE_FLAGS_REFRESH_SECONDS: z.coerce.number().default(30),
});

export const env = envSchema.parse(process.env);

export const isLocalAuthEnabled = env.AUTH_MODE === 'local' || env.AUTH_MODE === 'both';
export const isOryAuthEnabled = env.AUTH_MODE === 'ory' || env.AUTH_MODE === 'both';
