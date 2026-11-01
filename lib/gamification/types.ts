/**
 * Gamification & Learner Motivation Engine — Domain Types
 * Kannada Kaliri — Milestone 09
 */

export type XPActivityType =
  | 'lesson_completion'
  | 'assessment_completion'
  | 'assessment_high_score'
  | 'scenario_completion'
  | 'daily_challenge'
  | 'vocab_revision';

export interface XPTransaction {
  id: string;
  userId: string;
  activityType: XPActivityType;
  idempotencyKey: string;
  xpAmount: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface LearnerLevelInfo {
  levelNumber: number;
  level: number;
  title: string;
  kannadaTitle: string;
  currentXP: number;
  minXP: number;
  currentLevelMinXP: number;
  nextLevelXP: number | null; // null for max level
  xpToNextLevel: number;
  progressPercent: number; // 0 to 100
  progressPercentage: number;
  isMaxLevel: boolean;
}

export interface StreakDayActivity {
  date: string;
  dayName: string;
  dayLabel: string;
  dayLabelKannada: string;
  hasActivity: boolean;
  isActive: boolean;
  isToday: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  activityLast7Days: StreakDayActivity[];
  last7Days: StreakDayActivity[];
}

export type AchievementCategory = 'milestones' | 'consistency' | 'speaking' | 'mastery';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementBadge {
  id: string;
  name: string;
  title: string;
  kannadaName: string;
  kannadaTitle: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  isUnlocked: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  progressPercent: number; // 0 to 100 toward unlocking
}

export type ChallengeType =
  | 'learn_words'
  | 'complete_lesson'
  | 'build_sentences'
  | 'complete_scenario'
  | 'revise_weak_topic'
  | 'lesson_completion'
  | 'assessment_mastery'
  | 'scenario_practice'
  | 'vocabulary_review';

export interface DailyChallenge {
  id: string;
  title: string;
  kannadaTitle: string;
  description: string;
  type: ChallengeType;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  isCompleted: boolean;
  isClaimed: boolean;
  actionUrl?: string;
  expiresAt?: string;
  claimedAt?: string;
}

export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  levelNumber: number;
  level: number;
  levelTitle: string;
  xp: number;
  totalXP: number;
  isCurrentUser: boolean;
  isAnonymous?: boolean;
}

export interface LeaderboardPreference {
  userId: string;
  optIn: boolean;
  isAnonymous: boolean;
}

export interface GamificationSummary {
  userId: string;
  totalXP: number;
  level: LearnerLevelInfo;
  levelInfo: LearnerLevelInfo;
  streak: StreakStats;
  achievements: AchievementBadge[];
  badges: AchievementBadge[];
  unlockedAchievementsCount: number;
  dailyChallenges: DailyChallenge[];
  recentTransactions: XPTransaction[];
  leaderboardOptIn: boolean;
  isAnonymous: boolean;
  leaderboardPreference: LeaderboardPreference;
}
