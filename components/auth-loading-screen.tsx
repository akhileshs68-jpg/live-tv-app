'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export function AuthLoadingScreen() {
  const { authMessage, loading } = useAuth();
  const [dots, setDots] = useState('');
  const [showSkip, setShowSkip] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isError = authMessage.toLowerCase().includes('failed');

  // Animate loading dots
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);

    // Show skip after 1.5 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(skipTimer);
    };
  }, [loading]);

  if (!loading || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Animated Logo */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
              <span className="text-4xl">📺</span>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Free TV & Rewards</h1>
          <p className={`text-sm ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
            {authMessage}
            {!isError && <span className="inline-block w-6 text-left">{dots}</span>}
          </p>
        </div>

        {/* Loading Bar */}
        {!isError && (
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-accent to-secondary rounded-full animate-shimmer"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Features Info Box */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>150+ Live Channels (India & Global)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>Earn coins automatically while streaming</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span>Instant wallet rewards & streak multiplier</span>
          </div>
        </div>

        {/* Direct Access CTA */}
        {showSkip && (
          <div className="pt-2 text-center">
            <Button
              onClick={() => setDismissed(true)}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 rounded-xl shadow-md"
            >
              <Play className="w-4 h-4 fill-primary-foreground" />
              Open Live TV Channels Now
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
