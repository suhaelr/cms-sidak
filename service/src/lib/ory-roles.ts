import type { AppRole } from '../db/schema';

const MAPPABLE_APP_ROLES: AppRole[] = [
  'super_admin',
  'admin_pusat',
  'admin_wilayah',
  'inspektor',
  'verifikator',
];

/** SSO role claim → app_role enum */
const SSO_ROLE_MAP: Record<string, AppRole> = {
  'sidakbgn:super_admin': 'super_admin',
  'sidakbgn:admin_pusat': 'admin_pusat',
  'sidakbgn:admin_wilayah': 'admin_wilayah',
  'sidakbgn:inspektor': 'inspektor',
  'sidakbgn:verifikator': 'verifikator',
};

/** Flatten Kratos `traits` / introspection `ext` into top-level claims. */
export function flattenIdentityClaims(claims: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = { ...claims };

  const merge = (obj: unknown) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      Object.assign(flat, obj as Record<string, unknown>);
    }
  };

  merge(claims.traits);
  merge(claims.ext);
  if (claims.ext && typeof claims.ext === 'object' && !Array.isArray(claims.ext)) {
    merge((claims.ext as Record<string, unknown>).traits);
  }

  return flat;
}

function collectStrings(target: string[], value: unknown) {
  if (typeof value === 'string') {
    for (const part of value.split(/[\s,]+/)) {
      const trimmed = part.trim();
      if (trimmed) target.push(trimmed);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) target.push(item.trim());
    }
  }
}

export function mapSsoRolesToAppRoles(ssoRoles: string[]): AppRole[] {
  const mapped = new Set<AppRole>();

  for (const role of ssoRoles) {
    const namespaced = SSO_ROLE_MAP[role];
    if (namespaced) {
      mapped.add(namespaced);
      continue;
    }
    if ((MAPPABLE_APP_ROLES as string[]).includes(role)) {
      mapped.add(role as AppRole);
    }
  }

  return [...mapped];
}

/**
 * Extract role tokens from SSO identity traits / token claims.
 * Sources: `roles`, `role`, `external_ids` (e.g. sidakbgn:admin_pusat), scope, nested traits.
 */
export function extractSsoRoles(claims: Record<string, unknown>): string[] {
  const flat = flattenIdentityClaims(claims);
  const tokens: string[] = [];

  collectStrings(tokens, flat.roles);
  collectStrings(tokens, flat.role);
  collectStrings(tokens, flat.external_ids);
  collectStrings(tokens, flat.groups);

  if (typeof flat.scope === 'string') {
    collectStrings(tokens, flat.scope);
  }

  for (const [key, value] of Object.entries(flat)) {
    if (key.startsWith('sidakbgn:')) tokens.push(key);
    if (typeof value === 'string' && value.startsWith('sidakbgn:')) tokens.push(value);
  }

  return [...new Set(tokens)];
}
