export type Role = 'ADMIN' | 'LIBRARIAN' | 'MEMBER';

export type CopyStatus = 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'LOST' | 'DAMAGED';

export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';

export type ReservationStatus = 'PENDING' | 'READY' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  memberProfile?: MemberProfile | null;
}

export interface MemberProfile {
  id: string;
  userId: string;
  membershipId: string;
  address?: string | null;
  dateOfBirth?: string | null;
  membershipExpiry: string;
  totalFines: number;
  isEmailVerified: boolean;
  _count?: {
    loans?: number;
    reservations?: number;
    fines?: number;
  };
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  managerId?: string | null;
  manager?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  _count?: {
    copies?: number;
    loans?: number;
    reservations?: number;
  };
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedYear: number;
  category: string;
  subcategory?: string | null;
  description: string;
  coverUrl?: string | null;
  language: string;
  pages: number;
  price: number;
  createdAt: string;
  format?: string | null;
  maturityRating?: string | null;
  seriesName?: string | null;
  seriesNumber?: number | null;
  edition?: string | null;
  isNewArrival?: boolean;
  isStaffPick?: boolean;
  previewUrl?: string | null;
  amazonUrl?: string | null;
  rating?: number;
  ratingCount?: number;
  ageRange?: string | null;
  totalCopies?: number;
  availableCopies?: number;
  avgRating?: number;
  reviewCount?: number;
  copies?: BookCopy[];
  reviews?: Review[];
}

export interface BookCopy {
  id: string;
  bookId: string;
  branchId: string;
  barcode: string;
  status: CopyStatus;
  shelfLocation: string;
  version: number;
  book?: Book;
  branch?: Branch;
}

export interface Loan {
  id: string;
  copyId: string;
  memberId: string;
  librarianId: string;
  branchId: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  renewalCount: number;
  status: LoanStatus;
  conditionNote?: string | null;
  idempotencyKey?: string | null;
  copy: BookCopy & { book: Book };
  member: MemberProfile & { user: User };
  librarian: { id: string; name: string };
  branch: { id: string; name: string };
  fines?: Fine[];
}

export interface Reservation {
  id: string;
  bookId: string;
  memberId: string;
  branchId: string;
  status: ReservationStatus;
  requestedAt: string;
  readyAt?: string | null;
  expiresAt?: string | null;
  queuePosition: number;
  book: Book;
  branch: Branch;
  member?: MemberProfile & { user: User };
}

export interface Fine {
  id: string;
  loanId: string;
  memberId: string;
  amount: number;
  reason: string;
  isPaid: boolean;
  createdAt: string;
  loan: Loan;
  member?: MemberProfile & { user: User };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  fineId: string;
  memberId: string;
  amount: number;
  method: string;
  transactionId: string;
  paidAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  memberId: string;
  rating: number;
  comment: string;
  createdAt: string;
  member?: {
    user: {
      name: string;
    };
  };
}

export interface WishlistItem {
  id: string;
  memberId: string;
  bookId: string;
  createdAt: string;
  book: Book;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
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
