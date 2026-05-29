"use client"

import { useState, useEffect } from "react"
import type { Channel } from "@/lib/types"

interface FavoriteChannel extends Channel {
  addedAt: number
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load favorites from localStorage on mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem("tv-favorites")
        if (stored) {
          const parsed = JSON.parse(stored)
          setFavorites(Array.isArray(parsed) ? parsed : [])
        }
      } catch (error) {
        console.error("Failed to load favorites from localStorage:", error)
        setFavorites([])
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("tv-favorites", JSON.stringify(favorites))
    }
  }, [favorites, isLoading])

  const addFavorite = (channel: Channel) => {
    setFavorites((prev) => {
      // Prevent duplicates
      const exists = prev.some((fav) => fav.id === channel.id)
      if (exists) return prev

      return [
        ...prev,
        {
          ...channel,
          addedAt: Date.now(),
        },
      ]
    })
  }

  const removeFavorite = (channelId: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== channelId))
  }

  const toggleFavorite = (channel: Channel) => {
    const isFav = favorites.some((fav) => fav.id === channel.id)
    if (isFav) {
      removeFavorite(channel.id)
    } else {
      addFavorite(channel)
    }
  }

  const isFavorite = (channelId: string) => favorites.some((fav) => fav.id === channelId)

  const getFavorites = () => favorites

  const clearAllFavorites = () => setFavorites([])

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavorites,
    clearAllFavorites,
    isLoading,
  }
}
