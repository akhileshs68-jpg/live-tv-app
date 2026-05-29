"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Heart, Tv, Globe, Newspaper, Zap, ChevronLeft } from "lucide-react"
import { ChannelCard } from "@/components/channel-card"
import { VideoPlayer } from "@/components/video-player"
import { CountrySelector } from "@/components/country-selector"
import type { Channel } from "@/lib/types"
import type { CountryChannels } from "@/lib/global-channels"
import { useFavorites } from "@/hooks/use-favorites"
import { FavoritesSection } from "@/components/favorites-section"
import { COUNTRIES } from "@/lib/global-channels"

export function ChannelList() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null)
  const [viewMode, setViewMode] = useState<"channels" | "countries">("channels")
  const [selectedCountry, setSelectedCountry] = useState<CountryChannels | null>(null)
  const { favorites } = useFavorites()

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/channels")
      const data = await response.json()
      setChannels(data.channels || [])
    } catch (error) {
      console.error("Failed to fetch channels:", error)
      setChannels([])
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { label: "All", icon: Globe },
    { label: "India", icon: Tv },
    { label: "News", icon: Newspaper },
    { label: "Sports", icon: Zap },
    { label: "Entertainment", icon: Tv },
  ]

  const filteredChannels = useMemo(() => {
    let filtered = channels
    
    // Filter by country if in country view
    if (viewMode === "countries" && selectedCountry) {
      filtered = filtered.filter((c) => c.globalCategory === selectedCountry.name)
    }

    return filtered.filter((channel) => {
      const matchesSearch =
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.globalCategory?.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesCategory = false
      if (selectedCategory === "All") {
        matchesCategory = true
      } else if (selectedCategory === "India") {
        matchesCategory = channel.globalCategory === "India" || channel.country === "IN"
      } else {
        matchesCategory = channel.globalCategory === selectedCategory
      }

      const matchesFavorites = !showFavoritesOnly || favorites.includes(channel.id)

      return matchesSearch && matchesCategory && matchesFavorites
    })
  }, [channels, searchQuery, selectedCategory, showFavoritesOnly, favorites, viewMode, selectedCountry])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading channels...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3 mb-5">
              {viewMode === "countries" && selectedCountry && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedCountry(null)
                    setViewMode("channels")
                  }}
                  className="mr-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Tv className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Free TV India</h1>
                  <p className="text-xs text-muted-foreground">Global Streaming App</p>
                </div>
              </div>
            </div>

            {viewMode === "countries" ? (
              <>
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">Browse by Country</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search channels or countries..."
                      className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search channels..."
                      className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                      variant={viewMode === "countries" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setViewMode("countries")
                        setSelectedCountry(null)
                      }}
                      className="shrink-0"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      Countries
                    </Button>
                    <Button
                      variant={showFavoritesOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className="shrink-0"
                    >
                      <Heart className={`w-4 h-4 mr-2 ${showFavoritesOnly ? "fill-current" : ""}`} />
                      Favorites
                    </Button>
                    {categories.map((cat) => {
                      const Icon = cat.icon
                      return (
                        <Button
                          key={cat.label}
                          variant={selectedCategory === cat.label ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(cat.label)}
                          className="shrink-0"
                        >
                          <Icon className="w-4 h-4 mr-1" />
                          {cat.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
          {viewMode === "countries" && !selectedCountry ? (
            <CountrySelector countries={COUNTRIES} selectedCountry={selectedCountry} onSelectCountry={(country) => {
              setSelectedCountry(country)
              setViewMode("countries")
              setSearchQuery("")
            }} />
          ) : viewMode === "countries" && selectedCountry ? (
            <>
              {filteredChannels.length === 0 ? (
                <div className="text-center py-16">
                  <Tv className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg font-semibold">No channels found</p>
                  <p className="text-muted-foreground text-sm mt-2">Try a different search term</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-foreground">{selectedCountry.emoji} {selectedCountry.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{filteredChannels.length} channels available</p>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredChannels.map((channel) => (
                      <ChannelCard key={channel.id} channel={channel} onPlay={setPlayingChannel} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {!showFavoritesOnly && viewMode === "channels" && (
                <FavoritesSection onPlayChannel={setPlayingChannel} />
              )}
              {filteredChannels.length === 0 ? (
                <div className="text-center py-16">
                  <Tv className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg font-semibold">
                    {channels.length === 0 ? "No channels available" : "No channels found"}
                  </p>
                  {channels.length === 0 && (
                    <p className="text-muted-foreground text-sm mt-2">
                      Unable to load channels. Please try refreshing the page or check your internet connection.
                    </p>
                  )}
                  {showFavoritesOnly && channels.length > 0 && (
                    <p className="text-muted-foreground text-sm mt-2">Try adding some favorites first</p>
                  )}
                  {searchQuery && channels.length > 0 && (
                    <p className="text-muted-foreground text-sm mt-2">Try a different search term</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{filteredChannels.length} channels available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedCategory !== "All" && `Viewing: ${selectedCategory}`}
                      </p>
                    </div>
                    {channels.length > 0 && (
                      <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-md">
                        Total channels: {channels.length}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredChannels.map((channel) => (
                      <ChannelCard key={channel.id} channel={channel} onPlay={setPlayingChannel} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {playingChannel && <VideoPlayer channel={playingChannel} onClose={() => setPlayingChannel(null)} />}
    </>
  )
}
