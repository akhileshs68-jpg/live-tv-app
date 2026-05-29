'use client';

import React from 'react';
import type { User } from '@/lib/db-types';
import { formatCoins } from '@/lib/reward-utils';
import { Badge } from '@/components/ui/badge';

export function DashboardHeader({ user }: { user: User | null }) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold">
            💎
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-foreground">Watch & Earn</h1>
            <p className="text-xs text-muted-foreground">Live TV • Earn Coins</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Coin Balance */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 border border-border">
            <span className="text-lg">💰</span>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-bold text-foreground">{formatCoins(user?.totalCoins || 0)}</p>
            </div>
          </div>

          {/* User Info */}
          <div className="hidden md:block text-right px-3 py-2">
            <p className="text-sm text-muted-foreground">Pioneer</p>
            <p className="font-semibold text-foreground">{user?.piUsername}</p>
          </div>

          {/* Earning Status Badge */}
          <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1" />
            Earning Active
          </Badge>
        </div>
      </div>
    </header>
  );
}
