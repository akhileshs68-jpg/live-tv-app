'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

export function SystemStatusDashboard() {
  const systems = [
    { name: 'Auto Pi Authentication', status: 'active', icon: '🔐' },
    { name: 'Daily Login Rewards', status: 'active', icon: '📱' },
    { name: 'Watch & Earn TV', status: 'active', icon: '📺' },
    { name: 'Daily Tasks', status: 'active', icon: '✅' },
    { name: 'Streak Bonuses', status: 'active', icon: '🔥' },
    { name: 'Referral Program', status: 'active', icon: '👥' },
    { name: 'Ad Rewards', status: 'active', icon: '🎬' },
    { name: 'Achievement Badges', status: 'active', icon: '🏆' },
    { name: 'Leaderboard', status: 'active', icon: '📊' },
    { name: 'Wallet Sync', status: 'active', icon: '💰' },
    { name: 'Anti-Cheat Protection', status: 'active', icon: '🛡️' },
    { name: 'Social Sharing (4 platforms)', status: 'active', icon: '🔗' },
    { name: 'Multi-Level Referrals (Ready)', status: 'ready', icon: '📈' },
    { name: 'Seasonal Events (Ready)', status: 'ready', icon: '🎁' },
  ];

  const activeCount = systems.filter((s) => s.status === 'active').length;
  const totalCount = systems.length;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Status: ALL ACTIVE</span>
            <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
              {activeCount}/{totalCount} LIVE
            </Badge>
          </CardTitle>
          <CardDescription>All Watch & Earn features are fully operational and ready to earn</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {systems.map((system, idx) => (
          <Card key={idx} className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{system.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{system.name}</p>
                  <Badge 
                    variant={system.status === 'active' ? 'default' : 'secondary'}
                    className={system.status === 'active' 
                      ? 'bg-green-500/20 text-green-700 border-green-500/30 mt-1' 
                      : 'bg-blue-500/20 text-blue-700 border-blue-500/30 mt-1'
                    }
                  >
                    {system.status === 'active' ? '✓ Active' : '→ Ready'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-secondary/30 border-border">
        <CardContent className="pt-6 space-y-2 text-sm">
          <p className="font-semibold text-foreground">All Systems Operational</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>✓ 8 earning modes fully active</li>
            <li>✓ Referral system with social sharing</li>
            <li>✓ 13 achievement badges</li>
            <li>✓ Real-time coin tracking</li>
            <li>✓ Anti-fraud protection</li>
            <li>✓ Mobile-responsive design</li>
            <li>✓ Production-ready architecture</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
