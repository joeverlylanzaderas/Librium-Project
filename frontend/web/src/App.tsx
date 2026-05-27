// frontend/web/src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import AppRouter from '@/app/router'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useToast } from '@/hooks/useToast'
import './index.css'

function AppContent() {
  const { toasts, dismiss } = useToast()
  
  return (
    <>
      <AppRouter />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}