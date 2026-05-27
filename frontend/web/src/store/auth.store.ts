// frontend/web/src/store/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@shared/types/user'
import { tokenStorage } from '@/lib/axios'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: User) => void
  setLoading: (v: boolean) => void
  logout: () => void
  hydrate: (user: User, access: string, refresh: string) => void
  updateUserProfile: (profileUpdates: Partial<User['profile']>) => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      setLoading: (v) =>
        set({ isLoading: v }),

      hydrate: (user, access, refresh) => {
        tokenStorage.setTokens(access, refresh)
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        tokenStorage.clearTokens()
        set({ user: null, isAuthenticated: false })
      },

      updateUserProfile: (profileUpdates) => {
        set((state) => {
          if (!state.user) return state
          return {
            user: {
              ...state.user,
              profile: state.user.profile ? { ...state.user.profile, ...profileUpdates } : null as any
            }
          }
        })
      },

      updateUser: (updates) => {
        set((state) => {
          if (!state.user) return state
          return {
            user: { ...state.user, ...updates }
          }
        })
      },
    }),
    {
      name: 'librium-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

// ── Selectors ─────────────────────────────────
export const useUser = () => useAuthStore((s) => s.user)
export const useRole = () => useAuthStore((s) => s.user?.role)
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin')
export const useIsStaff = () => useAuthStore((s) =>
  s.user?.role === 'admin' || s.user?.role === 'librarian')
export const useIsBorrower = () => useAuthStore((s) =>
  s.user?.role === 'member')