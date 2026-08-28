'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PI_NETWORK_CONFIG } from '@/lib/system-config';
import { getApiUrl } from '@/lib/api-config';
import type { User, PremiumEntitlement } from '@/lib/db-types';
import { AdManager } from '@/lib/ads/ad-manager';

interface RewardEvent {
  type: 'watch' | 'daily_login' | 'task' | 'referral' | 'streak';
  amount: number;
  description: string;
}

interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
}

declare global {
  interface Window {
    Pi?: {
      init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate: (scopes: string[], onIncompletePaymentFound?: (payment: any) => void) => Promise<PiAuthResult>;
      createPayment?: (
        paymentData: { amount: number; memo: string; metadata: any },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment?: any) => void;
        }
      ) => void;
      user?: {
        getMe: () => Promise<{ uid: string; username: string; avatar?: string }>;
      };
    };
  }
}

export type AuthStatus =
  | 'idle'
  | 'initializing'
  | 'authenticating'
  | 'authenticated'
  | 'unauthenticated'
  | 'pi-browser-required'
  | 'error';

interface AuthContextType {
  user: User | null;
  premiumStatus: PremiumEntitlement | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authStatus: AuthStatus;
  authMessage: string;
  piAccessToken: string | null;
  isDevPreview: boolean;
  reauthenticate: () => Promise<void>;
  updateUserCoins: (amount: number) => void;
  syncServerBalance: (explicitBalance?: { totalCoins?: number; dailyCoinsEarned?: number; lifetimeEarnings?: number }) => Promise<void>;
  syncPremiumStatus: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
  addTransaction: (type: string, amount: number, reason: string) => Promise<void>;
  addReward: (reward: RewardEvent) => void;
  generateReferralCode: (piUsername?: string) => string;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const loadPiSDKScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (typeof window.Pi !== 'undefined') {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src*="pi-sdk.js"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(typeof window.Pi !== 'undefined'));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    const sdkUrl = PI_NETWORK_CONFIG.SDK_URL || 'https://sdk.minepi.com/pi-sdk.js';
    script.src = sdkUrl;
    script.async = true;

    script.onload = () => resolve(typeof window.Pi !== 'undefined');
    script.onerror = () => resolve(false);

