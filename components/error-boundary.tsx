'use client'

import React, { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
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
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  public componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    }
  }

  public componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
    }
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const msg = String(reason?.message || reason || '')
    // Prevent non-fatal background promise rejections (heartbeat, analytics, network glitches) from breaking the UI
    if (
      msg.includes('heartbeat') ||
      msg.includes('analytics') ||
      msg.includes('pi-sdk') ||
      msg.includes('429') ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('cancelled')
    ) {
      console.warn('[GlobalAsyncGuard] Prevented background promise rejection from crashing UI:', msg)
      event.preventDefault()
    }
  }

  private handleRetry = () => {
    const errStr = String(this.state.error?.message || this.state.error || '')
    if (
      errStr.includes('Loading chunk') ||
      errStr.includes('ChunkLoadError') ||
      errStr.includes('dynamically imported module')
    ) {
      if (typeof window !== 'undefined') {
        window.location.reload()
        return
      }
    }
    this.setState({ hasError: false, error: null })
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            The app could not load this section.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="default"
              onClick={this.handleRetry}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={this.handleGoHome}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
