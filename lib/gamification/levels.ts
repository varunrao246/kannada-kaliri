/**
 * Gamification & Learner Motivation Engine — Level Progression Logic
 * Kannada Kaliri — Milestone 09
 */

import type { LearnerLevelInfo } from './types';
import { LEARNER_LEVELS } from './constants';

export function calculateLevelFromXP(totalXP: number): LearnerLevelInfo {
  const xp = Math.max(0, Math.round(totalXP));

  // Find corresponding tier
  let activeLevel = LEARNER_LEVELS[0];
  for (let i = LEARNER_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEARNER_LEVELS[i].minXP) {
      activeLevel = LEARNER_LEVELS[i];
      break;
    }
  }

  const isMaxLevel = activeLevel.maxXP === null;
  let nextLevelXP: number | null = null;
  let xpToNextLevel = 0;
  let progressPercent = 100;

  if (!isMaxLevel) {
    const nextLevel = LEARNER_LEVELS.find((l) => l.levelNumber === activeLevel.levelNumber + 1);
    if (nextLevel) {
      nextLevelXP = nextLevel.minXP;
      xpToNextLevel = Math.max(0, nextLevel.minXP - xp);
      const tierRange = nextLevel.minXP - activeLevel.minXP;
      const currentProgressInTier = xp - activeLevel.minXP;
      progressPercent = Math.min(100, Math.max(0, Math.round((currentProgressInTier / tierRange) * 100)));
    }
  }

  return {
    levelNumber: activeLevel.levelNumber,
    level: activeLevel.levelNumber,
    title: activeLevel.title,
    kannadaTitle: activeLevel.kannadaTitle,
    currentXP: xp,
    minXP: activeLevel.minXP,
    currentLevelMinXP: activeLevel.minXP,
    nextLevelXP,
    xpToNextLevel,
    progressPercent,
    progressPercentage: progressPercent,
    isMaxLevel,
  };
}
