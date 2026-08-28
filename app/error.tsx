'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.warn('[RouteError] Caught route segment runtime exception:', error)
  }, [error])

  const isChunkError =
    error?.name === 'ChunkLoadError' ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('app/layout')

  const handleReset = () => {
    if (isChunkError && typeof window !== 'undefined') {
      try {
        const lastReload = sessionStorage.getItem('chunk_reload_ts')
        const now = Date.now()
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('chunk_reload_ts', String(now))
          window.location.reload()
          return
        }
      } catch (e) {
        // ignore
      }
    }
    reset()
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold mb-2">
        {isChunkError ? 'Update Available or Loading Delay' : 'Section Unable to Load'}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {isChunkError
          ? 'A new version or network hiccup occurred while fetching this component.'
          : 'An unexpected runtime hiccup occurred in this section. Live TV remains active.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={handleReset} variant="default" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {isChunkError ? 'Reload Application' : 'Try Again'}
        </Button>
        <Button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/'
          }}
          variant="outline"
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Go to Home
        </Button>
      </div>
    </div>
  )
}
