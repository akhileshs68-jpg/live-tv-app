'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, X, Tv, ShieldCheck, Check } from 'lucide-react';
import type { Channel } from '@/lib/types';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-service';

interface PremiumPromptModalProps {
  channel: Channel;
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumPromptModal({ channel, isOpen, onClose }: PremiumPromptModalProps) {
  if (!isOpen) return null;

  const basicPlan = SUBSCRIPTION_PLANS.premium_basic;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Top Glow & Header */}
        <div className="relative p-6 bg-gradient-to-b from-amber-500/15 to-transparent border-b border-border/50 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-6 h-6 fill-current" />
          </div>

          <Badge variant="outline" className="mb-2 bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold tracking-wider text-[11px]">
            FUTURE PREMIUM TIER
          </Badge>

          <h3 className="text-lg font-bold text-foreground">
            {channel.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            This channel is prepared for our upcoming Pioneer VIP Subscription tier.
          </p>
        </div>

        {/* Plan Preview */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">{basicPlan.title}</p>
                <p className="text-[11px] text-muted-foreground">Future low-cost Pi subscription</p>
              </div>
              <p className="text-base font-black text-amber-400 font-mono">
                {basicPlan.pricePi} Pi<span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              {basicPlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Payments are currently in preparation. All standard live channels remain 100% free!</span>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="outline"
              className="flex-1 text-xs border-border"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="flex-1 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-1.5"
              onClick={onClose}
            >
              <Tv className="w-3.5 h-3.5" />
              Watch Free Channels
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
