'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { RefreshCw, Smartphone, AlertCircle, Play } from 'lucide-react';

export function AuthLoadingScreen() {
  const { authMessage, authStatus, loading, isAuthenticated, reauthenticate } = useAuth();
  const [dots, setDots] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    return () => clearInterval(interval);
  }, [loading]);

  if (isAuthenticated || dismissed) return null;

  const isPiRequired = authStatus === 'pi-browser-required';
  const isError = authStatus === 'error';

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

        {/* Title & Status */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Pi Live TV</h1>

          {isPiRequired ? (
            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <Smartphone className="w-4 h-4" />
                Pi Browser Required
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                Pi authentication is required for full account & coin rewards access. Please open this app in the official <strong>Pi Browser</strong>.
              </p>
            </div>
          ) : isError ? (
            <div className="space-y-2 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                <AlertCircle className="w-4 h-4" />
                Authentication Error
              </div>
              <p className="text-sm text-destructive font-medium">{authMessage}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {authMessage}
              {loading && <span className="inline-block w-6 text-left">{dots}</span>}
            </p>
          )}
        </div>

        {/* Loading Indicator */}
        {loading && !isPiRequired && !isError && (
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

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {(isPiRequired || isError) && (
            <Button
              onClick={() => reauthenticate()}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 rounded-xl shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Pi Authentication
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setDismissed(true)}
            className="w-full gap-2 border-border text-foreground hover:bg-secondary py-5 rounded-xl"
          >
            <Play className="w-4 h-4" />
            Watch Live TV Channels
          </Button>
        </div>

        {/* Features Info Box */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>150+ Live Channels (India & Global)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>Earn coins automatically while streaming in Pi Browser</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span>Verified Pioneer identity & reward tracking</span>
          </div>
        </div>
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
