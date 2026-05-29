'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { BookmarkButton } from '@/components/bookmark-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WatchLaterPage() {
  const { bookmarks, clearAll, removeBookmark, isLoading } = useBookmarks();
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Watch Later</h1>
          </div>
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Watch Later</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {bookmarks.length} {bookmarks.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
          {bookmarks.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmClear(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Empty State */}
        {bookmarks.length === 0 ? (
          <Card className="border-dashed border-2 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No bookmarks yet
                </h2>
                <p className="text-muted-foreground mb-6">
                  Start bookmarking channels and videos to watch them later.
                </p>
                <Link href="/">
                  <Button className="gap-2">
                    <Play className="w-4 h-4" />
                    Browse Channels
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookmarks.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:border-primary/50 transition-all group"
              >
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-32 h-20 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground opacity-60">
                        {item.title.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      {item.language && (
                        <Badge variant="outline" className="text-xs">
                          {item.language}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-primary/10"
                      title="Play"
                    >
                      <Play className="w-4 h-4 fill-primary text-primary" />
                    </Button>
                    <BookmarkButton
                      item={item}
                      variant="ghost"
                      size="icon"
                      onBookmarkChange={(isBookmarked) => {
                        if (!isBookmarked) {
                          removeBookmark(item.id);
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                      onClick={() => removeBookmark(item.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all bookmarks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {bookmarks.length} items from your Watch Later list.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAll();
                setConfirmClear(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
