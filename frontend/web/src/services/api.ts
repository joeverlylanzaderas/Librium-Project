// frontend/web/src/services/api.ts
import { api, tokenStorage } from '@/lib/axios'
import { API_ENDPOINTS } from '@shared/constants/api'

// Helper to handle paginated responses
const normalizePaginated = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data
  if (data?.results && Array.isArray(data.results)) return data.results
  return []
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export const login = (email: string, password: string) => 
  api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password })

export const register = (data: any) => 
  api.post(API_ENDPOINTS.AUTH.REGISTER, data)

export const getMe = () => 
  api.get(API_ENDPOINTS.AUTH.ME)

export const changePassword = (data: any) => 
  api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data)

export const updateMe = (data: any) => 
  api.patch(API_ENDPOINTS.AUTH.ME, data)

// ============================================
// USERS ENDPOINTS
// ============================================

export const getUsers = () => 
  api.get(API_ENDPOINTS.USERS.LIST)

export const getUser = (id: number) => 
  api.get(API_ENDPOINTS.USERS.DETAIL(id))

export const createUser = (data: any) => 
  api.post(API_ENDPOINTS.USERS.LIST, data)

export const updateUser = (id: number, data: any) => 
  api.patch(API_ENDPOINTS.USERS.DETAIL(id), data)

export const deleteUser = (id: number) => 
  api.delete(API_ENDPOINTS.USERS.DETAIL(id))

export const reactivateUser = (id: number) => 
  api.post(API_ENDPOINTS.USERS.REACTIVATE(id))

// ============================================
// BOOKS ENDPOINTS
// ============================================

export const getBooks = () => 
  api.get(API_ENDPOINTS.BOOKS.LIST)

export const getBook = (id: number) => 
  api.get(API_ENDPOINTS.BOOKS.DETAIL(id))

export const createBook = (data: any) => 
  api.post(API_ENDPOINTS.BOOKS.LIST, data)

export const updateBook = (id: number, data: any) => 
  api.patch(API_ENDPOINTS.BOOKS.DETAIL(id), data)

export const deleteBook = (id: number) => 
  api.delete(API_ENDPOINTS.BOOKS.DETAIL(id))

export const restoreBook = (id: number) => 
  api.post(API_ENDPOINTS.BOOKS.RESTORE(id))

// ============================================
// AUTHORS ENDPOINTS
// ============================================

export const getAuthors = () => 
  api.get(API_ENDPOINTS.AUTHORS.LIST)

export const getAuthor = (id: number) => 
  api.get(API_ENDPOINTS.AUTHORS.DETAIL(id))

export const createAuthor = (data: any) => 
  api.post(API_ENDPOINTS.AUTHORS.LIST, data)

export const updateAuthor = (id: number, data: any) => 
  api.patch(API_ENDPOINTS.AUTHORS.DETAIL(id), data)

export const deleteAuthor = (id: number) => 
  api.delete(API_ENDPOINTS.AUTHORS.DETAIL(id))

// ============================================
// CATEGORIES ENDPOINTS
// ============================================

export const getCategories = () => 
  api.get(API_ENDPOINTS.CATEGORIES.LIST)

export const getCategory = (id: number) => 
  api.get(API_ENDPOINTS.CATEGORIES.DETAIL(id))

export const createCategory = (data: any) => 
  api.post(API_ENDPOINTS.CATEGORIES.LIST, data)

export const updateCategory = (id: number, data: any) => 
  api.patch(API_ENDPOINTS.CATEGORIES.DETAIL(id), data)

export const deleteCategory = (id: number) => 
  api.delete(API_ENDPOINTS.CATEGORIES.DETAIL(id))

// ============================================
// DEPARTMENTS ENDPOINTS
// ============================================

export const getDepartments = () => 
  api.get(API_ENDPOINTS.DEPARTMENTS.LIST)

export const getDepartment = (id: number) => 
  api.get(API_ENDPOINTS.DEPARTMENTS.DETAIL(id))

export const createDepartment = (data: any) => 
  api.post(API_ENDPOINTS.DEPARTMENTS.LIST, data)

export const updateDepartment = (id: number, data: any) => 
  api.patch(API_ENDPOINTS.DEPARTMENTS.DETAIL(id), data)

