export interface Channel {
  id: string
  name: string
  logo: string
  url: string
  category: string
  country: string
  language: string
  isLive: boolean
  globalCategory?: string
  youtubeId?: string
  streamType?: "hls" | "youtube" | "mp4"
  backupUrl?: string
  fallbackUrls?: string[]
  healthStatus?: "VERIFIED" | "UNSTABLE" | "FAILED"
  // EPG & ordering
  epgId?: string
  priority?: number
  isEnabled?: boolean
  status?: "FREE" | "PREMIUM" | "DISABLED"
  // Monetization & Subscription preparation (free by default)
  isPremium?: boolean
  price?: number
  currency?: string
  billingPeriod?: "monthly" | "yearly" | "lifetime"
  subscriptionPlanId?: string
  // Stream metadata & quality
  quality?: "1080p" | "720p" | "4K" | "HD" | "SD"
  isHd?: boolean
  // Analytics & TRP preparation
  viewCount?: number
  activeViewers?: number
}

export interface M3UPlaylist {
  channels: Channel[]
}

export interface ChannelAnalyticsSummary {
  channelId: string
  channelName: string
  totalViews: number
  totalWatchSeconds: number
  activeViewers: number
  peakConcurrent?: number
  lastUpdated: number
  dailyViews?: Record<string, number>
  weeklyViews?: number
  monthlyViews?: number
}

export interface OwnerAnalyticsReport {
  totalActiveViewers: number
  peakTodayViewers: number
  viewsToday: number
  totalPlatformViews: number
  totalWatchHours: number
  peakConcurrentViewers: number
  topChannelsByTRP: Array<{
    channelId: string
    channelName: string
    views: number
    watchMinutes: number
    sharePercentage: number
  }>
  dailyTrends: Array<{
    date: string
    views: number
    watchMinutes: number
  }>
  monthlyTrends: Array<{
    month: string
    views: number
    watchMinutes: number
  }>
  updatedAt: number
}

export type PaymentState = "pending" | "approved" | "completed" | "cancelled" | "failed"

export interface PiPaymentDTO {
  paymentId: string
  txid?: string
  userId: string
  username?: string
  amount: number
  memo: string
  status: PaymentState
  metadata?: Record<string, unknown>
  createdAt: number
  verifiedAt?: number
}

export interface SubscriptionRecord {
  id: string
  userId: string
  username?: string
  planId: string
  status: "active" | "inactive" | "expired" | "pending"
  startDate: number
  expiresAt: number | null
  autoRenew: boolean
  transactionId?: string
  paymentStatus?: PaymentState
  verifiedAt?: number
}

export interface SubscriptionPlanConfig {
  id: string
  title: string
  description: string
  pricePi: number
  billingPeriod: "monthly" | "yearly" | "lifetime"
  isActive: boolean
  features: string[]
}

export interface AdPlacementConfig {
  id: string
  type: "pre-roll" | "mid-roll" | "banner" | "sponsored_channel" | "sponsored_category"
  enabled: boolean
  frequencyCapMinutes?: number
  suppressForPremium?: boolean
  durationSeconds?: number
  sponsorName?: string
  targetCategory?: string
}

