// frontend/web/src/services/books.service.ts
import api from '@/lib/axios'
import type { Book, Category, Author } from '@shared/types'
import { API_ENDPOINTS } from '@shared/constants/api'

// ── Request types ─────────────────────────────
export interface ListBooksParams {
  search?:     string
  category?:   number
  author?:     number
  department?: number
  available?:  boolean
  page?:       number
  page_size?:  number
}

export interface PaginatedBooks {
  count:    number
  next:     string | null
  previous: string | null
  results:  Book[]
}

export interface PaginatedCategories {
  count:    number
  next:     string | null
  previous: string | null
  results:  Category[]
}

export interface PaginatedAuthors {
  count:    number
  next:     string | null
  previous: string | null
  results:  Author[]
}

export interface CreateBookPayload {
  title:           string
  isbn:            string
  author:          number
  category?:       number | null
  department?:     number | null
  cover_image?:    File
  description?:    string
  publication_year: number
}

export interface UpdateBookPayload {
  title?:           string
  isbn?:            string
  author?:          number
  category?:        number | null
  department?:      number | null
  cover_image?:     File
  description?:     string
  publication_year?: number
  is_active?:       boolean
}

// ── Books service ─────────────────────────────
export const booksService = {

  // GET /books/?search=...&category=...&available=...
  listBooks: async (params?: ListBooksParams): Promise<PaginatedBooks> => {
    const { data } = await api.get<PaginatedBooks>(API_ENDPOINTS.BOOKS.LIST, { params })
    return data
  },

  // GET /books/:id/
  getBook: async (id: number): Promise<Book> => {
    const { data } = await api.get<Book>(API_ENDPOINTS.BOOKS.DETAIL(id))
    return data
  },

  // POST /books/  (admin/librarian only)
  createBook: async (payload: CreateBookPayload): Promise<Book> => {
    const form = new FormData()
    form.append('title', payload.title)
    form.append('isbn', payload.isbn)
    form.append('author', String(payload.author))
    if (payload.category) form.append('category', String(payload.category))
    if (payload.department) form.append('department', String(payload.department))
    if (payload.cover_image) form.append('cover_image', payload.cover_image)
    if (payload.description) form.append('description', payload.description)
    form.append('publication_year', String(payload.publication_year))

    const { data } = await api.post<Book>(API_ENDPOINTS.BOOKS.LIST, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // PATCH /books/:id/  (admin/librarian only)
  updateBook: async (id: number, payload: UpdateBookPayload): Promise<Book> => {
    const form = new FormData()
    if (payload.title) form.append('title', payload.title)
    if (payload.isbn) form.append('isbn', payload.isbn)
    if (payload.author) form.append('author', String(payload.author))
    if (payload.category !== undefined) form.append('category', String(payload.category))
    if (payload.department !== undefined) form.append('department', String(payload.department))
    if (payload.cover_image) form.append('cover_image', payload.cover_image)
    if (payload.description) form.append('description', payload.description)
    if (payload.publication_year) form.append('publication_year', String(payload.publication_year))
    if (payload.is_active !== undefined) form.append('is_active', String(payload.is_active))

    const { data } = await api.patch<Book>(API_ENDPOINTS.BOOKS.DETAIL(id), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // DELETE /books/:id/  (admin/librarian only)
  deleteBook: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.BOOKS.DETAIL(id))
  },

  // PATCH /books/:id/restore/  (admin/librarian only)
  restoreBook: async (id: number): Promise<Book> => {
    const { data } = await api.patch<Book>(API_ENDPOINTS.BOOKS.RESTORE(id))
    return data
  },

  // ── Categories ────────────────────────────────

  // GET /categories/
  listCategories: async (params?: { page?: number; page_size?: number }): Promise<PaginatedCategories> => {
    const { data } = await api.get<PaginatedCategories>(API_ENDPOINTS.CATEGORIES.LIST, { params })
    return data
  },

  // GET /categories/:id/
  getCategory: async (id: number): Promise<Category> => {
    const { data } = await api.get<Category>(API_ENDPOINTS.CATEGORIES.DETAIL(id))
    return data
  },

  // POST /categories/  (admin/librarian only)
  createCategory: async (payload: { name: string; description?: string }): Promise<Category> => {
    const { data } = await api.post<Category>(API_ENDPOINTS.CATEGORIES.LIST, payload)
    return data
  },

  // PATCH /categories/:id/  (admin/librarian only)
  updateCategory: async (id: number, payload: Partial<{ name: string; description: string }>): Promise<Category> => {
    const { data } = await api.patch<Category>(API_ENDPOINTS.CATEGORIES.DETAIL(id), payload)
    return data
  },

  // DELETE /categories/:id/  (admin/librarian only)
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.CATEGORIES.DETAIL(id))
  },

  // ── Authors ───────────────────────────────────

  // GET /authors/
  listAuthors: async (params?: { page?: number; page_size?: number }): Promise<PaginatedAuthors> => {
    const { data } = await api.get<PaginatedAuthors>(API_ENDPOINTS.AUTHORS.LIST, { params })
    return data
  },

  // GET /authors/:id/
  getAuthor: async (id: number): Promise<Author> => {
    const { data } = await api.get<Author>(API_ENDPOINTS.AUTHORS.DETAIL(id))
    return data
  },

  // POST /authors/  (admin/librarian only)
  createAuthor: async (payload: { name: string; biography?: string; nationality?: string }): Promise<Author> => {
    const { data } = await api.post<Author>(API_ENDPOINTS.AUTHORS.LIST, payload)
    return data
  },

  // PATCH /authors/:id/  (admin/librarian only)
  updateAuthor: async (id: number, payload: Partial<{ name: string; biography: string; nationality: string }>): Promise<Author> => {
    const { data } = await api.patch<Author>(API_ENDPOINTS.AUTHORS.DETAIL(id), payload)
    return data
  },

  // DELETE /authors/:id/  (admin/librarian only)
  deleteAuthor: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.AUTHORS.DETAIL(id))
  },

  // ── Bookmarks ──────────────────────────────────

  // POST /bookmarks/ (create bookmark for current user)
  createBookmark: async (bookId: number): Promise<{ id: number; book: Book; created_at: string }> => {
    const { data } = await api.post(API_ENDPOINTS.BOOKMARKS.LIST, { book: bookId })
    return data
  },

  // GET /bookmarks/ (list current user's bookmarks)
  listBookmarks: async (params?: { page?: number; page_size?: number }): Promise<PaginatedBooks & { bookmarks: Array<{ id: number; created_at: string }> }> => {
    const { data } = await api.get(API_ENDPOINTS.BOOKMARKS.LIST, { params })
    return data
  },

  // DELETE /bookmarks/:id/ (remove bookmark)
  deleteBookmark: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.BOOKMARKS.DETAIL(id))
  },

  // ── Dashboard stats ────────────────────────────

  // GET /dashboard/ (library stats for admin)
  getDashboardStats: async (): Promise<{
    total_books: number
    available_books: number
    active_loans: number
    pending_requests: number
    overdue_loans: number
    total_fines: string
  }> => {
    const { data } = await api.get(API_ENDPOINTS.DASHBOARD)
    return data
  },
}
