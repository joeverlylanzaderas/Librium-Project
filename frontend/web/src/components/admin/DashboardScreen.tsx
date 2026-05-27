// frontend/web/src/components/admin/DashboardScreen.tsx
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '@/services/api'
import { extractData } from '@/hooks/useApiData'
import { 
  Book, 
  Hand, 
  Users, 
  DollarSign, 
  Clock, 
  BookOpen, 
  Calendar, 
  AlertCircle,
  TrendingUp,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'

type DashboardStats = {
  total_books?: number
  available_books?: number
  active_loans?: number
  overdue_loans?: number
  active_reservations?: number
  pending_borrow_requests?: number
  unpaid_fines_total?: number
  total_members?: number
  pending_returns?: number
  recent_activity?: Array<{
    type: 'loan' | 'return' | 'fine' | 'request'
    label: string
    member: string
    book: string
    date: string | null
  }>
}

const ACTIVITY_ICONS: Record<string, { icon: typeof Book; color: string }> = {
  loan: { icon: BookOpen, color: '#412D15' },
  return: { icon: Book, color: '#3D5A45' },
  fine: { icon: DollarSign, color: '#8A2B2B' },
  request: { icon: Hand, color: '#FF7D29' },
}

export default function DashboardScreen() {
  const navigate = useNavigate()

  const { data: response, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const stats = extractData<DashboardStats>(response) || {}
  const formattedDate = format(new Date(), 'EEEE, MMMM d, yyyy')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#281711]"></div>
      </div>
    )
  }

  const StatCard = ({ label, value, icon: Icon, accent, cardBg = '#FCFAEE', accentText = '#000', labelColor = '#2D1F10', tagText = '', onClick }: any) => (
    <div 
      onClick={onClick}
      className={`flex-1 min-w-[180px] p-4 border border-[#EAE7DF] relative overflow-hidden cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md ${cardBg === '#1F150C' ? 'bg-[#1F150C]' : 'bg-[#FCFAEE]'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase opacity-80 ${labelColor === '#2D1F10' ? 'text-[#2D1F10]' : 'text-[#EFE9CE]'}`}>
            {label}
          </p>
          <p className={`text-3xl font-bold font-serif mt-1 ${accentText === '#000' ? 'text-[#2D1F10]' : 'text-white'}`}>
            {value ?? '0'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
          <Icon size={18} className={accentText === '#000' ? 'text-[#1F150C]' : 'text-[#FFC85C]'} />
        </div>
      </div>
      {tagText && (
        <div className={`absolute bottom-0 left-0 right-0 py-1 text-center bg-[${accent}]`}>
          <p className="text-[10px] font-bold text-[#1F150C] tracking-wide">{tagText}</p>
        </div>
      )}
    </div>
  )

  const QuickTile = ({ label, icon: Icon, count, onClick }: any) => (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center py-3 bg-[#FBF5DD] border border-[#EFE9CE] hover:bg-[#EFE9CE] transition-colors relative group cursor-pointer"
    >
      {!!count && (
        <div className="absolute top-1 right-1 bg-[#8A2B2B] min-w-[16px] h-4 rounded-full px-1 flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">{count > 99 ? '99+' : count}</span>
        </div>
      )}
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
        <Icon size={16} className="text-[#412D15]" />
      </div>
      <span className="text-[11px] font-semibold text-[#2D1F10]">{label}</span>
    </button>
  )

  const ActivityRow = ({ item, isLast }: { item: any; isLast: boolean }) => {
    const meta = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.loan
    const Icon = meta.icon
    const dateStr = item.date ? format(new Date(item.date), 'MMM d') : '—'
    return (
      <div className={`flex items-center gap-3 px-3 py-3 ${!isLast && 'border-b border-[#FFC85C]'}`}>
        <div className={`w-7 h-7 rounded flex items-center justify-center`} style={{ backgroundColor: `${meta.color}15` }}>
          <Icon size={14} style={{ color: meta.color }} />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#2D1F10]">{item.label}</p>
          <p className="text-[11px] text-[#706251] truncate">{item.member} · {item.book}</p>
        </div>
        <p className="text-[11px] text-[#706251] font-mono">{dateStr}</p>
      </div>
    )
  }

  const LedgerRow = ({ label, value, icon: Icon, color, onClick }: any) => (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#FBF5DD] transition-colors border-b border-[#FFC85C] last:border-b-0 group cursor-pointer w-full text-left"
    >
      <div className="flex items-center gap-3">
        <Icon size={16} style={{ color }} />
        <span className="text-[13px] font-semibold text-[#2D1F10]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-bold font-serif" style={{ color }}>{value}</span>
        <ChevronRight size={14} className="text-[#706251] group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  )

  const quickLinks = [
    { label: 'Books', path: '/admin/books', icon: Book, count: stats?.total_books },
    { label: 'Borrow Requests', path: '/admin/borrow-requests', icon: Hand, count: stats?.pending_borrow_requests },
    { label: 'Loans', path: '/admin/loans', icon: BookOpen, count: stats?.active_loans },
    { label: 'Reservations', path: '/admin/reservations', icon: Calendar, count: stats?.active_reservations },
    { label: 'Fines', path: '/admin/fines', icon: DollarSign, count: stats?.unpaid_fines_total },
    { label: 'Users', path: '/admin/users', icon: Users, count: stats?.total_members },
  ]

  const unpaidFinesDisplay = stats?.unpaid_fines_total !== undefined ? `₱${Number(stats?.unpaid_fines_total).toLocaleString()}` : '₱0'

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#706251]">Hello, Administrator</p>
              <p className="text-xs font-medium text-[#706251] opacity-80 mt-0.5">{formattedDate}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1F150C] font-serif mt-1">Library Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#EFE9CE]">
              <TrendingUp size={16} className="text-[#3D5A45]" />
              <span className="text-xs font-semibold text-[#2D1F10]">Live Statistics</span>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Active Loans" 
            value={stats?.active_loans} 
            icon={BookOpen} 
            accent="#FFC85C" 
            tagText="ACTIVE LOANS" 
            onClick={() => navigate('/admin/loans')}
          />
          <StatCard 
            label="Total Books" 
            value={stats?.total_books} 
            icon={Book} 
            accent="#FF9D00" 
            cardBg="#1F150C" 
            accentText="#fff" 
            labelColor="#EFE9CE" 
            tagText="ALL BOOKS" 
            onClick={() => navigate('/admin/books')}
          />
          <StatCard 
            label="Borrow Requests" 
            value={stats?.pending_borrow_requests} 
            icon={Hand} 
            accent="#FF7D29" 
            tagText="BORROW REQUESTS" 
            onClick={() => navigate('/admin/borrow-requests')}
          />
          <StatCard 
            label="Pending Returns" 
            value={stats?.pending_returns} 
            icon={Clock} 
            accent="#F69D39" 
            cardBg="#1F150C" 
            accentText="#fff" 
            labelColor="#EFE9CE" 
            tagText="PENDING RETURNS" 
            onClick={() => navigate('/admin/loans')}
          />
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-3 uppercase">Quick Actions</p>
          <div className="bg-white border border-[#EFE9CE] overflow-hidden">
            <div className="bg-[#1F150C] px-4 py-2.5 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFC85C" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14 12 14 12 16.24 16.24" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="2" y1="12" x2="4" y2="12" />
              </svg>
              <span className="text-[13px] font-semibold text-[#FBF5DD]">Management Desks</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {quickLinks.map((link) => (
                  <QuickTile 
                    key={link.path} 
                    label={link.label} 
                    icon={link.icon} 
                    count={link.count} 
                    onClick={() => navigate(link.path)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Recent Activities + Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div>
            <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-3 uppercase">Recent Activities</p>
            <div className="bg-white border border-[#EFE9CE] overflow-hidden">
              <div className="bg-[#1F150C] px-4 py-2.5 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFC85C" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="text-[13px] font-semibold text-[#FBF5DD]">Recent Activity Log</span>
              </div>
              {!stats?.recent_activity?.length ? (
                <div className="text-center py-12">
                  <p className="text-3xl font-bold font-serif text-[#1F150C]">0</p>
                  <p className="text-xs text-[#706251] mt-2">No recent activity</p>
                </div>
              ) : (
                stats.recent_activity.map((item, idx) => (
                  <ActivityRow key={idx} item={item} isLast={idx === stats.recent_activity!.length - 1} />
                ))
              )}
            </div>
          </div>

          {/* Secondary Quick Actions */}
          <div>
            <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-3 uppercase">More Quick Actions</p>
            <div className="bg-white border border-[#EFE9CE] overflow-hidden">
              <div className="bg-[#1F150C] px-4 py-2.5 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFC85C" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span className="text-[13px] font-semibold text-[#FBF5DD]">Secondary Actions</span>
              </div>
              <div>
                <LedgerRow 
                  label="Available Books" 
                  value={stats?.available_books ?? 0} 
                  icon={Book} 
                  color="#3D5A45" 
                  onClick={() => navigate('/admin/books')} 
                />
                <LedgerRow 
                  label="Active Reservations" 
                  value={stats?.active_reservations ?? 0} 
                  icon={Calendar} 
                  color="#412D15" 
                  onClick={() => navigate('/admin/reservations')} 
                />
                <LedgerRow 
                  label="Unpaid Fines" 
                  value={unpaidFinesDisplay} 
                  icon={DollarSign} 
                  color="#8A2B2B" 
                  onClick={() => navigate('/admin/fines')} 
                />
                <LedgerRow 
                  label="Overdue Loans" 
                  value={stats?.overdue_loans ?? 0} 
                  icon={AlertCircle} 
                  color="#8A2B2B" 
                  onClick={() => navigate('/admin/loans')} 
                />
                <LedgerRow 
                  label="Registered Members" 
                  value={stats?.total_members ?? 0} 
                  icon={Users} 
                  color="#706251" 
                  onClick={() => navigate('/admin/users')} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}