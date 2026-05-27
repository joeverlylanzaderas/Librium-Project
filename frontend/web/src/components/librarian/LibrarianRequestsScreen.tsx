// frontend/web/src/components/librarian/LibrarianRequestsScreen.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { getBorrowRequests, approveBorrowRequest, rejectBorrowRequest } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { BorrowRequest } from '@shared/types/circulation'
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

type BorrowRequestWithDetails = BorrowRequest & {
  book_title?: string
  member_name?: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle }> = {
  pending:   { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D', icon: Clock },
  approved:  { bg: '#E6F4EA', text: '#137333', border: '#B7DFC4', icon: CheckCircle },
  rejected:  { bg: '#FCE8E6', text: '#C53030', border: '#F5C2BC', icon: XCircle },
  cancelled: { bg: '#F1EDE4', text: '#706251', border: '#DCD4C4', icon: AlertCircle },
}

const FILTERS = ['pending', 'approved', 'rejected', 'cancelled'] as const
type Filter = typeof FILTERS[number]

export default function LibrarianRequestsScreen() {
  const { showConfirm } = useAlert()
  const [filter, setFilter] = useState<Filter>('pending')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query - no manual refetch needed
  const { data: requestsResponse, isLoading } = useQuery({
    queryKey: ['borrow-requests', filter],
    queryFn: () => getBorrowRequests(filter),
  })
  const requests = extractData<BorrowRequestWithDetails[]>(requestsResponse) || []

  // Mutations - just invalidate the query, no refetch needed
  const approveMutation = useMutation({
    mutationFn: approveBorrowRequest,
    onSuccess: () => {
      // Invalidate both the current filter and dashboard
      queryClient.invalidateQueries({ queryKey: ['borrow-requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Borrow request approved' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to approve request', variant: 'destructive' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectBorrowRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrow-requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Borrow request rejected' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to reject request', variant: 'destructive' })
    },
  })

  const handleApprove = (id: number) => {
    showConfirm(
      'Confirm Handover',
      'Confirm the book was handed to the member?',
      () => approveMutation.mutate(id),
      { confirmText: 'Confirm', cancelText: 'Cancel', confirmVariant: 'success' }
    )
  }

  const handleReject = (id: number) => {
    showConfirm(
      'Reject Request',
      'Reject this borrow request?',
      () => rejectMutation.mutate(id),
      { confirmText: 'Reject', cancelText: 'Cancel', confirmVariant: 'danger' }
    )
  }

  const getStatusBadge = (status: string) => {
    const style = STATUS_COLORS[status] || STATUS_COLORS.pending
    const Icon = style.icon
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${style.bg}`} style={{ borderColor: style.border }}>
        <Icon size={10} style={{ color: style.text }} />
        <span className="text-[9px] font-extrabold" style={{ color: style.text }}>{status.toUpperCase()}</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  return (
    <div className="bg-[#FBF5DD] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Filter Tabs */}
        <div className="bg-[#1F150C] border-b border-[#412D15] sticky top-0 z-10">
          <div className="flex gap-1 p-3 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-semibold rounded transition-colors whitespace-nowrap ${
                  filter === f
                    ? 'bg-[#412D15] border border-[#FFC85C] text-[#FBF5DD]'
                    : 'text-[#FBF5DD] hover:bg-[#412D15]/50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-[#EFE9CE]">
            <h2 className="text-xl font-bold text-[#1F150C] font-baskerville">
              {filter.charAt(0).toUpperCase() + filter.slice(1)} Requests
            </h2>
            <div className="bg-[#412D15] px-2 py-0.5 rounded-full">
              <span className="text-xs font-bold text-[#FBF5DD]">{requests.length}</span>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#EFE9CE] rounded-lg">
              <p className="text-[#706251]">No {filter} requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-white border border-[#EFE9CE] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-[#1F150C] text-base font-baskerville mb-2">
                          {request.book?.title || request.book_title}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-[#706251]">
                            Member: <span className="font-semibold text-[#2D1F10]">
                              {request.member?.full_name || request.member_name}
                            </span>
                          </p>
                          <p className="text-sm text-[#706251]">
                            Requested: {format(new Date(request.request_date), 'MMM d, yyyy')}
                          </p>
                          {request.notes && (
                            <div className="mt-2 p-2 bg-[#F7F3E3] border-l-2 border-[#706251] rounded">
                              <p className="text-xs text-[#706251] italic">Notes: {request.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-3 mt-5 pt-4 border-t border-[#EFE9CE]">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={approveMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[#3D5A45] text-white py-2 text-sm font-semibold rounded-md hover:bg-[#2E4A35] transition-colors disabled:opacity-60"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={rejectMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#F5C2BC] text-[#C53030] py-2 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}