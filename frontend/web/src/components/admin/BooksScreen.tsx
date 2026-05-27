// frontend/web/src/components/admin/BooksScreen.tsx
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getBooks, createBook, updateBook, deleteBook,
  getAuthors, getCategories, getDepartments
} from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { Author, Category, Department } from '@shared/types/book'
import { Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp, X, Image as ImageIcon, Upload, Loader2 } from 'lucide-react'

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dz5b4xsjy'
const CLOUDINARY_UPLOAD_PRESET = 'librium_covers'

// Extended book type with flattened fields from API
type BookWithFlattenedFields = {
  id: number
  title: string
  isbn: string
  publication_year: number | null
  author: number
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

export default function BooksScreen() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'borrowed'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<BookWithFlattenedFields | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
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

  // Queries with real-time updates
  const { data: booksResponse, isLoading: booksLoading, refetch: refetchBooks } = useQuery({
    queryKey: ['books'],
    queryFn: getBooks,
    // Refresh every 10 seconds
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
  const books = extractData<BookWithFlattenedFields[]>(booksResponse) || []

  const { data: authorsResponse, refetch: refetchAuthors } = useQuery({
    queryKey: ['authors'],
    queryFn: getAuthors,
  })
  const authors = extractData<Author[]>(authorsResponse) || []

  const { data: categoriesResponse, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const categories = extractData<Category[]>(categoriesResponse) || []

  const { data: departmentsResponse, refetch: refetchDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })
  const departments = extractData<Department[]>(departmentsResponse) || []

  // Auto-refresh when component mounts
  useEffect(() => {
    refetchBooks()
    refetchAuthors()
    refetchCategories()
    refetchDepartments()
  }, [refetchBooks, refetchAuthors, refetchCategories, refetchDepartments])

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

  // Mutations with optimistic updates
  const createMutation = useMutation({
    mutationFn: createBook,
    onMutate: async (newBook) => {
      await queryClient.cancelQueries({ queryKey: ['books'] })
      const previousBooks = queryClient.getQueryData(['books'])
      
      // Optimistically add to cache
      queryClient.setQueryData(['books'], (old: any) => {
        const books = extractData<BookWithFlattenedFields[]>(old) || []
        const tempId = -Date.now()
        const optimisticBook = {
          ...newBook,
          id: tempId,
          author_name: authors.find(a => a.id === newBook.author)?.name || '',
          category_name: categories.find(c => c.id === newBook.category)?.name || '',
          department_name: departments.find(d => d.id === newBook.department)?.name || '',
        }
        return { ...old, data: { results: [optimisticBook, ...books] } }
      })
      
      return { previousBooks }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Book created successfully' })
      closeModal()
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousBooks) {
        queryClient.setQueryData(['books'], context.previousBooks)
      }
      const errorMsg = error?.response?.data?.publication_year?.[0] ||
                       error?.response?.data?.isbn?.[0] ||
                       error?.response?.data?.message ||
                       'Failed to create book'
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateBook(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['books'] })
      const previousBooks = queryClient.getQueryData(['books'])
      
      // Optimistically update cache
      queryClient.setQueryData(['books'], (old: any) => {
        const books = extractData<BookWithFlattenedFields[]>(old) || []
        const updatedBooks = books.map(book =>
          book.id === id ? { ...book, ...data, author_name: authors.find(a => a.id === data.author)?.name || book.author_name } : book
        )
        return { ...old, data: { results: updatedBooks } }
      })
      
      return { previousBooks }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Book updated successfully' })
      closeModal()
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousBooks) {
        queryClient.setQueryData(['books'], context.previousBooks)
      }
      const errorMsg = error?.response?.data?.publication_year?.[0] ||
                       error?.response?.data?.isbn?.[0] ||
                       error?.response?.data?.message ||
                       'Failed to update book'
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['books'] })
      const previousBooks = queryClient.getQueryData(['books'])
      
      // Optimistically remove from cache
      queryClient.setQueryData(['books'], (old: any) => {
        const books = extractData<BookWithFlattenedFields[]>(old) || []
        const filteredBooks = books.filter(book => book.id !== id)
        return { ...old, data: { results: filteredBooks } }
      })
      
      return { previousBooks }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'Book deleted successfully' })
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousBooks) {
        queryClient.setQueryData(['books'], context.previousBooks)
      }
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to delete book', variant: 'destructive' })
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

  const validateYear = (year: string): boolean => {
    const currentYear = new Date().getFullYear()
    const yearNum = parseInt(year)
    return !isNaN(yearNum) && yearNum >= 1000 && yearNum <= currentYear
  }

  const handleSubmit = () => {
    if (!formData.title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' })
      return
    }
    if (!formData.isbn) {
      toast({ title: 'Error', description: 'ISBN is required', variant: 'destructive' })
      return
    }
    
    if (formData.publication_year && !validateYear(formData.publication_year)) {
      const currentYear = new Date().getFullYear()
      toast({ 
        title: 'Error', 
        description: `Publication year must be between 1000 and ${currentYear}`, 
        variant: 'destructive' 
      })
      return
    }

    const payload: any = {
      title: formData.title,
      isbn: formData.isbn,
      available: formData.available,
    }

    if (formData.publication_year) {
      payload.publication_year = parseInt(formData.publication_year)
    }
    if (formData.description) {
      payload.description = formData.description
    }
    if (formData.cover_image) {
      payload.cover_image = formData.cover_image
    }
    if (formData.author && parseInt(formData.author)) {
      payload.author = parseInt(formData.author)
    }
    if (formData.category && parseInt(formData.category)) {
      payload.category = parseInt(formData.category)
    }
    if (formData.department && parseInt(formData.department)) {
      payload.department = parseInt(formData.department)
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#281711]"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-[#FCFAEE] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#DCD4C4]">
          <h1 className="text-xl font-bold text-[#281711] font-baskerville">
            Books Catalog ({filteredBooks.length})
          </h1>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#281711] text-[#F4EFE0] px-4 py-2 hover:bg-[#3D2A1E] transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-semibold">Add Book</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center bg-white border border-[#DCD4C4] px-3 py-2">
            <Search size={16} className="text-[#A1927F] mr-2" />
            <input
              type="text"
              placeholder="Search catalog…"
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

          <div className="flex gap-2 flex-wrap">
            {(['all', 'available', 'borrowed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter)}
                className={`px-4 py-1.5 text-xs font-semibold border transition-colors ${
                  filterStatus === filter
                    ? 'bg-[#281711] border-[#281711] text-[#F4EFE0]'
                    : 'bg-white border-[#DCD4C4] text-[#706251] hover:bg-gray-50'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid - rest of the JSX remains the same */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#706251]">No books found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => {
              const isExpanded = expandedId === book.id
              const statusColor = book.available 
                ? { bg: '#E6F4EA', text: '#137333', border: '#B7DFC4', label: 'Available' }
                : { bg: '#FCE8E6', text: '#8A2B2B', border: '#F5C2BC', label: 'On Loan' }

              return (
                <div key={book.id} className="bg-white border border-[#412D15] overflow-hidden">
                  <div className="p-4">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-12 bg-[#F4F1EA] flex items-center justify-center border border-[#DCD4C4]">
                          {book.cover_image ? (
                            <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-[#C4A77D]" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#281711] text-sm font-baskerville">{book.title}</h3>
                          <p className="text-xs text-[#706251]">{book.author_name || '—'}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-xs font-semibold border ${statusColor.bg} ${statusColor.text}`}>
                        {statusColor.label}
                      </div>
                    </div>

                    {/* ISBN */}
                    <div className="hidden md:block text-xs text-[#706251] mb-2">
                      ISBN: {book.isbn || '—'}
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : book.id)}
                      className="w-full flex justify-between items-center text-xs font-semibold text-[#513E2F] border-t border-[#DCD4C4] pt-3 mt-2"
                    >
                      <span>{isExpanded ? 'Collapse Details' : 'View Complete Record Profile'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#EFECE6] space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {book.category_name && (
                            <div>
                              <span className="text-[#A1927F]">Category:</span>
                              <span className="ml-2 text-[#281711]">{book.category_name}</span>
                            </div>
                          )}
                          {book.department_name && (
                            <div>
                              <span className="text-[#A1927F]">Dept:</span>
                              <span className="ml-2 text-[#281711]">{book.department_name}</span>
                            </div>
                          )}
                          {book.publication_year && (
                            <div>
                              <span className="text-[#A1927F]">Year:</span>
                              <span className="ml-2 text-[#281711]">{book.publication_year}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-[#4A3E3D] mt-2">
                          {book.description || 'No summary available.'}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3 pt-2 border-t border-[#F3F1EC]">
                          <button
                            onClick={() => openEditModal(book)}
                            className="flex-1 flex items-center justify-center gap-1 bg-white border border-[#DCD4C4] py-2 text-xs font-semibold text-[#513E2F] hover:bg-gray-50"
                          >
                            <Edit2 size={12} />
                            Edit Book
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently remove "${book.title}" from the catalog?`)) {
                                deleteMutation.mutate(book.id)
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1 bg-[#FCE8E6] border border-[#F5C2BC] py-2 text-xs font-semibold text-[#C53030] hover:bg-red-50"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal - remains the same */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F1E6] border border-[#DCD4C4] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-baskerville text-lg font-bold text-[#281711]">
                  {editingBook ? 'EDIT BOOK' : 'ADD NEW BOOK'}
                </h2>
                <button onClick={closeModal}>
                  <X size={20} className="text-[#281711]" />
                </button>
              </div>
              <div className="h-px bg-[#DCD4C4] mb-6" />

              {/* Cover Image Upload Section - remains the same */}
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
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#513E2F] hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
                  >
                    {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadingCover ? 'Uploading...' : 'Upload Image'}
                  </button>
                  
                  {formData.cover_image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image: '' })}
                      className="p-2 text-[#C53030] hover:bg-red-50 rounded transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#A1927F] mt-1">Recommended: 2:3 aspect ratio, max 2MB</p>
              </div>

              {/* Rest of the form remains the same */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Title *</label>
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
                  <label className="block text-xs font-semibold text-[#513E2F] mb-1">Publication Year</label>
                  <input
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] rounded"
                    placeholder={`1000-${new Date().getFullYear()}`}
                    min={1000}
                    max={new Date().getFullYear()}
                  />
                </div>

                {/* Searchable Author Dropdown */}
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

                {/* Searchable Category Dropdown */}
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

                {/* Searchable Department Dropdown */}
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
                    placeholder="Brief synopsis or notes…"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#DCD4C4]">
                <button
                  onClick={closeModal}
                  className="flex-1 border border-[#281711] py-2 text-sm font-semibold text-[#281711] hover:bg-gray-50 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending || uploadingCover}
                  className="flex-1 bg-[#281711] text-white py-2 text-sm font-semibold hover:bg-[#3D2A1E] rounded disabled:opacity-60"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'SAVING...' : (editingBook ? 'UPDATE' : 'SAVE')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
