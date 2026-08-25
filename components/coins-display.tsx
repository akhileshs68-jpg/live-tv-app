'use client';

import React from 'react';
import type { User } from '@/lib/db-types';
import { formatCoins } from '@/lib/reward-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Award, Clock, AlertCircle } from 'lucide-react';

export function CoinsDisplay({ user, dailyEarned = 0 }: { user: User | null; dailyEarned?: number }) {
  if (!user) return null;

  const dailyLimit = 500;
  const todayPoints = user.dailyCoinsEarned !== undefined ? user.dailyCoinsEarned : dailyEarned;
  const remainingToday = Math.max(0, dailyLimit - todayPoints);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Watch Points Balance */}
        <Card className="bg-gradient-to-br from-amber-500/15 via-primary/10 to-card border-amber-500/30 col-span-2 sm:col-span-1">
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {formatCoins(user.totalCoins)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Watch Points</p>
          </CardContent>
        </Card>

        {/* Today's Watch Points */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              Today's Earned
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {formatCoins(todayPoints)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">of {dailyLimit} max today</p>
          </CardContent>
        </Card>

        {/* Remaining Today */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              Remaining Today
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">
              {formatCoins(remainingToday)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Points available</p>
          </CardContent>
        </Card>

        {/* Lifetime Earnings */}
        <Card className="bg-card border-border col-span-2 sm:col-span-1">
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-accent" />
              Lifetime Earned
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-accent">
              {formatCoins(user.lifetimeEarnings)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">All-time Watch Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Notice */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground">
        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span>
          <strong>Watch Points Notice:</strong> Watch Points are in-app loyalty rewards awarded for streaming activity. They represent platform engagement and carry no monetary or cryptocurrency value.
        </span>
      </div>
    </div>
  );
}
