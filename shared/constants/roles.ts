// shared/constants/roles.ts
import type { UserRole } from '../types';

export const ROLES = {
  ADMIN: 'admin' as UserRole,
  LIBRARIAN: 'librarian' as UserRole,
  MEMBER: 'member' as UserRole,
};

export const BORROWER_ROLES: UserRole[] = ['member'];
export const STAFF_ROLES: UserRole[] = ['admin', 'librarian'];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  librarian: 'Librarian',
  member: 'Member',
};
