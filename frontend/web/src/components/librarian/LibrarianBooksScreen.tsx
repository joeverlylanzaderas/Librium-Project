// frontend/web/src/components/librarian/LibrarianBooksScreen.tsx
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { 
  getBooks, createBook, updateBook, deleteBook,
  getAuthors, getCategories, getDepartments
} from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { Author, Category, Department } from '@shared/types/book'
import { 
  Plus, Search, Edit2, Trash2, ChevronDown, X, 
  Image as ImageIcon, Upload, Loader2, CheckCircle, Circle,
  ChevronRight
} from 'lucide-react'

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dz5b4xsjy'
const CLOUDINARY_UPLOAD_PRESET = 'librium_covers'

// Extended book type with flattened fields from API
type BookWithFlattenedFields = {
  id: number
  title: string
  isbn: string
  publication_year: number | null
  author: number  // This is an ID, not an Author object
  author_name?: string
  category: number | null
  category_name?: string | null
  department: number | null
  department_name?: string | null
  available: boolean
  is_active: boolean
  cover_image: string | null
  description: string | null
}

export default function LibrarianBooksScreen() {
  const { showConfirm } = useAlert()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'borrowed'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<BookWithFlattenedFields | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Dropdown states
  const [authorSearch, setAuthorSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [departmentSearch, setDepartmentSearch] = useState('')
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    publication_year: '',
    author: '',
    category: '',
    department: '',
    description: '',
    available: true,
    cover_image: '',
  })

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: booksResponse, isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: getBooks,
  })
  const books = extractData<BookWithFlattenedFields[]>(booksResponse) || []

  const { data: authorsResponse } = useQuery({
    queryKey: ['authors'],
    queryFn: getAuthors,
  })
  const authors = extractData<Author[]>(authorsResponse) || []

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const categories = extractData<Category[]>(categoriesResponse) || []

  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })
  const departments = extractData<Department[]>(departmentsResponse) || []

  // Filtered dropdown lists
  const filteredAuthors = authors.filter(a => 
    a.name?.toLowerCase().includes(authorSearch.toLowerCase())
  )
  const filteredCategories = categories.filter(c => 
    c.name?.toLowerCase().includes(categorySearch.toLowerCase())
  )
  const filteredDepartments = departments.filter(d => 
    d.name?.toLowerCase().includes(departmentSearch.toLowerCase())
  )

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    uploadFormData.append('cloud_name', CLOUDINARY_CLOUD_NAME)

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: uploadFormData,
      })
      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  // Handle cover image upload
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 2MB', variant: 'destructive' })
      return
    }

    setUploadingCover(true)
    try {
      const imageUrl = await uploadImageToCloudinary(file)
      if (imageUrl) {
        setFormData({ ...formData, cover_image: imageUrl })
        toast({ title: 'Success', description: 'Cover image uploaded successfully' })
      } else {
        toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Could not upload cover image', variant: 'destructive' })
    } finally {
      setUploadingCover(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Book created successfully' })
      closeModal()
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.isbn?.[0] || error?.response?.data?.message || 'Failed to create book'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Book updated successfully' })
      closeModal()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to update book', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Book deletion request submitted' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Cannot delete book with active loans', variant: 'destructive' })
    },
    onSettled: () => {
      setDeletingId(null)
    },
  })

  const filteredBooks = books.filter((book: BookWithFlattenedFields) => {
    const matchesSearch = book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.author_name?.toLowerCase().includes(search.toLowerCase()) ||
      book.isbn?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' ? true :
      filterStatus === 'available' ? book.available : !book.available
    return matchesSearch && matchesStatus
  })

  const openCreateModal = () => {
    setEditingBook(null)
    setFormData({
      title: '', isbn: '', publication_year: '', author: '', category: '',
      department: '', description: '', available: true, cover_image: '',
    })
    setAuthorSearch('')
    setCategorySearch('')
    setDepartmentSearch('')
    setModalOpen(true)
  }

  const openEditModal = (book: BookWithFlattenedFields) => {
    setEditingBook(book)
    
    // Find display names for dropdowns
    const currentAuthor = authors.find(a => a.id === book.author)
    const currentCategory = categories.find(c => c.id === book.category)
    const currentDepartment = departments.find(d => d.id === book.department)
    
    setAuthorSearch(currentAuthor?.name || book.author_name || '')
    setCategorySearch(currentCategory?.name || book.category_name || '')
    setDepartmentSearch(currentDepartment?.name || book.department_name || '')
    
    setFormData({
      title: book.title || '',
      isbn: book.isbn || '',
      publication_year: book.publication_year?.toString() || '',
      author: book.author?.toString() || '',
      category: book.category?.toString() || '',
      department: book.department?.toString() || '',
      description: book.description || '',
      available: book.available,
      cover_image: book.cover_image || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingBook(null)
    setShowAuthorDropdown(false)
    setShowCategoryDropdown(false)
    setShowDepartmentDropdown(false)
  }

  const handleDelete = (book: BookWithFlattenedFields) => {
    showConfirm(
      'Confirm Deletion',
      `Request deletion of "${book.title}"? This will be reviewed by an administrator.`,
      () => {
        setDeletingId(book.id)
        deleteMutation.mutate(book.id)
      },
      { confirmText: 'Delete', cancelText: 'Cancel', confirmVariant: 'danger' }
    )
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.isbn) {
      toast({ title: 'Error', description: 'Title and ISBN are required', variant: 'destructive' })
      return
    }

    const currentYear = new Date().getFullYear()
    const yearNum = parseInt(formData.publication_year)
    if (formData.publication_year && (isNaN(yearNum) || yearNum < 1000 || yearNum > currentYear)) {
      toast({ title: 'Error', description: `Publication year must be between 1000 and ${currentYear}`, variant: 'destructive' })
      return
    }

    const payload: any = {
      title: formData.title,
      isbn: formData.isbn,
      publication_year: formData.publication_year ? yearNum : null,
      description: formData.description || undefined,
      available: formData.available,
      cover_image: formData.cover_image || null,
      author: formData.author ? parseInt(formData.author) : null,
      category: formData.category ? parseInt(formData.category) : null,
      department: formData.department ? parseInt(formData.department) : null,
    }

    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  if (booksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="bg-white border-b border-[#DCD4C4] p-4 space-y-3 sticky top-0 z-10">
          <div className="flex items-center bg-white border border-[#DCD4C4] px-3 py-2">
            <Search size={16} className="text-[#A1927F] mr-2" />
            <input
              type="text"
              placeholder="Search title, author, ISBN..."
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

          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-2">
              {(['all', 'available', 'borrowed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterStatus(filter)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                    filterStatus === filter
                      ? 'bg-[#281711] border-[#281711] text-white'
                      : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-[#281711] text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-[#3D2A1E] transition-colors"
            >
              <Plus size={14} />
              Add Book
            </button>
          </div>
          <p className="text-xs text-[#706251]">{filteredBooks.length} books registered</p>
        </div>

        {/* Books Table */}
        <div className="p-4">
          {filteredBooks.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#EFE9CE]">
              <p className="text-[#706251]">No records match your filters.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#EFE9CE] overflow-hidden rounded-lg">
              {/* Table Header */}
              <div className="hidden md:flex bg-[#F4F1EA] px-4 py-3 border-b border-[#DCD4C4] text-xs font-bold text-[#706251] uppercase tracking-wider">
                <div className="w-10"></div>
                <div className="w-16">Cover</div>
                <div className="flex-1">Title & Author</div>
                <div className="w-48">Identifiers</div>
                <div className="w-28">Status</div>
                <div className="w-10"></div>
              </div>

              {/* Table Rows */}
              {filteredBooks.map((book) => {
                const isExpanded = expandedId === book.id
                const statusColor = book.available 
                  ? { bg: '#E6F4EA', text: '#137333', border: '#B7DFC4', label: 'Available' }
                  : { bg: '#FCE8E6', text: '#8A2B2B', border: '#F5C2BC', label: 'Unavailable' }
                const isDeleting = deletingId === book.id

                return (
                  <div key={book.id} className="border-b border-[#EFE9CE] last:border-b-0">
                    {/* Main Row */}
                    <div 
                      className="flex flex-col md:flex-row px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : book.id)}
                    >
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-6">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                        <div className="w-16">
                          {book.cover_image ? (
                            <img src={book.cover_image} alt={book.title} className="w-10 h-14 object-cover border border-[#DCD4C4]" />
                          ) : (
                            <div className="w-10 h-14 bg-[#F4F1EA] border border-[#DCD4C4] flex items-center justify-center">
                              <ImageIcon size={20} className="text-[#C4A77D]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#281711] text-sm">{book.title}</h3>
                          <p className="text-xs text-[#706251]">{book.author_name || 'Unknown Author'}</p>
                        </div>
                        <div className="hidden md:block w-48">
                          <p className="text-xs text-[#706251]">ISBN: {book.isbn || '—'}</p>
                          <p className="text-xs text-[#706251]">Year: {book.publication_year || '—'}</p>
                        </div>
                        <div className="hidden md:block w-28">
                          <div className={`inline-block px-2 py-0.5 text-[10px] font-semibold border rounded ${statusColor.bg} ${statusColor.text}`}>
                            {statusColor.label}
                          </div>
                        </div>
                        <div className="md:hidden ml-auto">
                          <div className={`px-2 py-0.5 text-[10px] font-semibold border rounded ${statusColor.bg} ${statusColor.text}`}>
                            {statusColor.label}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-[#FAF5E3] px-4 py-4 border-t border-[#EFE9CE]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-[#513E2F] uppercase tracking-wider mb-2">Book Details</h4>
                            <div className="space-y-1">
                              <p className="text-sm"><span className="font-semibold">ISBN:</span> {book.isbn || '—'}</p>
                              <p className="text-sm"><span className="font-semibold">Year:</span> {book.publication_year || '—'}</p>
                              {book.category_name && (
                                <p className="text-sm"><span className="font-semibold">Category:</span> {book.category_name}</p>
                              )}
                              {book.department_name && (
                                <p className="text-sm"><span className="font-semibold">Department:</span> {book.department_name}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#513E2F] uppercase tracking-wider mb-2">Description</h4>
                            <p className="text-sm text-[#706251]">
                              {book.description || 'No summary overview details provided for this book.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#EFE9CE]">
                          <button
                            onClick={() => openEditModal(book)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#DCD4C4] text-xs font-semibold text-[#513E2F] hover:bg-gray-50 rounded"
                          >
                            <Edit2 size={12} />
                            Modify
                          </button>
                          <button
                            onClick={() => handleDelete(book)}
                            disabled={isDeleting}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#FCE8E6] border border-[#F5C2BC] text-xs font-semibold text-[#C53030] hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F1E6] border border-[#DCD4C4] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-baskerville text-lg font-bold text-[#281711]">
                  {editingBook ? 'UPDATE BOOK REGISTRY' : 'CREATE BOOK REGISTRY'}
                </h2>
                <button onClick={closeModal}>
                  <X size={20} className="text-[#281711]" />
                </button>
              </div>
              <div className="h-px bg-[#DCD4C4] mb-5" />

              {/* Cover Image Upload */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#513E2F] mb-1">Cover Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 bg-[#F4F1EA] border border-[#DCD4C4] flex items-center justify-center overflow-hidden">
                    {formData.cover_image ? (
                      <img src={formData.cover_image} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-[#C4A77D]" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#513E2F] hover:bg-gray-50 rounded"
                  >
                    {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadingCover ? 'Uploading...' : 'Upload Image'}
                  </button>
                  {formData.cover_image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image: '' })}
                      className="p-2 text-[#C53030] hover:bg-red-50 rounded"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Book Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">ISBN *</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Availability Status</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, available: !formData.available })}
                    className={`w-full flex items-center justify-center gap-2 py-2 border rounded transition-colors ${
                      formData.available ? 'bg-[#281711] border-[#281711] text-white' : 'bg-white border-[#DCD4C4] text-[#281711]'
                    }`}
                  >
                    {formData.available ? <CheckCircle size={16} /> : <Circle size={16} />}
                    <span className="text-sm font-semibold">
                      {formData.available ? 'Set Active / Available' : 'Set Reserved / On Loan'}
                    </span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Publication Year</label>
                  <input
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] rounded"
                    placeholder={`1000-${new Date().getFullYear()}`}
                  />
                </div>

                {/* Author Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Author</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={authorSearch}
                      onChange={(e) => {
                        setAuthorSearch(e.target.value)
                        setShowAuthorDropdown(true)
                        if (e.target.value === '') setFormData({ ...formData, author: '' })
                      }}
                      onFocus={() => setShowAuthorDropdown(true)}
                      placeholder="Type to search authors..."
                      className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] rounded pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthorDropdown(!showAuthorDropdown)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <ChevronDown size={16} className="text-[#A1927F]" />
                    </button>
                  </div>
                  {showAuthorDropdown && filteredAuthors.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-[#DCD4C4] rounded shadow-lg max-h-40 overflow-y-auto">
                      {filteredAuthors.map((author) => (
                        <button
                          key={author.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, author: String(author.id) })
                            setAuthorSearch(author.name)
                            setShowAuthorDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-[#281711] hover:bg-gray-50 border-b border-[#EAE7DF] last:border-b-0"
                        >
                          {author.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Category</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value)
                        setShowCategoryDropdown(true)
                        if (e.target.value === '') setFormData({ ...formData, category: '' })
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder="Type to search categories..."
                      className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] rounded pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <ChevronDown size={16} className="text-[#A1927F]" />
                    </button>
                  </div>
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-[#DCD4C4] rounded shadow-lg max-h-40 overflow-y-auto">
                      {filteredCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, category: String(category.id) })
                            setCategorySearch(category.name)
                            setShowCategoryDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-[#281711] hover:bg-gray-50 border-b border-[#EAE7DF] last:border-b-0"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Department Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Department</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={departmentSearch}
                      onChange={(e) => {
                        setDepartmentSearch(e.target.value)
                        setShowDepartmentDropdown(true)
                        if (e.target.value === '') setFormData({ ...formData, department: '' })
                      }}
                      onFocus={() => setShowDepartmentDropdown(true)}
                      placeholder="Type to search departments..."
                      className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] rounded pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <ChevronDown size={16} className="text-[#A1927F]" />
                    </button>
                  </div>
                  {showDepartmentDropdown && filteredDepartments.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-[#DCD4C4] rounded shadow-lg max-h-40 overflow-y-auto">
                      {filteredDepartments.map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, department: String(dept.id) })
                            setDepartmentSearch(dept.name)
                            setShowDepartmentDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-[#281711] hover:bg-gray-50 border-b border-[#EAE7DF] last:border-b-0"
                        >
                          {dept.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] rounded resize-none"
                    placeholder="Enter descriptive metadata logs..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#DCD4C4]">
                <button
                  onClick={closeModal}
                  className="flex-1 border border-[#281711] py-2 text-sm font-semibold text-[#281711] hover:bg-gray-50 rounded"
                >
                  Discard
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending || uploadingCover}
                  className="flex-1 bg-[#281711] text-white py-2 text-sm font-semibold hover:bg-[#3D2A1E] rounded disabled:opacity-60"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'SAVING...' : (editingBook ? 'SAVE REVISIONS' : 'PUBLISH ENTRY')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}