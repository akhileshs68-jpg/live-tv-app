'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export function AuthLoadingScreen() {
  const { authMessage, loading } = useAuth();
  const [dots, setDots] = useState('');
  const isError = authMessage.toLowerCase().includes('failed');

  // Animate loading dots
  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Animated Logo */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <span className="text-4xl">💰</span>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Watch & Earn</h1>
          <p className={`text-sm h-5 ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
            {authMessage}
            {!isError && <span className="inline-block w-8">{dots}</span>}
          </p>
        </div>

        {/* Loading Bar */}
        {!isError && (
          <div className="space-y-2">
            <div className="h-1 w-full bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary via-accent to-secondary rounded-full animate-shimmer"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Connecting to Pi Browser...
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span className="text-xs text-muted-foreground">Securely authenticating your Pi account</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span className="text-xs text-muted-foreground">Initializing your wallet connection</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span className="text-xs text-muted-foreground">Loading your reward dashboard</span>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-xs text-muted-foreground text-center">
          {isError ? 'Please refresh and try again.' : 'This usually takes a few seconds on first load.'}
        </p>
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
