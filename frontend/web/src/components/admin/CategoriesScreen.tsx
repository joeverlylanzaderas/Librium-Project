// frontend/web/src/components/admin/CategoriesScreen.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { Category } from '@shared/types/book'
import { Plus, Edit2, Trash2, Loader2, X } from 'lucide-react'

export default function CategoriesScreen() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const { showConfirm } = useAlert()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const categories = extractData<Category[]>(categoriesResponse) || []

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast({ title: 'Success', description: 'Category created successfully' })
      closeModal()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to create category', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast({ title: 'Success', description: 'Category updated successfully' })
      closeModal()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to update category', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast({ title: 'Success', description: 'Category deleted successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Cannot delete category with associated books', variant: 'destructive' })
    },
  })

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      description: category.description || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCategory(null)
  }

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }

    const payload = {
      name: formData.name,
      description: formData.description || null,
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: payload })
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
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E8E4D9]">
          <h1 className="text-lg font-bold text-[#281711] font-baskerville">Categories ({categories.length})</h1>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#281711] text-[#F4EFE0] px-4 py-2.5 hover:bg-[#3D2A1E] transition-colors"
          >
            <Plus size={16} />
            <span className="text-xs font-semibold tracking-wide">Add Category</span>
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#706251]">No categories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-white border border-[#EAE7DF] p-5">
                <div className="flex flex-col h-full">
                  <div className="flex-1 mb-4">
                    <h3 className="text-base font-bold text-[#281711] font-baskerville mb-1.5">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-[#4A3E3D] line-clamp-3">{category.description}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#F3F1EC]">
                    <button
                      onClick={() => openEditModal(category)}
                      className="w-8 h-8 bg-[#F4F1EA] flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 size={14} className="text-[#513E2F]" />
                    </button>
                    <button
                      onClick={() => {
                        showConfirm(
                          'Delete Category',
                          `Delete category "${category.name}"? This cannot be undone.`,
                          () => deleteMutation.mutate(category.id),
                          { confirmText: 'Delete', cancelText: 'Cancel', confirmVariant: 'danger' }
                        )
                      }}
                      className="w-8 h-8 bg-[#FCE8E6] flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} className="text-[#C53030]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F1E6] border border-[#DCD4C4] w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-baskerville text-base font-bold text-[#281711] tracking-wide">
                  {editingCategory ? 'EDIT CATEGORY' : 'ADD NEW CATEGORY'}
                </h2>
                <button onClick={closeModal}>
                  <X size={18} className="text-[#281711]" />
                </button>
              </div>
              <div className="h-px bg-[#DCD4C4] mb-5" />

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] resize-none"
                    placeholder="Enter description"
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
                  {createMutation.isPending || updateMutation.isPending ? 'SAVING...' : (editingCategory ? 'UPDATE' : 'SAVE RECORD')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}