'use client';

import React from 'react';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-6">
        {/* Logo with Glow */}
        <div className="flex justify-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-2xl opacity-60 scale-150"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-2xl">
              <span className="text-5xl">💎</span>
            </div>
          </div>
        </div>

        {/* Brand Text */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Watch & Earn</h1>
          <p className="text-sm text-muted-foreground">Live TV. Real Rewards.</p>
        </div>

        {/* Animated Loading Indicator */}
        <div className="flex justify-center gap-1 pt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent animate-bounce"
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
