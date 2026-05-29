'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Users, TrendingUp } from 'lucide-react';

interface Referral {
  id: string;
  referredUsername: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'pending';
  coinsEarned: number;
}

export function ReferralSystem() {
  const { user } = useAuth();
  const [copyStatus, setCopyStatus] = useState(false);
  const [shareMethod, setShareMethod] = useState<'copy' | 'whatsapp' | 'telegram' | null>(null);

  const mockReferrals: Referral[] = [
    { id: '1', referredUsername: 'user_abc123', joinDate: '5 days ago', status: 'active', coinsEarned: 100 },
    { id: '2', referredUsername: 'user_xyz789', joinDate: '12 days ago', status: 'active', coinsEarned: 100 },
    { id: '3', referredUsername: 'user_def456', joinDate: '1 month ago', status: 'active', coinsEarned: 100 },
  ];

  const handleCopyCode = () => {
    if (user?.referralCode) {
      const referralLink = `https://watchearn.app?ref=${user.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (user?.referralCode) {
      const message = `Join Watch & Earn and get 50 free coins! Use my referral code: ${user.referralCode}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleShareTelegram = () => {
    if (user?.referralCode) {
      const message = `Join Watch & Earn and get 50 free coins! Use my referral code: ${user.referralCode}`;
      const telegramUrl = `https://t.me/share/url?url=watchearn.app&text=${encodeURIComponent(message)}`;
      window.open(telegramUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Share Card */}
      <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Invite Friends & Earn
          </CardTitle>
          <CardDescription>Share your referral code and earn coins when they join</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Referral Code</label>
            <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border">
              <code className="flex-1 font-mono text-lg font-bold text-primary">
                {user?.referralCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copyStatus ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Rewards Info */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-background/50 rounded-lg border border-border">
            <div>
              <p className="text-xs text-muted-foreground">You Get</p>
              <p className="text-xl font-bold text-accent">+100</p>
              <p className="text-xs text-muted-foreground">per referral</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">They Get</p>
              <p className="text-xl font-bold text-primary">+50</p>
              <p className="text-xs text-muted-foreground">bonus coins</p>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Copy className="w-4 h-4" />
              <span className="text-xs">Copy Link</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTelegram}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Telegram</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-3xl font-bold text-foreground">{mockReferrals.length}</p>
              <p className="text-xs text-accent">All active and earning</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Referral Earnings</p>
              <p className="text-3xl font-bold text-primary">
                {(mockReferrals.length * 100).toLocaleString()}
              </p>
              <p className="text-xs text-accent">Total earned</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending Referrals</p>
              <p className="text-3xl font-bold text-secondary">2</p>
              <p className="text-xs text-accent">Awaiting confirmation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Referrals
          </CardTitle>
          <CardDescription>Users who joined using your code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockReferrals.map((referral) => (
            <div
              key={referral.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{referral.referredUsername}</p>
                <p className="text-xs text-muted-foreground">{referral.joinDate}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`${
                    referral.status === 'active'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}
                >
                  {referral.status}
                </Badge>
                <span className="font-semibold text-primary text-sm">+{referral.coinsEarned}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
