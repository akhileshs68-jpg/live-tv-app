// Database Types for Watch & Earn Reward System

export interface User {
  id: string;
  piUsername: string;
  walletAddress: string;
  totalCoins: number;
  balance?: number; // alias for totalCoins
  lifetimeEarnings: number;
  referralEarnings: number;
  referralCode: string;
  referredBy?: string;
  dailyStreak: number;
  lastLoginDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReward {
  id: string;
  userId: string;
  date: string;
  loginReward: number;
  watchReward: number;
  taskReward: number;
  streakBonus: number;
  totalEarned: number;
  createdAt: string;
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  videoUrl: string;
  rewardCoins: number;
  category: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserVideoWatch {
  id: string;
  userId: string;
  videoId: string;
  watchDuration: number; // in seconds
  completed: boolean;
  rewardClaimed: boolean;
  rewardAmount: number;
  watchedAt: string;
  deviceHash: string; // for multi-tab detection
}

export interface Task {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  category: 'daily' | 'weekly' | 'special';
  action: string;
  completed: boolean;
  completedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserTask {
  id: string;
  userId: string;
  taskId: string;
  completed: boolean;
  rewardClaimed: boolean;
  completedAt?: string;
  claimedAt?: string;
}

export interface Transaction {
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

export interface RedemptionRequest {
  id: string;
  userId: string;
  coinsRequested: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  paymentMethod?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  coinsEarned: number;
  status: 'pending' | 'confirmed' | 'paid';
  createdAt: string;
  confirmedAt?: string;
}

export interface LeaderboardEntry {
  userId: string;
  piUsername: string;
  totalCoins: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  rank: number;
  earnedToday: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetUserId?: string;
  details: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceHash: string;
  ipAddress: string;
  sessionToken: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reward' | 'task' | 'referral' | 'warning' | 'info';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface AntiBotCheck {
  id: string;
  userId: string;
  checkType: 'multi_tab' | 'rapid_claim' | 'device_change' | 'ip_change';
  ipAddress: string;
  deviceHash: string;
  flagged: boolean;
  details: string;
  createdAt: string;
}
