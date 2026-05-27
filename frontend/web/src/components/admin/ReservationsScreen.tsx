// frontend/web/src/components/admin/ReservationsScreen.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReservations, fulfillReservation } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
// Remove unused Reservation import
import { 
  CheckCircle, Clock, BookOpen, Archive, AlertCircle, 
  Loader2, X
} from 'lucide-react'
import { format } from 'date-fns'

// Extended reservation type for display (matches backend Reservation model)
type ReservationWithDetails = {
  id: number
  book: number
  book_title?: string
  member: number
  member_name?: string
  reserved_date: string  // Note: backend uses 'reserved_date', not 'reservation_date'
  expiry_date?: string
  status: string  // 'waiting', 'ready', 'cancelled', 'expired', 'fulfilled'
  queue_position?: number
  notified_date?: string | null
}

const STATUS_META: Record<string, { bg: string; text: string; icon: typeof BookOpen }> = {
  waiting:   { bg: '#FFF9E6', text: '#F69D39', icon: Clock },
  ready:     { bg: '#EAF2EC', text: '#3D5A45', icon: CheckCircle },
  fulfilled: { bg: '#D4E8D4', text: '#2E5E2E', icon: Archive },
  cancelled: { bg: '#F1EDE4', text: '#706251', icon: X },
  expired:   { bg: '#FCEAEA', text: '#8A2B2B', icon: AlertCircle },
}

export default function ReservationsScreen() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query
  const { data: reservationsResponse, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: getReservations,
  })
  const reservations = extractData<ReservationWithDetails[]>(reservationsResponse) || []

  // Mutation
  const fulfillMutation = useMutation({
    mutationFn: fulfillReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Loan created successfully!' })
      setModalOpen(false)
      setSelectedReservation(null)
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.error || 
                       error?.response?.data?.detail || 
                       'Could not create loan. Make sure the book is available.'
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const openFulfillModal = (reservation: ReservationWithDetails) => {
    setSelectedReservation(reservation)
    setModalOpen(true)
  }

  const handleFulfill = () => {
    if (!selectedReservation) return
    setProcessingId(selectedReservation.id)
    fulfillMutation.mutate(selectedReservation.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  const waitingReservations = reservations.filter(r => r.status === 'waiting')
  const readyReservations = reservations.filter(r => r.status === 'ready')
  const otherReservations = reservations.filter(r => !['waiting', 'ready'].includes(r.status))

  const ReservationRow = ({ 
    reservation, 
    showActions = false,
    isLast = false 
  }: { 
    reservation: ReservationWithDetails
    showActions?: boolean
    isLast?: boolean
  }) => {
    const meta = STATUS_META[reservation.status] || STATUS_META.waiting
    const Icon = meta.icon
    const isProcessing = processingId === reservation.id

    return (
      <div className={`flex items-center gap-3 px-4 py-3.5 ${!isLast && 'border-b border-[#FFC85C]'}`}>
        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${meta.text}15` }}>
          <Icon size={14} style={{ color: meta.text }} />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#2D1F10]">{reservation.book_title}</p>
          <p className="text-[11px] text-[#706251] mt-0.5">
            Member: {reservation.member_name || `ID: ${reservation.member}`} · 
            Reserved: {format(new Date(reservation.reserved_date), 'MMM d, yyyy')}
          </p>
          {reservation.queue_position !== undefined && (
            <p className="text-[11px] text-[#706251] mt-0.5">
              Queue Position: #{reservation.queue_position}
            </p>
          )}
          {reservation.expiry_date && reservation.status === 'waiting' && (
            <p className="text-[11px] text-[#8A2B2B] mt-0.5">
              Expires: {format(new Date(reservation.expiry_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>
        {showActions ? (
          <button
            onClick={() => openFulfillModal(reservation)}
            disabled={isProcessing}
            className="flex items-center gap-1.5 bg-[#3D5A45] text-white px-3 py-1.5 text-[11px] font-semibold hover:bg-[#2E4A35] transition-colors disabled:opacity-50 min-w-[110px] justify-center"
          >
            {isProcessing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <>
                <CheckCircle size={12} />
                Create Loan
              </>
            )}
          </button>
        ) : (
          <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide ${meta.bg}`} style={{ color: meta.text }}>
            {reservation.status.toUpperCase()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1F150C] font-serif">Reservation Queue</h1>
          <p className="text-sm font-medium text-[#706251] mt-1">
            Manage member waitlist ({reservations.length} total)
          </p>
        </div>

        {/* Ready to Fulfill Section */}
        {readyReservations.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-2 uppercase">Ready to Fulfill</p>
            <div className="bg-white border border-[#EFE9CE] overflow-hidden mb-4">
              <div className="bg-[#3D5A45] px-4 py-2.5 flex items-center gap-2">
                <CheckCircle size={14} className="text-white" />
                <span className="text-[13px] font-semibold text-white">Ready for Checkout</span>
              </div>
              {readyReservations.map((reservation, idx) => (
                <ReservationRow
                  key={reservation.id}
                  reservation={reservation}
                  showActions={true}
                  isLast={idx === readyReservations.length - 1}
                />
              ))}
            </div>
          </>
        )}

        {/* Waiting Queue Section */}
        {waitingReservations.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-2 uppercase">Waiting Queue</p>
            <div className="bg-white border border-[#EFE9CE] overflow-hidden mb-4">
              <div className="bg-[#1F150C] px-4 py-2.5 flex items-center gap-2">
                <Clock size={14} className="text-[#FFC85C]" />
                <span className="text-[13px] font-semibold text-[#FBF5DD]">Pending Availability</span>
              </div>
              {waitingReservations.map((reservation, idx) => (
                <ReservationRow
                  key={reservation.id}
                  reservation={reservation}
                  showActions={false}
                  isLast={idx === waitingReservations.length - 1}
                />
              ))}
            </div>
          </>
        )}

        {/* Archived Section */}
        {otherReservations.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-2 uppercase">Archived</p>
            <div className="bg-white border border-[#EFE9CE] overflow-hidden mb-4">
              <div className="bg-[#706251] px-4 py-2.5 flex items-center gap-2">
                <Archive size={14} className="text-white" />
                <span className="text-[13px] font-semibold text-white">Completed Records</span>
              </div>
              {otherReservations.map((reservation, idx) => (
                <ReservationRow
                  key={reservation.id}
                  reservation={reservation}
                  showActions={false}
                  isLast={idx === otherReservations.length - 1}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {reservations.length === 0 && (
          <div className="text-center py-12 bg-white border border-[#EFE9CE]">
            <p className="text-[#706251]">No reservations in the queue.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm border border-[#EFE9CE]">
            <h3 className="text-lg font-bold text-[#1F150C] font-serif text-center mb-3">
              Confirm Loan Creation
            </h3>
            <p className="text-sm text-[#2D1F10] text-center mb-5">
              Create a loan for "{selectedReservation.book_title}" to {selectedReservation.member_name}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalOpen(false)
                  setSelectedReservation(null)
                }}
                className="flex-1 border border-[#DCD4C4] py-2 text-sm font-semibold text-[#706251] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFulfill}
                className="flex-1 bg-[#3D5A45] text-white py-2 text-sm font-semibold hover:bg-[#2E4A35] transition-colors"
              >
                Create Loan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}