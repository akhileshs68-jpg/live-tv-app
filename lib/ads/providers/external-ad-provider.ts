/**
 * Phase 8 - External Ad Network Adapter Stub
 * Safe wrapper for external web ad tags.
 * Kept disabled by default until client environment compatibility is verified.
 */

import { AdItem, AdProviderInterface, AdSlotType } from '../types';

export class ExternalAdProviderAdapter implements AdProviderInterface {
  public name = 'External Ad Network Adapter';

  public isSupportedInEnvironment(): boolean {
    // External ad networks are kept disabled by default in Pi Browser WebView
    // until explicit script load checks and domain registrations pass.
    if (typeof window === 'undefined') return false;

    // Check if an external ad script (e.g. Google Publisher Tag or custom SDK) is present
    const hasExternalSdk = Boolean(
      (window as unknown as Record<string, unknown>).googletag ||
      (window as unknown as Record<string, unknown>).adsbygoogle
    );

    return hasExternalSdk;
  }

  public async fetchAd(slot: AdSlotType): Promise<AdItem | null> {
    if (!this.isSupportedInEnvironment()) {
      return null;
    }

    try {
      // Stub for external network ad request
      // Return null so AdManager seamlessly falls back to HouseAdProvider
      return null;
    } catch (error) {
      console.warn('[AdAdapter] External ad load failed safely:', error);
      return null;
    }
  }
}
