'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';
import { ChannelList } from '@/components/channel-list';
import { RewardOverlay } from '@/components/reward-overlay';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen during Pi authentication
  if (loading || !isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <RewardOverlay />
      <ChannelList />
    </div>
  );
}
