'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'referral' | 'redemption';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
}

export default function WalletPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [copyStatus, setCopyStatus] = useState(false);

  const mockTransactions: Transaction[] = [
    { id: '1', type: 'earn', description: 'Video Watch Reward', amount: 25, date: '2 hours ago', status: 'completed' },
    { id: '2', type: 'referral', description: 'Referral Bonus - User ABC123', amount: 100, date: '5 hours ago', status: 'completed' },
    { id: '3', type: 'earn', description: 'Task Completion', amount: 50, date: '1 day ago', status: 'completed' },
    { id: '4', type: 'spend', description: 'Redemption Request', amount: -500, date: '2 days ago', status: 'pending' },
    { id: '5', type: 'earn', description: 'Daily Login Bonus', amount: 10, date: '3 days ago', status: 'completed' },
  ];

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

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your coins and transactions</p>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {user?.totalCoins?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Reward Coins</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent">
                150
              </div>
              <p className="text-xs text-muted-foreground mt-1">Being processed</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lifetime Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-secondary">
                {user?.lifetimeEarnings?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All-time total</p>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Address */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
            <CardDescription>Your Pi Network wallet address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Wallet Address</label>
              <div className="flex items-center gap-2 bg-secondary/20 border border-border p-3 rounded-lg">
                <code className="flex-1 text-sm font-mono text-foreground break-all">
                  {user?.walletAddress}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAddress}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copyStatus ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transaction History</span>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </CardTitle>
            <CardDescription>All your earning and redemption transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="earn">Earned</TabsTrigger>
                <TabsTrigger value="referral">Referral</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {mockTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.amount >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="earn" className="space-y-3">
                {mockTransactions.filter(tx => tx.type === 'earn').map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border"
                  >
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="font-semibold text-accent">+{tx.amount}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="referral" className="space-y-3">
                {mockTransactions.filter(tx => tx.type === 'referral').map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border"
                  >
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="font-semibold text-primary">+{tx.amount}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="pending" className="space-y-3">
                {mockTransactions.filter(tx => tx.status === 'pending').map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <p className="font-medium text-foreground">{tx.description}</p>
                    </div>
                    <p className="font-semibold">{tx.amount}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Redemption */}
        <Card className="bg-card border-border mt-8 border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle>Request Redemption</CardTitle>
            <CardDescription>Convert your earned coins to rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="h-10"
                  >
                    {amount} coins
                  </Button>
                ))}
              </div>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-10">
                Request Redemption
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
