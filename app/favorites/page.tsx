"use client"

import { useEffect, useState } from "react"
import { Heart, Play, X, ChevronLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFavorites } from "@/hooks/use-favorites"
import { VideoPlayer } from "@/components/video-player"
import type { Channel } from "@/lib/types"

export default function FavoritesPage() {
  const { favorites, removeFavorite, clearAllFavorites, isLoading } = useFavorites()
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading your favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Favorite Channels</h1>
                  <p className="text-xs text-muted-foreground">{favorites.length} saved</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {favorites.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
          {favorites.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-primary opacity-60" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">No Favorite Channels</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Start adding channels to your favorites by clicking the heart icon. They will appear here for quick access.
                </p>
                <Link href="/">
                  <Button className="mt-4">
                    Browse Channels
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Showing {favorites.length} favorite channel{favorites.length !== 1 ? "s" : ""}
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favorites.map((channel) => (
                  <Card
                    key={channel.id}
                    className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all group cursor-pointer"
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
                          onClick={() => setPlayingChannel(channel)}
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
          )}
        </div>
      </div>

      {/* Clear All Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-sm w-full bg-card border-border p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Clear All Favorites?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This will remove all {favorites.length} saved channel{favorites.length !== 1 ? "s" : ""} from your favorites. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  clearAllFavorites()
                  setShowClearConfirm(false)
                }}
              >
                Clear All
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Video Player */}
      {playingChannel && <VideoPlayer channel={playingChannel} onClose={() => setPlayingChannel(null)} />}
    </>
  )
}
