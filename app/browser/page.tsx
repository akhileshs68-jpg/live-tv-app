'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { InAppBrowser } from '@/components/in-app-browser';

export default function BrowserPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <DashboardHeader user={user} />
      <InAppBrowser />
    </div>
  );
}
