'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Play, Wallet, Trophy, Users, Zap, Settings, TrendingUp, Bookmark, Heart, Youtube, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/youtube', label: 'YouTube', icon: Youtube },
    { href: '/browser', label: 'Browser', icon: Globe },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all border-t-2 border-transparent',
                isActive && 'border-t-primary text-primary'
              )}
            >
              {item.icon === Youtube ? (
                <div className="text-red-600">
                  <Icon className="w-6 h-6" />
                </div>
              ) : item.icon === Globe ? (
                <div className="text-blue-500">
                  <Icon className="w-6 h-6" />
                </div>
              ) : (
                <Icon className="w-6 h-6" />
              )}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/bookmarks', label: 'Watch Later', icon: Bookmark },
    { href: '/watch', label: 'Watch', icon: Play },
    { href: '/youtube', label: 'YouTube', icon: Youtube },
    { href: '/browser', label: 'Browser', icon: Globe },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/referral', label: 'Referral', icon: Users },
  ];

  return (
    <nav className="hidden md:block bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
          💎 Watch & Earn
        </Link>
        <div className="flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.icon === Youtube ? (
                  <span className="text-red-600">
                    <Icon className="w-4 h-4" />
                  </span>
                ) : item.icon === Globe ? (
                  <span className="text-blue-500">
                    <Icon className="w-4 h-4" />
                  </span>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
