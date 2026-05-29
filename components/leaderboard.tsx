'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalCoins: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  streak: number;
}

export function Leaderboard() {
  const [timeframe, setTimeframe] = useState('week');

  const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'Crypto_King', totalCoins: 45230, dailyEarnings: 320, weeklyEarnings: 2100, streak: 45 },
    { rank: 2, username: 'Earn_Master', totalCoins: 38950, dailyEarnings: 285, weeklyEarnings: 1950, streak: 32 },
    { rank: 3, username: 'Reward_Hunter', totalCoins: 35670, dailyEarnings: 255, weeklyEarnings: 1750, streak: 28 },
    { rank: 4, username: 'Watch_Pro', totalCoins: 32100, dailyEarnings: 220, weeklyEarnings: 1450, streak: 21 },
    { rank: 5, username: 'Grind_Daily', totalCoins: 28450, dailyEarnings: 180, weeklyEarnings: 1200, streak: 15 },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Global Leaderboard
          </CardTitle>
          <CardDescription>Top earners in the community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="alltime" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="alltime">All Time</TabsTrigger>
            </TabsList>

            <TabsContent value="alltime" className="space-y-3 mt-4">
              {mockLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center">
                      {entry.rank === 1 && (
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      )}
                      {entry.rank === 2 && (
                        <Trophy className="w-6 h-6 text-gray-400" />
                      )}
                      {entry.rank === 3 && (
                        <Trophy className="w-6 h-6 text-orange-600" />
                      )}
                      {entry.rank > 3 && (
                        <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{entry.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          {entry.streak}d streak
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent">{entry.totalCoins.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Coins</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-3 mt-4">
              {mockLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground">#{entry.rank}</span>
                    <p className="font-semibold text-foreground">{entry.username}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">{entry.weeklyEarnings}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="daily" className="space-y-3 mt-4">
              {mockLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground">#{entry.rank}</span>
                    <p className="font-semibold text-foreground">{entry.username}</p>
                  </div>
                  <p className="text-lg font-bold text-accent">{entry.dailyEarnings}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
