import type { AppRole } from '../db/schema';

const ADMIN_ROLES: AppRole[] = [
  'super_admin',
  'admin_pusat',
  'admin_wilayah',
  'inspektor',
  'verifikator',
];

export function isAdmin(roles: AppRole[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

export function hasRole(roles: AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}

export function isSuperAdmin(roles: AppRole[]): boolean {
  return roles.includes('super_admin');
}
