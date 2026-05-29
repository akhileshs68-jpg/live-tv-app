"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Play } from "lucide-react"
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
    <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all group cursor-pointer">
      <div className="relative aspect-video bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
        {channel.logo ? (
          <img
            src={channel.logo || "/placeholder.svg"}
            alt={channel.name}
            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <div className="text-5xl font-bold text-muted-foreground opacity-60">{channel.name.charAt(0)}</div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="lg"
            className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90 shadow-lg"
            onClick={() => onPlay(channel)}
          >
            <Play className="w-8 h-8 fill-primary-foreground text-primary-foreground" />
          </Button>
        </div>
        <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 bg-background/80 hover:bg-background"
            onClick={handleFavoriteClick}
            title={favorited ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart className={`w-4 h-4 ${favorited ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </Button>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground mb-2">{channel.name}</h3>
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
          {channel.language && (
            <Badge variant="outline" className="text-xs">
              {channel.language}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}
