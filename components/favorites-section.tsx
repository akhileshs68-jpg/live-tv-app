"use client"

import { useState } from "react"
import { Heart, Tv, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFavorites } from "@/hooks/use-favorites"
import type { Channel } from "@/lib/types"

interface FavoritesSection {
  onPlayChannel: (channel: Channel) => void
}

export function FavoritesSection({ onPlayChannel }: FavoritesSection) {
  const { favorites, removeFavorite, isLoading } = useFavorites()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Favorite Channels</h2>
            <p className="text-xs text-muted-foreground">Loading your favorites...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="mb-8 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center text-center py-6">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
            <Heart className="w-6 h-6 text-primary opacity-60" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No Favorite Channels Yet</h3>
          <p className="text-xs text-muted-foreground">Click the heart icon on any channel to save it here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Favorite Channels</h2>
            <p className="text-xs text-muted-foreground">{favorites.length} channel{favorites.length !== 1 ? "s" : ""} saved</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {favorites.map((channel) => (
          <Card
            key={channel.id}
            className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all group cursor-pointer relative"
            onMouseEnter={() => setHoveredId(channel.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative aspect-video bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : (
                <div className="text-4xl font-bold text-muted-foreground opacity-60">
                  {channel.name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="lg"
                  className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
                  onClick={() => onPlayChannel(channel)}
                >
                  <Play className="w-6 h-6 fill-primary-foreground text-primary-foreground" />
                </Button>
              </div>

              {hoveredId === channel.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-destructive/90 hover:bg-destructive text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFavorite(channel.id)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="p-3">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground mb-2">
                {channel.name}
              </h3>
              <div className="flex flex-wrap gap-1">
                {channel.globalCategory && (
                  <Badge variant="default" className="text-xs bg-primary/90 hover:bg-primary">
                    {channel.globalCategory}
                  </Badge>
                )}
                {channel.category && (
                  <Badge variant="secondary" className="text-xs">
                    {channel.category}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
