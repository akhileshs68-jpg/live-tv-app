"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import type HlsType from "hls.js"
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
  Tv,
  Radio,
  Expand,
} from "lucide-react"
import type { Channel } from "@/lib/types"
import { useFavorites } from "@/hooks/use-favorites"
import { useAuth } from "@/lib/auth-context"

interface VideoPlayerProps {
  channel: Channel
  onClose: () => void
}

type PlayerState = "idle" | "loading" | "playing" | "paused" | "buffering" | "error" | "retrying"
type FitMode = "contain" | "cover" | "fill"

export function VideoPlayer({ channel, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HlsType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { isFavorite, toggleFavorite } = useFavorites()
  const { updateUserCoins, piAccessToken, syncServerBalance } = useAuth()
  const favorited = isFavorite(channel.id)

  const [playerState, setPlayerState] = useState<PlayerState>("loading")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [watchedMinutes, setWatchedMinutes] = useState(0)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [useBackup, setUseBackup] = useState(false)
  const [useIframeFallback, setUseIframeFallback] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [fitMode, setFitMode] = useState<FitMode>("contain")

  const watchTimeRef = useRef(0)
  const piAccessTokenRef = useRef(piAccessToken)
  piAccessTokenRef.current = piAccessToken

  const updateUserCoinsRef = useRef(updateUserCoins)
  updateUserCoinsRef.current = updateUserCoins

  const syncServerBalanceRef = useRef(syncServerBalance)
  syncServerBalanceRef.current = syncServerBalance

  const channelRef = useRef({ id: channel.id, name: channel.name })
  channelRef.current = { id: channel.id, name: channel.name }

  const isSendingHeartbeatRef = useRef(false)
  const isActuallyPlayingRef = useRef(false)

  // Detect YouTube video or embed stream
  const isYouTube = Boolean(
    channel.youtubeId ||
    channel.streamType === "youtube" ||
    channel.url?.includes("youtube.com") ||
    channel.url?.includes("youtu.be") ||
    useIframeFallback
  )

  // Keep isActuallyPlayingRef synchronized with playerState & isYouTube
  useEffect(() => {
    if (isYouTube) {
      isActuallyPlayingRef.current = true
    } else {
      isActuallyPlayingRef.current = playerState === "playing"
    }
  }, [playerState, isYouTube])

  const extractYouTubeId = useCallback((url: string, explicitId?: string): string => {
    if (explicitId) return explicitId
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|.*[?&]v=))([\w-]{11})/)
    return match ? match[1] : ""
  }, [])

  const currentYoutubeId = extractYouTubeId(channel.url, channel.youtubeId)
  const activeStreamUrl = useBackup && channel.backupUrl ? channel.backupUrl : channel.url

  // HLS & Native Video Lifecycle Engine
  useEffect(() => {
    let isCancelled = false

    setPlayerState("loading")
    setErrorMsg(null)

    if (isYouTube) {
      setPlayerState("playing")
      return
    }

    const video = videoRef.current
    if (!video || !activeStreamUrl) {
      setPlayerState("error")
      setErrorMsg("This channel is currently unavailable.")
      return
    }

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const setupPlayer = async () => {
      if (activeStreamUrl.includes(".m3u8")) {
        try {
          const HlsModule = (await import("hls.js")).default
          if (HlsModule.isSupported()) {
            const hls = new HlsModule({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 60,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              manifestLoadingTimeOut: 10000,
              manifestLoadingMaxRetry: 3,
              levelLoadingTimeOut: 10000,
              levelLoadingMaxRetry: 3,
              fragLoadingTimeOut: 15000,
              fragLoadingMaxRetry: 4,
            })

            hlsRef.current = hls
            hls.loadSource(activeStreamUrl)
            hls.attachMedia(video)

            hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
              if (isCancelled) return
              video
                .play()
                .then(() => {
                  if (!isCancelled) setPlayerState("playing")
                })
                .catch(() => {
                  if (!isCancelled) setPlayerState("paused")
                })
            })

            hls.on(HlsModule.Events.ERROR, (_, data) => {
              if (isCancelled) return
              if (data.fatal) {
                switch (data.type) {
                  case HlsModule.ErrorTypes.NETWORK_ERROR:
                    if (retryCount < 3) {
                      setRetryCount((prev) => prev + 1)
                      setPlayerState("retrying")
                      hls.startLoad()
                    } else {
                      hls.destroy()
                      hlsRef.current = null
                      handleStreamFailure()
                    }
                    break
                  case HlsModule.ErrorTypes.MEDIA_ERROR:
                    if (retryCount < 3) {
                      setRetryCount((prev) => prev + 1)
                      setPlayerState("retrying")
                      hls.recoverMediaError()
                    } else {
                      hls.destroy()
                      hlsRef.current = null
                      handleStreamFailure()
                    }
                    break
                  default:
                    hls.destroy()
                    hlsRef.current = null
                    handleStreamFailure()
                    break
                }
              }
            })
            return
          }
        } catch (err) {
          console.warn("HLS load note:", err)
        }
      }

      if (isCancelled) return

      if (video.canPlayType("application/vnd.apple.mpegurl") || !activeStreamUrl.includes(".m3u8")) {
        video.src = activeStreamUrl
        video.load()
        video
          .play()
          .then(() => {
            if (!isCancelled) setPlayerState("playing")
          })
          .catch(() => {
            if (!isCancelled) setPlayerState("paused")
          })
      } else {
        handleStreamFailure()
      }
    }

    const handleStreamFailure = () => {
      if (isCancelled) return
      if (channel.backupUrl && !useBackup) {
        setUseBackup(true)
      } else if (currentYoutubeId) {
        setUseIframeFallback(true)
      } else {
        setPlayerState("error")
        setErrorMsg("This channel is currently unavailable.")
      }
    }

    setupPlayer()

    return () => {
      isCancelled = true
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (video) {
        video.pause()
        video.removeAttribute("src")
        video.load()
      }
    }
  }, [activeStreamUrl, channel, isYouTube, useBackup, useIframeFallback, retryCount, currentYoutubeId])

  // Reset watch session whenever channel changes
  useEffect(() => {
    watchTimeRef.current = 0
    setWatchedMinutes(0)
    setEarnedCoins(0)
  }, [channel.id])

  // Watch Time & Reward Engine (Stable Lifecycle - Independent of Rapid PlayerState Transitions)
  useEffect(() => {
    console.log("[WatchPoints] session engine mounted", {
      channelId: channel.id,
      channelName: channel.name,
    })

    const interval = setInterval(async () => {
      // Only accumulate seconds while actual playback is active
      if (!isActuallyPlayingRef.current) return

      watchTimeRef.current += 1
      const minutes = Math.floor(watchTimeRef.current / 60)
      setWatchedMinutes(minutes)

      if (watchTimeRef.current > 0 && watchTimeRef.current % 30 === 0) {
        if (isSendingHeartbeatRef.current) return
        isSendingHeartbeatRef.current = true

        try {
          const token = piAccessTokenRef.current
          if (!token) {
            console.warn("[WatchPoints] heartbeat skipped: User is unauthenticated (no Pi access token)")
            isSendingHeartbeatRef.current = false
            return
          }

          console.log("[WatchPoints] heartbeat sent for channel:", channelRef.current.id, "watchSeconds:", watchTimeRef.current)

          const res = await fetch("/api/rewards/heartbeat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              channelId: channelRef.current.id,
              channelName: channelRef.current.name,
            }),
          })

          if (res.status === 401) {
            console.warn("[WatchPoints] heartbeat unauthorized")
            return
          }

          if (res.ok) {
            const data = await res.json()
            console.log("[WatchPoints] heartbeat response", {
              success: data.success,
              coinsAwarded: data.coinsAwarded,
              message: data.message,
            })

            if (data && data.success) {
              if (data.coinsAwarded > 0) {
                console.log("[WatchPoints] coins awarded", data.coinsAwarded)
                setEarnedCoins((prev) => prev + data.coinsAwarded)
              }
              if (typeof data.totalCoins === "number") {
                syncServerBalanceRef.current({
                  totalCoins: data.totalCoins,
                  dailyCoinsEarned: data.dailyCoinsEarned,
                  lifetimeEarnings: data.lifetimeEarnings,
                })
              } else {
                syncServerBalanceRef.current()
              }
            } else if (data?.message?.includes("rate limited")) {
              console.log("[WatchPoints] heartbeat rate limited")
            } else if (data?.message?.includes("Insufficient watch duration")) {
              console.log("[WatchPoints] insufficient verified duration")
            }
          }
        } catch (e) {
          console.warn("[WatchPoints] Reward heartbeat network error:", e)
        } finally {
          isSendingHeartbeatRef.current = false
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [channel.id])

  // Standard HTML5 Fullscreen & In-App Expanded Player Handling
  const toggleFullscreen = async () => {
    const container = containerRef.current
    const isCurrentlyFS = Boolean(
      document.fullscreenElement || (document as any).webkitFullscreenElement || isFullscreen
    )

    if (isCurrentlyFS) {
      setIsFullscreen(false)
      if (document.exitFullscreen) {
        try {
          await document.exitFullscreen()
        } catch (e) {
          console.warn("[Fullscreen] exitFullscreen note:", e)
        }
      } else if ((document as any).webkitExitFullscreen) {
        try {
          ;(document as any).webkitExitFullscreen()
        } catch (e) {}
      }
    } else {
      setIsFullscreen(true)
      if (container) {
        try {
          if (container.requestFullscreen) {
            await container.requestFullscreen()
          } else if ((container as any).webkitRequestFullscreen) {
            ;(container as any).webkitRequestFullscreen()
          } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
            ;(videoRef.current as any).webkitEnterFullscreen()
          }
        } catch (err) {
          console.warn("[Fullscreen] Native requestFullscreen note:", err)
          // In-app expanded player mode is active via isFullscreen state
        }
      }
    }
  }

  useEffect(() => {
    const handleFSChange = () => {
      const isNativeFS = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement)
      if (isNativeFS) {
        setIsFullscreen(true)
      } else if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        // Native exit occurred
      }
    }

    document.addEventListener("fullscreenchange", handleFSChange)
    document.addEventListener("webkitfullscreenchange", handleFSChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange)
      document.removeEventListener("webkitfullscreenchange", handleFSChange)
    }
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (playerState === "playing") {
      isActuallyPlayingRef.current = false
      videoRef.current.pause()
      setPlayerState("paused")
    } else {
      videoRef.current
        .play()
        .then(() => {
          isActuallyPlayingRef.current = true
          setPlayerState("playing")
        })
        .catch(() => {
          isActuallyPlayingRef.current = false
          setPlayerState("paused")
        })
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

  const handleManualRetry = () => {
    setRetryCount(0)
    setPlayerState("loading")
    setErrorMsg(null)
    if (channel.backupUrl && !useBackup) {
      setUseBackup(true)
    } else if (currentYoutubeId) {
      setUseIframeFallback(true)
    } else if (videoRef.current) {
      videoRef.current.load()
    }
  }

  const toggleFitMode = () => {
    setFitMode((prev) => {
      if (prev === "contain") return "cover"
      if (prev === "cover") return "fill"
      return "contain"
    })
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center ${
        isFullscreen
          ? "w-screen h-screen h-[100dvh] w-[100dvw] p-0"
          : "bg-black/90 backdrop-blur-md p-0 sm:p-4"
      }`}
    >
      <Card
        className={`w-full bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden ${
          isFullscreen
            ? "h-full max-w-none border-none rounded-none justify-between bg-black"
            : "max-w-5xl border-zinc-800 shadow-2xl"
        }`}
      >
        {/* Header Bar */}
        <div
          className={`flex items-center justify-between z-30 transition-all ${
            isFullscreen
              ? "absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/95 via-black/60 to-transparent border-none text-white"
              : "p-3 sm:p-4 border-b border-zinc-800 bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-8 h-8 rounded object-contain bg-zinc-900 border border-zinc-800 p-0.5"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
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
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(channel)}
              className="text-zinc-300 hover:text-red-400 hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9"
              aria-label={favorited ? "Remove from Favorites" : "Add to Favorites"}
              title={favorited ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart className={`w-5 h-5 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button
              type="button"
              variant={isFullscreen ? "secondary" : "ghost"}
              size={isFullscreen ? "sm" : "icon"}
              onClick={toggleFullscreen}
              className={`h-10 min-w-10 px-2 sm:h-9 font-semibold text-xs gap-1.5 ${
                isFullscreen
                  ? "bg-white/20 hover:bg-white/30 text-white border border-white/20"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Exit</span>
                </>
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-300 hover:text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9"
              aria-label="Close Player"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Video Player Container */}
        <div
          ref={containerRef}
          className={`bg-black relative flex items-center justify-center overflow-hidden w-full group ${
            isFullscreen ? "flex-1 h-full min-h-0" : "aspect-video"
          }`}
        >
          {isYouTube && currentYoutubeId ? (
            <iframe
              className="w-full h-full border-0 object-contain"
              src={`https://www.youtube-nocookie.com/embed/${currentYoutubeId}?autoplay=1&mute=0&controls=1&enablejsapi=1&rel=0`}
              title={channel.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <>
              {(playerState === "loading" || playerState === "retrying") && !errorMsg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 space-y-2">
                  <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-1" />
                  <p className="text-zinc-300 text-sm font-medium">
                    {playerState === "retrying" ? "Reconnecting stream..." : "Connecting live stream..."}
                  </p>
                  {useBackup && <p className="text-xs text-amber-400">Using backup stream...</p>}
                </div>
              )}

              {errorMsg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-20 p-4 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-500 mb-1" />
                  <p className="text-zinc-200 text-sm max-w-md font-medium">{errorMsg}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button size="sm" onClick={handleManualRetry} className="gap-1.5 bg-primary hover:bg-primary/90">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry Stream
                    </Button>
                    {channel.backupUrl && !useBackup && (
                      <Button size="sm" variant="outline" onClick={() => setUseBackup(true)} className="gap-1.5 border-zinc-700 text-zinc-200">
                        Switch to Backup
                      </Button>
                    )}
                    {currentYoutubeId && !useIframeFallback && (
                      <Button size="sm" variant="secondary" onClick={() => setUseIframeFallback(true)} className="gap-1.5">
                        YouTube Player
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                className={`w-full h-full max-w-full max-h-full bg-black ${
                  fitMode === "cover" ? "object-cover" : fitMode === "fill" ? "object-fill" : "object-contain"
                }`}
                playsInline
                controls={false}
                autoPlay
                crossOrigin="anonymous"
                onCanPlay={() => {
                  isActuallyPlayingRef.current = true
                  setPlayerState("playing")
                  setErrorMsg(null)
                }}
                onPlay={() => {
                  isActuallyPlayingRef.current = true
                  setPlayerState("playing")
                }}
                onPlaying={() => {
                  isActuallyPlayingRef.current = true
                  setPlayerState("playing")
                }}
                onPause={() => {
                  isActuallyPlayingRef.current = false
                  if (playerState === "playing") setPlayerState("paused")
                }}
                onWaiting={() => {
                  isActuallyPlayingRef.current = false
                  setPlayerState("buffering")
                }}
                onError={() => {
                  isActuallyPlayingRef.current = false
                  if (channel.backupUrl && !useBackup) {
                    setUseBackup(true)
                  } else if (currentYoutubeId) {
                    setUseIframeFallback(true)
                  } else {
                    setPlayerState("error")
                    setErrorMsg("This channel is currently unavailable.")
                  }
                }}
              />
            </>
          )}

          {/* Player Overlay Controls */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between gap-3 z-30 transition-opacity">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                disabled={playerState === "loading" || isYouTube}
                className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
                aria-label={playerState === "playing" ? "Pause" : "Play"}
              >
                {playerState === "playing" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                disabled={isYouTube}
                className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <div className="w-20 hidden sm:block">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.05}
                  onValueChange={handleVolumeChange}
                  disabled={isYouTube}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isYouTube && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleFitMode}
                  className="text-xs text-zinc-200 hover:text-white hover:bg-white/20 h-9 px-2.5 gap-1 font-mono uppercase bg-white/10 border border-white/10"
                  title="Toggle Video Zoom/Fit Mode (Contain, Cover, Fill)"
                  aria-label={`Fit mode: ${fitMode}`}
                >
                  <Expand className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{fitMode}</span>
                </Button>
              )}

              {earnedCoins > 0 && (
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>+{earnedCoins}</span>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Statistics & Info Bar (Hidden in Fullscreen/Expanded Mode) */}
        {!isFullscreen && (
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
        )}
      </Card>
    </div>
  )
}
