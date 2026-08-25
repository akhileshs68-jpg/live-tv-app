// Database Types for Watch & Earn Reward System

export interface PremiumEntitlement {
  active: boolean;
  plan: 'free' | 'premium';
  startedAt?: string | number | null;
  expiresAt?: number | null;
  source?: 'manual' | 'pi_payment' | 'admin';
  updatedAt?: string;
}

export interface User {
  id: string;
  piUserId?: string;
  piUsername: string;
  walletAddress?: string;
  totalCoins: number;
  balance?: number; // alias for totalCoins
  dailyCoinsEarned?: number;
  lifetimeEarnings: number;
  referralEarnings: number;
  referralCode: string;
  referredBy?: string;
  dailyStreak: number;
  lastLoginDate: string;
  createdAt: string;
  updatedAt: string;
  premium?: PremiumEntitlement;
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

export interface CreatorProfile {
  piUserId: string;
  username: string;
  displayName: string;
  channelName: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface CreatorChannel {
  channelId: string;
  ownerPiUserId: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  category: string;
  language: string;
  country: string;
  status: 'active' | 'draft' | 'suspended';
  visibility: 'public' | 'unlisted' | 'private' | 'premium';
  createdAt: string;
  updatedAt: string;
}

export interface CreatorVideo {
  videoId: string;
  ownerPiUserId: string;
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // seconds
  status: 'ready' | 'processing' | 'failed' | 'draft';
  visibility: 'public' | 'unlisted' | 'private' | 'premium';
  contentType: 'VOD' | 'SCHEDULED' | 'LIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreatorPlaylist {
  playlistId: string;
  ownerPiUserId: string;
  channelId: string;
  title: string;
  description: string;
  videoIds: string[];
  visibility: 'public' | 'unlisted' | 'private' | 'premium';
  createdAt: string;
  updatedAt: string;
}

export interface ChannelSchedule {
  scheduleId: string;
  ownerPiUserId: string;
  channelId: string;
  videoId: string;
  startAt: string;
  endAt: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'created' | 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed' | 'expired';

export interface PiPaymentRecord {
  paymentId: string;
  piUserId: string;
  productId: string;
  amount: number;
  currency: 'Pi';
  status: PaymentStatus;
  piPaymentIdentifier?: string;
  txid?: string | null;
  network: 'testnet' | 'mainnet';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  error?: string | null;
}

export interface ProductCatalogItem {
  productId: string;
  name: string;
  description: string;
  pricePi: number;
  durationDays: number;
  plan: 'premium';
  active: boolean;
}

export interface WatchPointUtilityItem {
  productId: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'ad_free_pass' | 'premium_membership' | 'hd_pass' | 'pioneer_badge';
  durationHours?: number;
  durationDays?: number;
  active: boolean;
}

export interface RewardRedemptionRecord {
  redemptionId: string;
  piUserId: string;
  productId: string;
  pointsCost: number;
  status: 'completed' | 'failed';
  createdAt: string;
  completedAt: string;
  entitlementId?: string;
}

export interface UserEntitlementRecord {
  entitlementId: string;
  piUserId: string;
  type: 'premium_membership' | 'ad_free_pass' | 'hd_pass' | 'pioneer_badge';
  source: 'pi_payment' | 'watch_points' | 'admin' | 'promo';
  status: 'active' | 'expired' | 'revoked';
  startedAt: string;
  expiresAt: string | null;
  paymentId?: string;
  redemptionId?: string;
  createdAt: string;
  updatedAt: string;
}

