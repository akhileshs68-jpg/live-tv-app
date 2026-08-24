'use client';

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Gift, Zap } from 'lucide-react';
import { formatCoins } from '@/lib/reward-utils';

export function WalletSummary() {
  const { balance, lifetimeEarnings, referralEarnings, todayEarnings, loading, getTransactionSummary } = useWallet();

  const summary = getTransactionSummary();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="h-12 bg-secondary/20 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Current Balance */}
      <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{formatCoins(balance)}</div>
          <p className="text-xs text-muted-foreground mt-1">Available coins</p>
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
          <div className="text-3xl font-bold text-accent">{formatCoins(lifetimeEarnings)}</div>
          <p className="text-xs text-muted-foreground mt-1">Total earned</p>
        </CardContent>
      </Card>

      {/* Today's Earnings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-500">{formatCoins(todayEarnings)}</div>
          <p className="text-xs text-muted-foreground mt-1">Today&apos;s earnings</p>
        </CardContent>
      </Card>

      {/* Referral Earnings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-500" />
            Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-pink-500">{formatCoins(referralEarnings)}</div>
          <p className="text-xs text-muted-foreground mt-1">From referrals</p>
        </CardContent>
      </Card>

      {/* Transaction Summary Stats */}
      {summary && (
        <>
          {/* Total Earned */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCoins(summary.totalEarned)}</div>
              <p className="text-xs text-muted-foreground mt-1">Watch rewards</p>
            </CardContent>
          </Card>

          {/* Total Spent */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCoins(summary.totalSpent)}</div>
              <p className="text-xs text-muted-foreground mt-1">Redeemed coins</p>
            </CardContent>
          </Card>

          {/* Total Transactions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{summary.totalTransactions}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
