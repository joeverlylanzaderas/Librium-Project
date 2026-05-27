// frontend/web/src/hooks/useBooks.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { booksService } from '@/services'

export const useBooks = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ['books', params],
    queryFn: () => booksService.listBooks(params),
    placeholderData: keepPreviousData, // <-- Correct v5 implementation
    staleTime: 1000 * 60 * 5,
  })

export const useBook = (id?: number) =>
  useQuery({
    queryKey: ['book', id],
    queryFn: () => (id ? booksService.getBook(id) : Promise.reject('No id')),
    enabled: !!id,
  })