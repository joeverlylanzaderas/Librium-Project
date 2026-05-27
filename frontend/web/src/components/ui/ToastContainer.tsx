// frontend/web/src/components/ui/ToastContainer.tsx
import { Toast, ToastVariant } from '@/hooks/useToast'

interface ToastContainerProps {
  toasts: Toast[]
  dismiss: (id: string) => void
}

export function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null
  
  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-50 border border-red-200 text-red-800'
      case 'success':
        return 'bg-green-50 border border-green-200 text-green-800'
      default:
        return 'bg-white border border-gray-200 text-gray-800'
    }
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded shadow-lg max-w-sm ${getVariantStyles(toast.variant || 'default')}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs mt-1 opacity-80">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}