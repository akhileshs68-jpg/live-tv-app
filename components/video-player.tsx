"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import Hls from "hls.js"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  X,
  Heart,
  AlertCircle,
  Zap,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Tv,
  Radio
} from "lucide-react"
import type { Channel } from "@/lib/types"
import { useFavorites } from "@/hooks/use-favorites"
import { useAuth } from "@/lib/auth-context"

interface VideoPlayerProps {
  channel: Channel
  onClose: () => void
}

export function VideoPlayer({ channel, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const { isFavorite, toggleFavorite } = useFavorites()
  const { addReward } = useAuth()
  const favorited = isFavorite(channel.id)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [watchedMinutes, setWatchedMinutes] = useState(0)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [useBackup, setUseBackup] = useState(false)
  const [useIframeFallback, setUseIframeFallback] = useState(false)

  const watchTimeRef = useRef(0)

  // Detect YouTube video or embed stream
  const isYouTube = Boolean(
    channel.youtubeId ||
    channel.streamType === "youtube" ||
    channel.url?.includes("youtube.com") ||
    channel.url?.includes("youtu.be") ||
    useIframeFallback
  )

  const extractYouTubeId = useCallback((url: string, explicitId?: string): string => {
    if (explicitId) return explicitId
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|.*[?&]v=))([\w-]{11})/)
    return match ? match[1] : ""
  }, [])

  const currentYoutubeId = extractYouTubeId(channel.url, channel.youtubeId)

  // Stream URL to use
  const activeStreamUrl = useBackup && channel.backupUrl ? channel.backupUrl : channel.url

  // Initialize HLS Player or Native Video
  useEffect(() => {
    if (isYouTube) {
      setIsLoading(false)
      setError(null)
      setIsPlaying(true)
      return
    }

    const video = videoRef.current
    if (!video || !activeStreamUrl) return

    setIsLoading(true)
    setError(null)

    // Cleanup previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const isHlsStream = activeStreamUrl.includes(".m3u8") || channel.streamType === "hls"

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      })

      hlsRef.current = hls
      hls.loadSource(activeStreamUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
        setError(null)
        video.play().then(() => setIsPlaying(true)).catch(() => {
          // Autoplay was blocked, user needs to click play
          setIsPlaying(false)
        })
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS network error, attempting recovery...", data)
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS media error, attempting recovery...", data)
              hls.recoverMediaError()
              break
            default:
              console.error("Fatal HLS stream error:", data)
              hls.destroy()
              setIsLoading(false)
              if (channel.backupUrl && !useBackup) {
                setUseBackup(true)
              } else if (channel.youtubeId) {
                setUseIframeFallback(true)
              } else {
                setError("Stream is currently offline or undergoing maintenance.")
              }
              break
          }
        }
      })
    } else if (video.canPlayType("application/vnd.apple.mpegurl") || !isHlsStream) {
      // Native HLS (Safari/iOS) or regular MP4 stream
      video.src = activeStreamUrl
      video.load()
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      // Fallback
      video.src = activeStreamUrl
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [activeStreamUrl, channel, isYouTube, useBackup, useIframeFallback])

  // Watch Time & Coins Accrual Engine
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      watchTimeRef.current += 1
      const minutes = Math.floor(watchTimeRef.current / 60)
      setWatchedMinutes(minutes)

      // Award 2 coins every 30 seconds of active playback
      if (watchTimeRef.current % 30 === 0) {
        const coins = 2
        setEarnedCoins((prev) => prev + coins)
        try {
          addReward({
            type: "watch",
            amount: coins,
            description: `Watched ${channel.name} live stream`,
          })
        } catch (e) {
          console.error("Reward error:", e)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, channel.name, addReward])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const nextMuted = !isMuted
    videoRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const handleVolumeChange = (values: number[]) => {
    const val = values[0]
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val
      if (val === 0) {
        videoRef.current.muted = true
        setIsMuted(true)
      } else if (isMuted) {
        videoRef.current.muted = false
        setIsMuted(false)
      }
    }
  }

  const toggleFullscreen = async () => {
    try {
      const targetElement = isFullscreen ? null : (modalRef.current || containerRef.current)
      if (!isFullscreen && targetElement) {
        if (targetElement.requestFullscreen) {
          await targetElement.requestFullscreen()
        } else if ((targetElement as any).webkitRequestFullscreen) {
          await (targetElement as any).webkitRequestFullscreen()
        }
      } else if (isFullscreen) {
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle:", err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const retryStream = () => {
    setError(null)
    setIsLoading(true)
    if (channel.backupUrl && !useBackup) {
      setUseBackup(true)
    } else if (currentYoutubeId) {
      setUseIframeFallback(true)
    } else {
      const video = videoRef.current
      if (video) {
        video.load()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <Card
        ref={modalRef}
        className="w-full max-w-5xl bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Bar */}
        <div className="p-3 sm:p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-8 h-8 rounded object-contain bg-zinc-900 border border-zinc-800 p-0.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none"
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                <Tv className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg truncate text-zinc-100">
                  {channel.name}
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-600/90 text-white px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  LIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {channel.category || "TV Channel"} • {channel.language || "Multi-Language"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(channel)}
              className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
              title={favorited ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart className={`w-5 h-5 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Video Player Container */}
        <div ref={containerRef} className="aspect-video bg-black relative flex items-center justify-center">
          {isYouTube && currentYoutubeId ? (
            <iframe
              className="w-full h-full border-0"
              src={`https://www.youtube-nocookie.com/embed/${currentYoutubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0`}
              title={channel.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <>
              {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                  <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-3" />
                  <p className="text-zinc-300 text-sm font-medium">Connecting live stream...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-20 p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                  <p className="text-zinc-200 font-semibold mb-1">Stream Unavailable</p>
                  <p className="text-zinc-400 text-xs max-w-md mb-4">{error}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={retryStream} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Retry Stream
                    </Button>
                    {channel.youtubeId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setUseIframeFallback(true)}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Play via YouTube Live
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                controls={false}
                onCanPlay={() => {
                  setIsLoading(false)
                  setError(null)
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => {
                  setIsLoading(false)
                  if (channel.backupUrl && !useBackup) {
                    setUseBackup(true)
                  } else if (currentYoutubeId) {
                    setUseIframeFallback(true)
                  } else {
                    setError("Stream temporarily offline. Please select another channel.")
                  }
                }}
              />

              {/* Custom Bottom Controls Bar for HLS */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between opacity-90 hover:opacity-100 transition-opacity z-10">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="w-20 sm:w-24 hidden xs:block">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        min={0}
                        max={1}
                        step={0.05}
                        onValueChange={handleVolumeChange}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    2 coins / 30s
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Statistics & Info Bar */}
        <div className="p-3 sm:p-4 bg-zinc-900/90 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1.5 rounded-md text-zinc-300">
              <span className="text-zinc-500">Watch Time:</span>
              <span className="font-semibold text-zinc-100 font-mono">{watchedMinutes} min</span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-md text-amber-400">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Earned:</span>
              <span className="font-bold font-mono">+{earnedCoins} Coins</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            {channel.country && <span className="bg-zinc-800 px-2 py-1 rounded">{channel.country}</span>}
            {channel.globalCategory && (
              <span className="bg-zinc-800 px-2 py-1 rounded">{channel.globalCategory}</span>
            )}
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <Radio className="w-3 h-3 animate-pulse" /> Live Stream Active
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
