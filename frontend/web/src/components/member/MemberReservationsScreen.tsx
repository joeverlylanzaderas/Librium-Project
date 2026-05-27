// frontend/web/src/components/member/MemberReservationsScreen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReservations } from '@/services/api'
import { extractData } from '@/hooks/useApiData'
import type { Reservation } from '@shared/types/circulation'
import { Clock, CheckCircle, XCircle, Loader2, Search, X, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

type ReservationWithDetails = Reservation & {
  book_title?: string
  expiry_date?: string
}

const STATUS_META: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  waiting:   { bg: '#FFF9E6', text: '#F69D39', icon: Clock, label: 'Waiting' },
  ready:     { bg: '#EAF2EC', text: '#3D5A45', icon: CheckCircle, label: 'Ready' },
  fulfilled: { bg: '#D4E8D4', text: '#2E5E2E', icon: CheckCircle, label: 'Fulfilled' },
  cancelled: { bg: '#F1EDE4', text: '#706251', icon: XCircle, label: 'Cancelled' },
  expired:   { bg: '#FCEAEA', text: '#C53030', icon: AlertCircle, label: 'Expired' },
}

export default function MemberReservationsScreen() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'waiting' | 'ready' | 'fulfilled'>('all')

  const { data: reservationsResponse, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: getReservations,
  })
  const reservations = extractData<ReservationWithDetails[]>(reservationsResponse) || []

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch = res.book_title?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'all') return matchesSearch
    return res.status === filter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  const waitingCount = reservations.filter(r => r.status === 'waiting').length
  const readyCount = reservations.filter(r => r.status === 'ready').length
  const fulfilledCount = reservations.filter(r => r.status === 'fulfilled').length

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#281711] font-baskerville">My Reservations</h1>
          <p className="text-sm text-[#706251] mt-1">Manage your book reservations</p>
        </div>

        {/* Alert for ready reservations */}
        {readyCount > 0 && (
          <div className="mb-4 p-3 bg-[#E6F4EA] border border-[#B7DFC4] rounded-lg">
            <p className="text-sm text-[#137333]">
              <CheckCircle size={14} className="inline mr-1" />
              You have {readyCount} reservation(s) ready for pickup!
            </p>
          </div>
        )}

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
            All ({reservations.length})
          </button>
          <button
            onClick={() => setFilter('waiting')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'waiting'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            Waiting ({waitingCount})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'ready'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            Ready ({readyCount})
          </button>
          <button
            onClick={() => setFilter('fulfilled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'fulfilled'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            Fulfilled ({fulfilledCount})
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

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EFE9CE] rounded-lg">
            <Calendar size={48} className="mx-auto text-[#A1927F] mb-3" />
            <p className="text-[#706251]">
              {search ? `No results for "${search}"` : 'No reservations found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((reservation) => {
              const meta = STATUS_META[reservation.status] || STATUS_META.waiting
              const Icon = meta.icon

              return (
                <div key={reservation.id} className="bg-white border border-[#EFE9CE] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                      <span className="text-[10px] font-mono text-[#A1927F]">#{reservation.id}</span>
                    </div>

                    <h3 className="font-bold text-[#281711] text-base font-baskerville mb-2">{reservation.book_title}</h3>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[#706251]">Reserved:</span>
                        <span className="text-[#281711] font-medium">{format(new Date(reservation.reserved_date), 'MMM d, yyyy')}</span>
                      </div>
                      {reservation.queue_position && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#706251]">Queue Position:</span>
                          <span className="text-[#281711] font-medium">#{reservation.queue_position}</span>
                        </div>
                      )}
                      {reservation.expiry_date && reservation.status === 'waiting' && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#706251]">Expires:</span>
                          <span className="text-[#C53030] font-medium">{format(new Date(reservation.expiry_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
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