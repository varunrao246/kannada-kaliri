/**
 * Gamification & Learner Motivation Engine — Achievement Evaluation
 * Kannada Kaliri — Milestone 09
 *
 * Evaluates real evidence across platform tables to unlock badges.
 */

import type { AchievementBadge } from './types';
import { ALL_ACHIEVEMENT_DEFINITIONS } from './constants';

export interface AchievementEvaluationData {
  completedLessonsCount: number;
  assessmentCount?: number;
  assessmentResults?: Array<{ scorePercentage: number }>;
  hasPerfectAssessment?: boolean;
  currentStreak: number;
  longestStreak?: number;
  completedScenariosCount: number;
  masteredSkillsCount?: number;
  totalExercisesAttempted?: number;
  guruConversationsCount?: number;
  totalXP?: number;
  unlockedAchievementIds?: string[];
  unlockedMap?: Map<string, string>; // badgeId -> unlockedAt
}

export function evaluateAchievements(data: AchievementEvaluationData): AchievementBadge[] {
  const {
    completedLessonsCount,
    assessmentCount = data.assessmentResults ? data.assessmentResults.length : 0,
    hasPerfectAssessment = Boolean(
      data.hasPerfectAssessment ||
      data.assessmentResults?.some((a) => a.scorePercentage >= 100)
    ),
    currentStreak,
    longestStreak = currentStreak,
    completedScenariosCount,
    masteredSkillsCount = 0,
    unlockedMap = new Map(),
    unlockedAchievementIds = [],
  } = data;

  // Build a lookup map of previously unlocked
  const unlockedLookup = new Map<string, string>(unlockedMap);
  unlockedAchievementIds.forEach((id) => {
    if (!unlockedLookup.has(id)) {
      unlockedLookup.set(id, new Date().toISOString());
    }
  });

  const maxStreak = Math.max(currentStreak, longestStreak);

  return ALL_ACHIEVEMENT_DEFINITIONS.map((def) => {
    let isUnlocked = false;
    let progressPercent = 0;

    switch (def.id) {
      case 'first_lesson':
        isUnlocked = completedLessonsCount >= 1;
        progressPercent = Math.min(100, (completedLessonsCount / 1) * 100);
        break;
      case 'first_assessment':
        isUnlocked = assessmentCount >= 1;
        progressPercent = Math.min(100, (assessmentCount / 1) * 100);
        break;
      case 'five_lessons':
        isUnlocked = completedLessonsCount >= 5;
        progressPercent = Math.min(100, Math.round((completedLessonsCount / 5) * 100));
        break;
      case 'all_a1_lessons':
        isUnlocked = completedLessonsCount >= 15;
        progressPercent = Math.min(100, Math.round((completedLessonsCount / 15) * 100));
        break;
      case 'streak_3':
        isUnlocked = maxStreak >= 3;
        progressPercent = Math.min(100, Math.round((maxStreak / 3) * 100));
        break;
      case 'streak_7':
        isUnlocked = maxStreak >= 7;
        progressPercent = Math.min(100, Math.round((maxStreak / 7) * 100));
        break;
      case 'streak_30':
        isUnlocked = maxStreak >= 30;
        progressPercent = Math.min(100, Math.round((maxStreak / 30) * 100));
        break;
      case 'first_scenario':
        isUnlocked = completedScenariosCount >= 1;
        progressPercent = Math.min(100, (completedScenariosCount / 1) * 100);
        break;
      case 'three_scenarios':
        isUnlocked = completedScenariosCount >= 3;
        progressPercent = Math.min(100, Math.round((completedScenariosCount / 3) * 100));
        break;
      case 'eight_scenarios':
        isUnlocked = completedScenariosCount >= 8;
        progressPercent = Math.min(100, Math.round((completedScenariosCount / 8) * 100));
        break;
      case 'first_skill_mastered':
        isUnlocked = masteredSkillsCount >= 1;
        progressPercent = Math.min(100, (masteredSkillsCount / 1) * 100);
        break;
      case 'three_skills_mastered':
        isUnlocked = masteredSkillsCount >= 3;
        progressPercent = Math.min(100, Math.round((masteredSkillsCount / 3) * 100));
        break;
      case 'perfect_score':
        isUnlocked = hasPerfectAssessment;
        progressPercent = hasPerfectAssessment ? 100 : 0;
        break;
      default:
        isUnlocked = false;
        progressPercent = 0;
    }

    const previouslyUnlockedAt = unlockedLookup.get(def.id) || null;
    const finalUnlocked = isUnlocked || Boolean(previouslyUnlockedAt);
    const unlockedAt = previouslyUnlockedAt || (isUnlocked ? new Date().toISOString() : null);

    return {
      ...def,
      isUnlocked: finalUnlocked,
      unlocked: finalUnlocked,
      unlockedAt,
      progressPercent: finalUnlocked ? 100 : progressPercent,
    };
  });
}

export function getNewlyUnlockedAchievementIds(data: AchievementEvaluationData): string[] {
  const allBadges = evaluateAchievements(data);
  const previouslyUnlocked = new Set(
    data.unlockedAchievementIds ||
    (data.unlockedMap ? Array.from(data.unlockedMap.keys()) : [])
  );
  return allBadges
    .filter((b) => b.isUnlocked && !previouslyUnlocked.has(b.id))
    .map((b) => b.id);
}
