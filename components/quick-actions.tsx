'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trophy, Share2, Zap } from 'lucide-react';

export function QuickActions() {
  const tasks = [
    {
      id: 1,
      title: 'Daily Login',
      description: 'Sign in every day for streaks',
      reward: 10,
      icon: CheckCircle2,
      color: 'text-accent',
    },
    {
      id: 2,
      title: 'Watch 30 Min',
      description: 'Watch 30 minutes of content',
      reward: 50,
      icon: Zap,
      color: 'text-primary',
    },
    {
      id: 3,
      title: 'Invite Friends',
      description: 'Share your referral code',
      reward: 100,
      icon: Share2,
      color: 'text-secondary',
    },
    {
      id: 4,
      title: 'Weekly Streak',
      description: 'Maintain 7-day streak',
      reward: 200,
      icon: Trophy,
      color: 'text-accent',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Available Tasks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Card key={task.id} className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${task.color}`} />
                      {task.title}
                    </CardTitle>
                    <CardDescription className="text-xs">{task.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-accent">+{task.reward}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Start Task
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
