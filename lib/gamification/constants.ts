/**
 * Gamification & Learner Motivation Engine — Constants & Definitions
 * Kannada Kaliri — Milestone 09
 */

import type { AchievementBadge } from './types';

export const XP_REWARDS = {
  LESSON_COMPLETION: 20,
  ASSESSMENT_COMPLETION: 15,
  ASSESSMENT_HIGH_SCORE_BONUS: 10, // awarded when score >= 80%
  ASSESSMENT_EXCELLENCE_BONUS: 10,
  SCENARIO_COMPLETION: 25,
  DAILY_CHALLENGE: 30,
  VOCAB_REVISION: 10,
} as const;

export interface LevelConfig {
  levelNumber: number;
  title: string;
  kannadaTitle: string;
  minXP: number;
  maxXP: number | null; // null for max level
}

export const LEARNER_LEVELS: LevelConfig[] = [
  {
    levelNumber: 1,
    title: 'Kannada Explorer',
    kannadaTitle: 'ಕನ್ನಡ ಅನ್ವೇಷಕ',
    minXP: 0,
    maxXP: 99,
  },
  {
    levelNumber: 2,
    title: 'Kannada Beginner',
    kannadaTitle: 'ಕನ್ನಡ ಆರಂಭಿಕ',
    minXP: 100,
    maxXP: 249,
  },
  {
    levelNumber: 3,
    title: 'Kannada Learner',
    kannadaTitle: 'ಕನ್ನಡ ಕಲಿಯುವವ',
    minXP: 250,
    maxXP: 499,
  },
  {
    levelNumber: 4,
    title: 'Kannada Speaker',
    kannadaTitle: 'ಕನ್ನಡ ಭಾಷಿಗ',
    minXP: 500,
    maxXP: 899,
  },
  {
    levelNumber: 5,
    title: 'Kannada Conversationalist',
    kannadaTitle: 'ಕನ್ನಡ ಸಂಭಾಷಣಕಾರ',
    minXP: 900,
    maxXP: 1499,
  },
  {
    levelNumber: 6,
    title: 'Kannada Fluent Learner',
    kannadaTitle: 'ಪ್ರವೀಣ ಕಲಿ',
    minXP: 1500,
    maxXP: 2499,
  },
  {
    levelNumber: 7,
    title: 'Karnataka Connect Champion',
    kannadaTitle: 'ಕರ್ನಾಟಕ ಸಂಪರ್ಕ ವಿಜಯಿ',
    minXP: 2500,
    maxXP: null,
  },
];

export type AchievementDefinition = Omit<
  AchievementBadge,
  'isUnlocked' | 'unlocked' | 'unlockedAt' | 'progressPercent'
>;

