'use client';

/**
 * Session persistence for Watch & Earn Pi Network app
 * Handles automatic re-authentication and seamless session recovery
 */

export interface SessionData {
  user: {
    piUsername: string;
    piUid: string;
    walletAddress: string;
    referralCode: string;
  };
  tokens: {
    accessToken?: string;
    refreshToken?: string;
  };
  rewards: {
    totalCoins: number;
    lifetimeEarnings: number;
    referralEarnings: number;
    dailyStreak: number;
  };
  lastAuthTime: number;
}

const SESSION_KEY = 'watchEarnSession_v1';
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export const SessionManager = {
  /**
   * Save session to localStorage
   */
  saveSession(data: SessionData): void {
    try {
      const sessionWithExpiry = {
        ...data,
        expiryTime: Date.now() + SESSION_EXPIRY,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionWithExpiry));
      console.log('[v0] Session saved successfully');
    } catch (error) {
      console.error('[v0] Failed to save session:', error);
    }
  },

  /**
   * Load session from localStorage
   */
  loadSession(): SessionData | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Check if session has expired
      if (parsed.expiryTime && Date.now() > parsed.expiryTime) {
        console.log('[v0] Session expired, clearing');
        SessionManager.clearSession();
        return null;
      }

      console.log('[v0] Session loaded successfully');
      return {
        user: parsed.user,
        tokens: parsed.tokens,
        rewards: parsed.rewards,
        lastAuthTime: parsed.lastAuthTime,
      };
    } catch (error) {
      console.error('[v0] Failed to load session:', error);
      return null;
    }
  },

  /**
   * Clear session from localStorage
   */
  clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      console.log('[v0] Session cleared');
    } catch (error) {
      console.error('[v0] Failed to clear session:', error);
    }
  },

  /**
   * Check if session is still valid
   */
  isSessionValid(): boolean {
    const session = SessionManager.loadSession();
    if (!session) return false;

    // Session is valid if it exists and hasn't expired
    return true;
  },

  /**
   * Get session age in minutes
   */
  getSessionAge(): number {
    const session = SessionManager.loadSession();
    if (!session) return -1;
    return Math.floor((Date.now() - session.lastAuthTime) / 60000);
  },
};

/**
 * Recovery mechanism for interrupted authentication
 * Handles cases where user closes browser during auth
 */
export const AuthRecovery = {
  /**
   * Mark authentication as in-progress
   */
  setAuthInProgress(): void {
    try {
      localStorage.setItem('authInProgress_v1', JSON.stringify({
        timestamp: Date.now(),
        step: 'loading_sdk',
      }));
    } catch (error) {
      console.error('[v0] Failed to mark auth in progress:', error);
    }
  },

  /**
   * Clear in-progress flag
   */
  clearAuthInProgress(): void {
    try {
      localStorage.removeItem('authInProgress_v1');
    } catch (error) {
      console.error('[v0] Failed to clear auth in progress:', error);
    }
  },

  /**
   * Check if auth was interrupted
   */
  wasAuthInterrupted(): boolean {
    try {
      const stored = localStorage.getItem('authInProgress_v1');
      if (!stored) return false;

      const parsed = JSON.parse(stored);
      // If auth was in progress more than 5 minutes ago, consider it interrupted
      const age = Date.now() - parsed.timestamp;
      return age > 5 * 60 * 1000;
    } catch (error) {
      return false;
    }
  },
};
