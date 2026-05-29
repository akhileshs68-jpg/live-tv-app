'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EARNING_SOURCES_INFO } from '@/lib/earning-manager';
import { formatCoins } from '@/lib/reward-utils';

interface EarningSourcesProps {
  dailyEarned: number;
  dailyLimit: number;
}

export function EarningSourcesDisplay({ dailyEarned, dailyLimit }: EarningSourcesProps) {
  const earningSources = useMemo(() => {
    return Object.entries(EARNING_SOURCES_INFO).map(([key, info]) => ({
      id: key,
      ...info,
      active: true,
    }));
  }, []);

  const progressPercent = (dailyEarned / dailyLimit) * 100;
  const remaining = dailyLimit - dailyEarned;

  return (
    <div className="space-y-6">
      {/* Daily Earning Progress */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Earnings</span>
            <Badge className="text-lg px-3 py-1">{formatCoins(dailyEarned)} coins</Badge>
          </CardTitle>
          <CardDescription>Daily earning limit: {formatCoins(dailyLimit)} coins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <div className="grid grid-cols-3 text-sm text-muted-foreground">
            <div>
              <p className="text-primary font-bold">{dailyEarned}</p>
              <p className="text-xs">Earned</p>
            </div>
            <div className="text-center">
              <p className="text-accent font-bold">{remaining}</p>
              <p className="text-xs">Remaining</p>
            </div>
            <div className="text-right">
              <p className="text-foreground font-bold">{progressPercent.toFixed(0)}%</p>
              <p className="text-xs">Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Active Earning Sources */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Active Earning Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earningSources.map((source) => (
            <Card key={source.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{source.icon}</span>
                  <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Active</Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{source.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{source.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-accent">+{source.amount} coins</span>
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                    {source.frequency}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-secondary/30 border-border">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-foreground">7 Active Earning Modes</span>
              <span className="text-muted-foreground"> - All features are enabled and ready to use</span>
            </p>
            <p className="text-muted-foreground">
              Combine multiple earning sources to maximize your daily coins. Watch more, invite friends, complete tasks, and maintain your streak!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
