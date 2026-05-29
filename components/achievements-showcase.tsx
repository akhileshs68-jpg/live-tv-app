'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { initializeAchievements, getAchievementProgress, ACHIEVEMENT_CONFIG } from '@/lib/achievements';
import type { Achievement } from '@/lib/achievements';

interface AchievementsShowcaseProps {
  userId?: string;
}

export function AchievementsShowcase({ userId }: AchievementsShowcaseProps) {
  // Mock data - replace with real achievements from context
  const mockAchievements = React.useMemo(() => {
    const all = initializeAchievements(userId || 'demo');
    
    // Simulate some unlocked achievements
    all.achievements[0].unlocked = true; // first_watch
    all.achievements[1].progress = 2400; // hour_marathon (2400 seconds = 40 minutes)
    all.achievements[2].progress = 5; // daily_streak_7
    all.achievements[7].progress = 1; // first_referral
    all.achievements[8].progress = 3; // referral_5
    
    return all;
  }, [userId]);

  const unlockedCount = mockAchievements.achievements.filter((a) => a.unlocked).length;
  const totalAchievements = mockAchievements.achievements.length;
  const completionPercent = (unlockedCount / totalAchievements) * 100;

  return (
    <div className="space-y-6">
      {/* Achievements Header */}
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-3xl">🏆</span>
              Achievements & Badges
            </span>
            <Badge className="text-lg px-3 py-1">{unlockedCount}/{totalAchievements}</Badge>
          </CardTitle>
          <CardDescription>Complete challenges to unlock achievements and earn bonus rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={completionPercent} className="h-3" />
            <p className="text-sm text-muted-foreground">{completionPercent.toFixed(0)}% completed</p>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {mockAchievements.achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {/* Milestone Progress */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Earning Milestones</h3>
        <div className="space-y-3">
          {[
            { icon: '💰', label: '100 Coins', progress: 0, target: 100 },
            { icon: '⭐', label: '500 Coins', progress: 0, target: 500 },
            { icon: '🔥', label: '1,000 Coins', progress: 0, target: 1000 },
            { icon: '👑', label: '5,000 Coins', progress: 0, target: 5000 },
          ].map((milestone, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{milestone.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{milestone.label}</p>
                  <p className="text-xs text-muted-foreground">{milestone.progress} / {milestone.target}</p>
                </div>
              </div>
              <Progress value={(milestone.progress / milestone.target) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-secondary/30 border-border">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-foreground mb-2">Pro Tips to Unlock More Achievements</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Watch live TV daily to build your streak and unlock streak badges</li>
            <li>• Invite friends using your referral code to unlock network achievements</li>
            <li>• Complete all daily tasks to unlock the Task Master achievement</li>
            <li>• Reach the leaderboard top 10 to unlock exclusive badges</li>
            <li>• Each achievement rewards bonus coins and special perks</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const isNearComplete = achievement.progress >= achievement.target * 0.8;
  const progressPercent = Math.min((achievement.progress / achievement.target) * 100, 100);

  if (achievement.unlocked) {
    return (
      <div className="group cursor-pointer">
        <Card className="bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border-yellow-500/50 hover:border-yellow-500 transition-colors h-full">
          <CardContent className="p-3 text-center h-full flex flex-col items-center justify-center">
            <p className="text-4xl mb-2">{achievement.icon}</p>
            <p className="text-xs font-bold text-foreground">{achievement.title}</p>
            <Badge className="mt-2 bg-green-500/20 text-green-700 border-green-500/30 text-xs">
              +{achievement.reward}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer">
      <Card className={`bg-card border-border hover:border-primary/50 transition-colors h-full ${
        isNearComplete ? 'ring-2 ring-yellow-500/50' : ''
      }`}>
        <CardContent className="p-3 h-full flex flex-col items-center justify-center">
          <p className="text-3xl mb-2 opacity-50">{achievement.icon}</p>
          <p className="text-xs font-bold text-foreground text-center mb-2">{achievement.title}</p>
          <div className="w-full mb-2">
            <Progress value={progressPercent} className="h-1" />
          </div>
          <p className="text-xs text-muted-foreground">
            {achievement.progress}/{achievement.target}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
