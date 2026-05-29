'use client';

import { Button } from '@/components/ui/button';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { useBookmarks, type Bookmark } from '@/hooks/use-bookmarks';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  item: Bookmark;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'icon' | 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export function BookmarkButton({
  item,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  onBookmarkChange,
}: BookmarkButtonProps) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const bookmarked = isBookmarked(item.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (bookmarked) {
      removeBookmark(item.id);
    } else {
      addBookmark(item);
    }

    onBookmarkChange?.(!bookmarked);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        'transition-all duration-300',
        bookmarked && 'text-amber-500 hover:text-amber-600'
      )}
      title={bookmarked ? 'Remove from Watch Later' : 'Add to Watch Later'}
    >
      <BookmarkIcon
        className={cn(
          'w-4 h-4 transition-all',
          bookmarked && 'fill-amber-500'
        )}
      />
      {showLabel && (
        <span className="ml-2 text-xs">
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </Button>
  );
}
