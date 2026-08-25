'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, AlertCircle, Coins, Crown, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { AdSlot } from '@/components/ads/ad-slot';
import { PiPaymentRecord } from '@/lib/db-types';

export default function WalletPage() {
  const { user, premiumStatus, piAccessToken, loading, syncServerBalance, syncPremiumStatus } = useAuth();
  const [copyStatus, setCopyStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [piPayments, setPiPayments] = useState<PiPaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch('/api/pi/payment-status', {
        headers: {
          'Authorization': `Bearer ${piAccessToken || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.payments)) {
          setPiPayments(data.payments);
        }
      }
    } catch (err) {
      console.warn('Error fetching Pi payment transactions:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [piAccessToken]);

  const handleSync = async () => {
    setIsSyncing(true);
    await Promise.all([syncServerBalance(), syncPremiumStatus(), fetchPayments()]);
    setTimeout(() => setIsSyncing(false), 500);
  };

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
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-full" />
          <p className="text-xs text-muted-foreground">Loading Pioneer Wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Pioneer Asset Hub</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Server-authoritative Watch Points & Pi Network Payment History
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Assets"}
          </Button>
        </div>

        {/* Clear Ecosystem Assets Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Watch Points Card */}
          <Card className="bg-gradient-to-br from-amber-500/15 via-primary/10 to-card border-amber-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Watch Points (⭐)
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                  In-App Utility
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground">
                {user?.totalCoins?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Earned via Live TV watch time. Used for in-app utilities.
              </p>
            </CardContent>
          </Card>

          {/* Premium Status Card */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-purple-400" />
                  Premium Membership (👑)
                </CardTitle>
                <Badge variant={premiumStatus?.active ? "default" : "outline"} className={premiumStatus?.active ? "bg-amber-500 text-black font-bold text-[10px]" : "text-[10px]"}>
                  {premiumStatus?.active ? "Active" : "Free"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {premiumStatus?.active ? "Premium Pioneer" : "Free Pioneer"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {premiumStatus?.expiresAt
                  ? `Expires: ${new Date(premiumStatus.expiresAt).toLocaleDateString()}`
                  : "Ad-free experience & priority Watch Points"}
              </p>
            </CardContent>
          </Card>

          {/* Pi Cryptocurrency Card */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base font-extrabold">π</span>
                  Pi Network (π)
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  Official Web3
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                Official Pi Wallet
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pi cryptocurrency balance is securely managed inside official Pi Wallet.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Non-blocking Sponsor Banner */}
        <AdSlot slot="banner_feed" className="mb-8" />

        {/* Wallet Address Information */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Verified Pioneer Identity
            </CardTitle>
            <CardDescription className="text-xs">
              Linked with official Pi Browser authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Pi User ID / Username</label>
              <div className="flex items-center gap-2 bg-secondary/20 border border-border p-3 rounded-lg">
                <code className="flex-1 text-xs font-mono text-foreground break-all">
                  @{user?.piUsername || 'Pioneer'} ({user?.piUserId || 'Unlinked'})
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAddress}
                  className="flex items-center gap-1.5 text-xs h-8"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copyStatus ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History Tabs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Ledger & Transactions</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Separate ledgers for Pi Payments and Watch Points Redemptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pi_payments" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="pi_payments" className="text-xs">
                  Pi Payments (π)
                </TabsTrigger>
                <TabsTrigger value="watch_points" className="text-xs">
                  Watch Points Activity (⭐)
                </TabsTrigger>
              </TabsList>

              {/* Pi Payments History */}
              <TabsContent value="pi_payments" className="space-y-3">
                {loadingPayments ? (
                  <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                    Loading verified Pi payment records from server...
                  </div>
                ) : piPayments.length === 0 ? (
                  <div className="p-8 text-center space-y-2 bg-muted/20 rounded-xl border border-border">
                    <p className="text-sm font-bold text-foreground">No Pi Payments Recorded Yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Upgrade to Premium Pioneer to experience 100% ad-free live channels via official Pi Browser payment.
                    </p>
                    <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs mt-2">
                      <a href="/premium">View Premium Subscription Catalog</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {piPayments.map((tx) => (
                      <div
                        key={tx.paymentId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-secondary/10 border border-border gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{tx.productId}</span>
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                              {tx.network || 'mainnet'}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            ID: {tx.paymentId.substring(0, 16)}... {tx.txid ? `| TX: ${tx.txid.substring(0, 10)}...` : ''}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>

                        <div className="text-right sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                          <span className="text-base font-extrabold text-amber-400">
                            {tx.amount} π
                          </span>
                          <Badge
                            className={`text-[10px] font-bold mt-1 ${
                              tx.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : tx.status === 'approved'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {tx.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Watch Points Activity */}
              <TabsContent value="watch_points" className="space-y-3">
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Available Watch Points:</span>
                    <span className="text-amber-400 text-sm font-extrabold">{user?.totalCoins?.toLocaleString() || 0} ⭐</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Today's Earned:</span>
                    <span className="text-emerald-400 font-bold">{user?.dailyCoinsEarned || 0} / 500 max</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Lifetime Earned:</span>
                    <span>{user?.lifetimeEarnings || 0} ⭐</span>
                  </div>
                </div>

                <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-9 text-xs mt-2">
                  <a href="/earn">Open Watch Points Utility & Redemption Catalog</a>
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
