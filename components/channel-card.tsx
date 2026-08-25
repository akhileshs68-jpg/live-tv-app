"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Play, Radio } from "lucide-react"
import type { Channel } from "@/lib/types"
import { useFavorites } from "@/hooks/use-favorites"

interface ChannelCardProps {
  channel: Channel
  onPlay: (channel: Channel) => void
}

export function ChannelCard({ channel, onPlay }: ChannelCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorited = isFavorite(channel.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(channel)
  }

  return (
    <Card 
      className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all group cursor-pointer active:scale-[0.98] relative shadow-xs"
      onClick={() => onPlay(channel)}
    >
      <div className="relative aspect-video bg-gradient-to-br from-secondary/80 to-muted flex items-center justify-center overflow-hidden">
        {/* Live Badge */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] font-bold tracking-wider bg-red-600/90 text-white px-2 py-0.5 rounded-full shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>

        {/* Favorite Button */}
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-transform active:scale-90"
            onClick={handleFavoriteClick}
            title={favorited ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart className={`w-4 h-4 ${favorited ? "fill-red-500 text-red-500" : "text-white/80"}`} />
          </Button>
        </div>

        {/* Channel Logo */}
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none"
            }}
          />
        ) : (
          <div className="text-3xl font-extrabold text-muted-foreground/50">{channel.name.charAt(0)}</div>
        )}

        {/* Mobile Play Overlay Button */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg text-primary-foreground transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-2.5 sm:p-3">
        <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-1 text-foreground mb-1.5 group-hover:text-primary transition-colors">
          {channel.name}
        </h3>
        <div className="flex flex-wrap items-center gap-1">
          {channel.globalCategory && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/80 hover:bg-primary font-normal">
              {channel.globalCategory}
            </Badge>
          )}
          {channel.category && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
              {channel.category}
            </Badge>
          )}
          {channel.country && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border font-normal">
              {channel.country}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}
