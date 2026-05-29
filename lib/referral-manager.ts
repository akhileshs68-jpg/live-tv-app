// Referral System Manager - Handles unique codes, links, sharing, and tracking

import type { Referral } from '@/lib/db-types';

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
export function generateReferralLink(code: string, appUrl: string = 'https://watchearn.app'): ReferralLink {
  return {
    code,
    shortCode: code.substring(0, 6),
    url: `${appUrl}?ref=${code}`,
    createdAt: new Date().toISOString(),
    clicks: 0,
    conversions: 0,
  };
}

// Social media sharing URLs
export function generateShareLinks(username: string, code: string, appUrl: string = 'https://watchearn.app'): {
  telegram: string;
  whatsapp: string;
  facebook: string;
  twitter: string;
} {
  const referralUrl = `${appUrl}?ref=${code}`;
  const text = `Join me on Watch & Earn and start earning coins! Use my referral code ${code}`;

  return {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${referralUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`,
  };
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
  const key = `referral_stats_${userId}`;
  localStorage.setItem(key, JSON.stringify(stats));
}

// Load referral stats from localStorage
export function loadReferralStats(userId: string): ReferralStats | null {
  const key = `referral_stats_${userId}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Track referral click
export function trackReferralClick(code: string): void {
  const key = `referral_clicks_${code}`;
  const clicks = parseInt(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, clicks.toString());
}

// Create shareable message templates
export function getReferralMessage(code: string, platform: 'telegram' | 'whatsapp' | 'facebook' | 'twitter'): string {
  const baseMessage = `Join me on Watch & Earn - a free app to watch live TV and earn coins!`;
  
  const messages = {
    telegram: `${baseMessage}\n\nUse my referral code: ${code}\nGet 50 free coins when you sign up!`,
    whatsapp: `${baseMessage}\n\nUse my referral code: ${code}\nGet 50 free coins when you sign up!`,
    facebook: `Check out Watch & Earn! I'm earning coins by watching live TV. Use code ${code} to join me!`,
    twitter: `I'm earning coins on @WatchEarnApp! Use code ${code} to join and get 50 free coins!`,
  };
  
  return messages[platform];
}

export const REFERRAL_REWARDS = {
  REFERRER_BONUS: 100, // Coins earned by referrer when friend signs up
  REFERRED_BONUS: 50,  // Bonus coins for new user who uses referral code
  CONFIRMED_AFTER: 3,  // Days before referral is confirmed
  MAX_TIER_LEVELS: 3,  // Maximum referral levels for future support
} as const;