export const ALL_ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Learning Milestones
  {
    id: 'first_lesson',
    name: 'First Step in Kannada',
    title: 'First Step in Kannada',
    kannadaName: 'ಕನ್ನಡದ ಮೊದಲ ಹೆಜ್ಜೆ',
    kannadaTitle: 'ಕನ್ನಡದ ಮೊದಲ ಹೆಜ್ಜೆ',
    description: 'Complete your first structured Kannada lesson.',
    category: 'milestones',
    rarity: 'common',
    icon: '🌱',
    xpReward: 20,
  },
  {
    id: 'first_assessment',
    name: 'Quiz Pioneer',
    title: 'Quiz Pioneer',
    kannadaName: 'ಪರೀಕ್ಷಾ ಚತುರ',
    kannadaTitle: 'ಪರೀಕ್ಷಾ ಚತುರ',
    description: 'Take and submit your first interactive assessment.',
    category: 'milestones',
    rarity: 'common',
    icon: '📝',
    xpReward: 15,
  },
  {
    id: 'five_lessons',
    name: 'Foundation Builder',
    title: 'Foundation Builder',
    kannadaName: 'ಅಡಿಪಾಯ ನಿರ್ಮಾತೃ',
    kannadaTitle: 'ಅಡಿಪಾಯ ನಿರ್ಮಾತೃ',
    description: 'Complete 5 structured A1 lessons across the curriculum.',
    category: 'milestones',
    rarity: 'rare',
    icon: '🏛️',
    xpReward: 50,
  },
  {
    id: 'all_a1_lessons',
    name: 'A1 Kannada Master',
    title: 'A1 Kannada Master',
    kannadaName: 'A1 ಪೂರ್ಣ ವಿಜಯಿ',
    kannadaTitle: 'A1 ಪೂರ್ಣ ವಿಜಯಿ',
    description: 'Complete all 15 lessons across all 5 A1 curriculum modules.',
    category: 'milestones',
    rarity: 'legendary',
    icon: '👑',
    xpReward: 150,
  },

  // Consistency & Streaks
  {
    id: 'streak_3',
    name: 'Hat-Trick Learner',
    title: 'Hat-Trick Learner',
    kannadaName: 'ಮೂರು ದಿನದ ಹ್ಯಾಟ್ರಿಕ್',
    kannadaTitle: 'ಮೂರು ದಿನದ ಹ್ಯಾಟ್ರಿಕ್',
    description: 'Maintain a 3-day continuous learning streak.',
    category: 'consistency',
    rarity: 'common',
    icon: '🔥',
    xpReward: 25,
  },
  {
    id: 'streak_7',
    name: 'Weekly Warrior',
    title: 'Weekly Warrior',
    kannadaName: 'ವಾರದ ವೀರ',
    kannadaTitle: 'ವಾರದ ವೀರ',
    description: 'Achieve a full 7-day uninterrupted learning streak.',
    category: 'consistency',
    rarity: 'rare',
    icon: '⚡',
    xpReward: 70,
  },
  {
    id: 'streak_30',
    name: 'Habit of Mysore',
    title: 'Habit of Mysore',
    kannadaName: 'ಮೈಸೂರಿನ ಅಭ್ಯಾಸ',
    kannadaTitle: 'ಮೈಸೂರಿನ ಅಭ್ಯಾಸ',
    description: 'Dedicate 30 consecutive days to mastering Kannada.',
    category: 'consistency',
    rarity: 'legendary',
    icon: '🏆',
    xpReward: 300,
  },

  // Real-world Speaking & Scenarios
  {
    id: 'first_scenario',
    name: 'Namma Dialect',
    title: 'Namma Dialect',
    kannadaName: 'ನಮ್ಮ ಮಾತು',
    kannadaTitle: 'ನಮ್ಮ ಮಾತು',
    description: 'Complete your first real-world conversation simulator roleplay.',
    category: 'speaking',
    rarity: 'common',
    icon: '🗣️',
    xpReward: 25,
  },
  {
    id: 'three_scenarios',
    name: 'City Navigator',
    title: 'City Navigator',
    kannadaName: 'ನಗರ ಸಂಚಾರಿ',
    kannadaTitle: 'ನಗರ ಸಂಚಾರಿ',
    description: 'Successfully complete 3 different realistic conversation scenarios.',
    category: 'speaking',
    rarity: 'rare',
    icon: '🧭',
    xpReward: 60,
  },
  {
    id: 'eight_scenarios',
    name: 'Karnataka Connect',
    title: 'Karnataka Connect',
    kannadaName: 'ಕರ್ನಾಟಕ ಸಂಪರ್ಕ ರಾಯಭಾರಿ',
    kannadaTitle: 'ಕರ್ನಾಟಕ ಸಂಪರ್ಕ ರಾಯಭಾರಿ',
    description: 'Complete all 8 realistic scenarios across Bengaluru & Mysuru.',
    category: 'speaking',
    rarity: 'epic',
    icon: '🗺️',
    xpReward: 150,
  },

  // Mastery
  {
    id: 'first_skill_mastered',
    name: 'Skill Master',
    title: 'Skill Master',
    kannadaName: 'ಕೌಶಲ್ಯ ನಿಪುಣ',
    kannadaTitle: 'ಕೌಶಲ್ಯ ನಿಪುಣ',
    description: 'Reach 80%+ mastery in any core language skill.',
    category: 'mastery',
    rarity: 'rare',
    icon: '🎯',
    xpReward: 40,
  },
  {
    id: 'three_skills_mastered',
    name: 'Triple Mastery',
    title: 'Triple Mastery',
    kannadaName: 'ತ್ರಿವಳಿ ನಿಪುಣ',
    kannadaTitle: 'ತ್ರಿವಳಿ ನಿಪುಣ',
    description: 'Reach 80%+ mastery across 3 core language skills simultaneously.',
    category: 'mastery',
    rarity: 'epic',
    icon: '🏆',
    xpReward: 100,
  },
  {
    id: 'perfect_score',
    name: 'Centum Scholar',
    title: 'Centum Scholar',
    kannadaName: 'ಶತಕವೀರ',
    kannadaTitle: 'ಶತಕವೀರ',
    description: 'Score 100% accuracy on any lesson assessment.',
    category: 'mastery',
    rarity: 'rare',
    icon: '💯',
    xpReward: 35,
  },
];

export const ACHIEVEMENTS_CATALOG: AchievementBadge[] = ALL_ACHIEVEMENT_DEFINITIONS.map(
  (def) => ({
    ...def,
    isUnlocked: false,
    unlocked: false,
    unlockedAt: null,
    progressPercent: 0,
  })
);

export function getAchievementById(id: string): AchievementBadge | undefined {
  return ACHIEVEMENTS_CATALOG.find((b) => b.id === id);
}
