// frontend/web/src/components/member/MemberRequestsScreen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBorrowRequests } from '@/services/api'
import { extractData } from '@/hooks/useApiData'
import type { BorrowRequest } from '@shared/types/circulation'
import { Clock, CheckCircle, XCircle, Loader2, Search, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

type BorrowRequestWithDetails = BorrowRequest & {
  book_title?: string
}

const STATUS_META: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  pending:   { bg: '#FFFBEB', text: '#B45309', icon: Clock, label: 'Pending' },
  approved:  { bg: '#E6F4EA', text: '#137333', icon: CheckCircle, label: 'Approved' },
  rejected:  { bg: '#FCE8E6', text: '#C53030', icon: XCircle, label: 'Rejected' },
  cancelled: { bg: '#F1EDE4', text: '#706251', icon: AlertCircle, label: 'Cancelled' },
}

export default function MemberRequestsScreen() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const { data: requestsResponse, isLoading } = useQuery({
    queryKey: ['borrow-requests'],
    queryFn: () => getBorrowRequests(),
  })
  const requests = extractData<BorrowRequestWithDetails[]>(requestsResponse) || []

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.book?.title?.toLowerCase().includes(search.toLowerCase()) ||
      req.book_title?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'all') return matchesSearch
    return req.status === filter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const rejectedCount = requests.filter(r => r.status === 'rejected').length

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#281711] font-baskerville">Borrow Requests</h1>
          <p className="text-sm text-[#706251] mt-1">Track your book borrow requests</p>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'approved'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'rejected'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center bg-white border border-[#DCD4C4] rounded-lg px-3 py-2">
            <Search size={16} className="text-[#A1927F] mr-2" />
            <input
              type="text"
              placeholder="Search by book title..."
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

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EFE9CE] rounded-lg">
            <Clock size={48} className="mx-auto text-[#A1927F] mb-3" />
            <p className="text-[#706251]">
              {search ? `No results for "${search}"` : 'No borrow requests found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const meta = STATUS_META[request.status] || STATUS_META.pending
              const Icon = meta.icon

              return (
                <div key={request.id} className="bg-white border border-[#EFE9CE] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.text}15` }}>
                          <Icon size={14} style={{ color: meta.text }} />
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: meta.bg, color: meta.text }}>
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#A1927F]">#{request.id}</span>
                    </div>

                    <h3 className="font-bold text-[#281711] text-base font-baskerville mb-2">
                      {request.book?.title || request.book_title}
                    </h3>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[#706251]">Requested:</span>
                        <span className="text-[#281711] font-medium">{format(new Date(request.request_date), 'MMM d, yyyy')}</span>
                      </div>
                      {request.processed_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#706251]">Processed:</span>
                          <span className="text-[#281711] font-medium">{format(new Date(request.processed_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {request.notes && (
                      <div className="mt-3 p-2 bg-[#F7F3E3] border-l-2 border-[#706251] rounded">
                        <p className="text-xs text-[#706251] italic">Notes: {request.notes}</p>
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