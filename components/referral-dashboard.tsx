'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { generateShareLinks, getReferralMessage, REFERRAL_REWARDS } from '@/lib/referral-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Send, MessageCircle, Heart, Facebook, X } from 'lucide-react';
import { toast } from 'sonner';

export function ReferralDashboard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  if (!user) return null;

  const referralCode = user.referralCode;
  const referralUrl = `https://watchearn.app?ref=${referralCode}`;
  const shareLinks = generateShareLinks(user.piUsername, referralCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleShare = (platform: 'telegram' | 'whatsapp' | 'facebook' | 'twitter') => {
    const url = shareLinks[platform];
    window.open(url, '_blank', 'width=600,height=400');
    toast.success(`Share opened on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
  };

  // Mock data - replace with real data from backend
  const stats = {
    totalInvites: 12,
    confirmedReferrals: 8,
    pendingReferrals: 4,
    totalEarned: user.referralEarnings || 0,
    thisMonth: 400,
    potentialPending: 200,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Referral Program</h1>
        <p className="text-muted-foreground">
          Invite friends and earn {REFERRAL_REWARDS.REFERRER_BONUS} coins per signup. They get {REFERRAL_REWARDS.REFERRED_BONUS} bonus coins!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Invites</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalInvites}</p>
            <p className="text-xs text-accent mt-2">+{stats.confirmedReferrals} confirmed</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Referral Earnings</p>
            <p className="text-3xl font-bold text-accent">{stats.totalEarned.toLocaleString()}</p>
            <p className="text-xs text-green-500 mt-2">+{stats.thisMonth} this month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Pending Converts</p>
            <p className="text-3xl font-bold text-primary">{stats.pendingReferrals}</p>
            <p className="text-xs text-yellow-500 mt-2">~{stats.potentialPending} coins waiting</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Your Rank</p>
            <p className="text-3xl font-bold text-primary">#42</p>
            <p className="text-xs text-primary/80 mt-2">Top 5% of referrers</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>Share this code with friends to earn rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
              <code className="text-lg font-bold text-primary">{referralCode}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyCode}
                className="hover:bg-primary/10"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This code is unique to you and never expires. Friends who sign up with your code will give you both rewards!
          </p>
        </CardContent>
      </Card>

      {/* Referral Link Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link directly with friends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralUrl}
              readOnly
              className="bg-secondary/50 text-sm"
            />
            <Button
              size="sm"
              variant="default"
              onClick={handleCopyLink}
              className="whitespace-nowrap"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Sharing */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share on Social Media
          </CardTitle>
          <CardDescription>Quick share buttons for your referral code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto py-3 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500"
              onClick={() => handleShare('telegram')}
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Telegram</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto py-3 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-500"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto py-3 hover:bg-blue-600/10 hover:border-blue-600/30 hover:text-blue-600"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="w-5 h-5" />
              <span className="hidden sm:inline">Facebook</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto py-3 hover:bg-foreground/10 hover:border-foreground/30"
              onClick={() => handleShare('twitter')}
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Twitter/X</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent" />
            How the Referral Program Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Badge className="h-6 w-6 flex items-center justify-center flex-shrink-0">1</Badge>
            <div>
              <p className="font-medium">Share Your Code</p>
              <p className="text-sm text-muted-foreground">Send your unique referral code to friends</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Badge className="h-6 w-6 flex items-center justify-center flex-shrink-0">2</Badge>
            <div>
              <p className="font-medium">Friend Signs Up</p>
              <p className="text-sm text-muted-foreground">They enter your code during signup</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Badge className="h-6 w-6 flex items-center justify-center flex-shrink-0">3</Badge>
            <div>
              <p className="font-medium">Instant Rewards</p>
              <p className="text-sm text-muted-foreground">You get {REFERRAL_REWARDS.REFERRER_BONUS} coins, they get {REFERRAL_REWARDS.REFERRED_BONUS} bonus coins</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Badge className="h-6 w-6 flex items-center justify-center flex-shrink-0">4</Badge>
            <div>
              <p className="font-medium">Keep Earning</p>
              <p className="text-sm text-muted-foreground">Unlimited referrals with no cap on earnings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Referrals List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Friends you&apos;ve successfully referred</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: 'Pioneer User 1', status: 'confirmed', date: '2 days ago', earned: 100 },
              { name: 'Pioneer User 2', status: 'confirmed', date: '5 days ago', earned: 100 },
              { name: 'Pioneer User 3', status: 'pending', date: '1 day ago', earned: 0 },
            ].map((referral, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{referral.name}</p>
                  <p className="text-xs text-muted-foreground">{referral.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={referral.status === 'confirmed' ? 'default' : 'secondary'}>
                    {referral.status}
                  </Badge>
                  {referral.earned > 0 && (
                    <span className="text-sm font-bold text-accent">+{referral.earned}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">{REFERRAL_REWARDS.REFERRER_BONUS}</p>
            <p className="text-sm text-muted-foreground">Coins you earn per referral</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-accent mb-2">{REFERRAL_REWARDS.REFERRED_BONUS}</p>
            <p className="text-sm text-muted-foreground">Bonus coins for your friends</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground mb-2">Unlimited</p>
            <p className="text-sm text-muted-foreground">Max referrals you can make</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
