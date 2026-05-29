'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Bookmark {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  url: string;
  timestamp: number;
  logo?: string;
  language?: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('tv-bookmarks');
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse bookmarks:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever bookmarks change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tv-bookmarks', JSON.stringify(bookmarks));
    }
  }, [bookmarks, isLoading]);

  const addBookmark = (bookmark: Bookmark) => {
    const exists = bookmarks.some((b) => b.id === bookmark.id);
    if (exists) {
      toast.info('Already bookmarked');
      return false;
    }

    const newBookmark = {
      ...bookmark,
      timestamp: Date.now(),
    };

    setBookmarks((prev) => [newBookmark, ...prev]);
    toast.success(`${bookmark.title} added to Watch Later`);
    return true;
  };

  const removeBookmark = (bookmarkId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    toast.success('Removed from Watch Later');
  };

  const isBookmarked = (itemId: string) => {
    return bookmarks.some((b) => b.id === itemId);
  };

  const getBookmark = (bookmarkId: string) => {
    return bookmarks.find((b) => b.id === bookmarkId);
  };

  const clearAll = () => {
    setBookmarks([]);
    toast.success('All bookmarks cleared');
  };

  const getBookmarkCount = () => bookmarks.length;

  return {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getBookmark,
    clearAll,
    getBookmarkCount,
  };
}
