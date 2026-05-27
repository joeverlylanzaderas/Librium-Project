// frontend/web/src/hooks/useApiData.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

// Helper to extract data from axios response
export function extractData<T>(response: any): T {
  return response?.data?.results || response?.data || response
}

// Enhanced useQuery wrapper that automatically extracts data
export function useApiQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<any, TError, TData>
) {
  return useQuery({
    ...options,
    select: (data) => extractData<TData>(data),
  })
}