/**
 * Phase 8 - Professional Non-Blocking Advertising Architecture
 * Types & Interfaces for AdManager, AdProviders, and Ad Events.
 */

export type AdSlotType =
  | 'banner_top'
  | 'banner_feed'
  | 'banner_hub'
  | 'native_card'
  | 'sponsor_badge';

export interface AdItem {
  id: string;
  slot: AdSlotType;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  icon?: string;
  badge?: string;
  sponsorName: string;
  isExternal?: boolean;
}

export type AdEventType =
  | 'ad_requested'
  | 'ad_loaded'
  | 'ad_impression'
  | 'ad_clicked'
  | 'ad_dismissed'
  | 'ad_failed';

export interface AdEvent {
  type: AdEventType;
  adId: string;
  slot: AdSlotType;
  timestamp: number;
  error?: string;
}

export interface FrequencyCapConfig {
  maxImpressionsPerSession: number;
  cooldownSeconds: number;
  maxImpressionsPerDay: number;
}

export interface AdProviderInterface {
  name: string;
  isSupportedInEnvironment: () => boolean;
  fetchAd: (slot: AdSlotType) => Promise<AdItem | null>;
}

export interface UserAdPreferences {
  hasPremium: boolean;
  optedOutPersonalized?: boolean;
}
