'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  signInWithPi: () => Promise<void>;
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
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof window.Pi !== 'undefined') {
          clearInterval(interval);
          resolve(true);
        } else if (attempts >= 25) {
          clearInterval(interval);
          resolve(typeof window.Pi !== 'undefined');
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    const sdkUrl = PI_NETWORK_CONFIG.SDK_URL || 'https://sdk.minepi.com/pi-sdk.js';
    script.src = sdkUrl;
    script.async = true;

    script.onload = () => resolve(typeof window.Pi !== 'undefined');
    script.onerror = () => resolve(false);

    document.head.appendChild(script);

    setTimeout(() => {
      resolve(typeof window.Pi !== 'undefined');
    }, 4000);
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const [premiumStatus, setPremiumStatus] = useState<PremiumEntitlement | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const isAdminRef = useRef<boolean>(false);
  isAdminRef.current = isAdmin;

  const [loading, setLoading] = useState(true);

  // In-flight concurrency guard and monotonic request version tracker
  const authInProgressRef = useRef<boolean>(false);
  const authRequestIdRef = useRef<number>(0);

  const updateAdminState = useCallback((admin: boolean) => {
    setIsAdmin(Boolean(admin));
  }, []);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authMessage, setAuthMessage] = useState('Initializing Pi Network...');
  const [piAccessToken, setPiAccessToken] = useState<string | null>(null);
  const [isDevPreview, setIsDevPreview] = useState(false);

  const fetchServerAdminStatus = async (token: string | null): Promise<boolean | null> => {
    if (!token || token === 'dev_preview_token' || token.startsWith('dev_preview_')) {
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
      // Non-200 response (e.g. 500, 502, 503, 504) -> transient server error
      return null;
    } catch (err) {
      console.warn('Failed to fetch server admin status (transient error):', err);
      return null;
    }
  };

  const generateReferralCode = useCallback((piUsername?: string) => {
    const name = piUsername || 'USR';
    const timestamp = Date.now().toString(36).toUpperCase();
    const usernameHash = name
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${usernameHash}${random}${timestamp.substring(0, 4)}`;
  }, []);

  const fetchServerPremiumStatus = async (token: string | null): Promise<PremiumEntitlement | null> => {
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
      return null;
    } catch (err) {
      console.warn('Failed to fetch server premium status:', err);
      return null;
    }
  };

  const fetchServerBalance = async (token: string | null): Promise<{ totalCoins: number; lifetimeEarnings: number; dailyCoinsEarned: number } | null> => {
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
            totalCoins: Number(data.totalCoins ?? 0),
            lifetimeEarnings: Number(data.lifetimeEarnings ?? 0),
            dailyCoinsEarned: Number(data.dailyCoinsEarned ?? 0),
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('Failed to fetch server balance (transient error):', err);
      return null;
    }
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
    // Prevent duplicate/concurrent in-flight authentication calls
    if (authInProgressRef.current) {
      console.log('[Pi Auth] Authentication is already in progress, skipping concurrent call.');
      return;
    }

    authInProgressRef.current = true;
    const currentRequestId = ++authRequestIdRef.current;

    setLoading(true);
    setAuthStatus('initializing');
    setAuthMessage('Initializing Pi Network SDK...');

    try {
      // Step 1: Conclusively await Pi SDK readiness before deciding browser environment
      const sdkLoaded = await loadPiSDKScript();

      // Check if stale request before proceeding
      if (currentRequestId !== authRequestIdRef.current) {
        console.log('[Pi Auth] Discarding stale auth request ID:', currentRequestId);
        return;
      }

      const hasPiObject = typeof window !== 'undefined' && Boolean(window.Pi);
      const isPiBrowserUA = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('pibrowser');
      const isPiEnvironment = hasPiObject || (sdkLoaded && Boolean(window.Pi)) || isPiBrowserUA;

      console.log('[Pi Auth] Environment check:', {
        sdkLoaded,
        hasPiObject,
        isPiBrowserUA,
        isPiEnvironment,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
      });

      // If outside Pi environment and SDK is conclusively absent:
      // Provide an immediate, non-blocking Pioneer preview session so external browsers render smoothly.
      if (!isPiEnvironment && !sdkLoaded) {
        const existingUser = userRef.current;
        if (existingUser && existingUser.piUserId && !existingUser.piUserId.includes('preview')) {
          console.log('[Pi Auth] Preserving active Pioneer session across environment check:', existingUser.piUsername);
          setAuthStatus('authenticated');
          setAuthMessage(`Connected as @${existingUser.piUsername}`);
          return;
        }

        console.log('[Pi Auth] Outside Pi Browser - initializing instant Pioneer Live TV preview session.');
        setIsDevPreview(true);
        const devToken = 'dev_preview_token';
        setPiAccessToken(devToken);
        
        const guestUid = 'pioneer_preview_123';
        const guestUsername = 'Pioneer_Preview';
        const defaultUser = createPioneerUser(guestUsername, guestUid, 150, 150, 25);
        
        setUser(defaultUser);
        setPremiumStatus({ active: false, plan: 'free', expiresAt: null });
        setAuthStatus('authenticated');
        setAuthMessage('Live TV Preview Mode');
        updateAdminState(false);
        setLoading(false);
        return;
      }

      if (typeof window.Pi === 'undefined') {
        const existingUser = userRef.current;
        if (!existingUser || !existingUser.piUserId) {
          setUser(null);
          setPiAccessToken(null);
          setIsDevPreview(false);
          setAuthStatus('pi-browser-required');
          setAuthMessage('Please open Pi Live TV inside the Pi Browser app.');
        }
        setLoading(false);
        return;
      }

      setAuthStatus('initializing');
      setAuthMessage('Initializing Pi Network SDK v2.0...');

      try {
        // Treat Pi.init(...) as a Promise and await it fully before calling Pi.authenticate(...)
        await window.Pi.init({
          version: '2.0',
          sandbox: PI_NETWORK_CONFIG.SANDBOX ?? false,
        });
      } catch (initErr) {
        console.warn('[Pi Auth] Pi.init note (may already be initialized):', initErr);
      }

      setAuthStatus('authenticating');
      setAuthMessage('Authenticating Pioneer identity...');

      const onIncompletePaymentFound = async (payment: any) => {
        console.log('[Pi Auth] Incomplete payment found during authentication:', payment);
        if (payment && payment.identifier) {
          try {
            if (payment.transaction && payment.transaction.txid) {
              await fetch(getApiUrl('/api/pi/complete'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction.txid }),
              });
            } else {
              await fetch(getApiUrl('/api/pi/approve'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paymentId: payment.identifier }),
              });
            }
          } catch (recErr) {
            console.warn('[Pi Auth] Failed incomplete payment recovery:', recErr);
          }
        }
      };

      console.log('[Pi Auth] Authenticating with window.Pi.authenticate...');
      // Authenticate with the required 'username' and 'payments' scopes
      const authResult = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
      
      if (currentRequestId !== authRequestIdRef.current) {
        console.log('[Pi Auth] Discarding stale authResult for request ID:', currentRequestId);
        return;
      }

      if (!authResult || !authResult.accessToken) {
        throw new Error('No access token returned from Pi authentication.');
      }

      const clientUser = authResult.user;
      const token = authResult.accessToken;
      const initialUid = clientUser?.uid;
      const initialUsername = clientUser?.username;

      if (!initialUid || !initialUsername) {
        throw new Error('Incomplete Pioneer identity received from Pi authentication.');
      }

      console.log('[Pi Auth] Received authentic Pi Pioneer identity:', { uid: initialUid, username: initialUsername });

      // Establish the authentic Pioneer identity in state, preserving current balance if already known
      const existingUser = userRef.current;
      const existingCoins = (existingUser && existingUser.piUserId === initialUid) ? existingUser.totalCoins : 0;
      const existingLifetime = (existingUser && existingUser.piUserId === initialUid) ? existingUser.lifetimeEarnings : 0;
      const existingDaily = (existingUser && existingUser.piUserId === initialUid) ? existingUser.dailyCoinsEarned : 0;

      const initialPioneer = createPioneerUser(initialUsername, initialUid, existingCoins, existingLifetime, existingDaily);
      setUser(initialPioneer);
      setPiAccessToken(token);
      setIsDevPreview(false);
      setAuthStatus('authenticated');
      setAuthMessage(`Connected as @${initialUsername}`);
      setLoading(false);

      // Concurrently verify with backend and fetch Firestore balance, premium status, and admin rights
      (async () => {
        try {
          const [verifiedUser, serverBal, serverPrem, serverAdmin] = await Promise.all([
            verifyTokenWithServer(token),
            fetchServerBalance(token),
            fetchServerPremiumStatus(token),
            fetchServerAdminStatus(token),
          ]);

          // Guard against stale background resolutions
          if (currentRequestId !== authRequestIdRef.current) {
            console.log('[Pi Auth] Discarding stale background sync for request ID:', currentRequestId);
            return;
          }

          const finalUid = verifiedUser?.uid || initialUid;
          const finalUsername = verifiedUser?.username || initialUsername;

          setUser((prev) => {
            if (!prev) {
              const coins = serverBal ? serverBal.totalCoins : existingCoins;
              const life = serverBal ? serverBal.lifetimeEarnings : existingLifetime;
              const daily = serverBal ? serverBal.dailyCoinsEarned : existingDaily;
              return createPioneerUser(finalUsername, finalUid, coins, life, daily);
            }
            return {
              ...prev,
              piUserId: finalUid,
              piUsername: finalUsername,
              // Only overwrite balance if serverBal successfully returned (preserves known balance on error)
              totalCoins: serverBal ? serverBal.totalCoins : prev.totalCoins,
              lifetimeEarnings: serverBal ? serverBal.lifetimeEarnings : prev.lifetimeEarnings,
              dailyCoinsEarned: serverBal ? serverBal.dailyCoinsEarned : prev.dailyCoinsEarned,
              updatedAt: new Date().toISOString(),
            };
          });

          if (serverPrem) {
            setPremiumStatus(serverPrem);
            AdManager.setPremiumStatus(serverPrem.active);
          }

          // Only update admin state if server returned an authoritative boolean (null = transient error, preserve existing state)
          if (serverAdmin !== null) {
            updateAdminState(serverAdmin);
          }

          setAuthMessage(`Connected as @${finalUsername}`);
        } catch (syncErr) {
          console.warn('[Pi Auth] Background server balance sync note:', syncErr);
        }
      })();
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isExplicitInvalidAuth = errMsg.includes('invalid_token') || errMsg.includes('revoked') || errMsg.includes('unauthorized') || errMsg.includes('expired');
      console.warn('[Pi Auth] Authentication error:', errMsg);

      const existingUser = userRef.current;
      const hasActivePioneer = Boolean(existingUser && existingUser.piUserId && !existingUser.piUserId.includes('preview'));

      // If an existing Pioneer session is already active and the error is transient/recoverable,
      // preserve the existing verified Pioneer identity so the user does NOT get dropped to Guest/Unauthenticated.
      if (hasActivePioneer && !isExplicitInvalidAuth) {
        console.log('[Pi Auth] Preserving active Pioneer session across transient Pi Browser error:', existingUser?.piUsername);
        setAuthStatus('authenticated');
        setAuthMessage(`Connected as @${existingUser?.piUsername}`);
      } else {
        setUser(null);
        setPremiumStatus({ active: false, plan: 'free', expiresAt: null });
        updateAdminState(false);
        AdManager.setPremiumStatus(false);
        setPiAccessToken(null);
        setIsDevPreview(false);
        const isTimedOut = errMsg.includes('timed out') || errMsg.includes('Messaging promise') || errMsg.includes('bridge') || errMsg.includes('network') || errMsg.includes('IPC');
        if (isTimedOut) {
          setAuthStatus('pi-browser-required');
          setAuthMessage('Pi authentication timed out. Please tap Re-authenticate in Pi Browser.');
        } else {
          setAuthStatus('error');
          setAuthMessage(errMsg || 'Authentication failed. Please try again in Pi Browser.');
        }
      }
    } finally {
      authInProgressRef.current = false;
      setLoading(false);
    }
  }, [createPioneerUser, updateAdminState]);

  const authInitializedRef = useRef(false);

  useEffect(() => {
    if (!authInitializedRef.current) {
      authInitializedRef.current = true;
      authenticateWithPiSDK();
    }

    // Safety fallback: Ensure loading flag resolves within 3 seconds so feature pages never deadlock on infinite spinner
    const timer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[Pi Auth] Safety timeout triggered: resolving loading state to prevent page deadlock.');
          return false;
        }
        return prev;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [authenticateWithPiSDK]);

  const checkAdminStatus = useCallback(async (): Promise<boolean> => {
    const admin = await fetchServerAdminStatus(piAccessToken);
    if (admin !== null) {
      updateAdminState(admin);
      return admin;
    }
    // Transient error -> preserve currently verified admin status
    return isAdminRef.current;
  }, [piAccessToken, updateAdminState]);

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
        if (serverBal !== null) {
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
        } else {
          console.log('[WatchPoints] server balance fetch returned null (transient error), preserving existing balance.');
        }
      } catch (err) {
        console.warn('Failed to sync server balance:', err);
      }
    },
    [piAccessToken]
  );

  const syncPremiumStatus = useCallback(async () => {
    const prem = await fetchServerPremiumStatus(piAccessToken);
    if (prem !== null) {
      setPremiumStatus(prem);
      AdManager.setPremiumStatus(prem.active);
    }
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
    updateAdminState(false);
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
        signInWithPi: authenticateWithPiSDK,
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
