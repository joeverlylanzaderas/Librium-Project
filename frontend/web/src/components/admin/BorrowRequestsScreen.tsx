// frontend/web/src/components/admin/BorrowRequestsScreen.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { getBorrowRequests, approveBorrowRequest, rejectBorrowRequest } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { BorrowRequest } from '@shared/types/circulation'
import { Check, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  approved: { bg: '#E6F4EA', text: '#137333' },
  rejected: { bg: '#FCE8E6', text: '#C53030' },
}

const FILTERS = ['pending', 'approved', 'rejected'] as const
type Filter = typeof FILTERS[number]

// Extended type with flattened fields
type BorrowRequestWithDetails = BorrowRequest & {
  book_title?: string
  member_name?: string
}

export default function BorrowRequestsScreen() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [actingId, setActingId] = useState<number | null>(null)
  const { showConfirm } = useAlert()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query with real-time updates
  const { data: requestsResponse, isLoading, refetch } = useQuery({
    queryKey: ['borrow-requests', filter],
    queryFn: () => getBorrowRequests(filter),
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
  const requests = extractData<BorrowRequestWithDetails[]>(requestsResponse) || []

  // Auto-refresh on mount and filter change
  useEffect(() => {
    refetch()
  }, [filter, refetch])

  // Approve mutation with optimistic update
  const approveMutation = useMutation({
    mutationFn: approveBorrowRequest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['borrow-requests', filter] })
      const previousRequests = queryClient.getQueryData(['borrow-requests', filter])
      
      // Optimistically update cache
      queryClient.setQueryData(['borrow-requests', filter], (old: any) => {
        const requests = extractData<BorrowRequestWithDetails[]>(old) || []
        const updatedRequests = requests.map(req =>
          req.id === id ? { ...req, status: 'approved' } : req
        )
        return { ...old, data: { results: updatedRequests } }
      })
      
      return { previousRequests }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrow-requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Borrow request approved' })
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(['borrow-requests', filter], context.previousRequests)
      }
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to approve request', variant: 'destructive' })
    },
    onSettled: () => {
      setActingId(null)
    },
  })

  // Reject mutation with optimistic update
  const rejectMutation = useMutation({
    mutationFn: rejectBorrowRequest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['borrow-requests', filter] })
      const previousRequests = queryClient.getQueryData(['borrow-requests', filter])
      
      // Optimistically update cache
      queryClient.setQueryData(['borrow-requests', filter], (old: any) => {
        const requests = extractData<BorrowRequestWithDetails[]>(old) || []
        const updatedRequests = requests.map(req =>
          req.id === id ? { ...req, status: 'rejected' } : req
        )
        return { ...old, data: { results: updatedRequests } }
      })
      
      return { previousRequests }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrow-requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Borrow request rejected' })
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(['borrow-requests', filter], context.previousRequests)
      }
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to reject request', variant: 'destructive' })
    },
    onSettled: () => {
      setActingId(null)
    },
  })

  const handleApprove = (id: number) => {
    showConfirm(
      'Confirm Handover',
      'Confirm the book was handed to the member?',
      () => {
        setActingId(id)
        approveMutation.mutate(id)
      },
      { confirmText: 'Confirm', cancelText: 'Cancel', confirmVariant: 'success' }
    )
  }

  const handleReject = (id: number) => {
    showConfirm(
      'Reject Request',
      'Reject this borrow request?',
      () => {
        setActingId(id)
        rejectMutation.mutate(id)
      },
      { confirmText: 'Reject', cancelText: 'Cancel', confirmVariant: 'danger' }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#281711]"></div>
      </div>
    )
  }

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1F150C] font-serif">Borrow Requests</h1>
          <p className="text-sm font-medium text-[#706251] mt-1">Manage member borrow requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-[#1F150C] border-b border-[#412D15] mb-6">
          <div className="flex gap-1 p-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
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

        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-[#EFE9CE]">
          <h2 className="text-xl font-bold text-[#1F150C] font-baskerville">
            {filter.charAt(0).toUpperCase() + filter.slice(1)} Requests
          </h2>
          <div className="bg-[#412D15] px-2 py-0.5">
            <span className="text-xs font-bold text-[#FBF5DD]">{requests.length}</span>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#706251]">No {filter} requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {requests.map((request) => {
              const statusStyle = STATUS_COLORS[request.status] || STATUS_COLORS.pending
              const isActing = actingId === request.id
              const bookTitle = request.book?.title || request.book_title
              const memberName = request.member?.full_name || request.member_name

              return (
                <div key={request.id} className="bg-white border border-[#EFE9CE] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-[#1F150C] text-base font-baskerville">
                          {bookTitle || 'Unknown Book'}
                        </h3>
                        <p className="text-sm text-[#706251] mt-1">
                          Member: {memberName || `ID: ${request.member?.id || request.member}`}
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
                      <div className={`px-2 py-1 text-xs font-bold border rounded ${statusStyle.bg} ${statusStyle.text}`}>
                        {request.status.toUpperCase()}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-[#EFE9CE]">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[#3D5A45] text-white py-2 text-sm font-semibold rounded-md hover:bg-[#2E4A35] transition-colors disabled:opacity-60"
                        >
                          {isActing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Check size={14} />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#F5C2BC] text-[#C53030] py-2 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {isActing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <X size={14} />
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
    </div>
  )
}