export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/jwt/create/',
    REFRESH: '/auth/jwt/refresh/',
    REGISTER: '/auth/users/',
    ME: '/users/me/',
    CHANGE_PASSWORD: '/users/me/change-password/',
  },
  // Users
  USERS: {
    LIST: '/users/',
    DETAIL: (id: number) => `/users/${id}/`,
    REACTIVATE: (id: number) => `/users/${id}/reactivate/`,
  },
  // Library
  BOOKS: {
    LIST: '/library/books/',
    DETAIL: (id: number) => `/library/books/${id}/`,
    RESTORE: (id: number) => `/library/books/${id}/restore/`,
  },
  AUTHORS: { LIST: '/library/authors/', DETAIL: (id: number) => `/library/authors/${id}/` },
  CATEGORIES: { LIST: '/library/categories/', DETAIL: (id: number) => `/library/categories/${id}/` },
  DEPARTMENTS: { LIST: '/library/departments/', DETAIL: (id: number) => `/library/departments/${id}/` },
  BOOKMARKS: { LIST: '/library/bookmarks/', DETAIL: (id: number) => `/library/bookmarks/${id}/` },
  DASHBOARD: '/library/dashboard/',
  // Circulation
  BORROW_REQUESTS: {
    LIST: '/circulation/borrow-requests/',
    DETAIL: (id: number) => `/circulation/borrow-requests/${id}/`,
    APPROVE: (id: number) => `/circulation/borrow-requests/${id}/approve/`,
    REJECT: (id: number) => `/circulation/borrow-requests/${id}/reject/`,
  },
  LOANS: {
    LIST: '/circulation/loans/',
    DETAIL: (id: number) => `/circulation/loans/${id}/`,
    RETURN_REQUEST: '/circulation/loans/return-request/',
    RETURN_VERIFY: '/circulation/loans/return-verify/',
    BY_SEMESTER: '/circulation/loans/by-semester/',
    CANCEL_PICKUP: (id: number) => `/circulation/loans/${id}/cancel-pickup/`,
  },
  RESERVATIONS: {
    LIST: '/circulation/reservations/',
    DETAIL: (id: number) => `/circulation/reservations/${id}/`,
    FULFILL: (id: number) => `/circulation/reservations/${id}/fulfill/`,
  },
  FINES: {
    LIST: '/circulation/fines/',
    DETAIL: (id: number) => `/circulation/fines/${id}/`,
    PAY: (id: number) => `/circulation/fines/${id}/pay/`,
  },
  SEMESTERS: {
    LIST: '/circulation/semesters/',
    DETAIL: (id: number) => `/circulation/semesters/${id}/`,
    SET_ACTIVE: (id: number) => `/circulation/semesters/${id}/set-active/`,
  },
} as const;
