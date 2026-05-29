// Achievement & Badge System - Gamification rewards

export type AchievementId = 
  | 'first_watch'
  | 'hour_marathon'
  | 'daily_streak_7'
  | 'daily_streak_30'
  | 'coins_100'
  | 'coins_1000'
  | 'coins_10000'
  | 'first_referral'
  | 'referral_5'
  | 'referral_20'
  | 'all_tasks_complete'
  | 'leaderboard_top_10';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
  reward: number;
}

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  totalUnlocked: number;
  rewardsClaimed: number;
}

export const ACHIEVEMENT_CONFIG: Record<AchievementId, Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>> = {
  first_watch: {
    id: 'first_watch',
    title: 'First Watch',
    description: 'Watch your first video channel',
    icon: '📺',
    target: 1,
    reward: 25,
  },
  hour_marathon: {
    id: 'hour_marathon',
    title: 'Hour Marathon',
    description: 'Watch for 1 hour continuously',
    icon: '🏃',
    target: 3600,
    reward: 150,
  },
  daily_streak_7: {
    id: 'daily_streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day login streak',
    icon: '🔥',
    target: 7,
    reward: 200,
  },
  daily_streak_30: {
    id: 'daily_streak_30',
    title: 'Month Master',
    description: 'Maintain a 30-day login streak',
    icon: '👑',
    target: 30,
    reward: 1000,
  },
  coins_100: {
    id: 'coins_100',
    title: 'Century Club',
    description: 'Earn 100 coins',
    icon: '💰',
    target: 100,
    reward: 50,
  },
  coins_1000: {
    id: 'coins_1000',
    title: 'Thousand Tier',
    description: 'Earn 1,000 coins',
    icon: '💎',
    target: 1000,
    reward: 500,
  },
  coins_10000: {
    id: 'coins_10000',
    title: 'Diamond Whale',
    description: 'Earn 10,000 coins',
    icon: '👑',
    target: 10000,
    reward: 5000,
  },
  first_referral: {
    id: 'first_referral',
    title: 'First Friend',
    description: 'Refer your first friend',
    icon: '👥',
    target: 1,
    reward: 100,
  },
  referral_5: {
    id: 'referral_5',
    title: 'Influencer',
    description: 'Refer 5 friends',
    icon: '⭐',
    target: 5,
    reward: 500,
  },
  referral_20: {
    id: 'referral_20',
    title: 'Network King',
    description: 'Refer 20 friends',
    icon: '🌍',
    target: 20,
    reward: 2000,
  },
  all_tasks_complete: {
    id: 'all_tasks_complete',
    title: 'Task Master',
    description: 'Complete all daily tasks',
    icon: '✅',
    target: 1,
    reward: 300,
  },
  leaderboard_top_10: {
    id: 'leaderboard_top_10',
    title: 'Top 10',
    description: 'Reach top 10 in global leaderboard',
    icon: '🏆',
    target: 1,
    reward: 1000,
  },
};

export function initializeAchievements(userId: string): UserAchievements {
  return {
    userId,
    achievements: Object.values(ACHIEVEMENT_CONFIG).map((config) => ({
      ...config,
      unlocked: false,
      progress: 0,
    })),
    totalUnlocked: 0,
    rewardsClaimed: 0,
  };
}

export function checkAchievementProgress(
  achievements: UserAchievements,
  trigger: AchievementId,
  currentProgress: number,
): Achievement | null {
  const achievement = achievements.achievements.find((a) => a.id === trigger);
  if (!achievement || achievement.unlocked) return null;

  achievement.progress = currentProgress;

  if (currentProgress >= achievement.target) {
    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
    achievements.totalUnlocked += 1;
    return achievement;
  }

  return null;
}

export function getAchievementReward(id: AchievementId): number {
  return ACHIEVEMENT_CONFIG[id]?.reward || 0;
}

export function getUnlockedAchievements(achievements: UserAchievements): Achievement[] {
  return achievements.achievements.filter((a) => a.unlocked);
}

export function getAchievementProgress(achievements: UserAchievements): number {
  const unlocked = achievements.achievements.filter((a) => a.unlocked).length;
  return (unlocked / achievements.achievements.length) * 100;
}

export function saveAchievements(userId: string, achievements: UserAchievements): void {
  localStorage.setItem(`achievements_${userId}`, JSON.stringify(achievements));
}

export function loadAchievements(userId: string): UserAchievements {
  const saved = localStorage.getItem(`achievements_${userId}`);
  if (!saved) return initializeAchievements(userId);
  
  try {
    return JSON.parse(saved);
  } catch {
    return initializeAchievements(userId);
  }
}

export const ACHIEVEMENT_MILESTONES = [
  { coins: 100, title: 'Century', icon: '💰' },
  { coins: 500, title: 'Legendary', icon: '⭐' },
  { coins: 1000, title: 'Epic', icon: '🔥' },
  { coins: 5000, title: 'Mythic', icon: '👑' },
  { coins: 10000, title: 'Diamond', icon: '💎' },
] as const;
