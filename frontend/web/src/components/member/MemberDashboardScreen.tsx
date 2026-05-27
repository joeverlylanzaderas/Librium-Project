// frontend/web/src/components/member/MemberDashboardScreen.tsx
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAlert } from '@/components/ui/AlertProvider'
import { useAuthStore } from '@/store/auth.store'
import { useToast } from '@/hooks/useToast'
import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@shared/constants/api'
import { 
  getBooks, getCategories, getDepartments, 
  getLoans, getReservations, getBorrowRequests, getFines,
  getBookmarks, createBookmark, deleteBookmark
} from '@/services/api'
import { extractData } from '@/hooks/useApiData'
import { 
  BookOpen, AlertCircle, Bookmark, Clock, DollarSign, 
  Search, X, Sliders, ChevronRight, User, LogOut,
  Calendar, Heart, Plus, Book
} from 'lucide-react'

// Types
type BookType = {
  id: number
  title: string
  author_name: string
  category_name: string | null
  department_name: string | null
  available: boolean
  isbn: string
  publication_year: number
  description: string | null
  cover_image: string | null
}

type Category = { id: number; name: string }
type Department = { id: number; name: string }
type BookmarkItem = { id: number; book: number }

type MemberStats = {
  active_loans: number
  overdue: number
  reservations: number
  pending_requests: number
  unpaid_fines: number
}

const STAT_CARDS = [
  { key: 'active_loans', label: 'Active Loans', icon: BookOpen, color: '#C17B2E', targetPath: '/member/loans' },
  { key: 'overdue', label: 'Overdue', icon: AlertCircle, color: '#B94040', targetPath: '/member/loans' },
  { key: 'reservations', label: 'Reservations', icon: Bookmark, color: '#2E7D5E', targetPath: '/member/reservations' },
  { key: 'pending_requests', label: 'Pending', icon: Clock, color: '#7B5EA7', targetPath: '/member/requests' },
  { key: 'unpaid_fines', label: 'Fines', icon: DollarSign, color: '#B94040', targetPath: '/member/fines' },
]

const StatChip = ({ label, value, icon: Icon, color, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center px-3 py-2.5 rounded-xl border min-w-[85px] transition-all hover:shadow-md"
    style={{ backgroundColor: `${color}10`, borderColor: `${color}44` }}
  >
    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-0.5" style={{ backgroundColor: `${color}18` }}>
      <Icon size={14} style={{ color }} />
    </div>
    <span className="text-lg font-bold font-serif" style={{ color }}>{value}</span>
    <span className="text-[9px] font-bold text-[#7A6350] uppercase tracking-wide">{label}</span>
  </button>
)

const BookCard = ({ item, isLoaned, isReserved, hasPending, isBookmarked, bookmarkLoading, acting, onAction, onBookmarkToggle }: any) => {
  const isDisabled = isReserved || isLoaned || hasPending
  let btnLabel = 'Borrow'
  let btnColor = '#C17B2E'
  if (hasPending) { btnLabel = 'Pending'; btnColor = '#7B5EA7' }
  else if (isReserved) { btnLabel = 'Reserved'; btnColor = '#2E7D5E' }
  else if (isLoaned) { btnLabel = 'On Loan'; btnColor = '#7A6350' }
  else if (!item.available) { btnLabel = 'Reserve'; btnColor = '#2E7D5E' }

  return (
    <div className="bg-[#FFFDF8] rounded-xl border border-[#DDD3C4] p-2.5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
      {/* Cover Container */}
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#F2EBE0]">
        {item.cover_image ? (
          <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book size={32} className="text-[#A89880]" />
          </div>
        )}
        
        {/* Bookmark Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onBookmarkToggle() }}
          disabled={bookmarkLoading}
          className="absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full bg-[#C17B2E]/90 flex items-center justify-center border border-[#DDD3C4] shadow-sm"
        >
          {bookmarkLoading ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            isBookmarked ? <Heart size={14} className="text-white fill-white" /> : <Plus size={14} className="text-[#1C1008]" />
          )}
        </button>

        {/* Status Badge */}
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded" style={{ backgroundColor: item.available ? '#2E7D5E' : '#B94040' }}>
          <span className="text-white text-[8px] font-extrabold tracking-wide">{item.available ? 'ON THE SHELF' : 'ON LOAN'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="pt-2 pb-1 flex-1">
        <h3 className="font-serif text-[13px] font-bold text-[#1C1008] leading-tight line-clamp-2">{item.title}</h3>
        <p className="text-[11px] text-[#7A6350] italic mt-0.5">{item.author_name}</p>
        
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.category_name && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FBF0DC] text-[#C17B2E]">{item.category_name}</span>
          )}
          {item.department_name && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F0EBF8] text-[#7B5EA7]">{item.department_name}</span>
          )}
        </div>
        <p className="text-[10px] text-[#A89880] mt-1">Year: {item.publication_year}</p>
      </div>

      {/* Action Button */}
      <button
        onClick={onAction}
        disabled={acting === item.id || isDisabled}
        className="w-full py-2 rounded-lg flex items-center justify-center mt-1 transition-opacity disabled:opacity-60"
        style={{ backgroundColor: btnColor }}
      >
        {acting === item.id ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-white text-[11px] font-extrabold">{btnLabel}</span>
        )}
      </button>
    </div>
  )
}

