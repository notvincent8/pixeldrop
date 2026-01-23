import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Catches JavaScript errors in child components.
 * Useful for graceful recovery from WebGL/Canvas crashes.
 *
 * @example
 * <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *   <Canvas />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)

    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-neutral-950 p-4 text-white">
            <p className="text-lg">Something went wrong</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
            >
              Try again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}