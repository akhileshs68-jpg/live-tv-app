// Hook for accessing and managing wallet in React components
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getWalletManager, type TransactionRecord } from '@/lib/wallet-manager';
import type { User } from '@/lib/db-types';

interface WalletState {
  balance: number;
  lifetimeEarnings: number;
  referralEarnings: number;
  transactions: TransactionRecord[];
  todayEarnings: number;
  loading: boolean;
}

/**
 * useWallet - React hook for wallet management
 * Provides real-time access to wallet balance, transactions, and history
 */
export function useWallet() {
  const { user } = useAuth();
  const [walletState, setWalletState] = useState<WalletState>({
    balance: 0,
    lifetimeEarnings: 0,
    referralEarnings: 0,
    transactions: [],
    todayEarnings: 0,
    loading: true,
  });

  // Load wallet data when user changes
  useEffect(() => {
    if (!user?.id) {
      setWalletState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const loadWallet = () => {
      const walletManager = getWalletManager(user.id);
      const { user: walletUser } = walletManager.loadWalletState();
      const transactions = walletManager.getTransactions();
      const todayEarnings = walletManager.getTodayEarnings();

      setWalletState({
        balance: walletUser?.totalCoins || user.totalCoins || 0,
        lifetimeEarnings: walletUser?.lifetimeEarnings || user.lifetimeEarnings || 0,
        referralEarnings: walletUser?.referralEarnings || user.referralEarnings || 0,
        transactions,
        todayEarnings,
        loading: false,
      });
    };

    loadWallet();
  }, [user?.id, user?.totalCoins]);

  // Earn coins and record transaction
  const earnCoins = useCallback(
    (amount: number, reason: string) => {
      if (!user?.id) return;

      const walletManager = getWalletManager(user.id);
      const { transaction, updatedUser } = walletManager.recordTransaction(
        'earn',
        amount,
        reason,
        user
      );

      // Update local state
      setWalletState((prev) => ({
        ...prev,
        balance: updatedUser.totalCoins,
        lifetimeEarnings: updatedUser.lifetimeEarnings,
        transactions: [transaction, ...prev.transactions],
        todayEarnings: prev.todayEarnings + amount,
      }));

      return { transaction, updatedUser };
    },
    [user]
  );

  // Spend coins and record transaction
  const spendCoins = useCallback(
    (amount: number, reason: string) => {
      if (!user?.id) return;

      const walletManager = getWalletManager(user.id);
      const { transaction, updatedUser } = walletManager.recordTransaction(
        'spend',
        amount,
        reason,
        user
      );

      // Update local state
      setWalletState((prev) => ({
        ...prev,
        balance: updatedUser.totalCoins,
        transactions: [transaction, ...prev.transactions],
      }));

      return { transaction, updatedUser };
    },
    [user]
  );

  // Add referral earnings
  const addReferralReward = useCallback(
    (amount: number, referralCode: string) => {
      if (!user?.id) return;

      const walletManager = getWalletManager(user.id);
      const { transaction, updatedUser } = walletManager.recordTransaction(
        'referral',
        amount,
        `Referral reward from ${referralCode}`,
        user
      );

      // Update local state
      setWalletState((prev) => ({
        ...prev,
        balance: updatedUser.totalCoins,
        lifetimeEarnings: updatedUser.lifetimeEarnings,
        referralEarnings: updatedUser.referralEarnings,
        transactions: [transaction, ...prev.transactions],
      }));

      return { transaction, updatedUser };
    },
    [user]
  );

  // Redeem coins
  const redeemCoins = useCallback(
    (amount: number, method: string) => {
      if (!user?.id) return;

      const walletManager = getWalletManager(user.id);
      const { transaction, updatedUser } = walletManager.recordTransaction(
        'redemption',
        amount,
        `Redemption via ${method}`,
        user
      );

      // Update local state
      setWalletState((prev) => ({
        ...prev,
        balance: updatedUser.totalCoins,
        transactions: [transaction, ...prev.transactions],
      }));

      return { transaction, updatedUser };
    },
    [user]
  );

  // Get transactions by type
  const getTransactionsByType = useCallback(
    (type: 'earn' | 'spend' | 'referral' | 'redemption') => {
      return walletState.transactions.filter((tx) => tx.type === type);
    },
    [walletState.transactions]
  );

  // Get transaction summary
  const getTransactionSummary = useCallback(() => {
    if (!user?.id) return null;
    const walletManager = getWalletManager(user.id);
    return walletManager.getTransactionSummary();
  }, [user?.id]);

  // Export transactions
  const exportTransactions = useCallback(
    (format: 'json' | 'csv' = 'json') => {
      if (!user?.id) return '';
      const walletManager = getWalletManager(user.id);
      return format === 'csv'
        ? walletManager.exportTransactionsCSV()
        : walletManager.exportTransactions();
    },
    [user?.id]
  );

  return {
    // State
    ...walletState,

    // Actions
    earnCoins,
    spendCoins,
    addReferralReward,
    redeemCoins,
    getTransactionsByType,
    getTransactionSummary,
    exportTransactions,
  };
}
