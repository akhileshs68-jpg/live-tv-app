'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, Video, Gift, Users, TrendingUp } from 'lucide-react';

interface Activity {
  id: number;
  type: 'watch' | 'reward' | 'referral' | 'task';
  title: string;
  description: string;
  amount: number;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

export function RecentActivity() {
  const activities: Activity[] = [
    {
      id: 1,
      type: 'watch',
      title: 'Video Watched',
      description: 'Completed "Tech News Daily"',
      amount: 25,
      timestamp: '2 hours ago',
      icon: <Video className="w-4 h-4" />,
      color: 'bg-primary/20',
    },
    {
      id: 2,
      type: 'referral',
      title: 'Friend Joined',
      description: 'User ABC123 signed up',
      amount: 100,
      timestamp: '5 hours ago',
      icon: <Users className="w-4 h-4" />,
      color: 'bg-secondary/20',
    },
    {
      id: 3,
      type: 'task',
      title: 'Task Completed',
      description: '"Watch 30 Minutes" achievement',
      amount: 50,
      timestamp: '1 day ago',
      icon: <Gift className="w-4 h-4" />,
      color: 'bg-accent/20',
    },
    {
      id: 4,
      type: 'reward',
      title: 'Streak Bonus',
      description: '5-day streak milestone',
      amount: 75,
      timestamp: '2 days ago',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'bg-accent/20',
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest earning transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${activity.color}`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-accent/20 text-accent border-0">
                  +{activity.amount}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap w-16 text-right">
                  {activity.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
