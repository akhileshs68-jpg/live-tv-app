/**
 * Phase 8 - AdManager Singleton
 * Non-blocking, isolated advertising engine with frequency capping,
 * event tracking, fail-silent isolation, and premium entitlement foundation.
 */

import {
  AdEvent,
  AdItem,
  AdProviderInterface,
  AdSlotType,
  FrequencyCapConfig,
  UserAdPreferences,
} from './types';
import { HouseAdProvider } from './providers/house-ad-provider';
import { ExternalAdProviderAdapter } from './providers/external-ad-provider';

class AdManagerClass {
  private providers: AdProviderInterface[] = [];
  private events: AdEvent[] = [];
  private impressionCounts: Record<string, number> = {};
  private lastImpressionTimestamps: Record<string, number> = {};
  private dismissedAdIds: Set<string> = new Set();
  private userPrefs: UserAdPreferences = { hasPremium: false };

  private config: FrequencyCapConfig = {
    maxImpressionsPerSession: 10,
    cooldownSeconds: 15,
    maxImpressionsPerDay: 30,
  };

  constructor() {
    // Initialize provider chain: Primary House/Sponsor provider, secondary External Adapter
    this.providers = [
      new HouseAdProvider(),
      new ExternalAdProviderAdapter(),
    ];
  }

  /**
   * Set Premium entitlement status. If true, all ads are suppressed.
   */
  public setPremiumStatus(hasPremium: boolean): void {
    try {
      this.userPrefs.hasPremium = hasPremium;
    } catch (e) {
      console.warn('[AdManager] setPremiumStatus note:', e);
    }
  }

  public isPremium(): boolean {
    return Boolean(this.userPrefs.hasPremium);
  }

  /**
   * Evaluates if a given ad slot is eligible for displaying an ad.
   */
  public isAdEligible(slot: AdSlotType): boolean {
    try {
      // Rule 1: Premium users get zero ads
      if (this.userPrefs.hasPremium) {
        return false;
      }

      // Rule 2: Frequency Capping
      if (!this.applyFrequencyCap(slot)) {
        return false;
      }

      return true;
    } catch {
      return false; // Fail safe
    }
  }

  /**
   * Frequency cap check. Returns true if impression is allowed under caps.
   */
  public applyFrequencyCap(slot: AdSlotType): boolean {
    try {
      const now = Date.now();
      const lastTime = this.lastImpressionTimestamps[slot] || 0;
      const totalSessionImpressions = Object.values(this.impressionCounts).reduce(
        (a, b) => a + b,
        0
      );

      // Check max session impressions
      if (totalSessionImpressions >= this.config.maxImpressionsPerSession) {
        return false;
      }

      // Check cooldown between impressions for the same slot
      if (now - lastTime < this.config.cooldownSeconds * 1000) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Primary method to fetch an ad for a specific slot.
   * Completely isolated; returns null on error.
   */
  public async getAd(slot: AdSlotType): Promise<AdItem | null> {
    try {
      this.logEvent('ad_requested', 'pending', slot);

      if (!this.isAdEligible(slot)) {
        return null;
      }

      // Query providers in sequence
      for (const provider of this.providers) {
        if (provider.isSupportedInEnvironment()) {
          const ad = await provider.fetchAd(slot);
          if (ad && !this.dismissedAdIds.has(ad.id)) {
            this.logEvent('ad_loaded', ad.id, slot);
            return ad;
          }
        }
      }

      return null;
    } catch (error) {
      this.handleAdFailure('unknown', slot, error);
      return null; // Guarantee non-blocking execution
    }
  }

  /**
   * Record ad impression
   */
  public recordImpression(adId: string, slot: AdSlotType): void {
    try {
      const now = Date.now();
      this.impressionCounts[slot] = (this.impressionCounts[slot] || 0) + 1;
      this.lastImpressionTimestamps[slot] = now;
      this.logEvent('ad_impression', adId, slot);
    } catch (e) {
      console.warn('[AdManager] recordImpression note:', e);
    }
  }

  /**
   * Record user click on ad
   */
  public recordClick(adId: string, slot: AdSlotType): void {
    try {
      this.logEvent('ad_clicked', adId, slot);
    } catch (e) {
      console.warn('[AdManager] recordClick note:', e);
    }
  }

  /**
   * Record user dismiss/close of ad banner
   */
  public recordDismiss(adId: string, slot: AdSlotType): void {
    try {
      this.dismissedAdIds.add(adId);
      this.logEvent('ad_dismissed', adId, slot);
    } catch (e) {
      console.warn('[AdManager] recordDismiss note:', e);
    }
  }

  /**
   * Handle and isolate ad load/render failure
   */
  public handleAdFailure(adId: string, slot: AdSlotType, error: unknown): void {
    try {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logEvent('ad_failed', adId, slot, errMessage);
      console.warn(`[AdManager] Ad ${adId} failed on slot ${slot}:`, errMessage);
    } catch {
      // Fail silently
    }
  }

  /**
   * Safe internal event logger (no tokens, no PII)
   */
  private logEvent(
    type: AdEvent['type'],
    adId: string,
    slot: AdSlotType,
    error?: string
  ): void {
    try {
      const event: AdEvent = {
        type,
        adId,
        slot,
        timestamp: Date.now(),
        ...(error ? { error } : {}),
      };
      this.events.push(event);
      if (this.events.length > 50) {
        this.events.shift(); // keep log bounded
      }
    } catch {
      // Fail silently
    }
  }

  public getEvents(): ReadonlyArray<AdEvent> {
    return [...this.events];
  }
}

// Export singleton instance
export const AdManager = new AdManagerClass();
