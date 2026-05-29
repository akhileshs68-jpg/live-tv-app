'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock, Lock, Zap, Gift } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  progress: number;
  maxProgress: number;
  status: 'available' | 'in_progress' | 'completed' | 'claimed';
  icon: React.ReactNode;
  instructions: string;
}

export default function TasksPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'special'>('all');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Daily Login',
      description: 'Sign in to your account',
      reward: 10,
      category: 'daily',
      progress: 1,
      maxProgress: 1,
      status: 'claimed',
      icon: <CheckCircle2 className="w-5 h-5 text-accent" />,
      instructions: 'Simply log in to your account daily to earn coins.',
    },
    {
      id: '2',
      title: 'Watch 30 Minutes',
      description: 'Watch 30 minutes of content today',
      reward: 50,
      category: 'daily',
      progress: 15,
      maxProgress: 30,
      status: 'in_progress',
      icon: <Zap className="w-5 h-5 text-primary" />,
      instructions: 'Watch any videos on the platform to earn coins.',
    },
    {
      id: '3',
      title: 'Invite 5 Friends',
      description: 'Refer 5 friends to the platform',
      reward: 500,
      category: 'weekly',
      progress: 3,
      maxProgress: 5,
      status: 'in_progress',
      icon: <Gift className="w-5 h-5 text-secondary" />,
      instructions: 'Share your referral code with friends and earn when they join.',
    },
    {
      id: '4',
      title: '7-Day Streak',
      description: 'Maintain a 7-day login streak',
      reward: 200,
      category: 'weekly',
      progress: 5,
      maxProgress: 7,
      status: 'in_progress',
      icon: <Clock className="w-5 h-5" />,
      instructions: 'Log in every day without missing a day.',
    },
    {
      id: '5',
      title: 'Earn 1000 Coins',
      description: 'Earn a total of 1000 coins',
      reward: 300,
      category: 'monthly',
      progress: 450,
      maxProgress: 1000,
      status: 'in_progress',
      icon: <Zap className="w-5 h-5" />,
      instructions: 'Earn coins through any available methods.',
    },
    {
      id: '6',
      title: 'Complete Profile',
      description: 'Fill out your profile information',
      reward: 100,
      category: 'special',
      progress: 0,
      maxProgress: 1,
      status: 'available',
      icon: <CheckCircle2 className="w-5 h-5" />,
      instructions: 'Add a profile picture and bio to unlock this reward.',
    },
  ];

  const filteredTasks = selectedCategory === 'all' ? mockTasks : mockTasks.filter(t => t.category === selectedCategory);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'claimed':
        return 'bg-accent/20 text-accent';
      case 'completed':
        return 'bg-accent/20 text-accent';
      case 'in_progress':
        return 'bg-primary/20 text-primary';
      case 'available':
        return 'bg-secondary/20 text-secondary';
      default:
        return 'bg-muted-foreground/20 text-muted-foreground';
    }
  };

  const getProgressPercent = (task: Task) => (task.progress / task.maxProgress) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DashboardHeader user={user} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks & Achievements</h1>
          <p className="text-muted-foreground">Complete tasks to earn bonus coins and unlock rewards</p>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Active Tasks</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {mockTasks.filter(t => t.status === 'in_progress').length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="text-3xl font-bold text-accent mt-2">
                {mockTasks.filter(t => t.status === 'claimed').length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Rewards</p>
              <p className="text-3xl font-bold text-primary mt-2">
                {mockTasks.reduce((sum, t) => sum + (t.status === 'claimed' ? t.reward : 0), 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-3xl font-bold text-secondary mt-2">
                {Math.round((mockTasks.filter(t => t.status === 'claimed').length / mockTasks.length) * 100)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="all" onValueChange={(val) => setSelectedCategory(val as any)}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>

          {['all', 'daily', 'weekly', 'monthly', 'special'].map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="bg-card border-border hover:border-primary/50 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">{task.icon}</div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{task.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status === 'claimed' && 'Claimed'}
                            {task.status === 'completed' && 'Completed'}
                            {task.status === 'in_progress' && 'In Progress'}
                            {task.status === 'available' && 'Available'}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {task.progress} / {task.maxProgress}
                            </span>
                            <span className="font-semibold text-accent">+{task.reward} coins</span>
                          </div>
                          <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                              style={{ width: `${getProgressPercent(task)}%` }}
                            />
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3">{task.instructions}</p>

                        <Button
                          size="sm"
                          disabled={task.status === 'claimed'}
                          className={
                            task.status === 'claimed'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          }
                        >
                          {task.status === 'claimed' ? 'Claimed' : 'Claim Reward'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
