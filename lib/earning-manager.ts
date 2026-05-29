// Active Earning System - Tracks all earning sources and modes

import { REWARD_AMOUNTS } from '@/lib/reward-utils';

export type EarningSource = 
  | 'daily_login' 
  | 'watch_tv' 
  | 'task_complete' 
  | 'streak_bonus' 
  | 'referral' 
  | 'ad_watch' 
  | 'achievement';

export interface EarningSession {
  userId: string;
  date: string;
  sources: EarningRecord[];
  totalEarned: number;
  dailyLimit: number;
  dailyEarned: number;
  remainingToday: number;
}

export interface EarningRecord {
  id: string;
  source: EarningSource;
  amount: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ActiveEarningModes {
  dailyLogin: boolean;
  watchTV: boolean;
  tasks: boolean;
  streaks: boolean;
  referrals: boolean;
  ads: boolean;
  achievements: boolean;
  leaderboard: boolean;
}

export class EarningManager {
  private userId: string;
  private session: EarningSession;

  constructor(userId: string) {
    this.userId = userId;
    this.session = this.loadSession();
  }

  private loadSession(): EarningSession {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`earning_session_${this.userId}_${today}`);
    
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.date === today) {
          return session;
        }
      } catch (e) {
        console.log('[v0] Session load failed, creating new');
      }
    }

    return {
      userId: this.userId,
      date: today,
      sources: [],
      totalEarned: 0,
      dailyLimit: REWARD_AMOUNTS.DAILY_EARNING_LIMIT,
      dailyEarned: 0,
      remainingToday: REWARD_AMOUNTS.DAILY_EARNING_LIMIT,
    };
  }

  public saveSession(): void {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`earning_session_${this.userId}_${today}`, JSON.stringify(this.session));
  }

  public addEarning(source: EarningSource, amount: number, metadata?: Record<string, unknown>): boolean {
    if (this.session.dailyEarned + amount > this.session.dailyLimit) {
      console.log('[v0] Daily limit exceeded');
      return false;
    }

    const record: EarningRecord = {
      id: `earn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      source,
      amount,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.session.sources.push(record);
    this.session.totalEarned += amount;
    this.session.dailyEarned += amount;
    this.session.remainingToday = this.session.dailyLimit - this.session.dailyEarned;

    this.saveSession();
    return true;
  }

  public getSession(): EarningSession {
    return this.session;
  }

  public getDailyEarnings(): number {
    return this.session.dailyEarned;
  }

  public getRemainingToday(): number {
    return this.session.remainingToday;
  }

  public getSourceBreakdown(): Record<EarningSource, number> {
    const breakdown: Record<EarningSource, number> = {
      daily_login: 0,
      watch_tv: 0,
      task_complete: 0,
      streak_bonus: 0,
      referral: 0,
      ad_watch: 0,
      achievement: 0,
    };

    this.session.sources.forEach((record) => {
      breakdown[record.source] += record.amount;
    });

    return breakdown;
  }

  public canEarn(source: EarningSource): boolean {
    if (this.session.remainingToday <= 0) return false;
    
    // Check for duplicate daily login
    if (source === 'daily_login') {
      const today = new Date().toISOString().split('T')[0];
      const alreadyEarned = this.session.sources.some(
        (r) => r.source === 'daily_login' && r.timestamp.startsWith(today)
      );
      return !alreadyEarned;
    }

    return true;
  }
}

// Initialize all active earning modes
export function initializeActiveModes(): ActiveEarningModes {
  return {
    dailyLogin: true,
    watchTV: true,
    tasks: true,
    streaks: true,
    referrals: true,
    ads: true,
    achievements: true,
    leaderboard: true,
  };
}

// Get available earning sources for display
export function getAvailableEarningModes(modes: ActiveEarningModes): EarningSource[] {
  const available: EarningSource[] = [];
  
  if (modes.dailyLogin) available.push('daily_login');
  if (modes.watchTV) available.push('watch_tv');
  if (modes.tasks) available.push('task_complete');
  if (modes.streaks) available.push('streak_bonus');
  if (modes.referrals) available.push('referral');
  if (modes.ads) available.push('ad_watch');
  if (modes.achievements) available.push('achievement');

  return available;
}

// Calculate potential daily earnings
export function calculatePotentialEarnings(modes: ActiveEarningModes): number {
  let potential = 0;

  if (modes.dailyLogin) potential += REWARD_AMOUNTS.DAILY_LOGIN;
  if (modes.watchTV) potential += REWARD_AMOUNTS.WATCH_FULL * 3; // Assume 3 videos
  if (modes.tasks) potential += REWARD_AMOUNTS.TASK_COMPLETION * 5; // Assume 5 tasks
  if (modes.streaks) potential += 50; // Average streak bonus
  if (modes.referrals) potential += 100; // If referral converts
  if (modes.ads) potential += 25; // Per ad
  if (modes.achievements) potential += 100; // Per achievement

  return Math.min(potential, REWARD_AMOUNTS.DAILY_EARNING_LIMIT);
}

export const EARNING_SOURCES_INFO = {
  daily_login: {
    name: 'Daily Login',
    icon: '📱',
    amount: REWARD_AMOUNTS.DAILY_LOGIN,
    description: 'Login daily to earn bonus coins',
    frequency: 'Once per day',
  },
  watch_tv: {
    name: 'Watch TV',
    icon: '📺',
    amount: REWARD_AMOUNTS.WATCH_FULL,
    description: 'Earn coins by watching live TV channels',
    frequency: 'Per video',
  },
  task_complete: {
    name: 'Complete Tasks',
    icon: '✅',
    amount: REWARD_AMOUNTS.TASK_COMPLETION,
    description: 'Finish daily, weekly, and special tasks',
    frequency: 'Per task',
  },
  streak_bonus: {
    name: 'Streak Bonus',
    icon: '🔥',
    amount: 10,
    description: '10% bonus per consecutive day logged in',
    frequency: 'Per day',
  },
  referral: {
    name: 'Referral Rewards',
    icon: '👥',
    amount: REWARD_AMOUNTS.REFERRAL_REWARD,
    description: 'Invite friends and earn when they sign up',
    frequency: 'Per signup',
  },
  ad_watch: {
    name: 'Watch Ads',
    icon: '🎬',
    amount: 10,
    description: 'Watch video ads to earn bonus coins',
    frequency: 'Per video',
  },
  achievement: {
    name: 'Achievements',
    icon: '🏆',
    amount: 50,
    description: 'Unlock achievements and earn rewards',
    frequency: 'Per unlock',
  },
} as const;
