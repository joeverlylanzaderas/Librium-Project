// frontend/web/src/services/users.service.ts
import api from '@/lib/axios'
import type { User } from '@shared/types'
import { API_ENDPOINTS } from '@shared/constants/api'
//import type { UserProfile } from '@shared/types'

// ── Request types ─────────────────────────────
export interface UpdateProfilePayload {
  phone_number?:     string
  address?:          string
  bio?:              string
  birthday?:         string
  sex?:              string
  department?:       number | null
  school_id?:        string
  program?:          string
  year_level?:       number | null
  section?:          string
  position?:         string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password:     string
  re_new_password:  string
}

export interface CreateUserPayload {
  full_name:   string
  username:    string
  email:       string
  role:        string
  password:    string
  re_password: string
}

export interface PaginatedUsers {
  count:    number
  next:     string | null
  previous: string | null
  results:  User[]
}

// ── Users service ─────────────────────────────
export const usersService = {

  // GET /users/me/
  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>(API_ENDPOINTS.AUTH.ME)
    return data
  },

  // PATCH /users/me/  (profile fields)
  updateMe: async (payload: UpdateProfilePayload): Promise<User> => {
    const { data } = await api.patch<User>(API_ENDPOINTS.AUTH.ME, { profile: payload })
    return data
  },

  // PATCH /users/me/  (avatar — multipart)
  updateAvatar: async (file: File): Promise<User> => {
    const form = new FormData()
    form.append('profile.profile_picture', file)
    const { data } = await api.patch<User>(API_ENDPOINTS.AUTH.ME, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // POST /users/me/change-password/
  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload)
  },

  // ── Admin only ────────────────────────────────

  // GET /users/?role=student&search=...
  listUsers: async (params?: {
    role?:   string
    search?: string
    page?:   number
  }): Promise<PaginatedUsers> => {
    const { data } = await api.get<PaginatedUsers>(API_ENDPOINTS.USERS.LIST, { params })
    return data
  },

  // GET /users/:id/
  getUser: async (id: number): Promise<User> => {
    const { data } = await api.get<User>(API_ENDPOINTS.USERS.DETAIL(id))
    return data
  },

  // POST /users/  (admin creates user)
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post<User>(API_ENDPOINTS.USERS.LIST, payload)
    return data
  },

  // PATCH /users/:id/
  updateUser: async (id: number, payload: Partial<CreateUserPayload>): Promise<User> => {
    const { data } = await api.patch<User>(API_ENDPOINTS.USERS.DETAIL(id), payload)
    return data
  },

  // DELETE /users/:id/  (soft deactivate)
  deactivateUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}/`)
  },

  // POST /users/:id/reactivate/
  reactivateUser: async (id: number): Promise<User> => {
    const { data } = await api.post<User>(`/users/${id}/reactivate/`)
    return data
  },
}