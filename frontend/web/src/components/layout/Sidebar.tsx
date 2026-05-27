// frontend/web/src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Book, 
  Hand, 
  BookOpen, 
  DollarSign, 
  Users,
  LogOut,
  Library,
  User,
  Clock,
  Bookmark,
  Heart,
  TrendingUp,
  Tag,
  Briefcase,
  Calendar as CalendarIcon,
  Edit,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft, // Add this for Returns
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import type { LucideIcon } from 'lucide-react'

// Menu item types
type MenuItemType = 'item' | 'header'

interface MenuItem {
  type: MenuItemType
  name: string
  path?: string
  icon?: LucideIcon
}

// Menu structures matching your RN app exactly
const BORROWER_MENU: MenuItem[] = [
  { type: 'item', name: 'Dashboard',    path: '/member/dashboard',      icon: LayoutDashboard },
  { type: 'item', name: 'My Loans',     path: '/member/loans',          icon: BookOpen },
  { type: 'item', name: 'Requests',     path: '/member/requests',       icon: Clock },
  { type: 'item', name: 'Reservations', path: '/member/reservations',   icon: Bookmark },
  { type: 'item', name: 'Fines',        path: '/member/fines',          icon: DollarSign },
  { type: 'item', name: 'Bookmarks',    path: '/member/bookmarks',      icon: Heart },
  { type: 'item', name: 'Profile',      path: '/member/profile',        icon: User },
]

const LIBRARIAN_MENU: MenuItem[] = [
  { type: 'item', name: 'Dashboard',    path: '/librarian/dashboard',   icon: LayoutDashboard },
  { type: 'header', name: 'Operations' },
  { type: 'item', name: 'Requests',     path: '/librarian/requests',    icon: Clock },
  { type: 'item', name: 'Loans',        path: '/librarian/loans',       icon: BookOpen },
  { type: 'item', name: 'Returns',      path: '/librarian/returns',     icon: CornerDownLeft }, // Added Returns
  { type: 'item', name: 'Reservations', path: '/librarian/reservations', icon: Bookmark },
  { type: 'item', name: 'Fines',        path: '/librarian/fines',       icon: DollarSign },
  { type: 'header', name: 'Management' },
  { type: 'item', name: 'Books',        path: '/librarian/books',       icon: Book },
  { type: 'item', name: 'Members',      path: '/librarian/members',     icon: Users },
  { type: 'item', name: 'Profile',      path: '/librarian/profile',     icon: User },
]

const ADMIN_MENU: MenuItem[] = [
  { type: 'item',   name: 'Dashboard',    path: '/admin/dashboard',     icon: LayoutDashboard },
  { type: 'header', name: 'User Management' },
  { type: 'item',   name: 'Users',        path: '/admin/users',         icon: Users },
  { type: 'item',   name: 'Page Not Found',        path: '/admin/roles',         icon: UserPlus },
  { type: 'header', name: 'Library Catalog' },
  { type: 'item',   name: 'Books',        path: '/admin/books',         icon: Book },
  { type: 'item',   name: 'Authors',      path: '/admin/authors',       icon: Edit },
  { type: 'item',   name: 'Categories',   path: '/admin/categories',    icon: Tag },
  { type: 'item',   name: 'Departments',  path: '/admin/departments',   icon: Briefcase },
  { type: 'header', name: 'Circulation' },
  { type: 'item',   name: 'Borrow Requests', path: '/admin/borrow-requests', icon: Hand },
  { type: 'item',   name: 'Loans',        path: '/admin/loans',         icon: BookOpen },
  { type: 'item',   name: 'Reservations', path: '/admin/reservations',  icon: Bookmark },
  { type: 'item',   name: 'Fines',        path: '/admin/fines',         icon: DollarSign },
  { type: 'header', name: 'Academic' },
  { type: 'item',   name: 'Semesters',    path: '/admin/semesters',     icon: CalendarIcon },
  { type: 'item',   name: 'Reports',      path: '/admin/reports',       icon: TrendingUp },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onCollapseChange?: (collapsed: boolean) => void
}

