"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Heart, AlertCircle, Zap, Maximize2, Minimize2 } from "lucide-react"
import type { Channel } from "@/lib/types"
import { useFavorites } from "@/hooks/use-favorites"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"

interface VideoPlayerProps {
  channel: Channel
  onClose: () => void
}

export function VideoPlayer({ channel, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const { isFavorite, toggleFavorite } = useFavorites()
  const { user, addReward } = useAuth()
  const favorited = isFavorite(channel.id)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [watchedMinutes, setWatchedMinutes] = useState(0)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const watchTimeRef = useRef(0)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      setIsLoading(true)
      setError(null)
    }
  }, [channel.url])

  const handleCanPlay = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleError = () => {
    setIsLoading(false)
    setError("Stream not working. The stream may be offline or unavailable at this moment. Try another channel.")
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  // Track watch time and reward coins
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      watchTimeRef.current += 1
      const minutes = Math.floor(watchTimeRef.current / 60)
      setWatchedMinutes(minutes)

      // Award 1 coin every 30 seconds of watching (2 coins per minute)
      if (watchTimeRef.current % 30 === 0) {
        const coins = 2
        setEarnedCoins((prev) => prev + coins)
        addReward?.({
          type: 'watch',
          amount: coins,
          description: `Watched ${channel.name} for ${minutes} minutes`,
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, channel.name, addReward])

  const toggleFullscreen = async () => {
    try {
      const targetElement = isFullscreen ? null : (modalRef.current || containerRef.current)
      
      if (!isFullscreen && targetElement) {
        // Enter fullscreen
        if (targetElement.requestFullscreen) {
          await targetElement.requestFullscreen()
        } else if ((targetElement as any).webkitRequestFullscreen) {
          await (targetElement as any).webkitRequestFullscreen()
        } else if ((targetElement as any).mozRequestFullScreen) {
          await (targetElement as any).mozRequestFullScreen()
        } else if ((targetElement as any).msRequestFullscreen) {
          await (targetElement as any).msRequestFullscreen()
        }
      } else if (isFullscreen) {
        // Exit fullscreen
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen?.()
        } else if ((document as any).mozFullScreenElement) {
          await (document as any).mozCancelFullScreen?.()
        } else if ((document as any).msFullscreenElement) {
          await (document as any).msExitFullscreen?.()
        }
      }
    } catch (err) {
      console.error("[v0] Fullscreen error:", err)
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("msfullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("msfullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleFullscreenClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFullscreen()
  }

  if (isFullscreen) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        <div className="flex-1 flex items-center justify-center bg-black">
          <div className="w-full h-full relative">
            {isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                  <p className="text-white text-sm">Loading stream...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-white text-sm">{error}</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
              onCanPlay={handleCanPlay}
              onError={handleError}
              onPlay={handlePlay}
              onPause={handlePause}
            >
              <source src={channel.url} type="application/x-mpegURL" />
              <source src={channel.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2 z-20 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreenClick}
            className="bg-black/50 hover:bg-black/70 text-white relative z-30"
            title="Exit fullscreen"
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
      <Card ref={modalRef} className="w-full max-w-4xl bg-card border-border pointer-events-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate text-foreground">{channel.name}</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => toggleFavorite(channel)}
              title={favorited ? "Remove from Favorites" : "Add to Favorites"}
              className="pointer-events-auto"
            >
              <Heart className={`w-5 h-5 ${favorited ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </Button>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreenClick}
              title="Enter fullscreen"
              className="pointer-events-auto"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="pointer-events-auto">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="aspect-video bg-black relative">
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                <p className="text-white text-sm">Loading stream...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-white text-sm">{error}</p>
              </div>
            </div>
          )}
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
            onCanPlay={handleCanPlay}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
          >
            <source src={channel.url} type="application/x-mpegURL" />
            <source src={channel.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="p-4 bg-card">
          <div className="flex flex-wrap gap-3 mb-3">
            {/* Watch Time Stats */}
            <div className="flex items-center gap-2 text-sm bg-secondary/50 px-3 py-1.5 rounded-md">
              <span className="text-muted-foreground">Watched:</span>
              <span className="font-semibold text-foreground">{watchedMinutes}m</span>
            </div>

            {/* Earned Coins Display */}
            {earnedCoins > 0 && (
              <div className="flex items-center gap-2 text-sm bg-accent/20 px-3 py-1.5 rounded-md border border-accent/30">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Earned:</span>
                <span className="font-semibold text-accent">+{earnedCoins}</span>
              </div>
            )}

            {/* Channel Info */}
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground ml-auto">
              {channel.category && <span>Category: {channel.category}</span>}
              {channel.globalCategory && <span>• Type: {channel.globalCategory}</span>}
              {channel.language && <span>• Language: {channel.language}</span>}
              {channel.country && <span>• Country: {channel.country}</span>}
            </div>
          </div>

          {error && (
            <div className="mt-3">
              <Alert variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
