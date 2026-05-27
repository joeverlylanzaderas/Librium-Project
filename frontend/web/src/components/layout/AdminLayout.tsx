// frontend/web/src/components/layout/AdminLayout.tsx
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Chatbot from '@/components/chat/Chatbot'

// Menu items for title lookup
const getPageTitle = (path: string): string => {
  const titles: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/books': 'Books',
    '/admin/authors': 'Authors',
    '/admin/categories': 'Categories',
    '/admin/departments': 'Departments',
    '/admin/users': 'Users',
    '/admin/roles': 'Roles',
    '/admin/borrow-requests': 'Borrow Requests',
    '/admin/loans': 'Loans',
    '/admin/reservations': 'Reservations',
    '/admin/fines': 'Fines',
    '/admin/semesters': 'Semesters',
    '/admin/reports': 'Reports',
    '/admin/profile': 'Profile',
    '/admin/settings': 'Settings',
  }
  return titles[path] || 'Dashboard'
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)
  const location = useLocation()
  const currentPageTitle = getPageTitle(location.pathname)

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Only apply margin on desktop when sidebar is not collapsed
  const shouldApplyMargin = isDesktop && !isCollapsed
  const sidebarWidth = shouldApplyMargin ? 270 : 0

  return (
    <div className="flex h-screen bg-[#FBF5DD] overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onCollapseChange={setIsCollapsed}
      />
      
      {/* Main content area */}
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 w-full"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <Topbar onMenuClick={() => setSidebarOpen(true)} currentPageTitle={currentPageTitle} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Chatbot - available globally */}
      <Chatbot />
    </div>
  )
}