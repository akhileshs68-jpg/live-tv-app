'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const getStreakMessage = (days: number) => {
    if (days >= 30) return 'Legendary! 🔥';
    if (days >= 14) return 'On Fire! 🚀';
    if (days >= 7) return 'Going Strong! ⭐';
    return 'Keep It Up! 💪';
  };

  const getStreakColor = (days: number) => {
    if (days >= 30) return 'from-accent via-secondary to-primary';
    if (days >= 14) return 'from-primary via-secondary to-accent';
    if (days >= 7) return 'from-secondary to-primary';
    return 'from-primary to-secondary';
  };

  return (
    <Card className={`bg-gradient-to-r ${getStreakColor(streak)} border-0 shadow-lg`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white/80">Current Streak</p>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-white/90 animate-bounce" />
              <span className="text-4xl font-bold text-white">{streak}</span>
              <span className="text-lg text-white/80">days</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white">{getStreakMessage(streak)}</p>
            <p className="text-xs text-white/70 mt-1">
              {100 + streak * 10} coins/day at day {Math.ceil(streak / 10) + 1}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
