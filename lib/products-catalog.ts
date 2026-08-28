import { ProductCatalogItem, WatchPointUtilityItem } from '@/lib/db-types';

export const PRODUCTS_CATALOG: Record<string, ProductCatalogItem> = {
  LIVE_TV_PREMIUM_MONTHLY: {
    productId: 'LIVE_TV_PREMIUM_MONTHLY',
    name: 'Live TV Premium',
    description: '30 days of complete ad-free live streaming, priority Watch Points rewards, and unlocked premium channels on Pi Testnet.',
    pricePi: 0.25,
    durationDays: 30,
    plan: 'premium',
    active: true,
  },
  premium_7d: {
    productId: 'premium_7d',
    name: '7 Days Premium Pioneer',
    description: '7 days of 100% ad-free live streaming, priority Watch Points, and Premium Pioneer badge.',
    pricePi: 5,
    durationDays: 7,
    plan: 'premium',
    active: true,
  },
  premium_30d: {
    productId: 'premium_30d',
    name: '30 Days Premium Pioneer',
    description: '30 days of complete ad-free streaming, priority Watch Points rewards, and exclusive badge.',
    pricePi: 15,
    durationDays: 30,
    plan: 'premium',
    active: true,
  },
  premium_90d: {
    productId: 'premium_90d',
    name: '90 Days Premium Pioneer',
    description: '90 days of ultimate ad-free streaming, high-bitrate access, and top priority rewards.',
    pricePi: 35,
    durationDays: 90,
    plan: 'premium',
    active: true,
  },
};

export const WATCH_POINTS_UTILITIES: Record<string, WatchPointUtilityItem> = {
  ad_free_24h: {
    productId: 'ad_free_24h',
    name: '24-Hour Ad-Free Pass',
    description: 'Stream all live TV channels uninterrupted without banner or video ads for 24 hours.',
    pointsCost: 250,
    type: 'ad_free_pass',
    durationHours: 24,
    active: true,
  },
  premium_trial_3d: {
    productId: 'premium_trial_3d',
    name: '3-Day Premium VIP Trial',
    description: 'Unlock HD stream sources, ad-free streaming, and priority audio bitrates for 3 days.',
    pointsCost: 500,
    type: 'premium_membership',
    durationDays: 3,
    active: true,
  },
  priority_bitrate: {
    productId: 'priority_bitrate',
    name: 'HD Priority Stream Pass (7 Days)',
    description: 'Enable server-side high-bandwidth pipeline for crystal clear, low-latency live streaming.',
    pointsCost: 100,
    type: 'hd_pass',
    durationDays: 7,
    active: true,
  },
  pioneer_badge: {
    productId: 'pioneer_badge',
    name: 'Pioneer Supporter Badge',
    description: 'Display an exclusive Pioneer Supporter badge on your account profile and chat.',
    pointsCost: 200,
    type: 'pioneer_badge',
    active: true,
  },
};
