// frontend/web/src/hooks/useAuth.ts
import { useMutation, useQuery } from '@tanstack/react-query'
import { authService } from '@/services'
import { useAuthStore } from '@/store/auth.store'

export const useLogin = () => {
  const setUser = useAuthStore((s) => s.setUser)
  const hydrate = useAuthStore((s) => s.hydrate)

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login({ email, password }),
    onSuccess: ({ tokens, user }) => {
      hydrate(user, tokens.access, tokens.refresh)
      setUser(user)
    },
  })
}

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe(),
    retry: 1,
    staleTime: 1000 * 60 * 5,
    // Note: onSuccess was removed for useQuery in v5.
    // Sync state down in your UI layout or navbar components using useEffect instead.
  })
}