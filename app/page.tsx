'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';
import { ChannelList } from '@/components/channel-list';
import { RewardOverlay } from '@/components/reward-overlay';

export default function Home() {
  const { loading, user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {loading && !user && <AuthLoadingScreen />}
      <RewardOverlay />
      <ChannelList />
    </div>
  );
}
