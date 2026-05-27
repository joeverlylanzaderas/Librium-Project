// frontend/web/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        1000 * 60 * 5,   // 5 min — data stays fresh
      gcTime:           1000 * 60 * 10,  // 10 min — cache kept in memory
      retry:            1,               // one retry on failure
      refetchOnWindowFocus: false,       // don't refetch on tab focus
    },
    mutations: {
      retry: 0,
    },
  },
})