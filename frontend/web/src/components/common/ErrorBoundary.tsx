import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught boundary breakdown error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#1E120C] text-[#F4EFE0] p-6 text-center">
          <div className="bg-[#281711] border border-[#C59568] max-w-xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-[#C59568] mb-3" style={{ fontFamily: "'Gloock', serif" }}>
              APPLICATION ERROR
            </h1>
            <p className="text-sm opacity-80 mb-4">
              An error occurred while rendering this view workspace interface.
            </p>
            <pre className="bg-black/40 text-red-300 text-xs p-4 overflow-x-auto text-left rounded font-mono max-h-40 mb-6">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.assign('/')}
              className="px-5 py-2 bg-[#C59568] text-[#1E120C] text-xs font-bold tracking-wider hover:opacity-90 transition-opacity"
            >
              RELOAD APPLICATION
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}