const BookModal = ({ book, acting, isDisabled, isReserved, isLoaned, onClose, onAction }: any) => {
  if (!book) return null
  const available = book.available
  const btnLabel = isLoaned ? 'You Have This Book' : isReserved ? 'Already Reserved' : available ? 'Request to Borrow' : 'Join Waitlist'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-[#FAF6EE] w-full max-w-md rounded-t-3xl max-h-[90%] overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-[#DDD3C4] rounded-full mx-auto mt-3 mb-2" />
        
        <div className="overflow-y-auto px-5 pb-4">
          <button onClick={onClose} className="float-right p-1">
            <X size={18} className="text-[#7A6350]" />
          </button>
          
          <div className="flex justify-center mb-4">
            {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} className="w-32 h-44 rounded-lg object-cover" />
            ) : (
              <div className="w-32 h-44 rounded-lg bg-[#E8DFCF] flex items-center justify-center">
                <BookOpen size={48} className="text-[#A89880]" />
              </div>
            )}
          </div>

          <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full w-fit mx-auto mb-3 ${available ? 'bg-[#E8F5EF]' : 'bg-[#FAEAEA]'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-[#2E7D5E]' : 'bg-[#B94040]'}`} />
            <span className={`text-xs font-bold ${available ? 'text-[#2E7D5E]' : 'text-[#B94040]'}`}>
              {available ? 'Available on Shelf' : 'Currently Checked Out'}
            </span>
          </div>

          <h2 className="font-serif text-xl font-bold text-[#1C1008] text-center mb-1">{book.title}</h2>
          <p className="text-sm text-[#7A6350] italic text-center mb-3">by {book.author_name}</p>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {book.category_name && (
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-[#FBF0DC] text-[#C17B2E]">{book.category_name}</span>
            )}
            {book.department_name && (
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-[#F0EBF8] text-[#7B5EA7]">{book.department_name}</span>
            )}
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-[#F2EBE0] rounded-lg p-3 text-center">
              <p className="text-[10px] font-extrabold text-[#A89880] uppercase tracking-wide mb-1">ISBN</p>
              <p className="font-serif text-sm font-semibold text-[#1C1008]">{book.isbn}</p>
            </div>
            <div className="flex-1 bg-[#F2EBE0] rounded-lg p-3 text-center">
              <p className="text-[10px] font-extrabold text-[#A89880] uppercase tracking-wide mb-1">Year</p>
              <p className="font-serif text-sm font-semibold text-[#1C1008]">{book.publication_year}</p>
            </div>
          </div>

          {book.description && (
            <>
              <p className="text-xs font-extrabold text-[#7A6350] uppercase tracking-wide mb-2">Synopsis</p>
              <p className="text-sm text-[#4A3520] leading-relaxed">{book.description}</p>
            </>
          )}
        </div>

        <div className="p-5 pt-3 border-t border-[#DDD3C4]">
          <button
            onClick={onAction}
            disabled={acting === book.id || isDisabled}
            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: available ? '#C17B2E' : '#2E7D5E' }}
          >
            {acting === book.id ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {available ? <BookOpen size={16} className="text-white" /> : <Bookmark size={16} className="text-white" />}
                <span className="text-white text-sm font-extrabold">{btnLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MemberDashboardScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toast } = useToast()

  // State
  const [activeLoanedBookIds, setActiveLoanedBookIds] = useState<number[]>([])
  const [activeReservedBookIds, setActiveReservedBookIds] = useState<number[]>([])
  const [activeBorrowRequestIds, setActiveBorrowRequestIds] = useState<number[]>([])
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [acting, setActing] = useState<number | null>(null)
  const [bookmarkActingId, setBookmarkActingId] = useState<number | null>(null)
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null)

  // Search Filters
  const [search, setSearch] = useState('')
  const [authorSearch, setAuthorSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [filterAvail, setFilterAvail] = useState<'all' | 'available'>('all')
  const [pubYear, setPubYear] = useState('')
  const [showAdvFilters, setShowAdvFilters] = useState(false)

  // Queries
  const { data: booksResponse, isLoading: booksLoading, refetch: refetchBooks } = useQuery({
    queryKey: ['books'],
    queryFn: getBooks,
  })
  const books = extractData<BookType[]>(booksResponse) || []

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const categories = extractData<Category[]>(categoriesResponse) || []

  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })
  const departments = extractData<Department[]>(departmentsResponse) || []

  // API functions for borrow requests and reservations using the correct endpoints
  const createBorrowRequest = async (data: { book: number }) => {
    const response = await api.post(API_ENDPOINTS.BORROW_REQUESTS.LIST, data)
    return response.data
  }

  const createReservation = async (data: { book: number }) => {
    const response = await api.post(API_ENDPOINTS.RESERVATIONS.LIST, data)
    return response.data
  }

  // Load member stats
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const [loansRes, reservationsRes, requestsRes, finesRes, bookmarkDataRes] = await Promise.all([
        getLoans(), getReservations(), getBorrowRequests(), getFines(), getBookmarks()
      ])

      const loans = extractData<any[]>(loansRes) || []
      const reservations = extractData<any[]>(reservationsRes) || []
      const requests = extractData<any[]>(requestsRes) || []
      const fines = extractData<any[]>(finesRes) || []
      const bookmarkData = extractData<BookmarkItem[]>(bookmarkDataRes) || []

      setBookmarks(bookmarkData)

      const ongoingLoans = loans.filter((l: any) => ['none', 'pending', null].includes(l.return_status))
      const loanedIds = ongoingLoans.map((l: any) => Number(typeof l.book === 'object' ? l.book.id : l.book)).filter(Boolean)
      setActiveLoanedBookIds(loanedIds)

      const activeRequests = requests.filter((r: any) => r.status === 'pending')
      const requestIds = activeRequests.map((r: any) => Number(typeof r.book === 'object' ? r.book.id : r.book)).filter(Boolean)
      setActiveBorrowRequestIds(requestIds)

      const activeReservations = reservations.filter((r: any) => ['waiting', 'ready'].includes(r.status))
      const reservedIds = activeReservations.map((r: any) => Number(typeof r.book === 'object' ? r.book.id : r.book)).filter(Boolean)
      setActiveReservedBookIds(reservedIds)

      setStats({
        active_loans: ongoingLoans.length,
        overdue: loans.filter((l: any) => l.is_overdue).length,
        reservations: activeReservations.length,
        pending_requests: activeRequests.length,
        unpaid_fines: fines.filter((f: any) => !f.paid).reduce((sum: number, f: any) => sum + parseFloat(f.amount || '0'), 0),
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Filter books
  const filteredBooks = books.filter((book) => {
    if (search.trim() && !book.title.toLowerCase().includes(search.toLowerCase())) return false
    if (authorSearch.trim() && !book.author_name?.toLowerCase().includes(authorSearch.toLowerCase())) return false
    if (categoryId) {
      const targetCat = categories.find(c => c.id === categoryId)
      if (book.category_name?.toLowerCase() !== targetCat?.name?.toLowerCase()) return false
    }
    if (departmentId) {
      const targetDept = departments.find(d => d.id === departmentId)
      if (book.department_name?.toLowerCase() !== targetDept?.name?.toLowerCase()) return false
    }
    if (filterAvail === 'available' && !book.available) return false
    if (pubYear.trim() && String(book.publication_year) !== pubYear.trim()) return false
    return true
  })

  const clearAllFilters = () => {
    setSearch('')
    setAuthorSearch('')
    setCategoryId(null)
    setDepartmentId(null)
    setFilterAvail('all')
    setPubYear('')
  }

  const handleBookmarkToggle = async (bookId: number) => {
    setBookmarkActingId(bookId)
    const existingBookmark = bookmarks.find((b) => Number(b.book) === Number(bookId))

    try {
      if (existingBookmark) {
        setBookmarks((prev) => prev.filter((b) => b.id !== existingBookmark.id))
        await deleteBookmark(existingBookmark.id)
        toast({ title: 'Success', description: 'Bookmark removed' })
      } else {
        const newBookmark = await createBookmark(bookId)
        const bookmarkData = extractData<{ id: number }>(newBookmark)
        setBookmarks((prev) => [...prev, { id: bookmarkData.id, book: bookId }])
        toast({ title: 'Success', description: 'Bookmark added' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not toggle bookmark', variant: 'destructive' })
      await loadStats()
    } finally {
      setBookmarkActingId(null)
    }
  }

  const handleBorrowRequest = async (book: BookType) => {
    if (activeLoanedBookIds.includes(book.id)) {
      toast({ title: 'Action Prohibited', description: `You already have "${book.title}" checked out.`, variant: 'destructive' })
      return
    }
    if (activeReservedBookIds.includes(book.id)) {
      toast({ title: 'Already Reserved', description: `You already have a reservation for "${book.title}".`, variant: 'destructive' })
      return
    }
    if (!book.available) {
      const { showConfirm } = useAlert()
      showConfirm(
        'Join Waitlist',
        `"${book.title}" is currently on loan. Would you like to join the waitlist?`,
        async () => {
          setActing(book.id)
          try {
            await createReservation({ book: book.id })
            toast({ title: 'Reserved', description: 'You have been added to the waitlist.' })
            await loadStats()
            await refetchBooks()
          } catch (error: any) {
            toast({ title: 'Error', description: error?.response?.data?.detail || 'Could not create reservation.', variant: 'destructive' })
          } finally {
            setActing(null)
          }
        },
        { confirmText: 'Join Waitlist', cancelText: 'Cancel', confirmVariant: 'default' }
      )
      return
    }
    setActing(book.id)
    try {
      await createBorrowRequest({ book: book.id })
      toast({ title: 'Request Submitted', description: 'A librarian will process it shortly.' })
      await loadStats()
      await refetchBooks()
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.detail || 'Could not submit request.', variant: 'destructive' })
    } finally {
      setActing(null)
    }
  }

  const handleSignOut = () => {
    const { showConfirm } = useAlert()
    showConfirm(
      'Confirm Logout',
      'Are you sure you want to log out?',
      () => {
        window.location.href = '/login'
      },
      { confirmText: 'Logout', cancelText: 'Cancel', confirmVariant: 'danger' }
    )
  }

  // Responsive grid
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const numColumns = containerWidth >= 768 ? Math.floor(containerWidth / 220) : 2
  const gap = 12

  return (
    <div className="bg-[#FAF6EE] min-h-screen">
      {/* Fixed Header */}
      <div className="sticky top-0 z-20 bg-[#FAF6EE] border-b border-[#DDD3C4]">
        {/* Hero Section */}
        <div className="px-4 pt-4 pb-2 flex justify-between items-start">
          <div>
            <p className="text-[9px] font-extrabold tracking-[1.5px] text-[#A89880]">WELCOME BACK</p>
            <h1 className="font-serif text-2xl font-bold text-[#1C1008] mt-0.5">{user?.full_name?.split(' ')[0] ?? 'Reader'}</h1>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#DDD3C4] bg-[#FFFDF8]">
            <LogOut size={14} className="text-[#7A6350]" />
            <span className="text-[11px] font-bold text-[#7A6350]">Exit</span>
          </button>
        </div>

        {/* Alert Banners */}
        {stats && stats.overdue > 0 && (
          <button onClick={() => navigate('/member/loans')} className="flex items-center gap-2 px-4 py-2 w-full bg-[#FAEAEA] border-b border-[#DDD3C4]">
            <AlertCircle size={13} className="text-[#B94040]" />
            <span className="flex-1 text-[11px] font-bold text-[#B94040]">{stats.overdue} overdue {stats.overdue === 1 ? 'book' : 'books'} — tap to review</span>
            <ChevronRight size={13} className="text-[#B94040]" />
          </button>
        )}
        {stats && stats.unpaid_fines > 0 && (
          <button onClick={() => navigate('/member/fines')} className="flex items-center gap-2 px-4 py-2 w-full bg-[#FBF0DC]">
            <DollarSign size={13} className="text-[#C17B2E]" />
            <span className="flex-1 text-[11px] font-bold text-[#C17B2E]">Unpaid fines: ₱{stats.unpaid_fines.toFixed(2)} — tap to settle</span>
            <ChevronRight size={13} className="text-[#C17B2E]" />
          </button>
        )}

        {/* Stats Chips */}
        {statsLoading ? (
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-4 h-4 border-2 border-[#C17B2E] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#7A6350]">Loading library record…</span>
          </div>
        ) : stats ? (
          <div className="flex gap-2.5 overflow-x-auto px-4 py-3">
            {STAT_CARDS.map((card) => {
              const value = stats[card.key as keyof MemberStats]
              const display = card.key === 'unpaid_fines' ? `₱${(value as number).toFixed(0)}` : String(value)
              return (
                <StatChip
                  key={card.key}
                  label={card.label}
                  value={display}
                  icon={card.icon}
                  color={card.color}
                  onClick={() => navigate(card.targetPath)}
                />
              )
            })}
          </div>
        ) : null}

        {/* Toolbar */}
        <div className="px-4 pb-3 space-y-2.5">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#F2EBE0] rounded-lg px-2.5 h-9">
              <Search size={14} className="text-[#A89880]" />
              <input
                type="text"
                placeholder="Search title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#1C1008] placeholder-[#A89880] outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={14} className="text-[#A89880]" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAdvFilters(!showAdvFilters)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors ${showAdvFilters ? 'bg-[#1C1008] text-white' : 'bg-[#F2EBE0] text-[#1C1008]'}`}
            >
              <Sliders size={14} />
              <span className="text-xs font-bold">Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvFilters && (
            <div className="bg-[#FFFDF8] rounded-xl border border-[#DDD3C4] p-3 space-y-2.5">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-[#F2EBE0] rounded-lg px-2.5 h-9">
                  <User size={12} className="text-[#A89880]" />
                  <input
                    type="text"
                    placeholder="Author name..."
                    value={authorSearch}
                    onChange={(e) => setAuthorSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[#1C1008] placeholder-[#A89880] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 bg-[#F2EBE0] rounded-lg px-2.5 h-9 w-24">
                  <Calendar size={12} className="text-[#A89880]" />
                  <input
                    type="text"
                    placeholder="Year..."
                    maxLength={4}
                    value={pubYear}
                    onChange={(e) => setPubYear(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[#1C1008] placeholder-[#A89880] outline-none"
                  />
                </div>
              </div>

              {/* Departments */}
              {departments.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold text-[#7A6350] uppercase tracking-wide mb-1.5">Departments</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={() => setDepartmentId(null)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${!departmentId ? 'bg-[#FBF0DC] text-[#C17B2E] border border-[#C17B2E]' : 'bg-[#F2EBE0] text-[#7A6350]'}`}
                    >
                      All Departments
                    </button>
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => setDepartmentId(departmentId === dept.id ? null : dept.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${departmentId === dept.id ? 'bg-[#F0EBF8] text-[#7B5EA7] border border-[#7B5EA7]' : 'bg-[#F2EBE0] text-[#7A6350]'}`}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <div className="flex justify-end pt-1 border-t border-[#F2EBE0]">
                <button onClick={clearAllFilters} className="flex items-center gap-1.5 px-2 py-1">
                  <svg className="w-2.5 h-2.5 text-[#B94040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-[11px] font-bold text-[#B94040]">Reset Filters</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {(['all', 'available'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterAvail(f)}
                  className={`pb-0.5 text-[13px] font-semibold ${filterAvail === f ? 'text-[#C17B2E] border-b-2 border-[#C17B2E]' : 'text-[#7A6350]'}`}
                >
                  {f === 'all' ? 'All Books' : 'Available'}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-[#A89880]">{filteredBooks.length} found</span>
          </div>

          {/* Categories Row */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryId(null)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${!categoryId ? 'bg-[#FBF0DC] text-[#C17B2E] border border-[#C17B2E]' : 'bg-[#F2EBE0] text-[#7A6350]'}`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${categoryId === cat.id ? 'bg-[#FBF0DC] text-[#C17B2E] border border-[#C17B2E]' : 'bg-[#F2EBE0] text-[#7A6350]'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {booksLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#C17B2E] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16">
          <Book size={48} className="mx-auto text-[#A89880] mb-3" />
          <p className="text-[#7A6350]">No books found matching your criteria.</p>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`, gap: `${gap}px` }}>
            {filteredBooks.map((book) => (
              <div key={book.id} style={{ width: '100%' }}>
                <BookCard
                  item={book}
                  isLoaned={activeLoanedBookIds.includes(book.id)}
                  isReserved={activeReservedBookIds.includes(book.id)}
                  hasPending={activeBorrowRequestIds.includes(book.id)}
                  isBookmarked={bookmarks.some((b) => Number(b.book) === book.id)}
                  bookmarkLoading={bookmarkActingId === book.id}
                  acting={acting}
                  onAction={() => handleBorrowRequest(book)}
                  onBookmarkToggle={() => handleBookmarkToggle(book.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          acting={acting}
          isDisabled={activeReservedBookIds.includes(selectedBook.id) || activeLoanedBookIds.includes(selectedBook.id)}
          isReserved={activeReservedBookIds.includes(selectedBook.id)}
          isLoaned={activeLoanedBookIds.includes(selectedBook.id)}
          onClose={() => setSelectedBook(null)}
          onAction={() => handleBorrowRequest(selectedBook)}
        />
      )}
    </div>
  )
}