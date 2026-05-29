"use client"

import React, { useRef, useEffect, useState } from "react"
import { X, Minimize2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface YouTubePlayerProps {
  videoId: string
  onClose: () => void
}

export function YouTubePlayer({ videoId, onClose }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen()
        }
        setIsFullscreen(true)
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen?.()
        }
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error("[v0] Fullscreen error:", err)
    }
  }

  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement
    )
    setIsFullscreen(isCurrentlyFullscreen)
  }

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
    }
  }, [])

  if (isFullscreen) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-black">
          <div className="w-full h-full relative">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&fs=1&rel=0`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2 z-20 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="bg-black/50 hover:bg-black/70 text-white"
            title="Exit fullscreen"
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl">
        {/* Player Container */}
        <div ref={containerRef} className="w-full aspect-video bg-black relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&fs=1&rel=0`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Controls */}
        <div className="bg-card border-t border-border p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Watch on YouTube or use the fullscreen button for better viewing
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              YouTube
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              Fullscreen
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
