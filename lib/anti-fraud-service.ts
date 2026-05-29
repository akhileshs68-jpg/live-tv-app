// Anti-Fraud Service for Watch & Earn System

import { REWARD_AMOUNTS } from './reward-utils';

export interface WatchSession {
  videoId: string;
  userId: string;
  startTime: number;
  watchedDuration: number;
  deviceHash: string;
  sessionId: string;
  ipAddress: string;
  tabId: string;
}

export interface FraudScore {
  score: number; // 0-100, higher = more suspicious
  flags: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  shouldReward: boolean;
}

class AntiFraudService {
  private watchSessions: Map<string, WatchSession[]> = new Map();
  private userIPHistory: Map<string, { ip: string; timestamp: number }[]> = new Map();
  private rapidClaimTracker: Map<string, number[]> = new Map();
  private deviceTabTracker: Map<string, Set<string>> = new Map();

  calculateFraudScore(session: WatchSession, watchedDuration: number): FraudScore {
    const flags: string[] = [];
    let score = 0;

    // Check 1: Minimum watch time
    if (watchedDuration < 30) {
      flags.push('insufficient_watch_time');
      score += 50;
    }

    // Check 2: Multi-tab detection
    const deviceTabs = this.deviceTabTracker.get(session.deviceHash) || new Set();
    if (deviceTabs.size > 5) {
      flags.push('multi_tab_abuse');
      score += 40;
    }

    // Check 3: Rapid claim pattern (claims within 5 seconds)
    const recentClaims = this.rapidClaimTracker.get(session.userId) || [];
    const recentClaim = recentClaims.filter(t => Date.now() - t < 5000).length;
    if (recentClaim > 0) {
      flags.push('rapid_claim_detected');
      score += 45;
    }

    // Check 4: Unusual IP change
    const ipHistory = this.userIPHistory.get(session.userId) || [];
    if (ipHistory.length > 0) {
      const lastIP = ipHistory[ipHistory.length - 1];
      const hoursSinceLastActivity = (Date.now() - lastIP.timestamp) / (1000 * 60 * 60);
      
      if (lastIP.ip !== session.ipAddress && hoursSinceLastActivity < 24) {
        flags.push('suspicious_ip_change');
        score += 30;
      }
    }

    // Check 5: Impossible watch speed (watched entire video in < 1 second)
    if (watchedDuration > 300 && watchedDuration < 1) {
      flags.push('impossible_watch_speed');
      score += 60;
    }

    // Check 6: Daily limit exceeded
    const todaySessions = (this.watchSessions.get(session.userId) || []).filter(s => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return s.startTime > oneDayAgo;
    });

    if (todaySessions.length > 50) {
      flags.push('excessive_daily_claims');
      score += 35;
    }

    // Determine risk level and whether to reward
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (score >= 80) riskLevel = 'critical';
    else if (score >= 60) riskLevel = 'high';
    else if (score >= 40) riskLevel = 'medium';

    const shouldReward = score < 60 && watchedDuration >= 30;

    return {
      score,
      flags,
      riskLevel,
      shouldReward,
    };
  }

  registerWatchSession(session: WatchSession): void {
    const sessions = this.watchSessions.get(session.userId) || [];
    sessions.push(session);
    this.watchSessions.set(session.userId, sessions);

    // Track device tabs
    const tabs = this.deviceTabTracker.get(session.deviceHash) || new Set();
    tabs.add(session.tabId);
    this.deviceTabTracker.set(session.deviceHash, tabs);

    // Track IP
    const ipHistory = this.userIPHistory.get(session.userId) || [];
    ipHistory.push({ ip: session.ipAddress, timestamp: Date.now() });
    if (ipHistory.length > 50) ipHistory.shift(); // Keep last 50
    this.userIPHistory.set(session.userId, ipHistory);
  }

  registerRewardClaim(userId: string): void {
    const claims = this.rapidClaimTracker.get(userId) || [];
    claims.push(Date.now());
    if (claims.length > 100) claims.shift(); // Keep last 100
    this.rapidClaimTracker.set(userId, claims);
  }

  getUserRiskProfile(userId: string): {
    totalFlaggedSessions: number;
    averageFraudScore: number;
    lastRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const sessions = this.watchSessions.get(userId) || [];
    const flaggedSessions = sessions.filter(s => {
      // Estimate risk based on session patterns
      return false; // Placeholder
    });

    return {
      totalFlaggedSessions: flaggedSessions.length,
      averageFraudScore: flaggedSessions.length > 0 ? 35 : 15,
      lastRiskLevel: 'low',
    };
  }

  cleanupOldSessions(hoursOld: number = 24): void {
    const cutoffTime = Date.now() - hoursOld * 60 * 60 * 1000;
    this.watchSessions.forEach((sessions, userId) => {
      const filtered = sessions.filter(s => s.startTime > cutoffTime);
      if (filtered.length === 0) {
        this.watchSessions.delete(userId);
      } else {
        this.watchSessions.set(userId, filtered);
      }
    });
  }
}

export const antiFraudService = new AntiFraudService();
