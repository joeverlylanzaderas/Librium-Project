// frontend/web/src/app/router.tsx
import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import type { UserRole } from '@shared/types'

// Lazy loading utility with fallback checks
function loadLazyComponent<T extends Record<string, unknown>>(
  factory: () => Promise<T>,
  exportName: string,
) {
  return lazy(() =>
    factory().then((module) => {
      if (module.default) {
        return { default: module.default as React.ComponentType<any> }
      }
      if (module[exportName]) {
        return { default: module[exportName] as React.ComponentType<any> }
      }
      return {
        default: () => (
          <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 m-4">
            <h3 className="font-bold">Migration Discovery Error</h3>
            <p className="text-sm opacity-80">Could not find export choice "{exportName}" in bundle target chunk.</p>
          </div>
        )
      }
    }),
  )
}

// Lazy-loaded routes
const AuthLayout = loadLazyComponent(() => import('@/components/layout/AuthLayout'), 'AuthLayout')
const LoginForm = loadLazyComponent(() => import('@/components/auth/LoginForm'), 'LoginForm')
const RegisterForm = loadLazyComponent(() => import('@/components/auth/RegisterForm'), 'RegisterForm')
const BookList = loadLazyComponent(() => import('@/components/books/BookList'), 'BookList')
const BookDetail = loadLazyComponent(() => import('@/components/books/BookDetail'), 'BookDetail')
const ProfileScreen = loadLazyComponent(() => import('@/components/profile/ProfileScreen'), 'ProfileScreen')

// Member Components
const MemberLayout = loadLazyComponent(() => import('@/components/layout/MemberLayout'), 'MemberLayout')
const MemberDashboard = loadLazyComponent(() => import('@/components/member/MemberDashboardScreen'), 'MemberDashboardScreen')
const MemberLoans = loadLazyComponent(() => import('@/components/member/MemberLoansScreen'), 'MemberLoansScreen')
const MemberRequests = loadLazyComponent(() => import('@/components/member/MemberRequestsScreen'), 'MemberRequestsScreen')
const MemberReservations = loadLazyComponent(() => import('@/components/member/MemberReservationsScreen'), 'MemberReservationsScreen')
const MemberFines = loadLazyComponent(() => import('@/components/member/MemberFinesScreen'), 'MemberFinesScreen')
const MemberBookmarks = loadLazyComponent(() => import('@/components/member/MemberBookmarksScreen'), 'MemberBookmarksScreen')

// Admin components
const AdminLayout = loadLazyComponent(() => import('@/components/layout/AdminLayout'), 'AdminLayout')
const AdminDashboard = loadLazyComponent(() => import('@/components/admin/DashboardScreen'), 'DashboardScreen')
const AdminBooks = loadLazyComponent(() => import('@/components/admin/BooksScreen'), 'BooksScreen')
const AdminBorrowRequests = loadLazyComponent(() => import('@/components/admin/BorrowRequestsScreen'), 'BorrowRequestsScreen')
const AdminLoans = loadLazyComponent(() => import('@/components/admin/LoansScreen'), 'LoansScreen')
const AdminReservations = loadLazyComponent(() => import('@/components/admin/ReservationsScreen'), 'ReservationsScreen')
const AdminFines = loadLazyComponent(() => import('@/components/admin/FinesScreen'), 'FinesScreen')
const AdminUsers = loadLazyComponent(() => import('@/components/admin/UsersScreen'), 'UsersScreen')
const AdminAuthors = loadLazyComponent(() => import('@/components/admin/AuthorsScreen'), 'AuthorsScreen')
const AdminCategories = loadLazyComponent(() => import('@/components/admin/CategoriesScreen'), 'CategoriesScreen')
const AdminDepartments = loadLazyComponent(() => import('@/components/admin/DepartmentsScreen'), 'DepartmentsScreen')
const AdminSemesters = loadLazyComponent(() => import('@/components/admin/SemestersScreen'), 'SemestersScreen')

