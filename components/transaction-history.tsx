'use client';

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, TrendingDown, ArrowRight, AlertCircle } from 'lucide-react';
import type { TransactionRecord } from '@/lib/wallet-manager';

export function TransactionHistory() {
  const { transactions, loading, exportTransactions } = useWallet();

  const handleExport = (format: 'json' | 'csv') => {
    const data = exportTransactions(format);
    const element = document.createElement('a');
    const file = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `transactions.${format}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <TrendingUp className="w-4 h-4 text-accent" />;
      case 'spend':
      case 'redemption':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'referral':
        return <ArrowRight className="w-4 h-4 text-primary" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'text-accent';
      case 'spend':
      case 'redemption':
        return 'text-destructive';
      case 'referral':
        return 'text-primary';
      default:
        return 'text-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const TransactionRow = ({ tx }: { tx: TransactionRecord }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border hover:bg-secondary/20 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">{getTransactionIcon(tx.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate text-sm">{tx.reason}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.createdAt)}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className={`font-semibold text-sm ${getTransactionColor(tx.type)}`}>
          {tx.type === 'spend' || tx.type === 'redemption' ? '-' : '+'}
          {tx.amount}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Balance: {tx.balanceAfter}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary/20 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>No transactions yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">Start watching to earn your first coins!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedTransactions = transactions.filter((tx) => tx.type === 'earn');
  const spentTransactions = transactions.filter((tx) => tx.type === 'spend' || tx.type === 'redemption');
  const referralTransactions = transactions.filter((tx) => tx.type === 'referral');

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">Transaction History</CardTitle>
          <CardDescription>{transactions.length} total transactions</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('json')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            JSON
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="earned" className="text-xs sm:text-sm">
              Earned ({earnedTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="spent" className="text-xs sm:text-sm">
              Spent ({spentTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="referral" className="text-xs sm:text-sm">
              Referral ({referralTransactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">No transactions</p>
            )}
          </TabsContent>

          <TabsContent value="earned" className="space-y-2">
            {earnedTransactions.length > 0 ? (
              earnedTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">No earned transactions</p>
            )}
          </TabsContent>

          <TabsContent value="spent" className="space-y-2">
            {spentTransactions.length > 0 ? (
              spentTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">No spent transactions</p>
            )}
          </TabsContent>

          <TabsContent value="referral" className="space-y-2">
            {referralTransactions.length > 0 ? (
              referralTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">No referral transactions</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
