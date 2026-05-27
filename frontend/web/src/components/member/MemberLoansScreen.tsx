// frontend/web/src/components/member/MemberLoansScreen.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLoans, requestReturn, cancelPickup } from '@/services/api'
import { extractData } from '@/hooks/useApiData'
import { useToast } from '@/hooks/useToast'
import type { Loan } from '@shared/types/circulation'
import {
  BookOpen, Clock, CheckCircle, XCircle, AlertCircle,
  Search, X, RotateCcw, Ban,
} from 'lucide-react'
import { format } from 'date-fns'

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  ink:         '#1C1008',
  inkLight:    '#4A3520',
  muted:       '#7A6350',
  faint:       '#A89880',
  paper:       '#FAF6EE',
  paperDark:   '#F2EBE0',
  paperDeep:   '#E8DFCF',
  card:        '#FFFDF8',
  amber:       '#C17B2E',
  amberFaint:  '#FBF0DC',
  green:       '#2E7D5E',
  greenFaint:  '#E8F5EF',
  red:         '#B94040',
  redFaint:    '#FAEAEA',
  purple:      '#7B5EA7',
  purpleFaint: '#F0EBF8',
  blue:        '#1D6FA4',
  blueFaint:   '#E0F2FE',
  border:      '#DDD3C4',
}

// return_status → display metadata
const STATUS_META: Record<string, {
  bg: string; text: string; icon: typeof Clock; label: string
}> = {
  none:     { bg: T.blueFaint,   text: T.blue,   icon: Clock,        label: 'Active'           },
  pending:  { bg: T.amberFaint,  text: T.amber,  icon: Clock,        label: 'Return Requested' },
  verified: { bg: T.greenFaint,  text: T.green,  icon: CheckCircle,  label: 'Returned'         },
  rejected: { bg: T.redFaint,    text: T.red,    icon: XCircle,      label: 'Return Rejected'  },
  disputed: { bg: T.purpleFaint, text: T.purple, icon: AlertCircle,  label: 'Disputed'         },
}

type FilterKey = 'all' | 'active' | 'overdue' | 'pending' | 'returned'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'active',   label: 'Active'   },
  { key: 'overdue',  label: 'Overdue'  },
  { key: 'pending',  label: 'Pending'  },
  { key: 'returned', label: 'Returned' },
]

// Extended loan type with flattened fields from API
type LoanWithDetails = Loan & {
  book_title?: string
  book_cover?: string | null
}

