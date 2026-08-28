'use client'

import React from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
          <h1 className="text-xl font-bold text-red-400">Application Recovered</h1>
          <p className="text-sm text-zinc-400">
            A root rendering exception occurred. Tap below to reload and restore live streaming.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload()
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
