// frontend/web/src/components/admin/SemestersScreen.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { getSemesters, createSemester, updateSemester, deleteSemester, setActiveSemester } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { Semester } from '@shared/types/circulation'
import { Calendar, Plus, Edit2, Trash2, CheckCircle, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'

const SEMESTER_TYPE_LABELS: Record<string, string> = {
  '1st_sem': '1st Semester',
  '2nd_sem': '2nd Semester',
  'summer': 'Summer',
}

const SEMESTER_TYPE_OPTIONS = [
  { value: '1st_sem', label: '1st Semester' },
  { value: '2nd_sem', label: '2nd Semester' },
  { value: 'summer', label: 'Summer' },
]

// Helper to format semester for display
const formatSemesterLabel = (semester: Semester): string => {
  const typeLabel = SEMESTER_TYPE_LABELS[semester.semester_type] || semester.semester_type
  return `${typeLabel} — ${semester.academic_year}`
}

export default function SemestersScreen() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
  const [formData, setFormData] = useState({
    academic_year: '',
    semester_type: '',
    start_date: '',
    end_date: '',
  })
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { showConfirm } = useAlert()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query
  const { data: semestersResponse, isLoading } = useQuery({
    queryKey: ['semesters'],
    queryFn: getSemesters,
  })
  const semesters = extractData<Semester[]>(semestersResponse) || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Semester created successfully' })
      closeModal()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to create semester', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateSemester(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Semester updated successfully' })
      closeModal()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to update semester', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Semester deleted successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Cannot delete semester with associated records', variant: 'destructive' })
    },
    onSettled: () => {
      setDeletingId(null)
    },
  })

  const setActiveMutation = useMutation({
    mutationFn: setActiveSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Active semester updated' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to set active semester', variant: 'destructive' })
    },
  })

  const openCreateModal = () => {
    setEditingSemester(null)
    setFormData({ academic_year: '', semester_type: '', start_date: '', end_date: '' })
    setModalOpen(true)
  }

  const openEditModal = (semester: Semester) => {
    setEditingSemester(semester)
    setFormData({
      academic_year: semester.academic_year,
      semester_type: semester.semester_type,
      start_date: semester.start_date || '',
      end_date: semester.end_date || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingSemester(null)
  }

  const handleDelete = (semester: Semester) => {
    if (semester.is_active) {
      toast({ title: 'Notice', description: 'Deactivate this semester before deleting it.', variant: 'destructive' })
      return
    }
    showConfirm(
      'Delete Semester',
      `Delete "${formatSemesterLabel(semester)}"? This cannot be undone.`,
      () => {
        setDeletingId(semester.id)
        deleteMutation.mutate(semester.id)
      },
      { confirmText: 'Delete', cancelText: 'Cancel', confirmVariant: 'danger' }
    )
  }

  const handleSetActive = async (id: number) => {
    setActiveMutation.mutate(id)
  }

  const handleSubmit = () => {
    if (!formData.academic_year) {
      toast({ title: 'Error', description: 'Academic year is required', variant: 'destructive' })
      return
    }
    if (!formData.semester_type) {
      toast({ title: 'Error', description: 'Semester type is required', variant: 'destructive' })
      return
    }

    const payload = {
      academic_year: formData.academic_year,
      semester_type: formData.semester_type,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    }

    if (editingSemester) {
      updateMutation.mutate({ id: editingSemester.id, data: payload })
    } else {
      createMutation.mutate(payload)
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
    <div className="bg-[#FBFBFA] min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E8E4D9]">
          <h1 className="text-lg font-bold text-[#281711] font-baskerville">Semesters ({semesters.length})</h1>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#281711] text-[#F4EFE0] px-4 py-2.5 hover:bg-[#3D2A1E] transition-colors"
          >
            <Plus size={16} />
            <span className="text-xs font-semibold tracking-wide">Add Semester</span>
          </button>
        </div>

        {semesters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#706251]">No semesters yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {semesters.map((semester) => {
              const isDeleting = deletingId === semester.id
              const isActive = semester.is_active

              return (
                <div key={semester.id} className="bg-white border border-[#EAE7DF] p-5">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-[#706251]" />
                          <h3 className="text-base font-bold text-[#281711] font-baskerville">
                            {formatSemesterLabel(semester)}
                          </h3>
                        </div>
                        {isActive && (
                          <div className="px-2 py-0.5 text-[10px] font-bold bg-[#E6F4EA] text-[#137333] rounded">
                            ACTIVE
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1 mt-3">
                        {semester.start_date && (
                          <p className="text-sm text-[#4A3E3D]">
                            <span className="font-semibold">Start:</span> {format(new Date(semester.start_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        {semester.end_date && (
                          <p className="text-sm text-[#4A3E3D]">
                            <span className="font-semibold">End:</span> {format(new Date(semester.end_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        {!semester.start_date && !semester.end_date && (
                          <p className="text-sm text-[#706251] italic">Dates not set</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#F3F1EC]">
                      {!isActive && (
                        <button
                          onClick={() => handleSetActive(semester.id)}
                          disabled={setActiveMutation.isPending}
                          className="px-3 py-1.5 border border-[#281711] text-xs font-semibold text-[#281711] hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={12} />
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(semester)}
                        className="w-8 h-8 bg-[#F4F1EA] flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <Edit2 size={14} className="text-[#513E2F]" />
                      </button>
                      {!isActive && (
                        <button
                          onClick={() => handleDelete(semester)}
                          disabled={isDeleting}
                          className="w-8 h-8 bg-[#FCE8E6] flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 size={14} className="animate-spin text-[#C53030]" />
                          ) : (
                            <Trash2 size={14} className="text-[#C53030]" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F1E6] border border-[#DCD4C4] w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-baskerville text-base font-bold text-[#281711] tracking-wide">
                  {editingSemester ? 'EDIT SEMESTER' : 'ADD NEW SEMESTER'}
                </h2>
                <button onClick={closeModal}>
                  <X size={18} className="text-[#281711]" />
                </button>
              </div>
              <div className="h-px bg-[#DCD4C4] mb-5" />

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Academic Year *</label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                    placeholder="e.g., 2025-2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Semester Type *</label>
                  <select
                    value={formData.semester_type}
                    onChange={(e) => setFormData({ ...formData, semester_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] appearance-none"
                  >
                    <option value="">Select Semester Type</option>
                    {SEMESTER_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#DCD4C4]">
                <button
                  onClick={closeModal}
                  className="flex-1 border border-[#281711] py-2 text-xs font-semibold text-[#281711] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#281711] text-[#F4EFE0] py-2 text-xs font-semibold hover:bg-[#3D2A1E] disabled:opacity-60"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'SAVING...' : (editingSemester ? 'UPDATE' : 'SAVE RECORD')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}