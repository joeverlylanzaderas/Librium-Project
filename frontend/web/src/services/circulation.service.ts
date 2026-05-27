// frontend/web/src/services/circulation.service.ts
import api from '@/lib/axios'
import type { Semester, BorrowRequest, Loan, Reservation, Fine } from '@shared/types'
import { API_ENDPOINTS } from '@shared/constants/api'

// ── Request types ─────────────────────────────

export interface CreateSemesterPayload {
  name: string
  start_date: string
  end_date: string
  is_active?: boolean
}

export interface UpdateSemesterPayload {
  name?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
}

export interface CreateBorrowRequestPayload {
  book: number
  notes?: string
}

export interface BorrowRequestActionPayload {
  notes?: string
}

export interface CreateLoanPayload {
  book: number
  borrower?: number // admin only
  notes?: string
}

export interface ReturnRequestPayload {
  id: number
}

export interface ReturnVerifyPayload {
  id: number
  status: 'returned' | 'overdue'
  condition?: string
}

export interface CreateReservationPayload {
  book: number
}

export interface CreateFinePayload {
  loan: number
  amount: string
}

export interface PaginatedList<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ── Circulation service ────────────────────────

export const circulationService = {

  // ─────────────────────────────────────────────
  // SEMESTERS (admin only)
  // ─────────────────────────────────────────────

  // GET /semesters/
  listSemesters: async (params?: { page?: number; page_size?: number }): Promise<PaginatedList<Semester>> => {
    const { data } = await api.get<PaginatedList<Semester>>(API_ENDPOINTS.SEMESTERS.LIST, { params })
    return data
  },

  // GET /semesters/:id/
  getSemester: async (id: number): Promise<Semester> => {
    const { data } = await api.get<Semester>(API_ENDPOINTS.SEMESTERS.DETAIL(id))
    return data
  },

  // POST /semesters/
  createSemester: async (payload: CreateSemesterPayload): Promise<Semester> => {
    const { data } = await api.post<Semester>(API_ENDPOINTS.SEMESTERS.LIST, payload)
    return data
  },

  // PATCH /semesters/:id/
  updateSemester: async (id: number, payload: UpdateSemesterPayload): Promise<Semester> => {
    const { data } = await api.patch<Semester>(API_ENDPOINTS.SEMESTERS.DETAIL(id), payload)
    return data
  },

  // DELETE /semesters/:id/
  deleteSemester: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.SEMESTERS.DETAIL(id))
  },

  // PATCH /semesters/:id/set-active/
  setSemesterActive: async (id: number): Promise<Semester> => {
    const { data } = await api.patch<Semester>(API_ENDPOINTS.SEMESTERS.SET_ACTIVE(id))
    return data
  },

  // ─────────────────────────────────────────────
  // BORROW REQUESTS (members create, staff approve/reject)
  // ─────────────────────────────────────────────

  // GET /borrow-requests/  (member: their own, staff: all)
  listBorrowRequests: async (params?: { status?: string; page?: number; page_size?: number }): Promise<PaginatedList<BorrowRequest>> => {
    const { data } = await api.get<PaginatedList<BorrowRequest>>(API_ENDPOINTS.BORROW_REQUESTS.LIST, { params })
    return data
  },

  // GET /borrow-requests/:id/
  getBorrowRequest: async (id: number): Promise<BorrowRequest> => {
    const { data } = await api.get<BorrowRequest>(API_ENDPOINTS.BORROW_REQUESTS.DETAIL(id))
    return data
  },

  // POST /borrow-requests/  (members only)
  createBorrowRequest: async (payload: CreateBorrowRequestPayload): Promise<BorrowRequest> => {
    const { data } = await api.post<BorrowRequest>(API_ENDPOINTS.BORROW_REQUESTS.LIST, payload)
    return data
  },

  // POST /borrow-requests/:id/approve/  (staff only)
  approveBorrowRequest: async (id: number, payload?: BorrowRequestActionPayload): Promise<BorrowRequest> => {
    const { data } = await api.post<BorrowRequest>(API_ENDPOINTS.BORROW_REQUESTS.APPROVE(id), payload || {})
    return data
  },

  // POST /borrow-requests/:id/reject/  (staff only)
  rejectBorrowRequest: async (id: number, payload?: BorrowRequestActionPayload): Promise<BorrowRequest> => {
    const { data } = await api.post<BorrowRequest>(API_ENDPOINTS.BORROW_REQUESTS.REJECT(id), payload || {})
    return data
  },

  // DELETE /borrow-requests/:id/  (delete own pending request)
  deleteBorrowRequest: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.BORROW_REQUESTS.DETAIL(id))
  },

  // ─────────────────────────────────────────────
  // LOANS
  // ─────────────────────────────────────────────

  // GET /loans/  (member: their own, staff: all)
  listLoans: async (params?: { status?: string; page?: number; page_size?: number }): Promise<PaginatedList<Loan>> => {
    const { data } = await api.get<PaginatedList<Loan>>(API_ENDPOINTS.LOANS.LIST, { params })
    return data
  },

  // GET /loans/by-semester/?semester_id=  (view loans by semester)
  getLoansBySemester: async (params: { semester_id: number; page?: number; page_size?: number }): Promise<PaginatedList<Loan>> => {
    const { data } = await api.get<PaginatedList<Loan>>(API_ENDPOINTS.LOANS.BY_SEMESTER, { params })
    return data
  },

  // GET /loans/:id/
  getLoan: async (id: number): Promise<Loan> => {
    const { data } = await api.get<Loan>(API_ENDPOINTS.LOANS.DETAIL(id))
    return data
  },

  // POST /loans/  (staff creates loan directly)
  createLoan: async (payload: CreateLoanPayload): Promise<Loan> => {
    const { data } = await api.post<Loan>(API_ENDPOINTS.LOANS.LIST, payload)
    return data
  },

  // POST /loans/return-request/  (member requests to return)
  requestLoanReturn: async (payload: ReturnRequestPayload): Promise<Loan> => {
    const { data } = await api.post<Loan>(API_ENDPOINTS.LOANS.RETURN_REQUEST, payload)
    return data
  },

  // POST /loans/return-verify/  (staff verifies return, marks as returned)
  verifyLoanReturn: async (payload: ReturnVerifyPayload): Promise<Loan> => {
    const { data } = await api.post<Loan>(API_ENDPOINTS.LOANS.RETURN_VERIFY, payload)
    return data
  },

  // DELETE /loans/:id/cancel-pickup/  (member cancels before pickup)
  cancelLoanBeforePickup: async (id: number): Promise<Loan> => {
    const { data } = await api.delete<Loan>(API_ENDPOINTS.LOANS.CANCEL_PICKUP(id))
    return data
  },

  // DELETE /loans/:id/  (staff only, soft delete)
  deleteLoan: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.LOANS.DETAIL(id))
  },

  // ─────────────────────────────────────────────
  // RESERVATIONS
  // ─────────────────────────────────────────────

  // GET /reservations/  (member: their own, staff: all)
  listReservations: async (params?: { status?: string; page?: number; page_size?: number }): Promise<PaginatedList<Reservation>> => {
    const { data } = await api.get<PaginatedList<Reservation>>(API_ENDPOINTS.RESERVATIONS.LIST, { params })
    return data
  },

  // GET /reservations/:id/
  getReservation: async (id: number): Promise<Reservation> => {
    const { data } = await api.get<Reservation>(API_ENDPOINTS.RESERVATIONS.DETAIL(id))
    return data
  },

  // POST /reservations/  (create reservation)
  createReservation: async (payload: CreateReservationPayload): Promise<Reservation> => {
    const { data } = await api.post<Reservation>(API_ENDPOINTS.RESERVATIONS.LIST, payload)
    return data
  },

  // POST /reservations/:id/fulfill/  (staff fulfills reservation by creating loan)
  fulfillReservation: async (id: number): Promise<Reservation> => {
    const { data } = await api.post<Reservation>(API_ENDPOINTS.RESERVATIONS.FULFILL(id))
    return data
  },

  // DELETE /reservations/:id/
  deleteReservation: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.RESERVATIONS.DETAIL(id))
  },

  // ─────────────────────────────────────────────
  // FINES
  // ─────────────────────────────────────────────

  // GET /fines/  (member: their own, staff: all)
  listFines: async (params?: { status?: string; page?: number; page_size?: number }): Promise<PaginatedList<Fine>> => {
    const { data } = await api.get<PaginatedList<Fine>>(API_ENDPOINTS.FINES.LIST, { params })
    return data
  },

  // GET /fines/:id/
  getFine: async (id: number): Promise<Fine> => {
    const { data } = await api.get<Fine>(API_ENDPOINTS.FINES.DETAIL(id))
    return data
  },

  // POST /fines/:id/pay/  (member pays fine)
  payFine: async (id: number): Promise<Fine> => {
    const { data } = await api.post<Fine>(API_ENDPOINTS.FINES.PAY(id))
    return data
  },
}
