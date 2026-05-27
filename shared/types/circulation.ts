// shared/types/circulation.ts
import type { User } from './user';
import type { Book } from './book';

export type BorrowRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LoanReturnStatus = 'none' | 'pending' | 'verified' | 'rejected' | 'disputed';
export type ReservationStatus = 'waiting' | 'ready' | 'cancelled' | 'expired' | 'fulfilled';

export interface Semester {
  id: number;
  academic_year: string;
  semester_type: '1st_sem' | '2nd_sem' | 'summer';
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface BorrowRequest {
  id: number;
  member: User;
  book: Book;
  status: BorrowRequestStatus;
  request_date: string;
  processed_date: string | null;
  processed_by: User | null;
  loan: Loan | null;
  notes: string | null;
}

export interface Loan {
  id: number;
  member: User;
  book: Book;
  semester: Semester | null;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  return_requested_date: string | null;
  return_verified_date: string | null;
  return_status: LoanReturnStatus;
  verified_by: User | null;
  notes: string | null;
  is_overdue: boolean;
  overdue_days: number;
}

export interface Reservation {
  id: number;
  member: User;
  book: Book;
  reserved_date: string;
  status: ReservationStatus;
  notified_date: string | null;
  queue_position: number;
}

export interface Fine {
  id: number;
  member: User;
  loan: Loan;
  amount: string;
  paid: boolean;
  paid_date: string | null;
  issued_date: string;
  issued_by: User | null;
  notes: string | null;
}