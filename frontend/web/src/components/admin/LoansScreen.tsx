// frontend/web/src/components/admin/LoansScreen.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { getLoans, createLoan, verifyReturn, getBooks, getUsers } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { Loan, Semester } from '@shared/types/circulation'
import { 
  Plus, Search, X, User as UserIcon, Book as BookIcon, 
  Calendar, Clock, AlertTriangle, Bell, CheckCircle, 
  XCircle, ChevronDown, ChevronUp, Loader2, Check
} from 'lucide-react'
import { format } from 'date-fns'

// Extended loan type for display purposes
type LoanWithDetails = Loan & {
  book_title?: string
  book_author?: string
  book_cover?: string | null
  book_category?: string | null
  book_department?: string | null
  member_name?: string
  notes?: string | null
}

type BookItem = {
  id: number
  title: string
  author_name?: string
  available?: boolean
}

type UserItem = {
  id: number
  email: string
  full_name?: string
}

const STATUS_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  none:      { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'ACTIVE HOLD' },
  pending:   { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D', label: 'RETURN PENDING' },
  verified:  { bg: '#E6F4EA', text: '#137333', border: '#B7DFC4', label: 'RETURN VERIFIED' },
  rejected:  { bg: '#FCE8E6', text: '#C53030', border: '#F5C2BC', label: 'RETURN REJECTED' },
  disputed:  { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE', label: 'DISPUTED' },
}

const formatSemester = (semester: Semester | null | undefined): string => {
  if (!semester) return '—'
  const typeMap: Record<string, string> = {
    '1st_sem': '1st Semester',
    '2nd_sem': '2nd Semester',
    'summer': 'Summer',
  }
  const typeLabel = typeMap[semester.semester_type] || semester.semester_type
  return `${typeLabel} — ${semester.academic_year}`
}

type FilterType = 'all' | 'pending' | 'active' | 'overdue' | 'returned'

export default function LoansScreen() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)
  const [bookPickerOpen, setBookPickerOpen] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [bookQuery, setBookQuery] = useState('')
  const [form, setForm] = useState({
    memberId: '',
    memberDisplay: '',
    bookId: '',
    bookDisplay: '',
  })
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries with real-time updates
  const { data: loansResponse, isLoading, refetch } = useQuery({
    queryKey: ['loans'],
    queryFn: getLoans,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
  const loans = extractData<LoanWithDetails[]>(loansResponse) || []

  const { data: booksResponse } = useQuery({
    queryKey: ['books-for-loans'],
    queryFn: getBooks,
    enabled: issueModalOpen,
  })
  const books = extractData<BookItem[]>(booksResponse) || []

  const { data: usersResponse } = useQuery({
    queryKey: ['users-for-loans'],
    queryFn: getUsers,
    enabled: issueModalOpen,
  })
  const users = extractData<UserItem[]>(usersResponse) || []

  // Auto-refresh on mount
  useEffect(() => {
    refetch()
  }, [refetch])

  // Mutations with optimistic updates
  const createLoanMutation = useMutation({
    mutationFn: createLoan,
    onMutate: async (newLoan) => {
      await queryClient.cancelQueries({ queryKey: ['loans'] })
      const previousLoans = queryClient.getQueryData(['loans'])
      
      // Optimistically add to cache
      queryClient.setQueryData(['loans'], (old: any) => {
        const loans = extractData<LoanWithDetails[]>(old) || []
        const tempId = -Date.now()
        const member = users.find(u => u.id === newLoan.member)
        const book = books.find(b => b.id === newLoan.book)
        
        const optimisticLoan = {
          id: tempId,
          member: newLoan.member,
          member_name: member?.full_name,
          book: newLoan.book,
          book_title: book?.title,
          loan_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          return_status: 'none',
          is_overdue: false,
          overdue_days: 0,
        } as LoanWithDetails
        
        return { ...old, data: { results: [optimisticLoan, ...loans] } }
      })
      
      return { previousLoans }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Loan issued successfully' })
      setIssueModalOpen(false)
      resetForm()
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousLoans) {
        queryClient.setQueryData(['loans'], context.previousLoans)
      }
      const msg = error?.response?.data?.message || 'Could not issue loan'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    },
  })

  const verifyReturnMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'verified' | 'rejected' }) => 
      verifyReturn(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['loans'] })
      const previousLoans = queryClient.getQueryData(['loans'])
      
      // Optimistically update cache
      queryClient.setQueryData(['loans'], (old: any) => {
        const loans = extractData<LoanWithDetails[]>(old) || []
        const updatedLoans = loans.map(loan =>
          loan.id === id ? { 
            ...loan, 
            return_status: status,
            return_verified_date: status === 'verified' ? new Date().toISOString() : null,
            return_date: status === 'verified' ? new Date().toISOString() : null,
          } : loan
        )
        return { ...old, data: { results: updatedLoans } }
      })
      
      return { previousLoans }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Return request processed' })
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousLoans) {
        queryClient.setQueryData(['loans'], context.previousLoans)
      }
      toast({ title: 'Error', description: error?.response?.data?.message || 'Action failed', variant: 'destructive' })
    },
    onSettled: () => {
      setActingId(null)
    },
  })

  const resetForm = () => {
    setForm({ memberId: '', memberDisplay: '', bookId: '', bookDisplay: '' })
    setMemberQuery('')
    setBookQuery('')
  }

  const handleVerify = (id: number, status: 'verified' | 'rejected') => {
    const { showConfirm } = useAlert()
    const message = status === 'verified' 
      ? 'Confirm physical verification of item return?'
      : 'Reject this item return request?'
    const title = status === 'verified' ? 'Verify Return' : 'Reject Return'
    const confirmVariant = status === 'verified' ? 'success' : 'danger'
    
    showConfirm(
      title,
      message,
      () => {
        setActingId(id)
        verifyReturnMutation.mutate({ id, status })
      },
      { confirmText: status === 'verified' ? 'Verify' : 'Reject', cancelText: 'Cancel', confirmVariant }
    )
  }

  const hasReturnRequest = (loan: LoanWithDetails) => {
    return loan.return_status === 'pending'
  }

  const isOverdue = (loan: LoanWithDetails) => {
    if (loan.return_status === 'verified') return false
    const dueDate = new Date(loan.due_date)
    const today = new Date()
    return dueDate < today
  }

  const getOverdueDays = (loan: LoanWithDetails) => {
    if (!isOverdue(loan)) return 0
    const dueDate = new Date(loan.due_date)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - dueDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const filteredLoans = loans.filter((loan) => {
    if (filter === 'pending') return loan.return_status === 'pending'
    if (filter === 'active') return loan.return_status === 'none' && !isOverdue(loan)
    if (filter === 'overdue') return loan.return_status === 'none' && isOverdue(loan)
    if (filter === 'returned') return loan.return_status === 'verified'
    return true
  })

  const filteredMembers = users.filter((user) =>
    user.email?.toLowerCase().includes(memberQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(memberQuery.toLowerCase())
  )

  const filteredBooks = books.filter((book) =>
    book.title?.toLowerCase().includes(bookQuery.toLowerCase()) ||
    book.author_name?.toLowerCase().includes(bookQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  return (
    <div className="bg-[#ECE7D1] min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-[#E8E4D9]">
          <h1 className="text-xl font-bold text-[#281711] font-baskerville">
            Book Borrows/Loans ({filteredLoans.length})
          </h1>
          <button
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-2 bg-[#281711] text-[#F4EFE0] px-4 py-2.5 hover:bg-[#3D2A1E] transition-colors"
          >
            <Plus size={16} />
            <span className="text-xs font-semibold tracking-wide">Issue Loan</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {(['all', 'pending', 'active', 'overdue', 'returned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold border transition-colors ${
                filter === f
                  ? 'bg-[#281711] border-[#281711] text-[#F4EFE0]'
                  : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {filteredLoans.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EFE9CE]">
            <p className="text-[#706251]">No entries matching criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLoans.map((loan) => {
              const isExpanded = expandedId === loan.id
              const overdue = isOverdue(loan)
              const hasReturnReq = hasReturnRequest(loan)
              const statusKey = loan.return_status === 'none' && overdue ? 'overdue' : loan.return_status
              const status = STATUS_MAP[statusKey] || STATUS_MAP.none
              const isReturned = loan.return_status === 'verified'
              const isActing = actingId === loan.id

              return (
                <div
                  key={loan.id}
                  className={`bg-white border border-[#412D15] overflow-hidden transition-opacity ${
                    isReturned ? 'opacity-70' : ''
                  }`}
                >
                  <div className="p-4">
                    {/* Header Line */}
                    <div className="flex justify-between items-center mb-3">
                      <div className={`px-2 py-0.5 border text-[9px] font-bold ${status.bg} ${status.text}`}>
                        {status.label}
                      </div>
                      <span className="text-[11px] font-semibold text-[#A1927F]">ID: #{loan.id}</span>
                    </div>

                    {/* Book Info */}
                    <div className="mb-2 min-h-[52px]">
                      <h3 className="font-bold text-[#281711] text-sm font-baskerville line-clamp-2">
                        {loan.book_title || (typeof loan.book === 'object' ? loan.book.title : 'Untitled Catalog Material')}
                      </h3>
                      {loan.book_author && (
                        <p className="text-[11px] text-[#706251] italic mt-0.5">{loan.book_author}</p>
                      )}
                    </div>

                    <div className="h-px bg-[#EBE7DC] my-2" />

                    {/* Metrics Grid */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <UserIcon size={12} className="text-[#A1927F]" />
                        <span className="text-[11px] font-semibold text-[#513E2F]">Borrower:</span>
                        <span className="text-[11px] text-[#281711] font-medium flex-1 text-right truncate">
                          {loan.member_name || (typeof loan.member === 'object' ? loan.member.full_name : `ID: ${loan.member}`)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#A1927F]" />
                        <span className="text-[11px] font-semibold text-[#513E2F]">Issued:</span>
                        <span className="text-[11px] text-[#281711] flex-1 text-right">
                          {format(new Date(loan.loan_date), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className={overdue && !isReturned ? 'text-[#8A2B2B]' : 'text-[#A1927F]'} />
                        <span className={`text-[11px] font-semibold ${overdue && !isReturned ? 'text-[#8A2B2B]' : 'text-[#513E2F]'}`}>
                          Due Date:
                        </span>
                        <span className={`text-[11px] flex-1 text-right ${overdue && !isReturned ? 'text-[#8A2B2B] font-bold' : 'text-[#281711]'}`}>
                          {format(new Date(loan.due_date), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {hasReturnReq && loan.return_status !== 'verified' && (
                        <div className="flex items-center gap-1.5 bg-[#FEF3C7] px-2 py-1 -mx-2">
                          <Bell size={12} className="text-[#D97706]" />
                          <span className="text-[11px] font-semibold text-[#D97706]">Requested:</span>
                          <span className="text-[11px] text-[#D97706] flex-1 text-right">
                            {loan.return_requested_date ? format(new Date(loan.return_requested_date), 'MMM d, yyyy') : 'Return requested'}
                          </span>
                        </div>
                      )}

                      {overdue && loan.return_status !== 'verified' && (
                        <div className="flex items-center gap-1.5 bg-[#FCE8E6] px-2 py-1 -mx-2">
                          <AlertTriangle size={12} className="text-[#C53030]" />
                          <span className="text-[11px] font-bold text-[#C53030]">Overdue:</span>
                          <span className="text-[11px] font-bold text-[#C53030] flex-1 text-right">
                            {getOverdueDays(loan)}d Delayed
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                      className="w-full flex justify-between items-center text-[11px] font-semibold text-[#513E2F] border-t border-[#EBE7DC] pt-2.5 mt-3"
                    >
                      <span>{isExpanded ? 'Collapse Details' : 'View Complete Record Profile'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#EFECE6] space-y-2">
                        {loan.semester && (
                          <div className="text-[11px] text-[#706251]">
                            <span className="font-semibold">Semester:</span> {formatSemester(loan.semester)}
                          </div>
                        )}
                        {loan.return_date && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-[#137333]" />
                            <span className="text-[11px] font-semibold text-[#513E2F]">Returned:</span>
                            <span className="text-[11px] text-[#281711] flex-1 text-right">
                              {format(new Date(loan.return_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {loan.return_verified_date && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-[#137333]" />
                            <span className="text-[11px] font-semibold text-[#513E2F]">Verified:</span>
                            <span className="text-[11px] text-[#281711] flex-1 text-right">
                              {format(new Date(loan.return_verified_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {hasReturnReq && loan.return_status !== 'verified' && (
                      <div className="flex gap-2 mt-3 pt-2 border-t border-[#EBE7DC]">
                        <button
                          onClick={() => handleVerify(loan.id, 'verified')}
                          disabled={isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[#281711] text-white py-2 text-[11px] font-bold hover:bg-[#3D2A1E] transition-colors disabled:opacity-60"
                        >
                          {isActing && actingId === loan.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <>
                              <Check size={12} />
                              Verify
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleVerify(loan.id, 'rejected')}
                          disabled={isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#F5C2BC] text-[#C53030] py-2 text-[11px] font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {isActing && actingId === loan.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <>
                              <XCircle size={12} />
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Issue Loan Modal - same as before */}
      {issueModalOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-6">
          <div className="bg-[#FFFDF1] border border-[#412D15] w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-baskerville text-base font-bold text-[#281711]">Front Desk Borrow Issuance</h2>
                <button onClick={() => { setIssueModalOpen(false); resetForm() }}>
                  <X size={18} className="text-[#281711]" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#513E2F] mb-1">Member *</label>
                  <button
                    onClick={() => setMemberPickerOpen(true)}
                    className={`w-full flex items-center justify-between bg-white border p-3 ${form.memberId ? 'border-[#137333] bg-[#F0FAF3]' : 'border-[#DCD4C4]'}`}
                  >
                    <span className={`text-sm ${!form.memberId ? 'text-[#A1927F]' : 'text-[#281711]'}`}>
                      {form.memberId ? form.memberDisplay : 'Tap to search member…'}
                    </span>
                    {form.memberId ? (
                      <CheckCircle size={14} className="text-[#137333]" />
                    ) : (
                      <ChevronDown size={14} className="text-[#A1927F]" />
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#513E2F] mb-1">Book *</label>
                  <button
                    onClick={() => setBookPickerOpen(true)}
                    className={`w-full flex items-center justify-between bg-white border p-3 ${form.bookId ? 'border-[#137333] bg-[#F0FAF3]' : 'border-[#DCD4C4]'}`}
                  >
                    <span className={`text-sm ${!form.bookId ? 'text-[#A1927F]' : 'text-[#281711]'}`}>
                      {form.bookId ? form.bookDisplay : 'Tap to search book…'}
                    </span>
                    {form.bookId ? (
                      <CheckCircle size={14} className="text-[#137333]" />
                    ) : (
                      <ChevronDown size={14} className="text-[#A1927F]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => { setIssueModalOpen(false); resetForm() }}
                  className="flex-1 border border-[#DCD4C4] py-2.5 text-xs font-semibold text-[#706251] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createLoanMutation.mutate({ member: parseInt(form.memberId), book: parseInt(form.bookId) })}
                  disabled={!form.bookId || !form.memberId || createLoanMutation.isPending}
                  className="flex-1 bg-[#281711] text-[#F4EFE0] py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {createLoanMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <BookIcon size={13} />
                      Issue Hold Ledger
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Picker Modal */}
      {memberPickerOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-6">
          <div className="bg-[#FFFDF1] border border-[#412D15] w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[#EBE7DC]">
              <h3 className="font-baskerville text-sm font-bold text-[#281711]">Select Member</h3>
              <button onClick={() => setMemberPickerOpen(false)}>
                <X size={18} className="text-[#281711]" />
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 border-b border-[#EBE7DC]">
              <Search size={14} className="text-[#A1927F]" />
              <input
                type="text"
                placeholder="Type to search..."
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                className="flex-1 text-sm text-[#281711] outline-none bg-transparent"
                autoFocus
              />
              {memberQuery && (
                <button onClick={() => setMemberQuery('')}>
                  <X size={14} className="text-[#A1927F]" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="p-5 text-center text-xs text-[#A1927F] italic">No matching members found</div>
              ) : (
                filteredMembers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setForm({
                        ...form,
                        memberId: String(user.id),
                        memberDisplay: `${user.full_name || ''} (${user.email})`.trim(),
                      })
                      setMemberPickerOpen(false)
                    }}
                    className="w-full text-left px-4 py-3 border-b border-[#EAE7DF] hover:bg-gray-50"
                  >
                    <div className="text-sm font-semibold text-[#281711]">{user.full_name || user.email}</div>
                    <div className="text-xs text-[#706251]">{user.email}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Book Picker Modal */}
      {bookPickerOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-6">
          <div className="bg-[#FFFDF1] border border-[#412D15] w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[#EBE7DC]">
              <h3 className="font-baskerville text-sm font-bold text-[#281711]">Select Book</h3>
              <button onClick={() => setBookPickerOpen(false)}>
                <X size={18} className="text-[#281711]" />
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 border-b border-[#EBE7DC]">
              <Search size={14} className="text-[#A1927F]" />
              <input
                type="text"
                placeholder="Type to search..."
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
                className="flex-1 text-sm text-[#281711] outline-none bg-transparent"
                autoFocus
              />
              {bookQuery && (
                <button onClick={() => setBookQuery('')}>
                  <X size={14} className="text-[#A1927F]" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredBooks.length === 0 ? (
                <div className="p-5 text-center text-xs text-[#A1927F] italic">No matching books found</div>
              ) : (
                filteredBooks.map((book) => {
                  const isUnavailable = book.available === false
                  return (
                    <button
                      key={book.id}
                      onClick={() => {
                        if (isUnavailable) {
                          toast({ title: 'Unavailable', description: 'This book is currently on loan.', variant: 'destructive' })
                          return
                        }
                        setForm({
                          ...form,
                          bookId: String(book.id),
                          bookDisplay: book.title,
                        })
                        setBookPickerOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-[#EAE7DF] hover:bg-gray-50 ${isUnavailable ? 'bg-[#F7F4EB]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-[#281711]">{book.title}</div>
                          {book.author_name && (
                            <div className="text-xs text-[#706251]">by {book.author_name}</div>
                          )}
                        </div>
                        <div className={`px-2 py-0.5 text-[9px] font-bold border ${isUnavailable ? 'bg-[#FCE8E6] border-[#F5C2BC] text-[#C53030]' : 'bg-[#E6F4EA] border-[#B7DFC4] text-[#137333]'}`}>
                          {isUnavailable ? 'ON LOAN' : 'AVAILABLE'}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
