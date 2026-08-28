'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { YouTubeBrowser } from '@/components/youtube-browser';

export default function YouTubePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <DashboardHeader user={user} />
      <YouTubeBrowser />
    </div>
  );
}
