import { Request } from 'express';

// Since SQLite doesn't support Prisma enums, we define them as TypeScript string literals
export type Role = 'ADMIN' | 'LIBRARIAN' | 'MEMBER';
export type CopyStatus = 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'LOST' | 'DAMAGED';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';
export type ReservationStatus = 'PENDING' | 'READY' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';

// Enum-like constant objects for runtime use
export const Role = {
  ADMIN: 'ADMIN' as const,
  LIBRARIAN: 'LIBRARIAN' as const,
  MEMBER: 'MEMBER' as const,
};

export const CopyStatus = {
  AVAILABLE: 'AVAILABLE' as const,
  BORROWED: 'BORROWED' as const,
  RESERVED: 'RESERVED' as const,
  LOST: 'LOST' as const,
  DAMAGED: 'DAMAGED' as const,
};

export const LoanStatus = {
  ACTIVE: 'ACTIVE' as const,
  RETURNED: 'RETURNED' as const,
  OVERDUE: 'OVERDUE' as const,
};

export const ReservationStatus = {
  PENDING: 'PENDING' as const,
  READY: 'READY' as const,
  FULFILLED: 'FULFILLED' as const,
  CANCELLED: 'CANCELLED' as const,
  EXPIRED: 'EXPIRED' as const,
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  memberId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
