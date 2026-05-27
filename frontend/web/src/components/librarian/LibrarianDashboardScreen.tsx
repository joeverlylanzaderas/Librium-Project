// frontend/web/src/components/librarian/LibrarianDashboardScreen.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboard } from '@/services/api'
import { extractData } from '@/hooks/useApiData'
import { 
  Book, 
  ClipboardList, 
  BookOpen, 
  DollarSign, 
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Bookmark,
  ChevronRight,
  Zap,
  BarChart2,
  Layers,
  CornerDownLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/auth.store'

type DashboardStats = {
  total_books: number
  available_books: number
  active_loans: number
  overdue_loans: number
  pending_borrow_requests: number
  pending_returns: number
  unpaid_fines: number
  unpaid_fines_total: number
  active_reservations: number
  total_members: number
}

const QUICK_ACTIONS = [
  { label: 'Borrow Requests', path: '/librarian/requests', icon: ClipboardList, color: '#F69D39' },
  { label: 'Issue Loan', path: '/librarian/loans', icon: BookOpen, color: '#412D15' },
  { label: 'Returns Verification', path: '/librarian/returns', icon: CornerDownLeft, color: '#3D5A45' },
  { label: 'Fines Tracking', path: '/librarian/fines', icon: DollarSign, color: '#8A2B2B' },
  { label: 'Books Catalog', path: '/librarian/books', icon: Layers, color: '#7C3AED' },
  { label: 'Members Directory', path: '/librarian/members', icon: Users, color: '#0369A1' },
  { label: 'Reservations Ledger', path: '/librarian/reservations', icon: Bookmark, color: '#BE185D' },
]

export default function LibrarianDashboardScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Real-time polling setup
  const { data: response, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 15000, // Refresh every 15 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }, [queryClient])

  const stats = extractData<DashboardStats>(response) || {}
  const formattedDate = format(new Date(), 'EEEE, MMMM d, yyyy')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#281711]"></div>
      </div>
    )
  }

  const HeroCard = ({ label, value, icon: Icon, onClick, cardBg = '#FCFAEE', textColor = '#2D1F10', valueColor = '#1F150C', tagText, tagColor = '#FFC85C' }: any) => (
    <div 
      onClick={onClick}
      className="flex-1 min-w-[180px] border border-[#EAE7DF] overflow-hidden cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md"
    >
      <div className={`p-4 ${cardBg === '#1F150C' ? 'bg-[#1F150C]' : 'bg-[#FCFAEE]'}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <p className={`text-xs font-semibold uppercase opacity-80 ${textColor === '#2D1F10' ? 'text-[#2D1F10]' : 'text-[#EFE9CE]'}`}>
              {label}
            </p>
            <p className={`text-4xl font-bold font-serif mt-1 ${valueColor === '#1F150C' ? 'text-[#1F150C]' : 'text-white'}`}>
              {value ?? 0}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
            <Icon size={18} className={valueColor === '#1F150C' ? 'text-[#1F150C]' : 'text-[#FFC85C]'} />
          </div>
        </div>
      </div>
      <div className={`py-1 text-center ${tagColor === '#FFC85C' ? 'bg-[#FFC85C]' : tagColor === '#FF9D00' ? 'bg-[#FF9D00]' : 'bg-[#FF7D29]'}`}>
        <p className="text-[10px] font-bold text-[#1F150C] tracking-wide">{tagText}</p>
      </div>
    </div>
  )

  const QuickTile = ({ label, icon: Icon, count, color, onClick }: any) => (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center py-3 bg-[#FBF5DD] border border-[#EFE9CE] hover:bg-[#EFE9CE] transition-colors relative group cursor-pointer min-w-[100px]"
    >
      {!!count && (
        <div className="absolute top-1 right-1 bg-[#8A2B2B] min-w-[16px] h-4 rounded-full px-1 flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">{count > 99 ? '99+' : count}</span>
        </div>
      )}
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
        <Icon size={16} style={{ color }} />
      </div>
      <span className="text-[11px] font-semibold text-[#2D1F10] text-center">{label}</span>
    </button>
  )

  const AlertBanner = ({ icon: Icon, message, count, color, onClick }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 border rounded w-full ${color === 'danger' ? 'bg-[#FDF0EF] border-[#F5C2BC]' : 'bg-[#FFFBEB] border-[#FCD34D]'}`}
    >
      <Icon size={14} className={color === 'danger' ? 'text-[#8A2B2B]' : 'text-[#B45309]'} />
      <p className={`flex-1 text-left text-xs font-semibold ${color === 'danger' ? 'text-[#8A2B2B]' : 'text-[#B45309]'}`}>
        {count} {message}
      </p>
      <ChevronRight size={14} className={color === 'danger' ? 'text-[#8A2B2B]' : 'text-[#B45309]'} />
    </button>
  )

  const LedgerRow = ({ label, value, icon: Icon, color, onClick, isLast = false }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-4 py-3 hover:bg-[#FBF5DD] transition-colors group w-full text-left ${!isLast && 'border-b border-[#FFC85C]'}`}
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

  const hasAlerts = (stats?.overdue_loans ?? 0) > 0 || (stats?.pending_borrow_requests ?? 0) > 0

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#706251]">Hello, {user?.full_name?.split(' ')[0] || user?.email}</p>
          <p className="text-xs font-medium text-[#706251] opacity-80 mt-0.5">{formattedDate}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1F150C] font-serif mt-1">Librarian Dashboard</h1>
        </div>

        {/* Hero Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <HeroCard 
            label="Active Loans" 
            value={stats?.active_loans} 
            icon={Activity} 
            onClick={() => navigate('/librarian/loans')}
            tagText="CIRCULATION"
          />
          <HeroCard 
            label="Total Books" 
            value={stats?.total_books} 
            icon={Book} 
            onClick={() => navigate('/librarian/books')}
            cardBg="#1F150C"
            textColor="#EFE9CE"
            valueColor="white"
            tagText="ALL VOLUMES"
            tagColor="#FF9D00"
          />
          <HeroCard 
            label="Pending Requests" 
            value={stats?.pending_borrow_requests} 
            icon={ClipboardList} 
            onClick={() => navigate('/librarian/requests')}
            tagText="BORROW REQUESTS"
            tagColor="#FF7D29"
          />
        </div>

        {/* Alert Banners */}
        {hasAlerts && (
          <div className="px-0 mb-4 space-y-2">
            {(stats?.overdue_loans ?? 0) > 0 && (
              <AlertBanner 
                icon={AlertCircle}
                message="overdue volumes need review"
                count={stats.overdue_loans}
                color="danger"
                onClick={() => navigate('/librarian/loans')}
              />
            )}
            {(stats?.pending_borrow_requests ?? 0) > 0 && (
              <AlertBanner 
                icon={ClipboardList}
                message="borrow requests awaiting approval"
                count={stats.pending_borrow_requests}
                color="warning"
                onClick={() => navigate('/librarian/requests')}
              />
            )}
          </div>
        )}

        {/* Quick Actions Section */}
        <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-3 uppercase">Quick Actions</p>
        <div className="bg-white border border-[#EFE9CE] overflow-hidden mb-6">
          <div className="bg-[#1F150C] px-4 py-2.5 flex items-center gap-2">
            <Zap size={14} className="text-[#FFC85C]" />
            <span className="text-[13px] font-semibold text-[#FBF5DD]">Management Desks</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <QuickTile 
                  key={action.label}
                  label={action.label}
                  icon={action.icon}
                  color={action.color}
                  count={action.label === 'Borrow Requests' ? stats?.pending_borrow_requests : action.label === 'Issue Loan' ? stats?.overdue_loans : undefined}
                  onClick={() => navigate(action.path)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Overview Section */}
        <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-3 uppercase">Overview</p>
        <div className="bg-white border border-[#EFE9CE] overflow-hidden">
          <div className="bg-[#1F150C] px-4 py-2.5 flex items-center gap-2">
            <BarChart2 size={14} className="text-[#FFC85C]" />
            <span className="text-[13px] font-semibold text-[#FBF5DD]">Metrics</span>
          </div>
          <div className="py-1">
            <LedgerRow 
              label="Available Books" 
              value={stats?.available_books ?? 0} 
              icon={CheckCircle} 
              color="#3D5A45" 
              onClick={() => navigate('/librarian/books')} 
            />
            <LedgerRow 
              label="Overdue Loans" 
              value={stats?.overdue_loans ?? 0} 
              icon={AlertCircle} 
              color="#8A2B2B" 
              onClick={() => navigate('/librarian/loans')} 
            />
            <LedgerRow 
              label="Pending Returns" 
              value={stats?.pending_returns ?? 0} 
              icon={RefreshCw} 
              color="#F69D39" 
              onClick={() => navigate('/librarian/loans')} 
            />
            <LedgerRow 
              label="Active Reservations" 
              value={stats?.active_reservations ?? 0} 
              icon={Bookmark} 
              color="#412D15" 
              onClick={() => navigate('/librarian/reservations')} 
            />
            <LedgerRow 
              label="Unresolved Fines" 
              value={stats?.unpaid_fines ?? 0} 
              icon={DollarSign} 
              color="#8A2B2B" 
              onClick={() => navigate('/librarian/fines')} 
            />
            <LedgerRow 
              label="Total Members" 
              value={stats?.total_members ?? 0} 
              icon={Users} 
              color="#706251" 
              onClick={() => navigate('/librarian/members')} 
              isLast
            />
          </div>
        </div>
      </div>
    </div>
  )
}