"use client"

import React from "react"
import { ExternalLink, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Video {
  id: string
  title: string
  thumbnail: string
  channel?: string
  views?: string
}

interface YouTubeVideoCardProps {
  video: Video
  isSelected?: boolean
  onSelect: () => void
}

export function YouTubeVideoCard({ video, isSelected, onSelect }: YouTubeVideoCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-primary rounded-lg" : ""
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-2">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.currentTarget.src = `https://img.youtube.com/vi/${video.id}/default.jpg`
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {video.views && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
            {video.views} views
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-1">
        <h3 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        {video.channel && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {video.channel}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <Play className="w-3 h-3 mr-1" />
            Play
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://www.youtube.com/watch?v=${video.id}`, "_blank")
            }}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
