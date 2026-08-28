// Referral System Manager - Handles unique codes, links, sharing, and tracking

import type { Referral } from '@/lib/db-types';
import { getAppBaseUrl, getReferralShareUrl, getSocialShareLinks } from '@/lib/share-utils';

export const REFERRAL_REWARDS = {
  REFERRER_BONUS: 100, // Coins earned by referrer when friend signs up
  REFERRED_BONUS: 50,  // Bonus coins for new user who uses referral code
  CONFIRMED_AFTER: 3,  // Days before referral is confirmed
  MAX_TIER_LEVELS: 3,  // Maximum referral levels for future support
} as const;

export interface ReferralLink {
  code: string;
  url: string;
  shortCode: string;
  createdAt: string;
  clicks: number;
  conversions: number;
}

export interface ReferralStats {
  totalInvites: number;
  confirmedReferrals: number;
  totalEarned: number;
  pendingEarnings: number;
  referralCode: string;
  referralLink: string;
}

// Generate unique referral code for each user
export function generateReferralCode(piUsername: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const usernameHash = piUsername
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${usernameHash}${random}${timestamp.substring(0, 4)}`;
}

// Generate referral link from code
export function generateReferralLink(code: string, appUrl?: string): ReferralLink {
  const base = appUrl || getAppBaseUrl();
  return {
    code,
    shortCode: code.substring(0, 6),
    url: `${base}/?ref=${encodeURIComponent(code)}`,
    createdAt: new Date().toISOString(),
    clicks: 0,
    conversions: 0,
  };
}

// Social media sharing URLs
export function generateShareLinks(username: string, code: string, appUrl?: string): {
  telegram: string;
  whatsapp: string;
  facebook: string;
  twitter: string;
} {
  const base = appUrl || getAppBaseUrl();
  const referralUrl = `${base}/?ref=${encodeURIComponent(code)}`;
  const text = `Join Pi Live TV to stream 150+ free live channels! Use my Pioneer invite code ${code}`;

  return getSocialShareLinks(referralUrl, 'Pi Live TV', text);
}

// Track referral conversion
export function trackReferralConversion(
  referrerCode: string,
  referredUserId: string,
): Referral {
  return {
    id: 'ref_' + Date.now(),
    referrerId: 'from_code_' + referrerCode,
    referredUserId,
    coinsEarned: 100, // Referrer gets 100
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

// Calculate referral tier bonuses (for multi-level future support)
export function calculateReferralBonus(
  tier: number,
  directReferrals: number,
): number {
  // Tier 1: Direct referrals get 100 coins
  if (tier === 1) return 100;
  
  // Tier 2: Referrals of referrals get 20 coins
  if (tier === 2) return 20;
  
  // Tier 3+: Future tiered bonuses
  if (tier === 3) return 5;
  
  return 0;
}

// Validate referral code format
export function isValidReferralCode(code: string): boolean {
  // Format: 3 letters + 4 random + 4 timestamp = 11 chars
  return /^[A-Z]{3}[A-Z0-9]{4}[A-Z0-9]{4}$/.test(code);
}

// Parse referral code from URL
export function parseReferralCode(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref') || null;
  } catch {
    return null;
  }
}

// Store referral stats in localStorage
export function saveReferralStats(userId: string, stats: ReferralStats): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `referral_stats_${userId}`;
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save referral stats:', e);
  }
}

// Load referral stats from localStorage
export function loadReferralStats(userId: string): ReferralStats | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `referral_stats_${userId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Track referral click
export function trackReferralClick(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `referral_clicks_${code}`;
    const clicks = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, clicks.toString());
  } catch (e) {
    console.warn('Failed to track referral click:', e);
  }
}

// Create shareable message templates
export function getReferralMessage(code: string, platform: 'telegram' | 'whatsapp' | 'facebook' | 'twitter'): string {
  const base = getAppBaseUrl();
  const url = `${base}/?ref=${encodeURIComponent(code)}`;
  const baseMessage = `Join Pi Live TV - Stream 150+ free live channels!`;
  
  const messages = {
    telegram: `${baseMessage}\n\nUse my Pioneer code: ${code}\n${url}`,
    whatsapp: `${baseMessage}\n\nUse my Pioneer code: ${code}\n${url}`,
    facebook: `Watch free live TV on Pi Live TV! Use Pioneer code ${code}: ${url}`,
    twitter: `Streaming 150+ live channels on Pi Live TV! Use Pioneer code ${code}: ${url}`,
  };
  
  return messages[platform];
}
