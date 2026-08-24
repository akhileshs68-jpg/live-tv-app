'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PI_NETWORK_CONFIG } from '@/lib/system-config';
import type { User } from '@/lib/db-types';

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
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate: (scopes: string[]) => Promise<PiAuthResult>;
      user?: {
        getMe: () => Promise<{ uid: string; username: string; avatar?: string }>;
      };
    };
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  authMessage: string;
  updateUserCoins: (amount: number) => void;
  addTransaction: (type: string, amount: number, reason: string) => Promise<void>;
  addReward: (reward: RewardEvent) => void;
  generateReferralCode: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const loadPiSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'));
      return;
    }

    // If Pi SDK already exists, resolve immediately
    if (typeof window.Pi !== 'undefined') {
      console.log('[v0] Pi SDK already loaded');
      resolve();
      return;
    }

    const script = document.createElement('script');
    const sdkUrl = PI_NETWORK_CONFIG.SDK_URL || 'https://sdk.minepi.com/pi-sdk.js';
    
    script.src = sdkUrl;
    script.async = true;

    script.onload = () => {
      console.log('[v0] Pi SDK script loaded successfully');
      resolve();
    };

    script.onerror = () => {
      console.error('[v0] Failed to load Pi SDK script');
      reject(new Error('Failed to load Pi SDK'));
    };

    document.head.appendChild(script);
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('Initializing Pi Network...');
  const [piAuthAttempted, setPiAuthAttempted] = useState(false);

  const generateReferralCode = (piUsername: string) => {
    // Import better code generation
    const timestamp = Date.now().toString(36).toUpperCase();
    const usernameHash = piUsername
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${usernameHash}${random}${timestamp.substring(0, 4)}`;
  };

  const createUserFromPi = (piUsername: string, piUid: string): User => {
    // Check for referral code from URL
    const refCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null;
    
    return {
      id: 'pi_' + piUid,
      piUsername,
      walletAddress: piUid,
      totalCoins: refCode ? 50 : 0, // Bonus coins if referred
      lifetimeEarnings: refCode ? 50 : 0,
      referralEarnings: 0,
      referralCode: generateReferralCode(piUsername),
      referredBy: refCode || undefined, // Track who referred this user
      dailyStreak: 0,
      lastLoginDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Auto-authenticate on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // 1. Check if user exists in localStorage first for instant display
      try {
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('watchEarnUser') : null;
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.piUsername) {
            if (isMounted) {
              setUser(parsedUser);
              setAuthMessage('Welcome back!');
              setLoading(false);
              setPiAuthAttempted(true);
            }
            return;
          }
        }
      } catch (error) {
        console.warn('Stored user parse error:', error);
      }

      // Quick fallback generator
      const setupFallbackUser = (msg = 'Ready to Watch & Earn') => {
        if (!isMounted) return;
        const randomId = Math.random().toString(36).substring(2, 8);
        const demoUser = createUserFromPi('Pioneer_' + randomId, 'pioneer_' + Date.now());
        setUser(demoUser);
        try {
          localStorage.setItem('watchEarnUser', JSON.stringify(demoUser));
        } catch (_) {}
        setAuthMessage(msg);
        setPiAuthAttempted(true);
        setLoading(false);
      };

      try {
        setAuthMessage('Initializing...');
        
        // Timeout race: if Pi SDK doesn't load/respond in 1800ms, use fallback immediately
        const piAuthPromise = (async () => {
          await loadPiSDK();
          if (typeof window.Pi === 'undefined' || !window.Pi.init) {
            throw new Error('Pi SDK not available');
          }

          await window.Pi.init({
            version: '2.0',
            sandbox: PI_NETWORK_CONFIG.SANDBOX ?? false,
          });

          const authResult = await window.Pi.authenticate(['username']);
          if (!authResult?.user) {
            throw new Error('No user returned from Pi authenticate');
          }

          const piUserInfo = await window.Pi.user?.getMe?.().catch(() => null);
          const piUsername = piUserInfo?.username || authResult.user.username;
          const piUid = piUserInfo?.uid || authResult.user.uid;

          const newUser = createUserFromPi(piUsername, piUid);
          if (isMounted) {
            setUser(newUser);
            try {
              localStorage.setItem('watchEarnUser', JSON.stringify(newUser));
            } catch (_) {}
            setAuthMessage('Connected to Pi Network!');
            setPiAuthAttempted(true);
            setLoading(false);
          }
        })();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Pi Auth Timeout')), 1800)
        );

        await Promise.race([piAuthPromise, timeoutPromise]);
      } catch (error) {
        console.log('Using standard web session:', error);
        setupFallbackUser('Welcome to Watch & Earn');
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateUserCoins = (amount: number) => {
    if (user) {
      const updated = {
        ...user,
        totalCoins: user.totalCoins + amount,
        lifetimeEarnings: user.lifetimeEarnings + (amount > 0 ? amount : 0),
        updatedAt: new Date().toISOString(),
      };
      setUser(updated);
      localStorage.setItem('watchEarnUser', JSON.stringify(updated));
    }
  };

  const addReward = (reward: RewardEvent) => {
    updateUserCoins(reward.amount);
    console.log(`[v0] Reward claimed: ${reward.type} - +${reward.amount} coins - ${reward.description}`);
  };

  const addTransaction = async (type: string, amount: number, reason: string) => {
    console.log(`[v0] Transaction logged: ${type} - ${amount} coins - ${reason}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user && piAuthAttempted,
        authMessage,
        updateUserCoins,
        addReward,
        addTransaction,
        generateReferralCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
