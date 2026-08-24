// Persistent Wallet and Transaction Management System
import type { User, Transaction } from '@/lib/db-types';

export interface TransactionRecord extends Transaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'referral' | 'redemption';
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface WalletState {
  user: User;
  transactions: TransactionRecord[];
}

const WALLET_STORAGE_KEY = 'pi_wallet_state';
const TRANSACTIONS_STORAGE_KEY = 'pi_transactions_history';

/**
 * WalletManager - Handles all wallet operations including transactions
 * Persists data to localStorage for each authenticated Pi user
 */
export class WalletManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get storage key unique to this user
   */
  private getUserStorageKey(key: string): string {
    return `${key}_${this.userId}`;
  }

  /**
   * Load wallet state from persistent storage
   */
  loadWalletState(): WalletState {
    try {
      const walletKey = this.getUserStorageKey(WALLET_STORAGE_KEY);
      const transactionsKey = this.getUserStorageKey(TRANSACTIONS_STORAGE_KEY);

      const walletData = localStorage.getItem(walletKey);
      const transactionsData = localStorage.getItem(transactionsKey);

      return {
        user: walletData ? JSON.parse(walletData) : ({} as User),
        transactions: transactionsData ? JSON.parse(transactionsData) : [],
      };
    } catch (error) {
      console.error('[v0] Failed to load wallet state:', error);
      return {
        user: {} as User,
        transactions: [],
      };
    }
  }

  /**
   * Save wallet state to persistent storage
   */
  private saveWalletState(user: User, transactions: TransactionRecord[]): void {
    try {
      const walletKey = this.getUserStorageKey(WALLET_STORAGE_KEY);
      const transactionsKey = this.getUserStorageKey(TRANSACTIONS_STORAGE_KEY);

      localStorage.setItem(walletKey, JSON.stringify(user));
      localStorage.setItem(transactionsKey, JSON.stringify(transactions));
      console.log(`[v0] Wallet saved for user ${this.userId}`);
    } catch (error) {
      console.error('[v0] Failed to save wallet state:', error);
    }
  }

  /**
   * Record a transaction and update user balance
   */
  recordTransaction(
    type: 'earn' | 'spend' | 'referral' | 'redemption',
    amount: number,
    reason: string,
    user: User
  ): { transaction: TransactionRecord; updatedUser: User } {
    const { transactions: existingTransactions } = this.loadWalletState();

    // Calculate new balance
    const balanceBefore = user.totalCoins;
    const balanceAfter = balanceBefore + (type === 'spend' ? -amount : amount);

    // Create transaction record
    const transaction: TransactionRecord = {
      id: `tx_${this.userId}_${Date.now()}`,
      userId: this.userId,
      type,
      amount: Math.abs(amount), // Store absolute value
      reason,
      balanceBefore,
      balanceAfter: Math.max(0, balanceAfter), // Prevent negative balance
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update user
    const updatedUser: User = {
      ...user,
      totalCoins: Math.max(0, balanceAfter),
      lifetimeEarnings: user.lifetimeEarnings + (type === 'spend' ? 0 : amount),
      referralEarnings: type === 'referral' ? user.referralEarnings + amount : user.referralEarnings,
      updatedAt: new Date().toISOString(),
    };

    // Save both transaction and updated user
    const allTransactions = [...existingTransactions, transaction];
    this.saveWalletState(updatedUser, allTransactions);

    console.log(
      `[v0] Transaction recorded: ${type} - ${amount} coins - ${reason}`
    );

    return { transaction, updatedUser };
  }

  /**
   * Get all transactions for this user
   */
  getTransactions(): TransactionRecord[] {
    try {
      const { transactions } = this.loadWalletState();
      return transactions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('[v0] Failed to get transactions:', error);
      return [];
    }
  }

  /**
   * Get transactions filtered by type
   */
  getTransactionsByType(type: 'earn' | 'spend' | 'referral' | 'redemption'): TransactionRecord[] {
    return this.getTransactions().filter((tx) => tx.type === type);
  }

  /**
   * Get transaction summary statistics
   */
  getTransactionSummary() {
    const transactions = this.getTransactions();

    const summary = {
      totalEarned: 0,
      totalSpent: 0,
      totalReferral: 0,
      totalTransactions: transactions.length,
      lastTransaction: transactions[0] || null,
    };

    transactions.forEach((tx) => {
      if (tx.type === 'earn') {
        summary.totalEarned += tx.amount;
      } else if (tx.type === 'spend' || tx.type === 'redemption') {
        summary.totalSpent += tx.amount;
      } else if (tx.type === 'referral') {
        summary.totalReferral += tx.amount;
      }
    });

    return summary;
  }

  /**
   * Get transactions for a specific date range
   */
  getTransactionsByDateRange(startDate: Date, endDate: Date): TransactionRecord[] {
    const transactions = this.getTransactions();
    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return txDate >= startDate && txDate <= endDate;
    });
  }

  /**
   * Get today's transactions
   */
  getTodayTransactions(): TransactionRecord[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getTransactionsByDateRange(today, tomorrow);
  }

  /**
   * Get total earned today
   */
  getTodayEarnings(): number {
    return this.getTodayTransactions()
      .filter((tx) => tx.type === 'earn')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Clear all transactions (for testing or user deletion)
   */
  clearTransactions(): void {
    try {
      const transactionsKey = this.getUserStorageKey(TRANSACTIONS_STORAGE_KEY);
      localStorage.removeItem(transactionsKey);
      console.log(`[v0] Transactions cleared for user ${this.userId}`);
    } catch (error) {
      console.error('[v0] Failed to clear transactions:', error);
    }
  }

  /**
   * Export transactions as JSON
   */
  exportTransactions(): string {
    const transactions = this.getTransactions();
    return JSON.stringify(transactions, null, 2);
  }

  /**
   * Export transactions as CSV
   */
  exportTransactionsCSV(): string {
    const transactions = this.getTransactions();
    const headers = ['Date', 'Type', 'Reason', 'Amount', 'Balance After', 'Status'];
    const rows = transactions.map((tx) => [
      new Date(tx.createdAt).toLocaleString(),
      tx.type,
      tx.reason,
      tx.amount,
      tx.balanceAfter,
      tx.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csv;
  }
}

/**
 * Get or create wallet manager for a user
 */
export function getWalletManager(userId: string): WalletManager {
  return new WalletManager(userId);
}
