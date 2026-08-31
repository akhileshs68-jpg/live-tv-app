'use client';

import React from 'react';
import Link from 'next/link';
import type { User } from '@/lib/db-types';
import { formatCoins } from '@/lib/reward-utils';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Crown, Shield, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function DashboardHeader({ user }: { user: User | null }) {
  const { premiumStatus, isAdmin, isAuthenticated, isDevPreview, signInWithPi } = useAuth();
  const isPremium = Boolean(premiumStatus?.active);
  const showManualSignIn = !isAuthenticated || isDevPreview;

  return (
    <header className="bg-card/95 backdrop-blur-md border-b border-border sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)] shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
        {/* Brand logo & Title */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-base shadow">
            π
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-none">
                Pi Live TV
              </h1>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-red-600/90 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                <span className="w-1 h-1 rounded-full bg-white" />
                LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              Streaming & Rewards Platform
            </p>
          </div>
        </Link>

        {/* Balance, Premium Badge & User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Owner / Admin Shortcut Button */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs shrink-0"
              title="Open Owner / Admin Panel"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Admin</span>
            </Link>
          )}

          {/* Watch Points Balance */}
          <Link href="/earn" className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-lg px-2.5 py-1.5 shadow-xs transition-colors">
            <span className="text-sm">⭐</span>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-amber-500 font-bold leading-none">Watch Points</p>
              <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">{formatCoins(user?.totalCoins || 0)}</p>
            </div>
          </Link>

          {/* Premium Status Badge */}
          <Link href="/premium" title="Membership Entitlement">
            {isPremium ? (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 transition-colors text-[10px] sm:text-xs py-1 flex items-center gap-1 font-bold">
                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                PRO
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] sm:text-xs py-1 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors font-medium">
                FREE
              </Badge>
            )}
          </Link>

          {/* User Profile Quick Link / Manual Sign In Button */}
          {showManualSignIn ? (
            <button
              onClick={() => signInWithPi()}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
              title="Sign In with Pi Network"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-2 bg-muted/60 hover:bg-muted p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-border/80 transition-colors"
              title="Account Settings"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-foreground hidden md:inline truncate max-w-[100px]">
                {user?.piUsername ? `@${user.piUsername}` : 'Pioneer'}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
