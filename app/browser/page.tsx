'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLoadingScreen } from '@/components/auth-loading-screen'
import { InAppBrowser } from '@/components/in-app-browser'

export default function BrowserPage() {
  const { isAuthenticated, loading } = useAuth()

  if (loading || !isAuthenticated) {
    return <AuthLoadingScreen />
  }

  return <InAppBrowser />
}
