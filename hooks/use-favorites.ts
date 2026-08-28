"use client"

import { useState, useEffect, useCallback } from "react"
import type { Channel } from "@/lib/types"

interface FavoriteChannel extends Channel {
  addedAt: number
}

const STORAGE_KEY = "tv-favorites"
const CUSTOM_EVENT = "tv-favorites-updated"

function getStoredFavorites(): FavoriteChannel[] {
  if (typeof window === "undefined") return []
  try {
    const stored = window.localStorage ? localStorage.getItem(STORAGE_KEY) : null
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.warn("Failed to read favorites from storage:", error)
  }
  return []
}

function saveStoredFavorites(favs: FavoriteChannel[]) {
  if (typeof window === "undefined") return
  try {
    if (window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
      window.dispatchEvent(new CustomEvent(CUSTOM_EVENT, { detail: favs }))
    }
  } catch (error) {
    console.warn("Failed to save favorites to storage:", error)
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteChannel[]>(() => getStoredFavorites())
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Sync favorites on mount and on storage/custom events
  useEffect(() => {
    // Initial sync
    setFavorites(getStoredFavorites())
    setIsLoading(false)

    const handleSync = () => {
      setFavorites(getStoredFavorites())
      setIsLoading(false)
    }

    if (typeof window !== "undefined") {
      window.addEventListener(CUSTOM_EVENT, handleSync)
      window.addEventListener("storage", handleSync)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(CUSTOM_EVENT, handleSync)
        window.removeEventListener("storage", handleSync)
      }
    }
  }, [])

  const addFavorite = useCallback((channel: Channel) => {
    if (!channel || !channel.id) return
    const current = getStoredFavorites()
    if (current.some((fav) => fav.id === channel.id)) return

    const updated = [
      ...current,
      {
        ...channel,
        addedAt: Date.now(),
      },
    ]
    setFavorites(updated)
    saveStoredFavorites(updated)
  }, [])

  const removeFavorite = useCallback((channelId: string) => {
    if (!channelId) return
    const current = getStoredFavorites()
    const updated = current.filter((fav) => fav.id !== channelId)
    setFavorites(updated)
    saveStoredFavorites(updated)
  }, [])

  const toggleFavorite = useCallback((channel: Channel) => {
    if (!channel || !channel.id) return
    const current = getStoredFavorites()
    const isFav = current.some((fav) => fav.id === channel.id)
    if (isFav) {
      removeFavorite(channel.id)
    } else {
      addFavorite(channel)
    }
  }, [addFavorite, removeFavorite])

  const isFavorite = useCallback(
    (channelId: string) => Boolean(channelId && favorites.some((fav) => fav.id === channelId)),
    [favorites]
  )

  const getFavorites = useCallback(() => favorites, [favorites])

  const clearAllFavorites = useCallback(() => {
    setFavorites([])
    saveStoredFavorites([])
  }, [])

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

