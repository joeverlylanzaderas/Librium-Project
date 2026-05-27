// frontend/web/src/components/librarian/LibrarianLoansScreen.tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { getLoans, createLoan, verifyReturn, getBooks, getUsers } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { Loan } from '@shared/types/circulation'
import { 
  Search, Plus, X, ChevronDown, CheckCircle, XCircle, AlertCircle,
  Clock, BookOpen, Trash2, Loader2
} from 'lucide-react'
import { format } from 'date-fns'

// Types
type LoanWithDetails = Loan & {
  member_name?: string
  book_title?: string
  book_category?: string | null
  semester_label?: string | null
  verified_by_name?: string | null
  borrow_request_id?: number | null
}

type BookItem = { id: number; title: string; author_name?: string; available?: boolean }
type UserItem = { id: number; email: string; full_name?: string; role?: string }

const STATUS_FILTERS = ['all', 'none', 'pending', 'verified', 'rejected', 'disputed'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const FILTER_LABELS: Record<string, string> = {
  all: 'All', none: 'Active', pending: 'Pending Return',
  verified: 'Returned', rejected: 'Rejected', disputed: 'Disputed',
}

const RETURN_STATUS_META: Record<string, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
  none:     { color: '#0369A1', bg: '#E0F2FE', icon: BookOpen, label: 'Active' },
  pending:  { color: '#B45309', bg: '#FFFBEB', icon: Clock, label: 'Pending Return' },
  verified: { color: '#3D5A45', bg: '#E6F4EA', icon: CheckCircle, label: 'Returned' },
  rejected: { color: '#8A2B2B', bg: '#FCE8E6', icon: XCircle, label: 'Return Rejected' },
  disputed: { color: '#6D28D9', bg: '#EDE9FE', icon: AlertCircle, label: 'Disputed' },
}

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  member:    { label: 'MEMBER', color: '#0369A1', bg: '#E0F2FE' },
  librarian: { label: 'LIBRARIAN', color: '#B45309', bg: '#FFFBEB' },
  admin:     { label: 'ADMIN', color: '#8A2B2B', bg: '#FCE8E6' },
}

