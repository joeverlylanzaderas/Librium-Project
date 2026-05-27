// frontend/web/src/components/member/MemberBookmarksScreen.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBookmarks, deleteBookmark } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import { Heart, Loader2, Search, X, BookOpen } from 'lucide-react'
import { format } from 'date-fns'

type BookmarkWithDetails = {
  id: number
  book: number
  book_title: string
  book_cover: string | null
  bookmarked_date: string
}

export default function MemberBookmarksScreen() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: bookmarksResponse, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: getBookmarks,
  })
  const bookmarks = extractData<BookmarkWithDetails[]>(bookmarksResponse) || []

  const deleteMutation = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      toast({ title: 'Success', description: 'Bookmark removed' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: 'Failed to remove bookmark', variant: 'destructive' })
    },
  })

  const filteredBookmarks = bookmarks.filter((bookmark) =>
    bookmark.book_title?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#281711] font-baskerville">My Bookmarks</h1>
          <p className="text-sm text-[#706251] mt-1">Books you've saved for later</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center bg-white border border-[#DCD4C4] rounded-lg px-3 py-2">
            <Search size={16} className="text-[#A1927F] mr-2" />
            <input
              type="text"
              placeholder="Search bookmarks..."
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

        {/* Bookmarks Grid */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EFE9CE] rounded-lg">
            <Heart size={48} className="mx-auto text-[#A1927F] mb-3" />
            <p className="text-[#706251]">
              {search ? `No results for "${search}"` : 'No bookmarks yet. Start saving books you love!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-white border border-[#EFE9CE] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex">
                  {/* Book Cover */}
                  <div className="w-24 h-32 bg-[#F4F1EA] flex items-center justify-center border-r border-[#DCD4C4]">
                    {bookmark.book_cover ? (
                      <img src={bookmark.book_cover} alt={bookmark.book_title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={24} className="text-[#C4A77D]" />
                    )}
                  </div>
                  
                  {/* Book Info */}
                  <div className="flex-1 p-3">
                    <h3 className="font-bold text-[#281711] text-sm font-baskerville line-clamp-2">{bookmark.book_title}</h3>
                    <p className="text-xs text-[#706251] mt-2">
                      Saved: {format(new Date(bookmark.bookmarked_date), 'MMM d, yyyy')}
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Remove this bookmark?')) {
                          deleteMutation.mutate(bookmark.id)
                        }
                      }}
                      className="mt-3 text-xs text-[#C53030] hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                      <Heart size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}