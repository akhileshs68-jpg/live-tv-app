'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { CoinsDisplay } from '@/components/coins-display';
import { WatchPointsBenefitsCatalog } from '@/components/watch-points-benefits-catalog';
import { EarningSourcesDisplay } from '@/components/earning-sources-display';
import { AchievementsShowcase } from '@/components/achievements-showcase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdSlot } from '@/components/ads/ad-slot';

export default function EarnPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 font-bold">
            ⭐
          </div>
          <p className="text-xs text-muted-foreground">Loading Watch Points...</p>
        </div>
      </div>
    );
  }

  const dailyEarned = user?.dailyCoinsEarned || 0;
  const dailyLimit = 500;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <DashboardHeader user={user} />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Watch Points Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Server-authoritative Watch Points tracking, earning breakdown, and platform utility catalog
          </p>
        </div>

        {/* Watch Points Summary Grid */}
        <CoinsDisplay user={user} dailyEarned={dailyEarned} />

        {/* Non-blocking Sponsor Banner */}
        <AdSlot slot="banner_hub" />

        {/* Watch Points Tabs */}
        <Tabs defaultValue="utility" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/40 p-1">
            <TabsTrigger value="utility" className="text-xs sm:text-sm font-semibold">
              Utility & Benefits
            </TabsTrigger>
            <TabsTrigger value="earning" className="text-xs sm:text-sm font-semibold">
              Earning Breakdown
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs sm:text-sm font-semibold">
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="utility" className="space-y-4 pt-1">
            <WatchPointsBenefitsCatalog userPoints={user?.totalCoins || 0} />
          </TabsContent>

          <TabsContent value="earning" className="space-y-4 pt-1">
            <EarningSourcesDisplay dailyEarned={dailyEarned} dailyLimit={dailyLimit} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4 pt-1">
            <AchievementsShowcase userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
