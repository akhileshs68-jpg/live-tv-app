'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, Tv, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCoins } from '@/lib/reward-utils';
import { useAuth } from '@/lib/auth-context';
import { getApiUrl } from '@/lib/api-config';

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  icon: React.ReactNode;
  category: 'ad_free' | 'premium' | 'stream_quality' | 'badge';
  status: 'available' | 'coming_soon';
  highlight?: string;
}

export function WatchPointsBenefitsCatalog({ userPoints }: { userPoints?: number }) {
  const { user, piAccessToken, syncServerBalance, syncPremiumStatus } = useAuth();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  const availablePoints = userPoints ?? (user?.totalCoins || 0);

  const benefits: BenefitItem[] = [
    {
      id: 'ad_free_24h',
      title: '24-Hour Ad-Free Pass',
      description: 'Stream all live TV channels uninterrupted without banner or video ads for 24 hours.',
      pointsCost: 250,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      category: 'ad_free',
      status: 'available',
      highlight: 'Popular',
    },
    {
      id: 'premium_trial_3d',
      title: '3-Day Premium VIP Trial',
      description: 'Unlock HD stream sources, exclusive channels, and priority audio bitrates.',
      pointsCost: 500,
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      category: 'premium',
      status: 'available',
      highlight: 'High Value',
    },
    {
      id: 'priority_bitrate',
      title: 'HD Priority Stream Pass',
      description: 'Enable server-side high-bandwidth pipeline for crystal clear, low-latency live streaming.',
      pointsCost: 100,
      icon: <Tv className="w-5 h-5 text-blue-400" />,
      category: 'stream_quality',
      status: 'available',
    },
    {
      id: 'pioneer_badge',
      title: 'Pioneer Supporter Badge',
      description: 'Display an exclusive Pioneer Supporter badge on your chat messages and user profile.',
      pointsCost: 200,
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      category: 'badge',
      status: 'available',
    },
  ];

  const handleRedeem = async (item: BenefitItem) => {
    setRedeemingId(item.id);
    setFeedback(null);

    try {
      const res = await fetch(getApiUrl('/api/rewards/redeem'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${piAccessToken || ''}`,
        },
        body: JSON.stringify({ productId: item.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          id: item.id,
          success: true,
          msg: data.message || `Redeemed ${item.title}!`,
        });
        await Promise.all([syncServerBalance(), syncPremiumStatus()]);
      } else {
        setFeedback({
          id: item.id,
          success: false,
          msg: data.error || 'Redemption failed. Please try again.',
        });
      }
    } catch (err: any) {
      setFeedback({
        id: item.id,
        success: false,
        msg: err?.message || 'Server network error during redemption.',
      });
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-foreground">Watch Points Utility & Benefits</h2>
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
            Platform Utility
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Use your earned Watch Points to unlock premium viewing features and platform enhancements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {benefits.map((item) => {
          const canAfford = availablePoints >= item.pointsCost;
          const isRedeeming = redeemingId === item.id;
          const itemFeedback = feedback?.id === item.id ? feedback : null;

          return (
            <Card key={item.id} className="bg-card border-border hover:border-border/80 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-secondary/50 border border-border/60">
                      {item.icon}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">{item.title}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-amber-400">
                          {formatCoins(item.pointsCost)} Watch Points
                        </span>
                        {item.highlight && (
                          <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                            {item.highlight}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </CardDescription>

                {itemFeedback && (
                  <div
                    className={`p-2 rounded text-xs font-medium ${
                      itemFeedback.success
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                  >
                    {itemFeedback.msg}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Instant Activation
                  </span>
                  <Button
                    size="sm"
                    variant={canAfford ? 'default' : 'outline'}
                    disabled={!canAfford || isRedeeming}
                    onClick={() => handleRedeem(item)}
                    className="h-7 text-xs px-3 font-semibold"
                  >
                    {isRedeeming ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Redeeming...
                      </span>
                    ) : canAfford ? (
                      'Redeem Utility'
                    ) : (
                      `Need ${item.pointsCost - availablePoints} pts`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