// Librarian Components
const LibrarianLayout = loadLazyComponent(() => import('@/components/layout/LibrarianLayout'), 'LibrarianLayout')
const LibrarianDashboard = loadLazyComponent(() => import('@/components/librarian/LibrarianDashboardScreen'), 'LibrarianDashboardScreen')
const LibrarianBooks = loadLazyComponent(() => import('@/components/librarian/LibrarianBooksScreen'), 'LibrarianBooksScreen')
const LibrarianMembers = loadLazyComponent(() => import('@/components/librarian/LibrarianMembersScreen'), 'LibrarianMembersScreen')
const LibrarianLoans = loadLazyComponent(() => import('@/components/librarian/LibrarianLoansScreen'), 'LibrarianLoansScreen')
const LibrarianRequests = loadLazyComponent(() => import('@/components/librarian/LibrarianRequestsScreen'), 'LibrarianRequestsScreen')
const LibrarianReturns = loadLazyComponent(() => import('@/components/librarian/LibrarianReturnsScreen'), 'LibrarianReturnsScreen')
const LibrarianFines = loadLazyComponent(() => import('@/components/librarian/LibrarianFinesScreen'), 'LibrarianFinesScreen')
const LibrarianReservations = loadLazyComponent(() => import('@/components/librarian/LibrarianReservationsScreen'), 'LibrarianReservationsScreen')

const memberRoles: UserRole[] = ['member']
const staffRoles: UserRole[] = ['admin', 'librarian']

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">
    Loading application...
  </div>
)

function getDefaultDashboardPath(role?: UserRole | null) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'librarian') return '/librarian/dashboard'
  return '/member/dashboard'
}

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)

  if (isAuthenticated) {
    return <Navigate to={getDefaultDashboardPath(userRole)} replace />
  }
  return <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)

  if (isAuthenticated) {
    return <Navigate to={getDefaultDashboardPath(userRole)} replace />
  }
  return children
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center text-slate-700">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p>The route you are looking for does not exist.</p>
      <a href="/" className="text-primary hover:underline">
        Go back home
      </a>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication Portal Setup */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginForm />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterForm />
                </PublicRoute>
              }
            />
          </Route>

          {/* Public Library Catalogs */}
          <Route path="/books" element={<BookList />} />
          <Route path="/books/:bookId" element={<BookDetail />} />

          {/* Member Workspaces */}
          <Route path="/member" element={<ProtectedRoute allowedRoles={memberRoles} />}>
            <Route element={<MemberLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<MemberDashboard />} />
              <Route path="loans" element={<MemberLoans />} />
              <Route path="requests" element={<MemberRequests />} />
              <Route path="reservations" element={<MemberReservations />} />
              <Route path="fines" element={<MemberFines />} />
              <Route path="bookmarks" element={<MemberBookmarks />} />
              <Route path="profile" element={<ProfileScreen />} />
            </Route>
          </Route>

          {/* Librarian Workspaces */}
          <Route path="/librarian" element={<ProtectedRoute allowedRoles={staffRoles} />}>
            <Route element={<LibrarianLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<LibrarianDashboard />} />
              <Route path="books" element={<LibrarianBooks />} />
              <Route path="members" element={<LibrarianMembers />} />
              <Route path="loans" element={<LibrarianLoans />} />
              <Route path="requests" element={<LibrarianRequests />} />
              <Route path="returns" element={<LibrarianReturns />} />
              <Route path="fines" element={<LibrarianFines />} />
              <Route path="reservations" element={<LibrarianReservations />} />
              <Route path="profile" element={<ProfileScreen />} />
            </Route>
          </Route>

          {/* Site Administrator Panels */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="books" element={<AdminBooks />} />
              <Route path="borrow-requests" element={<AdminBorrowRequests />} />
              <Route path="loans" element={<AdminLoans />} />
              <Route path="reservations" element={<AdminReservations />} />
              <Route path="fines" element={<AdminFines />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="authors" element={<AdminAuthors />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="semesters" element={<AdminSemesters />} />
              <Route path="profile" element={<ProfileScreen />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}