    document.head.appendChild(script);
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<PremiumEntitlement | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authMessage, setAuthMessage] = useState('Initializing Pi Network...');
  const [piAccessToken, setPiAccessToken] = useState<string | null>(null);
  const [isDevPreview, setIsDevPreview] = useState(false);

  const fetchServerAdminStatus = async (token: string | null): Promise<boolean> => {
    if (!token) {
      return false;
    }
    try {
      const res = await fetch(getApiUrl('/api/admin/verify'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data && data.success && data.isAdmin);
      }
    } catch (err) {
      console.warn('Failed to fetch server admin status:', err);
    }
    return false;
  };

  const generateReferralCode = useCallback((piUsername?: string) => {
    const name = piUsername || user?.piUsername || 'USR';
    const timestamp = Date.now().toString(36).toUpperCase();
    const usernameHash = name
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${usernameHash}${random}${timestamp.substring(0, 4)}`;
  }, [user?.piUsername]);

  const fetchServerPremiumStatus = async (token: string | null): Promise<PremiumEntitlement> => {
    if (!token) {
      return { active: false, plan: 'free', expiresAt: null };
    }
    try {
      const res = await fetch(getApiUrl('/api/premium/status'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.premium) {
          return {
            active: Boolean(data.premium.active),
            plan: data.premium.plan === 'premium' ? 'premium' : 'free',
            expiresAt: data.premium.expiresAt || null,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch server premium status:', err);
    }
    return { active: false, plan: 'free', expiresAt: null };
  };

  const fetchServerBalance = async (token: string | null) => {
    if (!token) {
      return { totalCoins: 0, lifetimeEarnings: 0, dailyCoinsEarned: 0 };
    }
    try {
      const res = await fetch(getApiUrl('/api/rewards/balance'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return {
            totalCoins: data.totalCoins || 0,
            lifetimeEarnings: data.lifetimeEarnings || 0,
            dailyCoinsEarned: data.dailyCoinsEarned || 0,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch server balance:', err);
    }
    return { totalCoins: 0, lifetimeEarnings: 0, dailyCoinsEarned: 0 };
  };

  const createPioneerUser = useCallback((piUsername: string, piUid: string, initialCoins = 0, lifetimeCoins = 0, dailyCoinsEarned = 0): User => {
    const refCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null;

    return {
      id: 'pi_' + piUid,
      piUserId: piUid,
      piUsername,
      walletAddress: undefined,
      totalCoins: initialCoins,
      dailyCoinsEarned: dailyCoinsEarned,
      lifetimeEarnings: lifetimeCoins || initialCoins,
      referralEarnings: 0,
      referralCode: generateReferralCode(piUsername),
      referredBy: refCode || undefined,
      dailyStreak: 1,
      lastLoginDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [generateReferralCode]);

  const verifyTokenWithServer = async (token: string): Promise<{ uid: string; username: string } | null> => {
    try {
      const res = await fetch(getApiUrl('/api/pi/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data && data.verified && data.user) {
        return data.user;
      }
      return null;
    } catch (err) {
      console.warn('Server token verification request failed:', err);
      return null;
    }
  };

  const authenticateWithPiSDK = useCallback(async () => {
    setLoading(true);
    setAuthStatus('initializing');
    setAuthMessage('Detecting Pi Browser...');

    const isPiBrowser = typeof window !== 'undefined' && (
      navigator.userAgent.includes('PiBrowser')
    );

    // AI Studio preview container hostnames explicitly start with 'ais-dev-' or 'ais-pre-'
    const isAIStudioPreviewHost = typeof window !== 'undefined' && (
      window.location.hostname.startsWith('ais-dev-') ||
      window.location.hostname.startsWith('ais-pre-') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.search.includes('dev_preview=true')
    );

    // Dev preview mode is strictly allowed ONLY in desktop local/AI Studio IDE previews outside Pi Browser.
    // It is ABSOLUTELY FORBIDDEN if running inside Pi Browser.
    const isLocalDevPreviewAllowed = !isPiBrowser && isAIStudioPreviewHost;

    console.log('[Pi Auth] Environment check:', {
      isPiBrowser,
      isAIStudioPreviewHost,
      isLocalDevPreviewAllowed,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
    });

    try {
      const sdkLoaded = await loadPiSDKScript();

      if (!sdkLoaded || typeof window.Pi === 'undefined') {
        if (isLocalDevPreviewAllowed) {
          console.warn('[Dev Mode] Pi SDK unavailable outside Pi Browser. Using gated Dev Preview Pioneer.');
          setIsDevPreview(true);
          setPiAccessToken('dev_preview_token');
          
          const devUid = 'dev_preview_uid_123';
          const devUsername = 'Dev_Pioneer_Preview';
          const serverBal = await fetchServerBalance('dev_preview_token');

          const devUser = createPioneerUser(devUsername, devUid, serverBal.totalCoins, serverBal.lifetimeEarnings, serverBal.dailyCoinsEarned);
          setUser(devUser);
          setAuthStatus('authenticated');
          setAuthMessage('Development Preview Mode');
          setLoading(false);
          return;
        }

        console.warn('[Pi Auth] Pi SDK not available. Production rejected fake authentication.');
        setUser(null);
        setPiAccessToken(null);
        setIsDevPreview(false);
        setAuthStatus('pi-browser-required');
        setAuthMessage('Please open Pi Live TV inside the Pi Browser app.');
        setLoading(false);
        return;
      }

      setAuthStatus('initializing');
      setAuthMessage('Initializing Pi Network SDK v2.0...');

      const initPromise = window.Pi.init({
        version: '2.0',
        sandbox: PI_NETWORK_CONFIG.SANDBOX ?? false,
      });
      const initTimeout = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Pi SDK init timed out.')), 5000);
      });
      await Promise.race([initPromise, initTimeout]);

      setAuthStatus('authenticating');
      setAuthMessage('Authenticating Pioneer identity...');

      const onIncompletePaymentFound = (payment: any) => {
        console.log('[Pi Auth] Incomplete payment found during authentication:', payment);
      };

      console.log('[Pi Auth] Authenticating with window.Pi.authenticate...');
      const authResult = await window.Pi.authenticate(['username'], onIncompletePaymentFound);
      if (!authResult || !authResult.accessToken) {
        throw new Error('No access token returned from Pi authentication.');
      }

      const clientUser = authResult.user;
      const token = authResult.accessToken;
      console.log('[Pi Auth] Received Pi access token for client user:', { uid: clientUser?.uid, username: clientUser?.username });

      setAuthMessage('Verifying identity with server...');
      const verifiedUser = await verifyTokenWithServer(token);

      if (!verifiedUser || !verifiedUser.uid) {
        throw new Error('Authentication server verification failed. Please check your network or try again.');
      }

      const finalUid = verifiedUser.uid;
      const finalUsername = verifiedUser.username || clientUser?.username || `Pioneer_${finalUid.substring(0, 6)}`;

      console.log('[Pi Auth] Verified canonical Pioneer identity:', { finalUid, finalUsername });

      // Fetch server-authoritative balance, premium status, and admin status from Firestore
      const [serverBal, serverPrem, serverAdmin] = await Promise.all([
        fetchServerBalance(token),
        fetchServerPremiumStatus(token),
        fetchServerAdminStatus(token),
      ]);
      const authenticatedUser = createPioneerUser(finalUsername, finalUid, serverBal.totalCoins, serverBal.lifetimeEarnings, serverBal.dailyCoinsEarned);

      setUser(authenticatedUser);
      setPremiumStatus(serverPrem);
      setIsAdmin(serverAdmin);
      AdManager.setPremiumStatus(serverPrem.active);
      setPiAccessToken(token);
      setIsDevPreview(false);
      setAuthStatus('authenticated');
      setAuthMessage(`Connected as @${finalUsername}`);
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isTimedOut = errMsg.includes('timed out') || errMsg.includes('Messaging promise');
      console.warn('[Pi Auth] Authentication note:', errMsg);

      if (isLocalDevPreviewAllowed) {
        console.warn('[Dev Mode] Pi Auth failed, falling back to Dev Preview in local environment only.');
        setIsDevPreview(true);
        setPiAccessToken('dev_preview_token');
        const devUid = 'dev_preview_uid_123';
        const devUsername = 'Dev_Pioneer_Preview';
        const [serverBal, serverPrem, serverAdmin] = await Promise.all([
          fetchServerBalance('dev_preview_token'),
          fetchServerPremiumStatus('dev_preview_token'),
          fetchServerAdminStatus('dev_preview_token'),
        ]);
        const devUser = createPioneerUser(devUsername, devUid, serverBal.totalCoins, serverBal.lifetimeEarnings, serverBal.dailyCoinsEarned);
        setUser(devUser);
        setPremiumStatus(serverPrem);
        setIsAdmin(serverAdmin);
        AdManager.setPremiumStatus(serverPrem.active);
        setAuthStatus('authenticated');
        setAuthMessage('Development Preview Mode');
        setLoading(false);
        return;
      }

      setUser(null);
      setPremiumStatus({ active: false, plan: 'free', expiresAt: null });
      setIsAdmin(false);
      AdManager.setPremiumStatus(false);
      setPiAccessToken(null);
      setIsDevPreview(false);
      if (isTimedOut) {
        setAuthStatus('pi-browser-required');
        setAuthMessage('Pi authentication timed out. Please tap Re-authenticate in Pi Browser.');
      } else {
        setAuthStatus('error');
        setAuthMessage(errMsg || 'Authentication failed. Please try again in Pi Browser.');
      }
    } finally {
      setLoading(false);
    }
  }, [createPioneerUser]);

  useEffect(() => {
    authenticateWithPiSDK();
  }, [authenticateWithPiSDK]);

  const checkAdminStatus = useCallback(async (): Promise<boolean> => {
    const admin = await fetchServerAdminStatus(piAccessToken);
    setIsAdmin(admin);
    return admin;
  }, [piAccessToken]);

  const syncServerBalance = useCallback(
    async (explicitBalance?: { totalCoins?: number; dailyCoinsEarned?: number; lifetimeEarnings?: number }) => {
      if (explicitBalance && typeof explicitBalance.totalCoins === 'number') {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                totalCoins: explicitBalance.totalCoins ?? prev.totalCoins,
                dailyCoinsEarned: explicitBalance.dailyCoinsEarned !== undefined ? explicitBalance.dailyCoinsEarned : prev.dailyCoinsEarned,
                lifetimeEarnings: explicitBalance.lifetimeEarnings !== undefined ? explicitBalance.lifetimeEarnings : prev.lifetimeEarnings,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
        console.log('[WatchPoints] server balance synced', explicitBalance);
        return;
      }

      try {
        const serverBal = await fetchServerBalance(piAccessToken);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                totalCoins: serverBal.totalCoins,
                dailyCoinsEarned: serverBal.dailyCoinsEarned,
                lifetimeEarnings: serverBal.lifetimeEarnings,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
        console.log('[WatchPoints] server balance synced', serverBal);
      } catch (err) {
        console.warn('Failed to sync server balance:', err);
      }
    },
    [piAccessToken]
  );

  const syncPremiumStatus = useCallback(async () => {
    const prem = await fetchServerPremiumStatus(piAccessToken);
    setPremiumStatus(prem);
    AdManager.setPremiumStatus(prem.active);
  }, [piAccessToken]);

  const updateUserCoins = useCallback((amount: number) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            totalCoins: Math.max(0, prev.totalCoins + amount),
            lifetimeEarnings: prev.lifetimeEarnings + (amount > 0 ? amount : 0),
            updatedAt: new Date().toISOString(),
          }
        : null
    );
  }, []);

  const addReward = (reward: RewardEvent) => {
    updateUserCoins(reward.amount);
    console.log(`[Pi Live TV] Reward event: ${reward.type} +${reward.amount} coins`);
  };

  const addTransaction = async (type: string, amount: number, reason: string) => {
    console.log(`[Pi Live TV] Transaction: ${type} - ${amount} coins - ${reason}`);
  };

  const logout = () => {
    setUser(null);
    setPremiumStatus({ active: false, plan: 'free', expiresAt: null });
    setIsAdmin(false);
    AdManager.setPremiumStatus(false);
    setPiAccessToken(null);
    setAuthStatus('unauthenticated');
    setAuthMessage('Logged out.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        premiumStatus,
        loading,
        isAuthenticated: authStatus === 'authenticated',
        isAdmin,
        authStatus,
        authMessage,
        piAccessToken,
        isDevPreview,
        reauthenticate: authenticateWithPiSDK,
        updateUserCoins,
        syncServerBalance,
        syncPremiumStatus,
        checkAdminStatus,
        addTransaction,
        addReward,
        generateReferralCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
