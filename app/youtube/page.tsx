"use client"

import React from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"
import { YouTubeBrowser } from "@/components/youtube-browser"

export default function YouTubePage() {
  const { isAuthenticated, loading } = useAuth()

  if (loading || !isAuthenticated) {
    return <AuthLoadingScreen />
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <YouTubeBrowser />
    </div>
  )
}
