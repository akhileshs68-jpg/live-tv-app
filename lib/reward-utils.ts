// Reward System & Anti-Fraud Utilities

export const REWARD_AMOUNTS = {
  DAILY_LOGIN: 10,
  WATCH_MINIMUM: 30, // for 30 sec watch
  WATCH_FULL: 50,
  TASK_COMPLETION: 25,
  STREAK_BONUS_MULTIPLIER: 1.1, // 10% bonus per streak day
  REFERRAL_REWARD: 100,
  REFERRAL_REFERRED: 50,
  DAILY_EARNING_LIMIT: 500,
};

export function calculateWatchReward(watchDuration: number, fullDuration: number): number {
  // 30 sec minimum for any reward
  if (watchDuration < 30) return 0;
  
  // Minimum 30 sec reward
  if (watchDuration >= 30 && watchDuration < fullDuration) {
    return REWARD_AMOUNTS.WATCH_MINIMUM;
  }
  
  // Full video watched
  if (watchDuration >= fullDuration) {
    return REWARD_AMOUNTS.WATCH_FULL;
  }
  
  return 0;
}

export function calculateStreakBonus(streakDays: number): number {
  // 10% bonus per day of streak, max 100% at 10 days
  const bonusPercent = Math.min(streakDays * 10, 100);
  return Math.floor((REWARD_AMOUNTS.DAILY_LOGIN * bonusPercent) / 100);
}

export function generateDeviceHash(): string {
  // Simple device fingerprint - in production use more robust method
  const ua = navigator.userAgent;
  const lang = navigator.language;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hash = btoa(`${ua}${lang}${tz}`);
  return hash;
}

export function validateWatchCompletion(watchDuration: number, videoDuration: number): boolean {
  // User must watch at least 30 seconds
  return watchDuration >= 30;
}

export interface AntiBotCheckResult {
  flagged: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
}

export function checkMultiTabFraud(sessionDevices: Map<string, number>): AntiBotCheckResult {
  // Check if same device is claiming rewards in multiple tabs within short time
  if (sessionDevices.size > 3) {
    return {
      flagged: true,
      reason: 'Multiple tabs detected',
      severity: 'high',
    };
  }
  return { flagged: false, severity: 'low' };
}

export function checkRapidClaimFraud(lastClaimTime: number): AntiBotCheckResult {
  // Minimum 5 seconds between claims
  const timeSinceLastClaim = Date.now() - lastClaimTime;
  if (timeSinceLastClaim < 5000) {
    return {
      flagged: true,
      reason: 'Rapid claim detected',
      severity: 'high',
    };
  }
  return { flagged: false, severity: 'low' };
}

export function checkIPChange(currentIP: string, lastIP: string, hoursSinceLastActivity: number): AntiBotCheckResult {
  // Allow IP change if more than 24 hours
  if (currentIP !== lastIP && hoursSinceLastActivity < 24) {
    return {
      flagged: true,
      reason: 'Suspicious IP change',
      severity: 'medium',
    };
  }
  return { flagged: false, severity: 'low' };
}

export function checkDailyEarningLimit(dailyEarnings: number, newReward: number): boolean {
  return (dailyEarnings + newReward) <= REWARD_AMOUNTS.DAILY_EARNING_LIMIT;
}

export function calculateLeaderboardRank(
  userEarnings: number,
  allEarnings: number[]
): number {
  return allEarnings.filter(earning => earning > userEarnings).length + 1;
}

export function formatCoins(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K';
  }
  return amount.toString();
}

export function getRewardEmoji(amount: number): string {
  if (amount >= 100) return '🎊';
  if (amount >= 50) return '⭐';
  if (amount >= 25) return '💫';
  return '✨';
}