export default function Sidebar({ isOpen, onClose, onCollapseChange }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768
      setIsDesktop(desktop)
      if (!desktop) setIsCollapsed(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Notify parent when collapse state changes
  useEffect(() => {
    onCollapseChange?.(isCollapsed)
  }, [isCollapsed, onCollapseChange])

  // Select menu based on user role
  const getMenuItems = (): MenuItem[] => {
    if (user?.role === 'admin') return ADMIN_MENU
    if (user?.role === 'librarian') return LIBRARIAN_MENU
    return BORROWER_MENU
  }

  const menuItems = getMenuItems()
  const currentPath = location.pathname

  const getRoleDisplayName = () => {
    if (user?.role === 'admin') return 'Admin Portal'
    if (user?.role === 'librarian') return 'Librarian Portal'
    return 'Member Portal'
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (!isDesktop) onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const showFullUI = !isCollapsed

  return (
    <>
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-[#1F150C] border-r border-[#412D15] z-40
        transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-[78px]' : 'w-[270px]'}
      `}>
        {/* Branding Section */}
        <div 
          className={`flex items-center gap-3.5 px-5 pt-6 pb-3 cursor-pointer flex-shrink-0 ${!showFullUI && 'justify-center px-0'}`}
          onClick={() => handleNavigation(user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'librarian' ? '/librarian/dashboard' : '/member/dashboard')}
        >
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Library size={22} className="text-[#FBF5DD]" />
          </div>
          {showFullUI && (
            <div>
              <span className="text-xl font-bold text-[#FBF5DD] font-baskerville block">Librium</span>
              <span className="text-[9px] text-[#C59568] font-medium">{getRoleDisplayName()}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-px bg-[#412D15] mx-3 mb-2 flex-shrink-0" />

        {/* Collapse Toggle (Desktop only) */}
        {isDesktop && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center gap-2 py-2.5 px-5 bg-white/5 border-b border-white/5 mb-2 w-full hover:bg-white/10 transition-colors flex-shrink-0 ${!showFullUI && 'justify-center px-0'}`}
          >
            {isCollapsed ? (
              <ChevronRight size={16} className="text-[#EFE9CE]" />
            ) : (
              <>
                <ChevronLeft size={16} className="text-[#EFE9CE]" />
                <span className="text-xs font-semibold text-[#EFE9CE]">Collapse Menu</span>
              </>
            )}
          </button>
        )}

        {/* Navigation Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {menuItems.map((item, index) => {
            if (item.type === 'header') {
              return showFullUI ? (
                <div key={`header-${index}`} className="text-[#706251] text-[11px] font-bold tracking-wider uppercase px-3 mt-3.5 mb-1">
                  {item.name}
                </div>
              ) : (
                <div key={`divider-${index}`} className="h-px bg-white/5 my-2.5 w-1/2 mx-auto" />
              )
            }

            const isActive = currentPath === item.path
            const Icon = item.icon

            if (!Icon) return null

            return (
              <button
                key={item.path}
                onClick={() => item.path && handleNavigation(item.path)}
                className={`
                  flex items-center w-full rounded-lg transition-all duration-200 mb-0.5
                  ${!showFullUI ? 'justify-center px-0 py-2.5' : 'gap-3.5 px-3.5 py-2.5'}
                  ${isActive 
                    ? 'bg-[#FBF5DD] text-[#1F150C]' 
                    : 'text-[#EFE9CE] hover:bg-white/5'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-[#1F150C]' : 'text-[#EFE9CE]'} />
                {showFullUI && (
                  <span className={`text-sm font-medium ${isActive ? 'text-[#1F150C] font-bold' : 'text-[#EFE9CE]'}`}>
                    {item.name}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout Button at bottom */}
        <div className="p-3 border-t border-[#412D15] flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full rounded-lg transition-all duration-200
              ${!showFullUI ? 'justify-center px-0 py-2.5' : 'gap-3.5 px-3.5 py-2.5'}
              text-[#EFE9CE] hover:bg-white/5
            `}
          >
            <LogOut size={20} />
            {showFullUI && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && !isDesktop && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />
      )}
    </>
  )
}