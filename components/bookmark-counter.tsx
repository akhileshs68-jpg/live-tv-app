'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function BookmarkCounter() {
  const { getBookmarkCount } = useBookmarks();
  const count = getBookmarkCount();

  return (
    <Link href="/bookmarks">
      <Button variant="outline" size="sm" className="gap-2 relative">
        <Bookmark className="w-4 h-4" />
        Watch Later
        {count > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-primary">
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
