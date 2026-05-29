"use client"

import React, { useState, useCallback } from "react"
import { Search, Play, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { YouTubeVideoCard } from "./youtube-video-card"
import { YouTubePlayer } from "./youtube-player"

interface Video {
  id: string
  title: string
  thumbnail: string
  channel?: string
  views?: string
}

const FEATURED_VIDEOS: Video[] = [
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Video)",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    channel: "Rick Astley Official",
    views: "1.2B"
  },
  {
    id: "9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE (강남스타일) M/V",
    thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    channel: "officialpsy",
    views: "4.8B"
  },
  {
    id: "kJQP7kiw9Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw9Fk/maxresdefault.jpg",
    channel: "Luis Fonsi",
    views: "8.3B"
  },
  {
    id: "YQHsXMglC9A",
    title: "Adele - Hello",
    thumbnail: "https://img.youtube.com/vi/YQHsXMglC9A/maxresdefault.jpg",
    channel: "Adele",
    views: "3.1B"
  },
  {
    id: "jNQXAC9IVRw",
    title: "Me at the zoo",
    thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
    channel: "jawed",
    views: "293M"
  },
  {
    id: "e-IWRmpefzE",
    title: "Billie Eilish - bad guy",
    thumbnail: "https://img.youtube.com/vi/e-IWRmpefzE/maxresdefault.jpg",
    channel: "Billie Eilish",
    views: "1.4B"
  },
  {
    id: "ZbZSe6N_BXs",
    title: "Wiz Khalifa - See You Again ft. Charlie Puth",
    thumbnail: "https://img.youtube.com/vi/ZbZSe6N_BXs/maxresdefault.jpg",
    channel: "Wiz Khalifa",
    views: "3.9B"
  },
  {
    id: "kffacxfA7g4",
    title: "Justin Bieber - Baby ft. Ludacris",
    thumbnail: "https://img.youtube.com/vi/kffacxfA7g4/maxresdefault.jpg",
    channel: "Justin Bieber",
    views: "2.8B"
  },
]

const CATEGORIES = [
  { id: "trending", label: "Trending", icon: "🔥" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "education", label: "Education", icon: "📚" },
]

export function YouTubeBrowser() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(FEATURED_VIDEOS[0].id)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("trending")
  const [showPlayer, setShowPlayer] = useState(false)

  const filteredVideos = searchQuery.trim()
    ? FEATURED_VIDEOS.filter((video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channel?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FEATURED_VIDEOS

  const handleVideoSelect = useCallback((videoId: string) => {
    setSelectedVideoId(videoId)
    setShowPlayer(true)
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  return (
    <div className="w-full">
      {/* Player Modal */}
      {showPlayer && selectedVideoId && (
        <YouTubePlayer
          videoId={selectedVideoId}
          onClose={() => setShowPlayer(false)}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-red-600 flex-shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">YouTube</h1>
              <p className="text-xs text-muted-foreground">Browse videos</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search videos, channels..."
              className="pl-10 bg-secondary text-foreground border-border focus:border-primary"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="border-t border-border overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No videos found</p>
            <Button
              variant="outline"
              onClick={() => {
                window.open("https://www.youtube.com", "_blank")
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open YouTube
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <YouTubeVideoCard
                key={video.id}
                video={video}
                isSelected={selectedVideoId === video.id}
                onSelect={() => handleVideoSelect(video.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
