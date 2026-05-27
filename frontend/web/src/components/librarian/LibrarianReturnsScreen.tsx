// frontend/web/src/components/librarian/LibrarianReturnsScreen.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLoans, verifyReturn } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { Loan } from '@shared/types/circulation'
import { 
  Search, X, CheckCircle, XCircle, 
  Loader2, Calendar, User as UserIcon, BookOpen, Clock
} from 'lucide-react'
import { format } from 'date-fns'

type LoanWithDetails = Loan & {
  member_name?: string
  book_title?: string
  book_cover?: string | null
}

export default function LibrarianReturnsScreen() {
  const [search, setSearch] = useState('')
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null)
  const [returnAction, setReturnAction] = useState<'verified' | 'rejected' | null>(null)
  const [returnNotes, setReturnNotes] = useState('')
  const [acting, setActing] = useState<number | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query
  const { data: loansResponse, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: getLoans,
  })
  const loans = extractData<LoanWithDetails[]>(loansResponse) || []

  // Filter only loans with pending return requests
  const pendingReturns = loans.filter(loan => 
    loan.return_status === 'pending' &&
    (search === '' || 
      loan.member_name?.toLowerCase().includes(search.toLowerCase()) ||
      loan.book_title?.toLowerCase().includes(search.toLowerCase()))
  )

  // Mutation - verifyReturn expects 2 arguments: id and status
  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      verifyReturn(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Return request processed successfully' })
      setReturnModalOpen(false)
      setSelectedLoan(null)
      setReturnNotes('')
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to process return', variant: 'destructive' })
    },
    onSettled: () => setActing(null),
  })

  const openReturnModal = (loan: LoanWithDetails, action: 'verified' | 'rejected') => {
    setSelectedLoan(loan)
    setReturnAction(action)
    setReturnNotes('')
    setReturnModalOpen(true)
  }

  const handleVerifyConfirm = () => {
    if (selectedLoan && returnAction) {
      setActing(selectedLoan.id)
      verifyMutation.mutate({ id: selectedLoan.id, status: returnAction })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-4 md:p-6 pb-0">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-[#1F150C] font-serif">Return Verification</h1>
            <p className="text-sm font-medium text-[#706251] mt-1">
              Process member book returns ({pendingReturns.length} pending)
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 md:px-6 mb-6">
          <div className="flex items-center bg-white border border-[#DCD4C4] rounded-lg px-3 py-2 max-w-md">
            <Search size={16} className="text-[#A1927F] mr-2" />
            <input
              type="text"
              placeholder="Search by member or book title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#281711] placeholder-[#A1927F] outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-[#A1927F]" />
              </button>
            )}
          </div>
        </div>

        {/* Pending Returns List */}
        {pendingReturns.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EFE9CE] mx-4 md:mx-6 rounded-lg">
            <CheckCircle size={48} className="mx-auto text-[#A1927F] mb-3" />
            <p className="text-[#706251]">
              {search ? `No results for "${search}"` : 'No pending return requests.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-6 pt-0">
            {pendingReturns.map((loan) => {
              const isActing = acting === loan.id

              return (
                <div key={loan.id} className="bg-white border border-[#EFE9CE] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-5">
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-[#FFFBEB] flex items-center justify-center">
                          <Clock size={14} className="text-[#B45309]" />
                        </div>
                        <span className="text-xs font-bold text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded-full">
                          PENDING RETURN
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#A1927F]">#{loan.id}</span>
                    </div>

                    {/* Book and Member Info */}
                    <div className="mb-4">
                      <h3 className="font-bold text-[#1F150C] text-base font-baskerville mb-2">
                        {loan.book_title}
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <UserIcon size={14} className="text-[#A1927F]" />
                          <span className="text-[#706251]">Member:</span>
                          <span className="font-semibold text-[#2D1F10]">{loan.member_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={14} className="text-[#A1927F]" />
                          <span className="text-[#706251]">Due Date:</span>
                          <span className={`font-semibold ${loan.is_overdue ? 'text-[#C53030]' : 'text-[#2D1F10]'}`}>
                            {format(new Date(loan.due_date), 'MMM d, yyyy')}
                            {loan.is_overdue && ` (${loan.overdue_days} days overdue)`}
                          </span>
                        </div>
                        {loan.return_requested_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock size={14} className="text-[#A1927F]" />
                            <span className="text-[#706251]">Requested:</span>
                            <span className="text-[#2D1F10]">
                              {format(new Date(loan.return_requested_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {loan.notes && (
                          <div className="mt-2 p-2 bg-[#F7F3E3] border-l-2 border-[#706251] rounded">
                            <p className="text-xs text-[#706251] italic">Notes: {loan.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-3 border-t border-[#EFE9CE]">
                      <button
                        onClick={() => openReturnModal(loan, 'verified')}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#3D5A45] text-white py-2 text-sm font-semibold rounded-md hover:bg-[#2E4A35] transition-colors disabled:opacity-60"
                      >
                        <CheckCircle size={14} />
                        Verify Return
                      </button>
                      <button
                        onClick={() => openReturnModal(loan, 'rejected')}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#F5C2BC] text-[#C53030] py-2 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors disabled:opacity-60"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Verify/Reject Modal */}
      {returnModalOpen && selectedLoan && returnAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden border border-[#DCD4C4]">
            <div className="bg-[#1F150C] px-5 py-3.5 flex items-center gap-2">
              {returnAction === 'verified' ? (
                <CheckCircle size={16} className="text-[#3D5A45]" />
              ) : (
                <XCircle size={16} className="text-[#8A2B2B]" />
              )}
              <h3 className="text-[#FFC85C] text-sm font-bold font-serif">
                {returnAction === 'verified' ? 'Verify Return' : 'Reject Return'}
              </h3>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-[#706251] mb-4">
                {returnAction === 'verified' 
                  ? 'Confirm the book has been physically received and is in good condition.'
                  : 'Reject this return request. The member will be notified.'
                }
              </p>
              <label className="block text-[11px] font-bold text-[#706251] mb-1.5">Notes (optional)</label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#F7F2E6] border border-[#DCD4C4] text-sm text-[#2D1F10] rounded focus:outline-none focus:border-[#C59568] resize-none"
                placeholder="Additional notes for the member…"
              />
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    setReturnModalOpen(false)
                    setSelectedLoan(null)
                    setReturnAction(null)
                    setReturnNotes('')
                  }}
                  className="flex-1 border border-[#DCD4C4] py-2 text-sm font-semibold text-[#706251] rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyConfirm}
                  disabled={verifyMutation.isPending}
                  className={`flex-1 py-2 text-sm font-semibold rounded text-white ${
                    returnAction === 'verified' 
                      ? 'bg-[#3D5A45] hover:bg-[#2E4A35]' 
                      : 'bg-[#8A2B2B] hover:bg-[#6E1E1E]'
                  } disabled:opacity-60`}
                >
                  {verifyMutation.isPending ? 'Processing...' : (returnAction === 'verified' ? 'Verify' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}