export const deleteDepartment = (id: number) => 
  api.delete(API_ENDPOINTS.DEPARTMENTS.DETAIL(id))

// ============================================
// BOOKMARKS ENDPOINTS
// ============================================

export const getBookmarks = () => 
  api.get(API_ENDPOINTS.BOOKMARKS.LIST)

export const createBookmark = (bookId: number) => 
  api.post(API_ENDPOINTS.BOOKMARKS.LIST, { book: bookId })

export const deleteBookmark = (id: number) => 
  api.delete(API_ENDPOINTS.BOOKMARKS.DETAIL(id))

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

export const getDashboard = () => 
  api.get(API_ENDPOINTS.DASHBOARD)

// ============================================
// BORROW REQUESTS ENDPOINTS
// ============================================

export const getBorrowRequests = (status?: string) => {
  const url = status ? `${API_ENDPOINTS.BORROW_REQUESTS.LIST}?status=${status}` : API_ENDPOINTS.BORROW_REQUESTS.LIST
  return api.get(url)
}

export const getBorrowRequest = (id: number) => 
  api.get(API_ENDPOINTS.BORROW_REQUESTS.DETAIL(id))

export const approveBorrowRequest = (id: number) => 
  api.post(API_ENDPOINTS.BORROW_REQUESTS.APPROVE(id))

export const rejectBorrowRequest = (id: number) => 
  api.post(API_ENDPOINTS.BORROW_REQUESTS.REJECT(id))

// ============================================
// LOANS ENDPOINTS
// ============================================

export const getLoans = () => 
  api.get(API_ENDPOINTS.LOANS.LIST)

export const getLoan = (id: number) => 
  api.get(API_ENDPOINTS.LOANS.DETAIL(id))

export const createLoan = (data: any) => 
  api.post(API_ENDPOINTS.LOANS.LIST, data)

export const requestReturn = (loanId: number) => 
  api.post(API_ENDPOINTS.LOANS.RETURN_REQUEST, { loan_id: loanId })

export const verifyReturn = (loanId: number, status: string) => 
  api.post(API_ENDPOINTS.LOANS.RETURN_VERIFY, { loan_id: loanId, status })

export const getLoansBySemester = (semesterId: number) => 
  api.get(`${API_ENDPOINTS.LOANS.BY_SEMESTER}?semester=${semesterId}`)

export const cancelPickup = (id: number) => 
  api.post(API_ENDPOINTS.LOANS.CANCEL_PICKUP(id))

// ============================================
// RESERVATIONS ENDPOINTS
// ============================================

export const getReservations = () => 
  api.get(API_ENDPOINTS.RESERVATIONS.LIST)

export const getReservation = (id: number) => 
  api.get(API_ENDPOINTS.RESERVATIONS.DETAIL(id))

export const fulfillReservation = (id: number) => 
  api.post(API_ENDPOINTS.RESERVATIONS.FULFILL(id))

// ============================================
// FINES ENDPOINTS
// ============================================

export const getFines = () => 
  api.get(API_ENDPOINTS.FINES.LIST)

export const getFine = (id: number) => 
  api.get(API_ENDPOINTS.FINES.DETAIL(id))

export const payFine = (id: number) => 
  api.post(API_ENDPOINTS.FINES.PAY(id))

// ============================================
// SEMESTERS ENDPOINTS
// ============================================

export const getSemesters = () => 
  api.get(API_ENDPOINTS.SEMESTERS.LIST)

export const getSemester = (id: number) => 
  api.get(API_ENDPOINTS.SEMESTERS.DETAIL(id))

export const createSemester = (data: any) => 
  api.post(API_ENDPOINTS.SEMESTERS.LIST, data)

export const updateSemester = (id: number, data: any) => 
  api.patch(API_ENDPOINTS.SEMESTERS.DETAIL(id), data)

export const deleteSemester = (id: number) => 
  api.delete(API_ENDPOINTS.SEMESTERS.DETAIL(id))

export const setActiveSemester = (id: number) => 
  api.post(API_ENDPOINTS.SEMESTERS.SET_ACTIVE(id))

// ============================================
// UTILITY EXPORTS
// ============================================

export { normalizePaginated, tokenStorage }