/**
 * Phase 8 - House Ad Provider
 * Verified, non-intrusive Pi Ecosystem & Platform Partner sponsorships.
 * 100% compatible with Pi Browser Android WebView.
 */

import { AdItem, AdProviderInterface, AdSlotType } from '../types';

const HOUSE_ADS: AdItem[] = [
  {
    id: 'house_pi_network_pioneer',
    slot: 'banner_top',
    title: 'Pi Network Mainnet Ecosystem',
    description: 'Explore verified Pi Apps and utilities inside Pi Browser.',
    ctaText: 'Explore Ecosystem',
    ctaUrl: 'https://minepi.com',
    icon: '⚡',
    badge: 'Pi Ecosystem',
    sponsorName: 'Pi Network Partner',
    isExternal: false,
  },
  {
    id: 'house_watch_points_hub',
    slot: 'banner_hub',
    title: 'Unlock Ad-Free Stream Passes',
    description: 'Redeem Watch Points for 24-hour ad-free priority streaming.',
    ctaText: 'View Utilities',
    ctaUrl: '/earn',
    icon: '⭐',
    badge: 'Watch Points Utility',
    sponsorName: 'Pi Live TV',
    isExternal: false,
  },
  {
    id: 'house_pi_browser_security',
    slot: 'banner_feed',
    title: 'Official Pi Browser Verified App',
    description: 'Safe, encrypted, and server-authoritative streaming for Pioneers.',
    ctaText: 'Learn More',
    ctaUrl: '/earn',
    icon: '🛡️',
    badge: 'Verified App',
    sponsorName: 'Security Guarantee',
    isExternal: false,
  },
  {
    id: 'house_native_hd_channels',
    slot: 'native_card',
    title: 'Pi Live TV HD Priority Streams',
    description: 'Upgrade your channel experience with HD bitrate passes unlocked via Watch Points.',
    ctaText: 'Explore Perks',
    ctaUrl: '/earn',
    icon: '📺',
    badge: 'Sponsored Channel',
    sponsorName: 'Featured Partner',
    isExternal: false,
  },
  {
    id: 'house_sponsor_pioneer_tier',
    slot: 'sponsor_badge',
    title: 'Pioneer Stream Supporter',
    description: 'Supporting global live TV broadcasting for Pi Network users.',
    ctaText: 'Join Pioneers',
    ctaUrl: '/earn',
    icon: '👑',
    badge: 'Official Sponsor',
    sponsorName: 'Pi Live TV Network',
    isExternal: false,
  },
];

export class HouseAdProvider implements AdProviderInterface {
  public name = 'House & Ecosystem Sponsor Provider';

  public isSupportedInEnvironment(): boolean {
    return true; // 100% supported on all mobile and web browsers including Pi Browser
  }

  public async fetchAd(slot: AdSlotType): Promise<AdItem | null> {
    try {
      const matching = HOUSE_ADS.filter((ad) => ad.slot === slot);
      if (matching.length === 0) {
        // Fallback to any house ad if specific slot matches none
        const fallback = HOUSE_ADS[Math.floor(Math.random() * HOUSE_ADS.length)];
        return { ...fallback, slot };
      }
      const selected = matching[Math.floor(Math.random() * matching.length)];
      return selected;
    } catch {
      return null;
    }
  }
}
