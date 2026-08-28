'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { ReferralDashboard } from '@/components/referral-dashboard';

export default function ReferralPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DashboardHeader user={user} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <ReferralDashboard />
      </div>
    </div>
  );
}
