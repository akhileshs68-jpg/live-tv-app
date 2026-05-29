'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';

interface DailyRewardCardProps {
  dailyEarnings: number;
}

export function DailyRewardCard({ dailyEarnings }: DailyRewardCardProps) {
  const dailyLimit = 500;
  const progressPercent = (dailyEarnings / dailyLimit) * 100;

  return (
    <Card className="bg-gradient-to-r from-accent/20 to-secondary/20 border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          Today&apos;s Earnings
        </CardTitle>
        <CardDescription>Earn up to {dailyLimit} coins per day</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-lg font-bold text-accent">{dailyEarnings}</span>
          </div>
          <div className="h-3 bg-background rounded-full overflow-hidden border border-accent/20">
            <div
              className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {dailyLimit - dailyEarnings} coins remaining
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="text-xs h-9"
          >
            Watch Videos
          </Button>
          <Button
            variant="outline"
            className="text-xs h-9"
          >
            Complete Tasks
          </Button>
          <Button
            variant="outline"
            className="text-xs h-9"
          >
            Share Referral
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded">
          <Clock className="w-4 h-4" />
          <span>Resets at 12:00 AM UTC</span>
        </div>
      </CardContent>
    </Card>
  );
}
