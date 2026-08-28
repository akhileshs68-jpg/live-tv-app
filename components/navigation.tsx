'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Tv, Heart, User, Trophy, Wallet, Users, Globe, Youtube, Bookmark, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export function Navigation() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const mobileNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/watch', label: 'Live', icon: Tv },
    { href: '/favorites', label: 'Saved', icon: Heart },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
    { href: '/settings', label: user?.piUsername ? `@${user.piUsername.slice(0, 6)}` : 'Pi', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border md:hidden z-40 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 transition-all rounded-lg relative',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopNavigation() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/watch', label: 'Live TV', icon: Tv },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/bookmarks', label: 'Watch Later', icon: Bookmark },
    { href: '/youtube', label: 'YouTube', icon: Youtube },
    { href: '/browser', label: 'Browser', icon: Globe },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/referral', label: 'Referral', icon: Users },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <nav className="hidden md:block bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground hover:text-primary transition-colors shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-sm shadow">
            π
          </div>
          <span className="bg-gradient-to-r from-primary via-accent to-foreground bg-clip-text text-transparent">
            Pi Live TV
          </span>
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2.5 lg:gap-4 overflow-x-auto no-scrollbar max-w-full py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 text-xs lg:text-sm transition-colors py-1 px-2 rounded-md whitespace-nowrap shrink-0',
                  isActive
                    ? 'text-primary font-semibold bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
