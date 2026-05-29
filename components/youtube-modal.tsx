"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ExternalLink, Search, Play } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface YouTubeModalProps {
  isOpen: boolean
  onClose: () => void
}

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
}

export function YouTubeModal({ isOpen, onClose }: YouTubeModalProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string>("dQw4w9WgXcQ") // Default Rick Roll
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Search YouTube using noCookie embed and local search suggestions
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    // Show loading state
    setIsSearching(true)

    // Simulate search with popular video suggestions
    // In production, this would call a backend API with YouTube Data API
    searchTimeoutRef.current = setTimeout(() => {
      const suggestions: YouTubeVideo[] = [
        {
          id: "9bZkp7q19f0",
          title: "PSY - GANGNAM STYLE (강남스타일) M/V",
          thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/default.jpg",
        },
        {
          id: "kJQP7kiw9Fk",
          title: "Luis Fonsi - Despacito ft. Daddy Yankee",
          thumbnail: "https://img.youtube.com/vi/kJQP7kiw9Fk/default.jpg",
        },
        {
          id: "YQHsXMglC9A",
          title: "Adele - Hello",
          thumbnail: "https://img.youtube.com/vi/YQHsXMglC9A/default.jpg",
        },
      ]

      // Filter by search query
      const filtered = suggestions.filter((video) =>
        video.title.toLowerCase().includes(query.toLowerCase())
      )

      setSearchResults(filtered.length > 0 ? filtered : suggestions.slice(0, 2))
      setIsSearching(false)
    }, 500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] md:h-[95vh] bg-card border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-red-600">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">YouTube</h2>
              <p className="text-xs text-muted-foreground">Watch videos safely</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.open(`https://www.youtube.com/watch?v=${selectedVideoId}`, "_blank")
              }}
              title="Open video in new tab"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Video Player */}
          <div className="flex-1 flex flex-col bg-black">
            <div className="aspect-video bg-black flex items-center justify-center">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${selectedVideoId}?autoplay=0&controls=1&fs=1&rel=0`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            {/* Search Bar */}
            <div className="p-4 bg-card border-t border-border">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search videos on YouTube..."
                  className="pl-10 bg-secondary text-foreground border-border focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click on a video or use the external link button to watch on YouTube
              </p>
            </div>
          </div>

          {/* Sidebar - Video Suggestions */}
          <div className="hidden md:flex md:flex-col w-80 bg-card border-l border-border overflow-y-auto">
            <div className="p-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-semibold text-sm text-foreground">
                {searchQuery ? "Search Results" : "Popular Videos"}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isSearching && (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  <p className="text-xs text-muted-foreground mt-2">Searching...</p>
                </div>
              )}

              {!isSearching && searchResults.length === 0 && !searchQuery && (
                <div className="p-4 text-center text-muted-foreground text-xs">
                  <p>Search or browse YouTube videos</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      window.open("https://www.youtube.com", "_blank")
                    }}
                  >
                    Open Full YouTube
                  </Button>
                </div>
              )}

              {!isSearching && searchResults.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  className={`w-full p-3 border-b border-border text-left hover:bg-secondary/50 transition-colors ${
                    selectedVideoId === video.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0 w-16 h-12 bg-black rounded overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 90'%3E%3Crect fill='%23222' width='120' height='90'/%3E%3C/svg%3E`
                        }}
                      />
                      <Play className="absolute inset-0 m-auto w-4 h-4 text-white opacity-70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground line-clamp-2">
                        {video.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">YouTube</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
          <p>Using YouTube's official embed. For full features and search, click "Open in new tab" above.</p>
        </div>
      </Card>
    </div>
  )
}
