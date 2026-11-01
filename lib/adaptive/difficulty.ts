/**
 * Adaptive Learning Intelligence Engine — Exercise Difficulty Calibration
 * Kannada Kaliri — Milestone 08
 *
 * Dynamically computes exercise difficulty for assessment sessions:
 * - Easy: Foundational questions with maximum hints
 * - Medium: Standard balanced practice
 * - Hard: Advanced challenges with minimal guidance
 */

import type { AdaptiveDifficultyState } from './types';
import type { Database } from '@/types/database';

type ExerciseAttemptRow = Database['public']['Tables']['exercise_attempts']['Row'];

export function calculateAdaptiveDifficulty(
  recentAttempts: ExerciseAttemptRow[]
): AdaptiveDifficultyState {
  if (recentAttempts.length === 0) {
    return {
      currentLevel: 'medium',
      accuracyRecent: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      explanation: 'Default balanced difficulty for new session.',
    };
  }

  // Look at up to the last 8 attempts, newest first
  const sorted = [...recentAttempts].sort(
    (a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
  ).slice(0, 8);

  const correctCount = sorted.filter((a) => a.is_correct).length;
  const accuracyRecent = Math.round((correctCount / sorted.length) * 100);

  // Compute consecutive streaks starting from the most recent
  let consecutiveCorrect = 0;
  for (const att of sorted) {
    if (att.is_correct) consecutiveCorrect += 1;
    else break;
  }

  let consecutiveIncorrect = 0;
  for (const att of sorted) {
    if (!att.is_correct) consecutiveIncorrect += 1;
    else break;
  }

  // 1. HARD DIFFICULTY RULE:
  // Requires at least 4 attempts, >= 80% accuracy, and at least 3 consecutive correct
  if (sorted.length >= 4 && accuracyRecent >= 80 && consecutiveCorrect >= 3) {
    return {
      currentLevel: 'hard',
      accuracyRecent,
      consecutiveCorrect,
      consecutiveIncorrect,
      explanation: `Promoted to Hard difficulty: ${accuracyRecent}% accuracy with ${consecutiveCorrect} consecutive correct answers.`,
    };
  }

  // 2. EASY DIFFICULTY RULE:
  // Triggered if consecutive mistakes >= 2 or recent accuracy < 60% with at least 3 attempts
  if (consecutiveIncorrect >= 2 || (sorted.length >= 3 && accuracyRecent < 60)) {
    return {
      currentLevel: 'easy',
      accuracyRecent,
      consecutiveCorrect,
      consecutiveIncorrect,
      explanation: `Calibrated to Easy difficulty: providing guided hints after ${consecutiveIncorrect} mistakes to rebuild confidence.`,
    };
  }

  // 3. BALANCED / MEDIUM DEFAULT:
  return {
    currentLevel: 'medium',
    accuracyRecent,
    consecutiveCorrect,
    consecutiveIncorrect,
    explanation: `Balanced Medium difficulty: calibrated to your ${accuracyRecent}% recent practice accuracy.`,
  };
}

