'use client';

import React from 'react';
import type { User } from '@/lib/db-types';
import { formatCoins } from '@/lib/reward-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet } from 'lucide-react';

export function CoinsDisplay({ user }: { user: User | null }) {
  if (!user) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Main Coins Balance */}
      <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30 md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Your Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-5xl font-bold text-primary">
              {formatCoins(user.totalCoins)}
            </div>
            <p className="text-sm text-muted-foreground">Reward Coins Available</p>
          </div>
        </CardContent>
      </Card>

      {/* Lifetime Earnings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Lifetime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {formatCoins(user.lifetimeEarnings)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
        </CardContent>
      </Card>
    </div>
  );
}
