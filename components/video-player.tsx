"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
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
  Settings,
  Check,
  Layers,
} from "lucide-react"
import type { Channel } from "@/lib/types"
import { useFavorites } from "@/hooks/use-favorites"
import { useAuth } from "@/lib/auth-context"
import { getApiUrl } from "@/lib/api-config"

interface VideoPlayerProps {
  channel: Channel
  onClose: () => void
}

type PlayerState = "idle" | "loading" | "playing" | "paused" | "buffering" | "error" | "retrying"
type FitMode = "contain" | "cover" | "fill"

interface QualityOption {
  levelIndex: number // -1 for auto
  label: string
  height?: number
  bitrate?: number
}

export function VideoPlayer({ channel, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HlsType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { isFavorite, toggleFavorite } = useFavorites()
  const { updateUserCoins, piAccessToken, syncServerBalance } = useAuth()
  const favorited = isFavorite(channel.id)

  // Stream Candidates array
  const streamCandidates = useMemo(() => {
    const raw = [channel.url, ...(channel.fallbackUrls || []), channel.backupUrl].filter(
      (url): url is string => typeof url === "string" && url.trim().length > 0
    )
    return Array.from(new Set(raw))
  }, [channel.url, channel.fallbackUrls, channel.backupUrl])

  const [candidateIndex, setCandidateIndex] = useState(0)
  const [useIframeFallback, setUseIframeFallback] = useState(false)
  const [playerState, setPlayerState] = useState<PlayerState>("loading")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [watchedMinutes, setWatchedMinutes] = useState(0)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fitMode, setFitMode] = useState<FitMode>("contain")
  const [qualityLevels, setQualityLevels] = useState<QualityOption[]>([])
  const [selectedQuality, setSelectedQuality] = useState<number>(-1) // -1 is Auto
  const [isHdStream, setIsHdStream] = useState<boolean>(Boolean(channel.isHd || channel.quality === "1080p" || channel.quality === "720p"))
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

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
  const retryAttemptsRef = useRef(0)

  const extractYouTubeId = useCallback((url: string, explicitId?: string): string => {
    if (explicitId) return explicitId
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|.*[?&]v=))([\w-]{11})/)
    return match ? match[1] : ""
  }, [])

  const currentYoutubeId = extractYouTubeId(channel.url, channel.youtubeId)

  // Determine if stream is YouTube
  const isYouTube = Boolean(
    useIframeFallback ||
    (channel.streamType === "youtube" && currentYoutubeId) ||
    (streamCandidates.length === 0 && currentYoutubeId) ||
    channel.url?.includes("youtube.com") ||
    channel.url?.includes("youtu.be")
  )

  // Keep isActuallyPlayingRef synchronized
  useEffect(() => {
    if (isYouTube) {
      isActuallyPlayingRef.current = true
    } else {
      isActuallyPlayingRef.current = playerState === "playing"
    }
  }, [playerState, isYouTube])

  const activeStreamUrl = streamCandidates[candidateIndex] || channel.url

  // Reset candidates and state when channel changes
  useEffect(() => {
    setCandidateIndex(0)
    setUseIframeFallback(false)
    setPlayerState("loading")
    setErrorMsg(null)
    setQualityLevels([])
    setSelectedQuality(-1)
    setIsHdStream(Boolean(channel.isHd || channel.quality === "1080p" || channel.quality === "720p"))
    retryAttemptsRef.current = 0
  }, [channel.id, channel.isHd, channel.quality])

  // Primary HLS & Video Stream Lifecycle Engine
  useEffect(() => {
    let isCancelled = false

    setPlayerState("loading")
    setErrorMsg(null)

    if (isYouTube && currentYoutubeId) {
      setPlayerState("playing")
      return
    }

    const video = videoRef.current
    if (!video || !activeStreamUrl) {
      if (currentYoutubeId) {
        setUseIframeFallback(true)
      } else {
        setPlayerState("error")
        setErrorMsg("Unable to play this channel right now. Please select another channel.")
      }
      return
    }

    // Clean previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const switchToNextCandidateOrFallback = (reason?: string) => {
      if (isCancelled) return
      if (candidateIndex + 1 < streamCandidates.length) {
        console.log(`[StreamEngine] Switching to fallback source ${candidateIndex + 2}/${streamCandidates.length} (${reason || "stream error"})`)
        setCandidateIndex((prev) => prev + 1)
      } else if (currentYoutubeId && !useIframeFallback) {
        console.log("[StreamEngine] HLS streams exhausted, switching to YouTube live fallback")
        setUseIframeFallback(true)
      } else {
        setPlayerState("error")
        setErrorMsg("Live broadcast currently offline. You can retry or choose another channel.")
      }
    }

    const setupPlayer = async () => {
      const isM3U8 = activeStreamUrl.includes(".m3u8") || activeStreamUrl.includes("/hls/")

      if (isM3U8) {
        try {
          const HlsModule = (await import("hls.js")).default
          if (HlsModule.isSupported()) {
            const hls = new HlsModule({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 60,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              manifestLoadingTimeOut: 12000,
              manifestLoadingMaxRetry: 2,
              levelLoadingTimeOut: 12000,
              levelLoadingMaxRetry: 2,
              fragLoadingTimeOut: 15000,
              fragLoadingMaxRetry: 3,
            })

            hlsRef.current = hls
            hls.loadSource(activeStreamUrl)
            hls.attachMedia(video)

            hls.on(HlsModule.Events.MANIFEST_PARSED, (_, data) => {
              if (isCancelled) return

              // Parse Quality Levels
              if (data && data.levels && data.levels.length > 0) {
                const parsedOptions: QualityOption[] = [
                  { levelIndex: -1, label: "Auto (Adaptive)" },
                ]
                let foundHd = false

                data.levels.forEach((lvl, idx) => {
                  const h = lvl.height || 0
                  let lbl = `${h}p`
                  if (h >= 1080) lbl = "1080p HD"
                  else if (h >= 720) lbl = "720p HD"
                  else if (h >= 480) lbl = "480p SD"
                  else if (h > 0) lbl = `${h}p`
                  else lbl = `Level ${idx + 1}`

                  if (h >= 720) foundHd = true

                  parsedOptions.push({
                    levelIndex: idx,
                    label: lbl,
                    height: h,
                    bitrate: lvl.bitrate,
                  })
                })

                setQualityLevels(parsedOptions)
                if (foundHd) setIsHdStream(true)
              }

              video
                .play()
                .then(() => {
                  if (!isCancelled) {
                    setPlayerState("playing")
                    setErrorMsg(null)
                  }
                })
                .catch((err) => {
                  console.log("[StreamEngine] Autoplay note:", err)
                  if (!isCancelled) setPlayerState("paused")
                })
            })

            hls.on(HlsModule.Events.LEVEL_SWITCHED, (_, data) => {
              if (isCancelled || !hls.levels) return
              const activeLevel = hls.levels[data.level]
              if (activeLevel && activeLevel.height && activeLevel.height >= 720) {
                setIsHdStream(true)
              }
            })

            hls.on(HlsModule.Events.ERROR, (_, data) => {
              if (isCancelled) return

              if (data.fatal) {
                switch (data.type) {
                  case HlsModule.ErrorTypes.NETWORK_ERROR:
                    if (retryAttemptsRef.current < 2) {
                      retryAttemptsRef.current += 1
                      setPlayerState("retrying")
                      hls.startLoad()
                    } else {
                      hls.destroy()
                      hlsRef.current = null
                      switchToNextCandidateOrFallback("Network error")
                    }
                    break
                  case HlsModule.ErrorTypes.MEDIA_ERROR:
                    if (retryAttemptsRef.current < 2) {
                      retryAttemptsRef.current += 1
                      setPlayerState("retrying")
                      hls.recoverMediaError()
                    } else {
                      hls.destroy()
                      hlsRef.current = null
                      switchToNextCandidateOrFallback("Media decode error")
                    }
                    break
                  default:
                    hls.destroy()
                    hlsRef.current = null
                    switchToNextCandidateOrFallback("Fatal stream error")
                    break
                }
              }
            })

            return
          }
        } catch (err) {
          console.warn("[StreamEngine] HLS module load exception:", err)
        }
      }

      if (isCancelled) return

      // Native playback for Safari / direct video format
      if (video.canPlayType("application/vnd.apple.mpegurl") || !isM3U8) {
        video.src = activeStreamUrl
        video.load()
        video
          .play()
          .then(() => {
            if (!isCancelled) {
              setPlayerState("playing")
              setErrorMsg(null)
            }
          })
          .catch((err) => {
            console.log("[StreamEngine] Native play note:", err)
            if (!isCancelled) setPlayerState("paused")
          })
      } else {
        switchToNextCandidateOrFallback("HLS unsupported natively")
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
  }, [activeStreamUrl, candidateIndex, streamCandidates, isYouTube, currentYoutubeId, useIframeFallback])

  // Quality Level Switching
  const handleQualitySelect = (levelIdx: number) => {
    setSelectedQuality(levelIdx)
    setShowSettingsMenu(false)
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIdx
      if (levelIdx === -1) {
        hlsRef.current.loadLevel = -1
      }
    }
  }

  // Reset watch session on channel change
  useEffect(() => {
    watchTimeRef.current = 0
    setWatchedMinutes(0)
    setEarnedCoins(0)
  }, [channel.id])

  // Watch Time & Reward Heartbeat Engine
  useEffect(() => {
    const interval = setInterval(async () => {
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
            isSendingHeartbeatRef.current = false
            return
          }

          const res = await fetch(getApiUrl("/api/rewards/heartbeat"), {
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

          if (res.ok) {
            const data = await res.json()
            if (data && data.success) {
              if (data.coinsAwarded > 0) {
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
            }
          }
        } catch (e) {
          console.warn("[WatchPoints] Heartbeat notice:", e)
        } finally {
          isSendingHeartbeatRef.current = false
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [channel.id])

  // HTML5 Fullscreen & In-App Expanded View Handling
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
          console.warn("[Fullscreen] exit note:", e)
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
          console.warn("[Fullscreen] Native request note:", err)
        }
      }
    }
  }

  useEffect(() => {
    const handleFSChange = () => {
      const isNativeFS = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement)
      if (isNativeFS) {
        setIsFullscreen(true)
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
    retryAttemptsRef.current = 0
    setCandidateIndex(0)
    setUseIframeFallback(false)
    setPlayerState("loading")
    setErrorMsg(null)
    if (videoRef.current) {
      videoRef.current.load()
    }
  }

  const handleCycleSource = () => {
    if (streamCandidates.length > 1) {
      const nextIdx = (candidateIndex + 1) % streamCandidates.length
      setCandidateIndex(nextIdx)
      setUseIframeFallback(false)
      setPlayerState("loading")
      setErrorMsg(null)
    } else if (currentYoutubeId) {
      setUseIframeFallback(true)
      setPlayerState("playing")
      setErrorMsg(null)
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
                {isHdStream && (
                  <span className="text-[10px] font-extrabold tracking-wider bg-blue-600/90 text-white px-1.5 py-0.5 rounded shadow">
                    HD
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {channel.category || "TV Channel"} • {channel.language || "Multi-Language"}
                {streamCandidates.length > 1 && !isYouTube && (
                  <span className="ml-2 text-zinc-500">
                    Source {candidateIndex + 1}/{streamCandidates.length}
                  </span>
                )}
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

        {/* Video Player Stage Container */}
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
                    {playerState === "retrying" ? "Reconnecting live stream..." : "Connecting live stream..."}
                  </p>
                  {candidateIndex > 0 && (
                    <p className="text-xs text-amber-400">
                      Using backup stream source {candidateIndex + 1}...
                    </p>
                  )}
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
                    {streamCandidates.length > 1 && (
                      <Button size="sm" variant="outline" onClick={handleCycleSource} className="gap-1.5 border-zinc-700 text-zinc-200">
                        <Layers className="w-3.5 h-3.5" />
                        Switch Source ({candidateIndex + 1}/{streamCandidates.length})
                      </Button>
                    )}
                    {currentYoutubeId && !useIframeFallback && (
                      <Button size="sm" variant="secondary" onClick={() => setUseIframeFallback(true)} className="gap-1.5">
                        YouTube Stream
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
              />
            </>
          )}

          {/* Quality & Settings Dropdown Menu */}
          {showSettingsMenu && qualityLevels.length > 0 && (
            <div className="absolute right-4 bottom-16 bg-zinc-900 border border-zinc-700 rounded-lg p-2 z-40 shadow-xl min-w-[160px] space-y-1">
              <div className="text-[11px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider border-b border-zinc-800">
                Stream Quality
              </div>
              {qualityLevels.map((opt) => (
                <button
                  key={opt.levelIndex}
                  onClick={() => handleQualitySelect(opt.levelIndex)}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center justify-between transition-colors ${
                    selectedQuality === opt.levelIndex
                      ? "bg-primary/20 text-primary font-bold"
                      : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedQuality === opt.levelIndex && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
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

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Quality Selector (when Hls levels exist) */}
              {!isYouTube && qualityLevels.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettingsMenu((prev) => !prev)}
                  className={`text-xs h-9 px-2.5 gap-1 font-mono uppercase border ${
                    showSettingsMenu
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "text-zinc-200 hover:text-white hover:bg-white/20 bg-white/10 border-white/10"
                  }`}
                  title="Select Stream Quality"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="text-[10px]">
                    {selectedQuality === -1
                      ? "Auto"
                      : qualityLevels.find((q) => q.levelIndex === selectedQuality)?.label || "HD"}
                  </span>
                </Button>
              )}

              {/* Source switcher (if multiple stream candidates exist) */}
              {!isYouTube && streamCandidates.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCycleSource}
                  className="text-xs text-zinc-200 hover:text-white hover:bg-white/20 h-9 px-2.5 gap-1 font-mono uppercase bg-white/10 border border-white/10"
                  title="Switch Stream Source"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[10px]">SRC {candidateIndex + 1}</span>
                </Button>
              )}

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
