'use client';

import React from 'react';
import { ChannelList } from '@/components/channel-list';

export default function WatchPage() {
  return (
    <main className="min-h-screen bg-background text-foreground relative">
      <ChannelList />
    </main>
  );
}
