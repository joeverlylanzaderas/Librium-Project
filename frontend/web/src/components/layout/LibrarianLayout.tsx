// frontend/web/src/components/layout/LibrarianLayout.tsx
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Chatbot from '@/components/chat/Chatbot'

// Menu items for title lookup
const getPageTitle = (path: string): string => {
  const titles: Record<string, string> = {
    '/librarian/dashboard': 'Dashboard',
    '/librarian/books': 'Books Catalog',
    '/librarian/members': 'Members Directory',
    '/librarian/loans': 'Loan Management',
    '/librarian/requests': 'Borrow Requests',
    '/librarian/returns': 'Return Verification',
    '/librarian/fines': 'Fine Management',
    '/librarian/reservations': 'Reservation Management',
    '/librarian/profile': 'My Profile',
  }
  return titles[path] || 'Librarian Portal'
}

export default function LibrarianLayout() {
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