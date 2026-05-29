'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EarningSourcesDisplay } from '@/components/earning-sources-display';
import { AchievementsShowcase } from '@/components/achievements-showcase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EarnPage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  // Mock daily data
  const dailyEarned = 245;
  const dailyLimit = 500;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DashboardHeader user={user} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">Watch & Earn</h1>
          <p className="text-lg text-muted-foreground">
            All 7 earning modes are active and ready to earn you coins every day
          </p>
        </div>

        {/* Active Features Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <Badge className="w-3 h-3 p-0 bg-green-500" />
                <span className="text-sm font-medium">Daily Login</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-3 h-3 p-0 bg-green-500" />
                <span className="text-sm font-medium">Watch TV</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-3 h-3 p-0 bg-green-500" />
                <span className="text-sm font-medium">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-3 h-3 p-0 bg-green-500" />
                <span className="text-sm font-medium">Streaks</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-3 h-3 p-0 bg-green-500" />
                <span className="text-sm font-medium">Referrals</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-3 h-3 p-0 bg-green-500" />
                <span className="text-sm font-medium">Ads</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-3 h-3 p-0 bg-green-500" />
                <span className="text-sm font-medium">Achievements</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-3 h-3 p-0 bg-green-500" />
                <span className="text-sm font-medium">Leaderboard</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="earning" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="earning">Earning Sources</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="features">Active Features</TabsTrigger>
          </TabsList>

          <TabsContent value="earning" className="space-y-4">
            <EarningSourcesDisplay dailyEarned={dailyEarned} dailyLimit={dailyLimit} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <AchievementsShowcase userId={user?.id} />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <FeaturesList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FeaturesList() {
  const features = [
    {
      icon: '📱',
      name: 'Daily Login Rewards',
      description: 'Earn 10 coins every day you log in with streak bonuses',
      status: 'Active',
    },
    {
      icon: '📺',
      name: 'Watch & Earn',
      description: 'Watch live TV channels and earn 30-50 coins per video',
      status: 'Active',
    },
    {
      icon: '✅',
      name: 'Daily Tasks',
      description: 'Complete tasks to earn 25 coins each (unlimited)',
      status: 'Active',
    },
    {
      icon: '🔥',
      name: 'Streak Bonuses',
      description: '10% bonus coins for each consecutive day (up to 100%)',
      status: 'Active',
    },
    {
      icon: '👥',
      name: 'Referral Program',
      description: 'Earn 100 coins per friend signup, they get 50 bonus coins',
      status: 'Active',
    },
    {
      icon: '🎬',
      name: 'Ad Rewards',
      description: 'Watch short ads to earn bonus coins',
      status: 'Active',
    },
    {
      icon: '🏆',
      name: 'Achievements',
      description: 'Unlock 13 achievement badges with bonus rewards',
      status: 'Active',
    },
    {
      icon: '📊',
      name: 'Leaderboard',
      description: 'Compete with other users and earn prestige rewards',
      status: 'Active',
    },
    {
      icon: '💳',
      name: 'Instant Wallet',
      description: 'All coins sync instantly to your Pi Network wallet',
      status: 'Active',
    },
    {
      icon: '🛡️',
      name: 'Anti-Cheat',
      description: 'Advanced fraud detection to protect your earnings',
      status: 'Active',
    },
    {
      icon: '⚡',
      name: 'Multi-Level Referrals',
      description: 'Earn from 2nd and 3rd tier referrals (future)',
      status: 'Ready',
    },
    {
      icon: '🎁',
      name: 'Seasonal Events',
      description: 'Special challenges with bonus rewards (coming soon)',
      status: 'Ready',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, idx) => (
          <Card key={idx} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{feature.name}</h3>
                    <Badge 
                      variant={feature.status === 'Active' ? 'default' : 'secondary'}
                      className={feature.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                    >
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle>All Features Enabled</CardTitle>
          <CardDescription>Start earning coins immediately with 8 active earning modes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold text-foreground">Daily Earning Potential:</span>
            <span className="text-accent font-bold ml-2">500+ coins</span>
          </p>
          <p>
            <span className="font-semibold text-foreground">Monthly Potential:</span>
            <span className="text-accent font-bold ml-2">15,000+ coins</span>
          </p>
          <p className="text-muted-foreground">
            With all earning modes active and optimal engagement, you can earn the maximum daily limit every day.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
