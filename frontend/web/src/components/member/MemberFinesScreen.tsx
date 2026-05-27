// frontend/web/src/components/member/MemberFinesScreen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFines } from '@/services/api'
import { extractData } from '@/hooks/useApiData'
import type { Fine } from '@shared/types/circulation'
import { DollarSign, CheckCircle, Loader2, Search, X } from 'lucide-react'
import { format } from 'date-fns'

type FineWithDetails = Fine & {
  book_title?: string
  loan_id?: number
}

export default function MemberFinesScreen() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all')

  const { data: finesResponse, isLoading } = useQuery({
    queryKey: ['fines'],
    queryFn: getFines,
  })
  const fines = extractData<FineWithDetails[]>(finesResponse) || []

  const filteredFines = fines.filter((fine) => {
    const matchesSearch = fine.book_title?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'unpaid') return !fine.paid && matchesSearch
    if (filter === 'paid') return fine.paid && matchesSearch
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  const unpaidTotal = fines.filter(f => !f.paid).reduce((sum, f) => sum + parseFloat(f.amount), 0)
  const unpaidCount = fines.filter(f => !f.paid).length
  const paidCount = fines.filter(f => f.paid).length

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#281711] font-baskerville">Fines & Penalties</h1>
          <p className="text-sm text-[#706251] mt-1">View your fine history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[#EFE9CE] rounded-lg p-4">
            <p className="text-xs font-semibold text-[#706251] uppercase tracking-wider">Total Unpaid</p>
            <p className="text-2xl font-bold text-[#C53030] font-serif">₱{unpaidTotal.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-[#EFE9CE] rounded-lg p-4">
            <p className="text-xs font-semibold text-[#706251] uppercase tracking-wider">Unpaid Fines</p>
            <p className="text-2xl font-bold text-[#1F150C] font-serif">{unpaidCount}</p>
          </div>
          <div className="bg-white border border-[#EFE9CE] rounded-lg p-4">
            <p className="text-xs font-semibold text-[#706251] uppercase tracking-wider">Paid Fines</p>
            <p className="text-2xl font-bold text-[#1F150C] font-serif">{paidCount}</p>
          </div>
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
            All ({fines.length})
          </button>
          <button
            onClick={() => setFilter('unpaid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'unpaid'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            Unpaid ({unpaidCount})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
              filter === 'paid'
                ? 'bg-[#281711] border-[#281711] text-white'
                : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
            }`}
          >
            Paid ({paidCount})
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

        {/* Fines List */}
        {filteredFines.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EFE9CE] rounded-lg">
            <DollarSign size={48} className="mx-auto text-[#A1927F] mb-3" />
            <p className="text-[#706251]">
              {search ? `No results for "${search}"` : 'No fines found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFines.map((fine) => (
              <div key={fine.id} className="bg-white border border-[#EFE9CE] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fine.paid ? 'bg-[#E6F4EA]' : 'bg-[#FCE8E6]'}`}>
                        <DollarSign size={14} className={fine.paid ? 'text-[#137333]' : 'text-[#C53030]'} />
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${fine.paid ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C53030]'}`}>
                        {fine.paid ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A1927F]">#{fine.id}</span>
                  </div>

                  <h3 className="font-bold text-[#281711] text-base font-baskerville mb-2">{fine.book_title || `Loan #${fine.loan?.id}`}</h3>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[#706251]">Amount:</span>
                      <span className={`font-bold ${fine.paid ? 'text-[#137333]' : 'text-[#C53030]'}`}>
                        ₱{parseFloat(fine.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706251]">Issued:</span>
                      <span className="text-[#281711] font-medium">{format(new Date(fine.issued_date), 'MMM d, yyyy')}</span>
                    </div>
                    {fine.paid_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#706251]">Paid:</span>
                        <span className="text-[#137333] font-medium">{format(new Date(fine.paid_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {fine.notes && (
                    <div className="mt-3 p-2 bg-[#F7F3E3] border-l-2 border-[#706251] rounded">
                      <p className="text-xs text-[#706251] italic">Notes: {fine.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}