export default function LibrarianLoansScreen() {
  const { showConfirm } = useAlert()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null)
  const [verifyAction, setVerifyAction] = useState<'verified' | 'rejected' | 'disputed' | null>(null)
  const [verifyNotes, setVerifyNotes] = useState('')
  const [acting, setActing] = useState<number | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: loansResponse, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: getLoans,
  })
  const loans = extractData<LoanWithDetails[]>(loansResponse) || []

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      verifyReturn(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Return request processed' })
      setVerifyModalOpen(false)
      setSelectedLoan(null)
      setVerifyNotes('')
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Action failed', variant: 'destructive' })
    },
    onSettled: () => setActing(null),
  })

  const handleDelete = (loan: LoanWithDetails) => {
    showConfirm(
      'Confirm Deletion',
      `Delete loan #${loan.id} for "${loan.book_title}"? The book will become available again.`,
      () => {
        setActing(loan.id)
        toast({ title: 'Info', description: 'Delete functionality coming soon', variant: 'default' })
        setActing(null)
      },
      { confirmText: 'Delete', cancelText: 'Cancel', confirmVariant: 'danger' }
    )
  }

  const filteredLoans = useMemo(() => {
    let result = loans
    if (filter !== 'all') {
      result = result.filter(l => l.return_status === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.member_name?.toLowerCase().includes(q) ||
        l.book_title?.toLowerCase().includes(q)
      )
    }
    return [...result].sort((a, b) => {
      if (a.return_status === 'pending' && b.return_status !== 'pending') return -1
      if (b.return_status === 'pending' && a.return_status !== 'pending') return 1
      return new Date(b.loan_date).getTime() - new Date(a.loan_date).getTime()
    })
  }, [loans, filter, search])

  const pendingCount = loans.filter(l => l.return_status === 'pending').length
  const overdueCount = loans.filter(l => l.is_overdue && l.return_status !== 'verified').length

  const openVerifyModal = (loan: LoanWithDetails, action: 'verified' | 'rejected' | 'disputed') => {
    setSelectedLoan(loan)
    setVerifyAction(action)
    setVerifyNotes('')
    setVerifyModalOpen(true)
  }

  const handleVerifyConfirm = () => {
    if (selectedLoan && verifyAction) {
      setActing(selectedLoan.id)
      verifyMutation.mutate({ id: selectedLoan.id, status: verifyAction })
    }
  }

  const pendingCountBadge = pendingCount > 0 ? ` (${pendingCount})` : ''

  return (
    <div className="bg-[#FBF5DD] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="bg-white border-b border-[#DCD4C4] p-3 space-y-2 sticky top-0 z-10">
          {(pendingCount > 0 || overdueCount > 0) && (
            <div className="flex gap-2 flex-wrap">
              {pendingCount > 0 && (
                <button
                  onClick={() => setFilter('pending')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-[#FFFBEB] border-[#FCD34D]"
                >
                  <Clock size={11} className="text-[#B45309]" />
                  <span className="text-[11px] font-bold text-[#B45309]">
                    {pendingCount} pending return{pendingCount > 1 ? 's' : ''}
                  </span>
                </button>
              )}
              {overdueCount > 0 && (
                <button
                  onClick={() => setFilter('none')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-[#FCE8E6] border-[#F5C2BC]"
                >
                  <AlertCircle size={11} className="text-[#8A2B2B]" />
                  <span className="text-[11px] font-bold text-[#8A2B2B]">{overdueCount} overdue</span>
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-[#F7F2E6] border border-[#DCD4C4] rounded px-3 py-1.5">
              <Search size={13} className="text-[#706251] mr-2" />
              <input
                type="text"
                placeholder="Search member or book…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#2D1F10] placeholder-[#A1927F] outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={13} className="text-[#706251]" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIssueModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#1F150C] text-[#FFC85C] px-3 py-1.5 rounded text-xs font-bold"
            >
              <Plus size={13} />
              Issue Loan
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-[#1F150C] border-[#1F150C] text-[#FFC85C]'
                    : 'bg-[#FBF5DD] border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
                }`}
              >
                {FILTER_LABELS[f]}{f === 'pending' ? pendingCountBadge : ''}
              </button>
            ))}
          </div>
        </div>

        {!isLoading && (
          <div className="px-4 py-1.5">
            <p className="text-[11px] font-semibold text-[#706251]">
              {filteredLoans.length} {filteredLoans.length === 1 ? 'record' : 'records'}
              {search && ` for "${search}"`}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EFE9CE] mx-4 rounded">
            <p className="text-[#706251]">
              {search ? `No results for "${search}"` : `No ${FILTER_LABELS[filter].toLowerCase()} loans.`}
            </p>
          </div>
        ) : (
          <div className="p-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1F150C] rounded-t-lg">
                <tr className="text-left">
                  <th className="px-3 py-2 text-[10px] font-extrabold text-[#FFC85C] uppercase tracking-wider w-[8%]">#</th>
                  <th className="px-3 py-2 text-[10px] font-extrabold text-[#FFC85C] uppercase tracking-wider w-[20%]">Member</th>
                  <th className="px-3 py-2 text-[10px] font-extrabold text-[#FFC85C] uppercase tracking-wider w-[25%]">Book</th>
                  <th className="px-3 py-2 text-[10px] font-extrabold text-[#FFC85C] uppercase tracking-wider w-[12%] hidden md:table-cell">Loan Date</th>
                  <th className="px-3 py-2 text-[10px] font-extrabold text-[#FFC85C] uppercase tracking-wider w-[12%] hidden md:table-cell">Due Date</th>
                  <th className="px-3 py-2 text-[10px] font-extrabold text-[#FFC85C] uppercase tracking-wider w-[12%]">Status</th>
                  <th className="px-3 py-2 text-[10px] font-extrabold text-[#FFC85C] uppercase tracking-wider text-right w-[21%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan, idx) => {
                  const meta = RETURN_STATUS_META[loan.return_status] || RETURN_STATUS_META.none
                  const Icon = meta.icon
                  const isActing = acting === loan.id
                  const isOverdue = loan.is_overdue && loan.return_status !== 'verified'
                  const isEven = idx % 2 === 0

                  return (
                    <tr
                      key={loan.id}
                      className={`border-b border-[#EFE9CE] ${isEven ? 'bg-white' : 'bg-[#F7F2E6]'} ${isOverdue ? 'border-l-2 border-l-[#8A2B2B]' : ''}`}
                    >
                      <td className="px-3 py-3 text-[11px] font-mono text-[#706251]">#{loan.id}</td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-[13px] text-[#2D1F10] truncate max-w-[200px]">{loan.member_name}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[12px] text-[#706251] truncate max-w-[250px]">{loan.book_title}</p>
                        {isOverdue && (
                          <p className="text-[9px] font-bold text-[#8A2B2B] mt-0.5">{loan.overdue_days}d overdue</p>
                        )}
                        {loan.return_status === 'pending' && loan.return_requested_date && (
                          <p className="text-[9px] font-bold text-[#B45309] mt-0.5">
                            req: {format(new Date(loan.return_requested_date), 'MMM d')}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[11px] font-mono text-[#706251] hidden md:table-cell">
                        {format(new Date(loan.loan_date), 'MMM d, yyyy')}
                      </td>
                      <td className={`px-3 py-3 text-[11px] font-mono hidden md:table-cell ${isOverdue ? 'text-[#8A2B2B] font-bold' : 'text-[#706251]'}`}>
                        {format(new Date(loan.due_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-3 py-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full`} style={{ backgroundColor: meta.bg }}>
                          <Icon size={10} style={{ color: meta.color }} />
                          <span className="text-[9px] font-extrabold" style={{ color: meta.color }}>{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isActing ? (
                          <Loader2 size={14} className="animate-spin text-[#412D15] mx-auto" />
                        ) : loan.return_status === 'pending' ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => openVerifyModal(loan, 'verified')}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-[#E6F4EA] border border-[#3D5A45] text-[10px] font-bold text-[#3D5A45]"
                            >
                              <CheckCircle size={10} />
                              Verify
                            </button>
                            <button
                              onClick={() => openVerifyModal(loan, 'rejected')}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-[#FCE8E6] border border-[#8A2B2B] text-[10px] font-bold text-[#8A2B2B]"
                            >
                              <XCircle size={10} />
                              Reject
                            </button>
                            <button
                              onClick={() => openVerifyModal(loan, 'disputed')}
                              className="flex items-center justify-center px-2 py-1 rounded bg-[#EDE9FE] border border-[#6D28D9]"
                              title="Dispute"
                            >
                              <AlertCircle size={10} className="text-[#6D28D9]" />
                            </button>
                          </div>
                        ) : (loan.return_status === 'none' || loan.return_status === 'rejected') ? (
                          <button
                            onClick={() => handleDelete(loan)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-[#F7F2E6] border border-[#DCD4C4] text-[10px] font-bold text-[#706251]"
                          >
                            <Trash2 size={10} />
                            Delete
                          </button>
                        ) : (
                          <p className="text-[11px] font-mono text-[#706251]">
                            {loan.return_verified_date
                              ? format(new Date(loan.return_verified_date), 'MMM d')
                              : loan.return_date
                              ? format(new Date(loan.return_date), 'MMM d')
                              : '—'}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue Loan Modal */}
      {issueModalOpen && (
        <IssueLoanModal
          visible={issueModalOpen}
          onClose={() => setIssueModalOpen(false)}
          onIssued={() => {
            queryClient.invalidateQueries({ queryKey: ['loans'] })
            setIssueModalOpen(false)
          }}
        />
      )}

      {/* Verify Modal */}
      {verifyModalOpen && selectedLoan && verifyAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden border border-[#DCD4C4]">
            <div className="bg-[#1F150C] px-5 py-3.5 flex items-center gap-2">
              {verifyAction === 'verified' && <CheckCircle size={16} className="text-[#3D5A45]" />}
              {verifyAction === 'rejected' && <XCircle size={16} className="text-[#8A2B2B]" />}
              {verifyAction === 'disputed' && <AlertCircle size={16} className="text-[#6D28D9]" />}
              <h3 className="text-[#FFC85C] text-sm font-bold font-serif">
                {verifyAction === 'verified' && 'Verify Return'}
                {verifyAction === 'rejected' && 'Reject Return'}
                {verifyAction === 'disputed' && 'Mark Disputed'}
              </h3>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-[#706251] mb-4">
                {verifyAction === 'verified' && 'Confirm the book has been physically received.'}
                {verifyAction === 'rejected' && 'The return request will be sent back to the member.'}
                {verifyAction === 'disputed' && 'Flag this return for further investigation.'}
              </p>
              <label className="block text-[11px] font-bold text-[#706251] mb-1.5">Notes (optional)</label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#F7F2E6] border border-[#DCD4C4] text-sm text-[#2D1F10] rounded focus:outline-none focus:border-[#C59568] resize-none"
                placeholder="Additional notes for the member…"
              />
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    setVerifyModalOpen(false)
                    setSelectedLoan(null)
                    setVerifyAction(null)
                    setVerifyNotes('')
                  }}
                  className="flex-1 border border-[#DCD4C4] py-2 text-sm font-semibold text-[#706251] rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyConfirm}
                  disabled={verifyMutation.isPending}
                  className={`flex-1 py-2 text-sm font-semibold rounded text-white ${
                    verifyAction === 'verified' ? 'bg-[#3D5A45] hover:bg-[#2E4A35]' :
                    verifyAction === 'rejected' ? 'bg-[#8A2B2B] hover:bg-[#6E1E1E]' :
                    'bg-[#6D28D9] hover:bg-[#5B21B6]'
                  } disabled:opacity-60`}
                >
                  {verifyMutation.isPending ? 'Processing...' : verifyAction?.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Issue Loan Modal Component
function IssueLoanModal({ visible, onClose, onIssued }: { visible: boolean; onClose: () => void; onIssued: () => void }) {
  const [memberSearch, setMemberSearch] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)
  const [bookPickerOpen, setBookPickerOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<UserItem | null>(null)
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: booksResponse } = useQuery({
    queryKey: ['books-list'],
    queryFn: getBooks,
    enabled: visible,
  })
  const books = extractData<BookItem[]>(booksResponse) || []

  const { data: usersResponse } = useQuery({
    queryKey: ['users-list'],
    queryFn: getUsers,
    enabled: visible,
  })
  const users = extractData<UserItem[]>(usersResponse) || []

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const filteredMembers = users.filter(u =>
    u.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const filteredBooks = books.filter(b =>
    b.title?.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.author_name?.toLowerCase().includes(bookSearch.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!selectedMember || !selectedBook) {
      toast({ title: 'Error', description: 'Select both a member and a book', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await createLoan({ member: selectedMember.id, book: selectedBook.id })
      toast({ title: 'Success', description: 'Loan issued successfully' })
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      onIssued()
      reset()
    } catch (error: any) {
      const msg = error?.response?.data?.book?.[0] || error?.response?.data?.member?.[0] || 'Could not issue loan'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setSelectedMember(null)
    setSelectedBook(null)
    setMemberSearch('')
    setBookSearch('')
    setMemberPickerOpen(false)
    setBookPickerOpen(false)
  }

  if (!visible) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#FFFDF1] border border-[#412D15] w-full max-w-md rounded-lg overflow-hidden">
          <div className="bg-[#1F150C] px-5 py-3.5 flex items-center gap-2">
            <BookOpen size={15} className="text-[#FFC85C]" />
            <h3 className="flex-1 text-[#FFC85C] text-sm font-bold font-serif">Front Desk Borrow Issuance</h3>
            <button onClick={() => { onClose(); reset() }}>
              <X size={17} className="text-[#EFE9CE]" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#706251] mb-1.5 uppercase tracking-wide">Member *</label>
              <button
                onClick={() => setMemberPickerOpen(true)}
                className={`w-full flex items-center justify-between border p-3 rounded ${selectedMember ? 'border-[#137333] bg-[#F0FAF3]' : 'border-[#DCD4C4] bg-white'}`}
              >
                <span className={`text-sm ${!selectedMember ? 'text-[#A1927F]' : 'text-[#2D1F10]'}`}>
                  {selectedMember ? `${selectedMember.full_name || selectedMember.email} (${selectedMember.email})` : 'Tap to search member…'}
                </span>
                <ChevronDown size={14} className="text-[#A1927F]" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#706251] mb-1.5 uppercase tracking-wide">Book *</label>
              <button
                onClick={() => setBookPickerOpen(true)}
                className={`w-full flex items-center justify-between border p-3 rounded ${selectedBook ? 'border-[#137333] bg-[#F0FAF3]' : 'border-[#DCD4C4] bg-white'}`}
              >
                <span className={`text-sm ${!selectedBook ? 'text-[#A1927F]' : 'text-[#2D1F10]'}`}>
                  {selectedBook ? selectedBook.title : 'Tap to search book…'}
                </span>
                <ChevronDown size={14} className="text-[#A1927F]" />
              </button>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button onClick={() => { onClose(); reset() }} className="flex-1 border border-[#DCD4C4] py-2 text-sm font-semibold text-[#706251] rounded">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedMember || !selectedBook || saving}
                className="flex-1 bg-[#1F150C] text-white py-2 text-sm font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={13} />}
                Issue Loan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Member Picker Modal */}
      {memberPickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#412D15] w-full max-w-md max-h-[70vh] flex flex-col rounded-lg overflow-hidden">
            <div className="bg-[#1F150C] px-4 py-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[#FFC85C] text-sm font-bold font-serif">Select Member</h4>
                <button onClick={() => setMemberPickerOpen(false)}><X size={16} className="text-[#EFE9CE]" /></button>
              </div>
            </div>
            <div className="p-3 border-b border-[#DCD4C4]">
              <div className="flex items-center gap-2 border border-[#DCD4C4] rounded px-3 py-1.5 bg-[#F7F2E6]">
                <Search size={13} className="text-[#A1927F]" />
                <input
                  type="text"
                  placeholder="Type to search…"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#2D1F10] outline-none"
                  autoFocus
                />
                {memberSearch && (
                  <button onClick={() => setMemberSearch('')}><X size={13} className="text-[#A1927F]" /></button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="p-5 text-center text-xs text-[#A1927F] italic">No matching members found</div>
              ) : (
                filteredMembers.map((user) => {
                  const roleMeta = ROLE_META[user.role as keyof typeof ROLE_META] || ROLE_META.member
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedMember(user)
                        setMemberPickerOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 border-b border-[#EAE7DF] hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#2D1F10]">{user.full_name || user.email}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${roleMeta.bg}`} style={{ color: roleMeta.color }}>
                          {roleMeta.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#706251] mt-0.5">{user.email}</p>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Book Picker Modal */}
      {bookPickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#412D15] w-full max-w-md max-h-[70vh] flex flex-col rounded-lg overflow-hidden">
            <div className="bg-[#1F150C] px-4 py-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[#FFC85C] text-sm font-bold font-serif">Select Book</h4>
                <button onClick={() => setBookPickerOpen(false)}><X size={16} className="text-[#EFE9CE]" /></button>
              </div>
            </div>
            <div className="p-3 border-b border-[#DCD4C4]">
              <div className="flex items-center gap-2 border border-[#DCD4C4] rounded px-3 py-1.5 bg-[#F7F2E6]">
                <Search size={13} className="text-[#A1927F]" />
                <input
                  type="text"
                  placeholder="Type to search…"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#2D1F10] outline-none"
                  autoFocus
                />
                {bookSearch && (
                  <button onClick={() => setBookSearch('')}><X size={13} className="text-[#A1927F]" /></button>
                )}
              </div>
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
                        setSelectedBook(book)
                        setBookPickerOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-[#EAE7DF] hover:bg-gray-50 ${isUnavailable ? 'bg-[#F7F4EB]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#2D1F10]">{book.title}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${isUnavailable ? 'bg-[#FCE8E6] text-[#8A2B2B]' : 'bg-[#E6F4EA] text-[#3D5A45]'}`}>
                          {isUnavailable ? 'ON LOAN' : 'AVAILABLE'}
                        </span>
                      </div>
                      {book.author_name && <p className="text-xs text-[#706251] mt-0.5">by {book.author_name}</p>}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}