export default function MemberLoansScreen() {
  const { toast }      = useToast()
  const queryClient    = useQueryClient()
  const [search,       setSearch]  = useState('')
  const [filter,       setFilter]  = useState<FilterKey>('all')
  const [actingId,     setActingId] = useState<number | null>(null)
  const [confirmId,    setConfirmId] = useState<number | null>(null)
  const [confirmType,  setConfirmType] = useState<'return' | 'cancel' | null>(null)

  // Query with real-time updates
  const { data: loansRes, isLoading, refetch } = useQuery({
    queryKey: ['loans'],
    queryFn: getLoans,
    // Refresh every 10 seconds
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
  const loans = extractData<LoanWithDetails[]>(loansRes) || []

  // Auto-refresh when component mounts
  useEffect(() => {
    refetch()
  }, [refetch])

  // Counts for filter labels
  const counts = {
    all:      loans.length,
    active:   loans.filter(l => l.return_status === 'none' && !l.is_overdue).length,
    overdue:  loans.filter(l => l.is_overdue && l.return_status !== 'verified').length,
    pending:  loans.filter(l => l.return_status === 'pending').length,
    returned: loans.filter(l => l.return_status === 'verified').length,
  }

  const filtered = loans.filter((loan) => {
    // Search
    const bookTitle = loan.book_title || (typeof loan.book === 'object' ? loan.book.title : '')
    if (search && !bookTitle.toLowerCase().includes(search.toLowerCase())) return false
    // Tab filter
    if (filter === 'active')   return loan.return_status === 'none' && !loan.is_overdue
    if (filter === 'overdue')  return loan.is_overdue && loan.return_status !== 'verified'
    if (filter === 'pending')  return loan.return_status === 'pending'
    if (filter === 'returned') return loan.return_status === 'verified'
    return true
  })

  // ── Mutations with immediate cache update ──────────────────────────────────
  const requestReturnMutation = useMutation({
    mutationFn: (loanId: number) => requestReturn(loanId),
    onMutate: async (loanId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['loans'] })
      
      // Snapshot previous value
      const previousLoans = queryClient.getQueryData(['loans'])
      
      // Optimistically update the cache
      queryClient.setQueryData(['loans'], (old: any) => {
        const loans = extractData<LoanWithDetails[]>(old) || []
        const updatedLoans = loans.map((loan: LoanWithDetails) =>
          loan.id === loanId ? { ...loan, return_status: 'pending', return_requested_date: new Date().toISOString() } : loan
        )
        return { ...old, data: { results: updatedLoans } }
      })
      
      return { previousLoans }
    },
    onSuccess: () => {
      toast({ title: 'Return Requested', description: 'A librarian will verify your return shortly.' })
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousLoans) {
        queryClient.setQueryData(['loans'], context.previousLoans)
      }
      toast({ title: 'Error', description: 'Could not submit return request.', variant: 'destructive' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      setActingId(null); setConfirmId(null); setConfirmType(null)
    },
  })

  const cancelPickupMutation = useMutation({
    mutationFn: (loanId: number) => cancelPickup(loanId),
    onMutate: async (loanId) => {
      await queryClient.cancelQueries({ queryKey: ['loans'] })
      const previousLoans = queryClient.getQueryData(['loans'])
      
      queryClient.setQueryData(['loans'], (old: any) => {
        const loans = extractData<LoanWithDetails[]>(old) || []
        const updatedLoans = loans.filter((loan: LoanWithDetails) => loan.id !== loanId)
        return { ...old, data: { results: updatedLoans } }
      })
      
      return { previousLoans }
    },
    onSuccess: () => {
      toast({ title: 'Pickup Cancelled', description: 'Your pickup has been cancelled.' })
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLoans) {
        queryClient.setQueryData(['loans'], context.previousLoans)
      }
      toast({ title: 'Error', description: 'Could not cancel pickup.', variant: 'destructive' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      setActingId(null); setConfirmId(null); setConfirmType(null)
    },
  })

  const handleConfirm = () => {
    if (!confirmId || !confirmType) return
    setActingId(confirmId)
    if (confirmType === 'return') requestReturnMutation.mutate(confirmId)
    else cancelPickupMutation.mutate(confirmId)
  }

  const bookTitle = (loan: LoanWithDetails) =>
    loan.book_title || (typeof loan.book === 'object' ? loan.book.title : `Book #${loan.book}`)

  const bookCover = (loan: LoanWithDetails): string | null =>
    loan.book_cover || (typeof loan.book === 'object' ? loan.book.cover_image : null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: T.amber }} />
      </div>
    )
  }

  return (
    <div className="min-h-full" style={{ backgroundColor: T.paper }}>
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Page header */}
        <div className="mb-5">
          <h1 className="font-bold" style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: T.ink }}>
            My Loans
          </h1>
          <p style={{ fontSize: '13px', color: T.muted, marginTop: '2px' }}>
            Track your borrowed books and manage returns
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="rounded-full px-3 py-1.5 text-xs font-bold border whitespace-nowrap transition-all"
              style={filter === key
                ? { backgroundColor: T.ink, color: '#fff', borderColor: T.ink }
                : { backgroundColor: T.card, color: T.muted, borderColor: T.border }
              }
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 h-10 mb-5 border"
          style={{ backgroundColor: T.paperDark, borderColor: T.border }}
        >
          <Search size={15} style={{ color: T.faint, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by book title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none font-medium"
            style={{ fontSize: '13px', color: T.ink }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="hover:opacity-60 transition-opacity">
              <X size={14} style={{ color: T.faint }} />
            </button>
          )}
        </div>

        {/* Empty */}
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center py-16 rounded-2xl border"
            style={{ backgroundColor: T.card, borderColor: T.border }}
          >
            <BookOpen size={44} style={{ color: T.faint }} />
            <p className="mt-3" style={{ fontSize: '14px', color: T.muted }}>
              {search ? `No results for "${search}"` : 'No loans found.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((loan) => {
              const meta    = STATUS_META[loan.return_status] ?? STATUS_META.none
              const Icon    = meta.icon
              const isOver  = loan.is_overdue && loan.return_status !== 'verified'
              const cover   = bookCover(loan)
              const title   = bookTitle(loan)
              const isActing = actingId === loan.id

              // Which actions are available?
              const canRequestReturn = loan.return_status === 'none'
              const canCancel        = loan.return_status === 'none'

              return (
                <div
                  key={loan.id}
                  className="rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
                  style={{ backgroundColor: T.card, borderColor: isOver ? T.red + '55' : T.border }}
                >
                  <div className="p-4">
                    {/* Top row: cover + info */}
                    <div className="flex gap-3">
                      {/* Cover thumbnail */}
                      <div
                        className="rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ width: '52px', height: '72px', backgroundColor: T.paperDeep }}
                      >
                        {cover ? (
                          <img src={cover} alt={title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen size={22} style={{ color: T.faint }} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Status badge + ID */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold"
                            style={{ fontSize: '10px', backgroundColor: meta.bg, color: meta.text }}
                          >
                            <Icon size={10} />
                            {meta.label}
                          </span>
                          <span className="font-mono" style={{ fontSize: '10px', color: T.faint }}>
                            #{loan.id}
                          </span>
                        </div>

                        <h3
                          className="font-bold leading-snug line-clamp-2 mb-2"
                          style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: T.ink }}
                        >
                          {title}
                        </h3>

                        {/* Date rows */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span style={{ fontSize: '11px', color: T.muted }}>Borrowed</span>
                            <span className="font-medium" style={{ fontSize: '11px', color: T.inkLight }}>
                              {format(new Date(loan.loan_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ fontSize: '11px', color: T.muted }}>Due Date</span>
                            <span
                              className="font-bold"
                              style={{ fontSize: '11px', color: isOver ? T.red : T.inkLight }}
                            >
                              {format(new Date(loan.due_date), 'MMM d, yyyy')}
                              {isOver && ` · ${loan.overdue_days}d overdue`}
                            </span>
                          </div>
                          {loan.return_date && (
                            <div className="flex justify-between">
                              <span style={{ fontSize: '11px', color: T.muted }}>Returned</span>
                              <span className="font-medium" style={{ fontSize: '11px', color: T.green }}>
                                {format(new Date(loan.return_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                          {loan.return_verified_date && loan.return_status === 'verified' && (
                            <div className="flex justify-between">
                              <span style={{ fontSize: '11px', color: T.muted }}>Verified</span>
                              <span className="font-medium" style={{ fontSize: '11px', color: T.green }}>
                                {format(new Date(loan.return_verified_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Overdue notice */}
                    {isOver && (
                      <div
                        className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 border-l-4"
                        style={{ backgroundColor: T.redFaint, borderColor: T.red }}
                      >
                        <AlertCircle size={13} style={{ color: T.red, flexShrink: 0 }} />
                        <p style={{ fontSize: '11px', color: T.red, fontWeight: 700 }}>
                          This book is {loan.overdue_days} day{loan.overdue_days !== 1 ? 's' : ''} overdue. Please return it as soon as possible.
                        </p>
                      </div>
                    )}

                    {/* Pending notice - only show if still pending */}
                    {loan.return_status === 'pending' && (
                      <div
                        className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 border-l-4"
                        style={{ backgroundColor: T.amberFaint, borderColor: T.amber }}
                      >
                        <Clock size={13} style={{ color: T.amber, flexShrink: 0 }} />
                        <p style={{ fontSize: '11px', color: T.amber, fontWeight: 700 }}>
                          Return request submitted — awaiting librarian verification.
                        </p>
                      </div>
                    )}

                    {/* Rejected notice */}
                    {loan.return_status === 'rejected' && (
                      <div
                        className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 border-l-4"
                        style={{ backgroundColor: T.redFaint, borderColor: T.red }}
                      >
                        <XCircle size={13} style={{ color: T.red, flexShrink: 0 }} />
                        <p style={{ fontSize: '11px', color: T.red, fontWeight: 700 }}>
                          Your return was rejected. Please bring the book to the library desk.
                        </p>
                      </div>
                    )}

                    {/* Verified notice - show that return was verified */}
                    {loan.return_status === 'verified' && (
                      <div
                        className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 border-l-4"
                        style={{ backgroundColor: T.greenFaint, borderColor: T.green }}
                      >
                        <CheckCircle size={13} style={{ color: T.green, flexShrink: 0 }} />
                        <p style={{ fontSize: '11px', color: T.green, fontWeight: 700 }}>
                          Your return has been verified. Thank you!
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {(canRequestReturn || canCancel) && (
                      <div className="flex gap-2 mt-3">
                        {canRequestReturn && (
                          <button
                            onClick={() => { setConfirmId(loan.id); setConfirmType('return') }}
                            disabled={isActing}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: T.green, color: '#fff', fontSize: '12px' }}
                          >
                            {isActing && confirmType === 'return' ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <RotateCcw size={13} />
                                Request Return
                              </>
                            )}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => { setConfirmId(loan.id); setConfirmType('cancel') }}
                            disabled={isActing}
                            className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-bold border transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: T.card, color: T.muted, borderColor: T.border, fontSize: '12px' }}
                          >
                            {isActing && confirmType === 'cancel' ? (
                              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: T.muted }} />
                            ) : (
                              <>
                                <Ban size={13} />
                                Cancel
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Confirm Dialog ── */}
      {confirmId !== null && confirmType !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(28,16,8,0.55)' }}
          onClick={() => { setConfirmId(null); setConfirmType(null) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
            style={{ backgroundColor: T.card }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: confirmType === 'return' ? T.greenFaint : T.redFaint,
              }}
            >
              {confirmType === 'return'
                ? <RotateCcw size={22} style={{ color: T.green }} />
                : <Ban size={22} style={{ color: T.red }} />
              }
            </div>

            <h2
              className="font-bold text-center mb-1"
              style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: T.ink }}
            >
              {confirmType === 'return' ? 'Request Return?' : 'Cancel Pickup?'}
            </h2>
            <p className="text-center mb-6" style={{ fontSize: '13px', color: T.muted }}>
              {confirmType === 'return'
                ? 'This will notify the librarian that you are returning this book. Please bring it to the library.'
                : 'This will cancel your loan pickup. The book will be released back to the shelf.'
              }
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmId(null); setConfirmType(null) }}
                className="flex-1 py-2.5 rounded-xl font-bold border transition-opacity"
                style={{ backgroundColor: T.paperDark, color: T.muted, borderColor: T.border, fontSize: '13px' }}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={actingId !== null}
                className="flex-1 py-2.5 rounded-xl font-bold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: confirmType === 'return' ? T.green : T.red,
                  fontSize: '13px',
                }}
              >
                {actingId !== null ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : confirmType === 'return' ? 'Yes, Request' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
