// frontend/web/src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@shared/types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

/**
 * ProtectedRoute Component
 * Validates user authentication and role-based access layers.
 * Unauthenticated guests are safely booted directly to /login.
 * Users without permissions are auto-routed to their target workspace hub.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // 1. Session check: Clear out unauthorized users instantly
  if (!user || !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 2. Permission check: Block and bounce users if role is missing from allowed array
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultPath =
      user.role === 'admin'
        ? '/admin/dashboard'
        : user.role === 'librarian'
          ? '/librarian/loans'
          : '/member/dashboard'
          
    return <Navigate to={defaultPath} replace />
  }

  // 3. Success step: Render layout outlet child nodes smoothly
  return <Outlet />
}