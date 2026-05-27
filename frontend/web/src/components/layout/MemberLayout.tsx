// frontend/web/src/components/layout/MemberLayout.tsx
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Chatbot from '@/components/chat/Chatbot'

const getPageTitle = (path: string): string => {
  const titles: Record<string, string> = {
    '/member/dashboard':    'Library Catalog',
    '/member/loans':        'My Loans',
    '/member/requests':     'My Requests',
    '/member/reservations': 'My Reservations',
    '/member/fines':        'My Fines',
    '/member/bookmarks':    'My Bookmarks',
    '/member/profile':      'My Profile',
  }
  return titles[path] || 'Member Portal'
}

export default function MemberLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)
  const location = useLocation()
  const currentPageTitle = getPageTitle(location.pathname)

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sidebarWidth = isDesktop && !isCollapsed ? 270 : 0

  return (
    <div className="flex h-screen bg-[#FAF6EE] overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapseChange={setIsCollapsed}
      />

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