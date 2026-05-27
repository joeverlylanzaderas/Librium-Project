// frontend/web/src/components/admin/FinesScreen.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { getFines, payFine } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { Fine } from '@shared/types/circulation'
import { AlertCircle, CheckCircle, DollarSign, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

// Extended fine type for display (since the API might return additional fields)
type FineWithDetails = Fine & {
  reason?: string
  member_name?: string
}

export default function FinesScreen() {
  const { showConfirm } = useAlert()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query
  const { data: finesResponse, isLoading } = useQuery({
    queryKey: ['fines'],
    queryFn: getFines,
  })
  const fines = extractData<FineWithDetails[]>(finesResponse) || []

  // Mutation
  const payMutation = useMutation({
    mutationFn: payFine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Fine marked as paid' })
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || 'Could not update record.'
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
    },
  })

  const handlePay = (id: number, amount: string) => {
    showConfirm(
      'Mark Fine as Paid',
      `Mark ₱${parseFloat(amount).toFixed(2)} fine as paid?`,
      () => payMutation.mutate(id),
      { confirmText: 'Confirm', cancelText: 'Cancel', confirmVariant: 'success' }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  // Use 'paid' boolean from the Fine model, not 'status'
  const unpaidFines = fines.filter(f => !f.paid)
  const paidFines = fines.filter(f => f.paid)

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1F150C] font-serif">Accounts &amp; Fines</h1>
          <p className="text-sm font-medium text-[#706251] mt-1">
            Ledger Balances ({fines.length})
          </p>
        </div>

        {/* Outstanding Unpaid Balances Section */}
        {unpaidFines.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-2 uppercase">
              Outstanding Unpaid Balances
            </p>
            <div className="bg-white border border-[#EFE9CE] overflow-hidden mb-4">
              <div className="bg-[#8A2B2B] px-4 py-2.5 flex items-center gap-2">
                <AlertCircle size={14} className="text-[#FFC85C]" />
                <span className="text-[13px] font-semibold text-white">Arrears Register</span>
              </div>
              {unpaidFines.map((fine, idx) => (
                <div 
                  key={fine.id} 
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 ${
                    idx !== unpaidFines.length - 1 && 'border-b border-[#FFC85C]'
                  }`}
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#8A2B2B15' }}>
                    <DollarSign size={14} className="text-[#8A2B2B]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#8A2B2B] font-serif">
                      ₱{parseFloat(fine.amount).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-[#706251] mt-0.5">
                      Member: {fine.member_name || fine.member?.full_name || `ID: ${fine.member?.id}`} · Loan Reference: #{fine.loan?.id}
                    </p>
                    {fine.notes && (
                      <p className="text-[11px] text-[#706251] italic mt-0.5">
                        Notes: {fine.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handlePay(fine.id, fine.amount)}
                    disabled={payMutation.isPending}
                    className="bg-[#3D5A45] text-white px-3 py-1.5 text-[11px] font-semibold hover:bg-[#2E4A35] transition-colors disabled:opacity-50 self-start sm:self-center"
                  >
                    Mark Paid
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Settled Accounts Section */}
        {paidFines.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-[#706251] tracking-wider mb-2 uppercase">
              Settled Accounts
            </p>
            <div className="bg-white border border-[#EFE9CE] overflow-hidden mb-4">
              <div className="bg-[#1F150C] px-4 py-2.5 flex items-center gap-2">
                <CheckCircle size={14} className="text-[#FFC85C]" />
                <span className="text-[13px] font-semibold text-[#FBF5DD]">Cleared Ledger Entries</span>
              </div>
              {paidFines.map((fine, idx) => (
                <div 
                  key={fine.id} 
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 opacity-75 ${
                    idx !== paidFines.length - 1 && 'border-b border-[#FFC85C]'
                  }`}
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3D5A4515' }}>
                    <CheckCircle size={14} className="text-[#3D5A45]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#3D5A45] font-serif">
                      ₱{parseFloat(fine.amount).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-[#706251] mt-0.5">
                      Member: {fine.member_name || fine.member?.full_name || `ID: ${fine.member?.id}`} · Reference: #{fine.id}
                    </p>
                  </div>
                  <div className="bg-[#EAF2EC] px-2 py-1 rounded self-start sm:self-center">
                    <span className="text-[10px] font-bold text-[#3D5A45]">
                      SETTLED: {fine.paid_date ? format(new Date(fine.paid_date), 'MMM d, yyyy') : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {fines.length === 0 && (
          <div className="text-center py-12 bg-white border border-[#EFE9CE]">
            <p className="text-[#706251]">No fines on record.</p>
          </div>
        )}
      </div>
    </div>
  )
}