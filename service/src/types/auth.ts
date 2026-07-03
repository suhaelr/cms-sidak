import type { AppRole } from '../db/schema';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  authProvider: 'local' | 'ory';
  roles: AppRole[];
}

export type AuthContext = {
  user: AuthUser | null;
};
