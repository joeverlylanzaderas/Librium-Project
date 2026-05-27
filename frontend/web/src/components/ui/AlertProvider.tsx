// frontend/web/src/components/ui/AlertProvider.tsx
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

type AlertVariant = 'default' | 'danger' | 'success' | 'warning'

type AlertButton = {
  text: string
  onPress?: () => void
  variant?: AlertVariant
}

type AlertState = {
  visible: boolean
  title: string
  message: string
  buttons: AlertButton[]
  cancelable: boolean
  variant?: AlertVariant
}

type AlertContextValue = {
  showAlert: (title: string, message?: string, options?: { buttonText?: string; onClose?: () => void; variant?: AlertVariant }) => void
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; confirmVariant?: AlertVariant }
  ) => void
  closeAlert: () => void
}

const AlertContext = createContext<AlertContextValue>({
  showAlert: () => {},
  showConfirm: () => {},
  closeAlert: () => {},
})

export const useAlert = () => useContext(AlertContext)

const getIcon = (variant?: AlertVariant) => {
  switch (variant) {
    case 'danger':
      return <XCircle size={24} className="text-[#C53030]" />
    case 'success':
      return <CheckCircle size={24} className="text-[#137333]" />
    case 'warning':
      return <AlertCircle size={24} className="text-[#D97706]" />
    default:
      return <Info size={24} className="text-[#C17B2E]" />
  }
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    cancelable: true,
  })

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }))
  }, [])

  const showAlert = useCallback(
    (title: string, message = '', options?: { buttonText?: string; onClose?: () => void; variant?: AlertVariant }) => {
      const onOk = () => {
        close()
        options?.onClose?.()
      }

      setState({
        visible: true,
        title,
        message,
        cancelable: true,
        variant: options?.variant || 'default',
        buttons: [{ text: options?.buttonText ?? 'OK', onPress: onOk, variant: 'default' }],
      })
    },
    [close]
  )

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      options?: { confirmText?: string; cancelText?: string; confirmVariant?: AlertVariant }
    ) => {
      const handleConfirm = () => {
        close()
        onConfirm()
      }
      const handleCancel = () => {
        close()
      }

      setState({
        visible: true,
        title,
        message,
        cancelable: true,
        variant: options?.confirmVariant || 'danger',
        buttons: [
          { text: options?.cancelText ?? 'Cancel', onPress: handleCancel, variant: 'default' },
          { text: options?.confirmText ?? 'Confirm', onPress: handleConfirm, variant: options?.confirmVariant || 'danger' },
        ],
      })
    },
    [close]
  )

  // Override native window.confirm
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalConfirm = window.confirm
    window.confirm = (message?: string): boolean => {
      showConfirm('Confirm', message || 'Are you sure?', () => {}, {
        confirmText: 'OK',
        cancelText: 'Cancel',
      })
      return true
    }

    return () => {
      window.confirm = originalConfirm
    }
  }, [showConfirm])

  // Override native window.alert
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalAlert = window.alert
    window.alert = (message?: any) => {
      showAlert('Notice', String(message ?? ''))
    }

    return () => {
      window.alert = originalAlert
    }
  }, [showAlert])

  const contextValue = useMemo(() => ({ showAlert, showConfirm, closeAlert: close }), [showAlert, showConfirm, close])

  // Get icon based on variant
  const Icon = getIcon(state.variant)

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      
      {/* Custom Modal */}
      {state.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6" onClick={close}>
          <div 
            className="w-full max-w-md bg-[#FFFDF9] rounded-2xl border border-[#DCD4C4] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#F4F1EA]">
                  {Icon}
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-lg font-bold text-[#1C1008] text-center mb-2 font-serif">
                {state.title}
              </h2>
              
              {/* Message */}
              {state.message && (
                <p className="text-sm text-[#4A3520] text-center leading-relaxed mb-5">
                  {state.message}
                </p>
              )}
              
              {/* Buttons */}
              <div className={`flex ${state.buttons.length > 1 ? 'gap-2' : 'justify-center'}`}>
                {state.buttons.map((button, index) => {
                  const isPrimary = button.variant === 'danger' || button.variant === 'success' || button.variant === 'warning'
                  const isCancel = button.text === 'Cancel' || button.variant === 'default'
                  
                  return (
                    <button
                      key={index}
                      onClick={button.onPress || close}
                      className={`
                        px-4 py-2 rounded-lg font-semibold text-sm transition-colors
                        ${state.buttons.length > 1 ? 'flex-1' : 'px-6'}
                        ${isPrimary && button.variant === 'danger' ? 'bg-[#C53030] hover:bg-[#9B2C2C] text-white' : ''}
                        ${isPrimary && button.variant === 'success' ? 'bg-[#137333] hover:bg-[#0E5A2A] text-white' : ''}
                        ${isPrimary && button.variant === 'warning' ? 'bg-[#D97706] hover:bg-[#B45309] text-white' : ''}
                        ${isPrimary && !button.variant ? 'bg-[#281711] hover:bg-[#3D2A1E] text-white' : ''}
                        ${isCancel && !isPrimary ? 'border border-[#DCD4C4] bg-white text-[#706251] hover:bg-gray-50' : ''}
                      `}
                    >
                      {button.text}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  )
}