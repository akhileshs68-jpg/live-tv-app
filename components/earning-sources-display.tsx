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

  const progressPercent = Math.min(100, (dailyEarned / (dailyLimit || 500)) * 100);
  const remaining = Math.max(0, (dailyLimit || 500) - dailyEarned);

  return (
    <div className="space-y-6">
      {/* Daily Earning Progress */}
      <Card className="bg-gradient-to-br from-amber-500/10 via-primary/5 to-card border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base font-bold text-foreground">
            <span>Today's Watch Points Accumulated</span>
            <Badge className="text-sm px-3 py-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
              {formatCoins(dailyEarned)} / {formatCoins(dailyLimit)} pts
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Server-enforced daily Watch Points cap: {formatCoins(dailyLimit)} points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Progress value={progressPercent} className="h-2.5 bg-secondary" />
          </div>
          <div className="grid grid-cols-3 text-xs text-muted-foreground">
            <div>
              <p className="text-emerald-400 font-bold text-sm">{dailyEarned}</p>
              <p className="text-[11px]">Earned Today</p>
            </div>
            <div className="text-center">
              <p className="text-amber-400 font-bold text-sm">{remaining}</p>
              <p className="text-[11px]">Remaining Cap</p>
            </div>
            <div className="text-right">
              <p className="text-foreground font-bold text-sm">{progressPercent.toFixed(0)}%</p>
              <p className="text-[11px]">Cap Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Active Earning Sources */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3">Watch Points Earning Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {earningSources.map((source) => (
            <Card key={source.id} className="bg-card border-border hover:border-border/80 transition-colors">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{source.icon}</span>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Active</Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-0.5">{source.name}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-snug">{source.description}</p>
                <div className="flex items-center justify-between border-t border-border/40 pt-2">
                  <span className="text-xs font-bold text-amber-400">+{source.amount} pts</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">
                    {source.frequency}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
