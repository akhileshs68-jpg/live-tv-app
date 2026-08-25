"use client"

import { useState, useEffect, useMemo, Fragment } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Heart, Tv, Globe, Newspaper, Zap, ChevronLeft, X, Film, Music, Radio, RotateCcw } from "lucide-react"
import { ChannelCard } from "@/components/channel-card"
import { VideoPlayer } from "@/components/video-player"
import { CountrySelector } from "@/components/country-selector"
import type { Channel } from "@/lib/types"
import type { CountryChannels } from "@/lib/global-channels"
import { useFavorites } from "@/hooks/use-favorites"
import { FavoritesSection } from "@/components/favorites-section"
import { COUNTRIES, GLOBAL_CHANNELS } from "@/lib/global-channels"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { AdSlot } from "@/components/ads/ad-slot"

export function ChannelList() {
  const { user } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null)
  const [viewMode, setViewMode] = useState<"channels" | "countries">("channels")
  const [selectedCountry, setSelectedCountry] = useState<CountryChannels | null>(null)
  const { isFavorite } = useFavorites()

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/channels")
      if (response.ok) {
        const data = await response.json()
        if (data.channels && data.channels.length > 0) {
          setChannels(data.channels)
          return
        }
      }
      setChannels(GLOBAL_CHANNELS)
    } catch (error) {
      console.warn("Failed to fetch channels, using fallback list:", error)
      setChannels(GLOBAL_CHANNELS)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { label: "All", icon: Globe },
    { label: "India", icon: Tv },
    { label: "News", icon: Newspaper },
    { label: "Sports", icon: Zap },
    { label: "Entertainment", icon: Film },
    { label: "Music", icon: Music },
  ]

  const filteredChannels = useMemo(() => {
    let filtered = channels
    
    if (viewMode === "countries" && selectedCountry) {
      filtered = filtered.filter((c) => c.globalCategory === selectedCountry.name)
    }

    return filtered.filter((channel) => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        channel.name.toLowerCase().includes(query) ||
        channel.category?.toLowerCase().includes(query) ||
        channel.globalCategory?.toLowerCase().includes(query) ||
        channel.language?.toLowerCase().includes(query)

      let matchesCategory = false
      if (selectedCategory === "All") {
        matchesCategory = true
      } else if (selectedCategory === "India") {
        matchesCategory = channel.globalCategory === "India" || channel.country === "IN"
      } else {
        matchesCategory = channel.globalCategory === selectedCategory || channel.category === selectedCategory
      }

      const matchesFavorites = !showFavoritesOnly || isFavorite(channel.id)

      return matchesSearch && matchesCategory && matchesFavorites
    })
  }, [channels, searchQuery, selectedCategory, showFavoritesOnly, isFavorite, viewMode, selectedCountry])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={user} />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading live TV channels...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader user={user} />

      <div className="min-h-screen bg-background">
        {/* Sticky Mobile Search & Category Bar */}
        <div className="sticky top-[53px] z-20 bg-background/95 backdrop-blur-md border-b border-border/80 px-3 sm:px-4 py-2.5 space-y-2">
          <div className="max-w-7xl mx-auto space-y-2">
            {/* Search Box */}
            <div className="flex items-center gap-2">
              {viewMode === "countries" && selectedCountry && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedCountry(null)
                    setViewMode("channels")
                  }}
                  className="h-9 w-9 shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search channels, categories..."
                  className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-secondary/50 border-border/80 rounded-lg focus-visible:ring-primary placeholder:text-muted-foreground/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    title="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Button
                variant={viewMode === "countries" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (viewMode === "countries") {
                    setViewMode("channels")
                    setSelectedCountry(null)
                  } else {
                    setViewMode("countries")
                  }
                }}
                className="h-9 text-xs shrink-0 px-2.5 gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Countries</span>
              </Button>
            </div>

            {/* Horizontally Scrollable Category Chips */}
            {viewMode === "channels" && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 -mx-1 px-1 touch-pan-x">
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="h-7 text-xs shrink-0 rounded-full px-3 gap-1 font-medium"
                >
                  <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? "fill-current text-white" : "text-red-400"}`} />
                  Favorites
                </Button>

                {categories.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = selectedCategory === cat.label && !showFavoritesOnly
                  return (
                    <Button
                      key={cat.label}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setShowFavoritesOnly(false)
                        setSelectedCategory(cat.label)
                      }}
                      className="h-7 text-xs shrink-0 rounded-full px-3 gap-1 font-medium"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
          {viewMode === "countries" && !selectedCountry ? (
            <CountrySelector
              countries={COUNTRIES}
              selectedCountry={selectedCountry}
              onSelectCountry={(country) => {
                setSelectedCountry(country)
                setViewMode("countries")
                setSearchQuery("")
              }}
            />
          ) : (
            <>
              {!showFavoritesOnly && viewMode === "channels" && !searchQuery && (
                <FavoritesSection onPlayChannel={setPlayingChannel} />
              )}

              {/* Non-blocking Sponsor Banner */}
              <AdSlot slot="banner_top" className="mb-4" />

              {/* Status and count banner */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    {selectedCountry ? `${selectedCountry.emoji} ${selectedCountry.name}` : showFavoritesOnly ? "Favorite Channels" : `${selectedCategory} Live Channels`}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {filteredChannels.length} channel{filteredChannels.length !== 1 ? "s" : ""} available
                  </p>
                </div>

                {(searchQuery || selectedCategory !== "All" || showFavoritesOnly) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("All")
                      setShowFavoritesOnly(false)
                    }}
                    className="h-7 text-xs text-primary hover:text-primary/80 gap-1 px-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Channel Grid */}
              {filteredChannels.length === 0 ? (
                <div className="text-center py-12 px-4 bg-card/40 border border-border/60 rounded-xl space-y-3">
                  <Tv className="w-12 h-12 mx-auto text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-bold text-foreground">No channels found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? `No results matching "${searchQuery}". Try searching for another channel or category.`
                        : showFavoritesOnly
                        ? "You haven't added any favorite channels yet. Tap the heart icon on any channel to save it."
                        : "No channels currently available in this filter."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("All")
                      setShowFavoritesOnly(false)
                    }}
                    className="text-xs mt-2"
                  >
                    View All Channels
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                  {filteredChannels.map((channel, idx) => (
                    <Fragment key={channel.id}>
                      <ChannelCard channel={channel} onPlay={setPlayingChannel} />
                      {idx === 5 && <AdSlot slot="native_card" />}
                    </Fragment>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {playingChannel && <VideoPlayer channel={playingChannel} onClose={() => setPlayingChannel(null)} />}
    </>
  )
}
