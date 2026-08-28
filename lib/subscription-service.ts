import type { SubscriptionPlanConfig, SubscriptionRecord, PaymentState, Channel } from "@/lib/types";

/**
 * Decoupled Subscription & Monetization Service Specification
 * Prepares extensible subscription tiers for low-cost Pi plans (e.g. 0.25 Pi/mo, 1 Pi/mo, 5 Pi/mo)
 * Note: Subscriptions remain inactive until official payment activation.
 */

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = {
  LIVE_TV_PREMIUM_MONTHLY: {
    id: "LIVE_TV_PREMIUM_MONTHLY",
    title: "Live TV Premium (Testnet)",
    description: "30 days of complete ad-free streaming, full access to premium channels, and priority rewards on Pi Testnet.",
    pricePi: 0.25,
    billingPeriod: "monthly",
    isActive: true,
    features: [
      "All Free Tier Features",
      "Ad-Free Streaming Guarantee",
      "Full Access to Premium Channels",
      "1.5x Watch Points Multiplier",
      "Exclusive Pioneer VIP Badge",
    ],
  },
  free_tier: {
    id: "free_tier",
    title: "Standard Pioneer",
    description: "Access all standard and curated live broadcast channels with standard rewards.",
    pricePi: 0,
    billingPeriod: "lifetime",
    isActive: true,
    features: [
      "Access to 100+ Live Channels",
      "Standard Watch Points Rewards",
      "Adaptive Bitrate Streaming",
      "Favorites & Watch History",
    ],
  },
  premium_basic: {
    id: "premium_basic",
    title: "Premium Monthly",
    description: "High-priority bandwidth, 100% ad-free experience, and 1.5x Watch Points multiplier.",
    pricePi: 1.0,
    billingPeriod: "monthly",
    isActive: false, // Inactive until officially enabled
    features: [
      "All Free Tier Features",
      "Ad-Free Streaming Guarantee",
      "1080p Full HD Priority Routing",
      "1.5x Watch Points Multiplier",
      "Exclusive Pioneer VIP Badge",
    ],
  },
  premium_annual: {
    id: "premium_annual",
    title: "Annual VIP Pass",
    description: "12 months of high-bitrate live streaming with maximum reward multipliers.",
    pricePi: 10.0,
    billingPeriod: "yearly",
    isActive: false, // Inactive until officially enabled
    features: [
      "All Premium Monthly Features",
      "2x Watch Points Multiplier",
      "Priority Customer & Stream Support",
      "Early Access to Future Premium Channels",
    ],
  },
};

export interface UserSubscriptionState {
  planId: string;
  isSubscribed: boolean;
  expiresAt: number | null;
  autoRenew: boolean;
  status: "active" | "inactive" | "expired" | "pending";
  paymentStatus?: PaymentState;
}

export function getDefaultSubscriptionState(): UserSubscriptionState {
  return {
    planId: "free_tier",
    isSubscribed: false,
    expiresAt: null,
    autoRenew: false,
    status: "inactive",
  };
}

/**
 * Access gate validator:
 * Existing channels (status: "FREE" or undefined) are 100% free and open.
 * If a channel is explicitly marked "PREMIUM" and user has no active subscription, returns allowed: false.
 * If a channel is "DISABLED", returns allowed: false.
 */
export function checkChannelAccess(
  channel: Channel,
  subscription?: UserSubscriptionState | null
): { allowed: boolean; reason?: "PREMIUM_REQUIRED" | "CHANNEL_DISABLED" | "NONE" } {
  if (channel.status === "DISABLED" || channel.isEnabled === false) {
    return { allowed: false, reason: "CHANNEL_DISABLED" };
  }

  const isPremiumChannel = channel.isPremium || channel.status === "PREMIUM";
  if (!isPremiumChannel) {
    return { allowed: true, reason: "NONE" };
  }

  // Check subscription state
  if (subscription && subscription.isSubscribed && subscription.status === "active") {
    if (!subscription.expiresAt || subscription.expiresAt > Date.now()) {
      return { allowed: true, reason: "NONE" };
    }
  }

  return { allowed: false, reason: "PREMIUM_REQUIRED" };
}
