'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatCoins } from '@/lib/reward-utils';
import { Coins, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function RewardOverlay() {
  const { user } = useAuth();
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [showEarnings, setShowEarnings] = useState(true);
  const [streak, setStreak] = useState(user?.dailyStreak || 0);

  useEffect(() => {
    // Simulate watching earning coins
    const interval = setInterval(() => {
      setDailyEarnings((prev) => {
        const newEarnings = prev + (Math.random() > 0.7 ? 5 : 0);
        return newEarnings > 500 ? 500 : newEarnings;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Coin Balance */}
          <Link
            href="/wallet"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Coins className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="text-sm font-bold text-foreground">
                {formatCoins(user?.balance || user?.totalCoins || 0)}
              </span>
            </div>
          </Link>

          {/* Daily Earnings Display */}
          {showEarnings && dailyEarnings > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-accent/20">
              <TrendingUp className="w-4 h-4 text-accent animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Today&apos;s Earnings</span>
                <span className="text-sm font-bold text-accent">{formatCoins(dailyEarnings)}</span>
              </div>
            </div>
          )}

          {/* Streak Badge */}
          {streak > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-lg">🔥</span>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Streak</span>
                <span className="text-sm font-bold text-primary">{streak} days</span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <Link href="/tasks">Tasks</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <Link href="/referral">Refer</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
