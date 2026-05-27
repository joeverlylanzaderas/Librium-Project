// frontend/web/src/lib/axios.ts
import axios from 'axios'
// Separated types using type-only imports to satisfy verbatimModuleSyntax
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

// ── Constants ─────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
const ACCESS_KEY  = 'librium_access'
const REFRESH_KEY = 'librium_refresh'

// ── Token helpers ─────────────────────────────
export const tokenStorage = {
  getAccess:      () => localStorage.getItem(ACCESS_KEY),
  getRefresh:     () => localStorage.getItem(REFRESH_KEY),
  setAccess:      (t: string) => localStorage.setItem(ACCESS_KEY, t),
  setRefresh:     (t: string) => localStorage.setItem(REFRESH_KEY, t),
  setTokens:      (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clearTokens:    () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// ── Axios instance ────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor — attach access token ─
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor — silent JWT refresh ─
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Asserting types cleanly using the type-only import
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Only attempt refresh on 401, not on the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !original._retry &&
      original.url !== '/auth/jwt/refresh/'
    ) {
      const refreshToken = tokenStorage.getRefresh()

      if (!refreshToken) {
        tokenStorage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue subsequent 401s while refresh is in flight
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/jwt/refresh/`, {
          refresh: refreshToken,
        })
        const newAccess: string = data.access
        tokenStorage.setAccess(newAccess)
        processQueue(newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (refreshError) {
        tokenStorage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api