// frontend/web/src/services/auth.service.ts
import api, { tokenStorage } from '@/lib/axios'
import type { User } from '@shared/types'
import { API_ENDPOINTS } from '@shared/constants/api'

// ── Request / Response types ──────────────────
export interface LoginPayload {
  email:    string
  password: string
}

export interface RegisterPayload {
  full_name:  string
  username:   string
  email:      string
  password:   string
  password2:  string
}

export interface AuthTokens {
  access:  string
  refresh: string
}

export interface LoginResponse extends AuthTokens {}

// ── Auth service ──────────────────────────────
export const authService = {

  // POST /auth/jwt/create/
  login: async (payload: LoginPayload): Promise<{ tokens: AuthTokens; user: User }> => {
    const { data: tokens } = await api.post<AuthTokens>(API_ENDPOINTS.AUTH.LOGIN, payload)
    tokenStorage.setTokens(tokens.access, tokens.refresh)
    // Fetch the logged-in user immediately after login
    const { data: user } = await api.get<User>(API_ENDPOINTS.AUTH.ME)
    return { tokens, user }
  },

  // POST /auth/users/
  register: async (payload: RegisterPayload): Promise<User> => {
  const { data } = await api.post<User>(API_ENDPOINTS.AUTH.REGISTER, payload)
    return data
  },
  
  // POST /auth/jwt/refresh/
  refreshToken: async (refresh: string): Promise<string> => {
    const { data } = await api.post<{ access: string }>(API_ENDPOINTS.AUTH.REFRESH, { refresh })
    tokenStorage.setAccess(data.access)
    return data.access
  },

  // GET /users/me/
  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>(API_ENDPOINTS.AUTH.ME)
    return data
  },

  // Logout — just clears tokens locally (JWT is stateless)
  logout: () => {
    tokenStorage.clearTokens()
  },
}