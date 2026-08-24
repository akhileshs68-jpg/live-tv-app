'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { WalletSummary } from '@/components/wallet-summary';
import { TransactionHistory } from '@/components/transaction-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, AlertCircle } from 'lucide-react';

export default function WalletPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [copyStatus, setCopyStatus] = useState(false);

  const handleCopyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Wallet & Earnings</h1>
          <p className="text-muted-foreground">Track your coins, earnings, and transaction history</p>
        </div>

        {/* Wallet Summary Cards */}
        <WalletSummary />

        {/* Wallet Address */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
            <CardDescription>Your Pi Network wallet address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Pi Wallet Address</label>
              <div className="flex items-center gap-2 bg-secondary/20 border border-border p-3 rounded-lg">
                <code className="flex-1 text-sm font-mono text-foreground break-all">
                  {user?.walletAddress || 'Not available'}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAddress}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                  {copyStatus ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This address is linked to your Pi Network authentication
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <TransactionHistory />

        {/* Information Card */}
        <Card className="bg-card border-border border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              How Earning Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Watch & Earn:</strong> Earn 2 coins per minute while watching live TV channels.
            </p>
            <p>
              <strong className="text-foreground">Referrals:</strong> Invite friends and earn bonus coins when they join.
            </p>
            <p>
              <strong className="text-foreground">Tasks:</strong> Complete daily and special tasks to earn additional rewards.
            </p>
            <p>
              <strong className="text-foreground">Persistence:</strong> Your coins and transaction history are automatically saved for your Pi account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
