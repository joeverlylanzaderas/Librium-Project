// frontend/web/src/components/layout/Topbar.tsx
import { useState, useEffect } from 'react'
import { Bell, Search, ChevronDown, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'

interface TopbarProps {
  onMenuClick: () => void
  currentPageTitle: string
}

export default function Topbar({ onMenuClick, currentPageTitle }: TopbarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadgeColor = () => {
    if (user?.role === 'admin') return 'bg-[#FFC85C] text-[#1F150C]'
    if (user?.role === 'librarian') return 'bg-[#EDE9FE] text-[#7C3AED]'
    return 'bg-white/20 text-[#FBF5DD]'
  }

  const getInitials = () => {
    if (!user?.full_name) return 'U'
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const profilePicture = user?.profile?.profile_picture

  return (
    <header className="h-[70px] bg-[#1F150C] border-b border-[#412D15] flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1 -ml-2 hover:bg-white/5 rounded transition-colors"
        >
          <svg className="w-6 h-6 text-[#FBF5DD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className={`font-baskerville text-white ${isDesktop ? 'text-[22px]' : 'text-[17px]'}`}>
          {currentPageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {isDesktop && (
          <div className="flex items-center bg-[#2D1F10] rounded px-3 py-1.5 w-72">
            <Search size={16} className="text-[#8E7A66]" />
            <input
              type="text"
              placeholder="Search library catalog..."
              className="bg-transparent border-none text-sm text-[#F4EFE0] placeholder-[#8E7A66] outline-none flex-1 ml-2"
            />
          </div>
        )}

        <button className="relative p-2 hover:bg-white/5 rounded transition-colors">
          <Bell size={18} className="text-[#EFE9CE]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C59568] rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 hover:bg-white/5 rounded transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#412D15] flex items-center justify-center overflow-hidden">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={user?.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#FFC85C]">{getInitials()}</span>
              )}
            </div>

            {isDesktop && (
              <>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#F4EFE0]">{user?.full_name?.split(' ')[0] || 'User'}</p>
                  <p className="text-[10px] text-[#8E7A66] capitalize">{user?.role || 'Member'}</p>
                </div>
                <ChevronDown size={14} className={`text-[#8E7A66] transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#1F150C] border border-[#412D15] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-[#412D15] bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#412D15] flex items-center justify-center overflow-hidden">
                      {profilePicture ? (
                        <img 
                          src={profilePicture} 
                          alt={user?.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#FFC85C]">{getInitials()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#F4EFE0]">{user?.full_name}</p>
                      <p className="text-xs text-[#8E7A66]">{user?.email}</p>
                    </div>
                  </div>
                  <div className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold mt-2 ${getRoleBadgeColor()}`}>
                    {user?.role?.toUpperCase() || 'MEMBER'}
                  </div>
                </div>

                <div className="py-1">
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false)
                      navigate(user?.role === 'admin' ? '/admin/profile' : user?.role === 'librarian' ? '/librarian/profile' : '/member/profile')
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#EFE9CE] hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <User size={14} />
                    Profile Settings
                  </button>
                  <hr className="my-1 border-[#412D15]" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-[#FF6B6B] hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}