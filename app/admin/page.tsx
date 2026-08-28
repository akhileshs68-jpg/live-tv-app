'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AdminPanel } from '@/components/admin-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { isAdmin, loading, isAuthenticated, user, reauthenticate } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Verifying administrative authorization...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="bg-card border-destructive/30 max-w-md w-full shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              This area is restricted to authorized Pi Live TV owners and administrators.
            </p>
            {user?.piUsername && (
              <p className="text-xs text-muted-foreground bg-muted/60 py-1.5 px-3 rounded font-mono">
                Logged in as: @{user.piUsername}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1 text-xs">
                <Link href="/">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Return Home
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button onClick={() => reauthenticate()} className="flex-1 text-xs bg-primary">
                  Authenticate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-8">
      <div className="bg-card border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Back to Live TV"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight flex items-center gap-2">
                Owner Dashboard
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  Admin
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Real-time TRP audience telemetry, monetization controls, and security audit
              </p>
            </div>
          </div>
          {user?.piUsername && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border">
              <span>@{user.piUsername}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <AdminPanel />
      </div>
    </div>
  );
}

