/**
 * Adaptive Learning Intelligence Engine — Deterministic Mastery Scoring
 * Kannada Kaliri — Milestone 08
 *
 * Transparent, explainable scoring methodology based on:
 * - Accuracy (% correct)
 * - Sample volume (damping factor to prevent false 100% from 1 lucky answer)
 * - Recency decay (knowledge retention over time)
 * - Repeated mistake penalty
 */

import type { MasteryState, SkillMastery, SkillCategory } from './types';

export const MASTERY_THRESHOLDS = {
  NEEDS_ATTENTION_MAX: 39,
  DEVELOPING_MAX: 59,
  PROFICIENT_MAX: 79,
  MASTERED_MIN: 80,
} as const;

export function resolveMasteryState(score: number): MasteryState {
  if (score >= MASTERY_THRESHOLDS.MASTERED_MIN) return 'mastered';
  if (score > MASTERY_THRESHOLDS.DEVELOPING_MAX) return 'proficient';
  if (score > MASTERY_THRESHOLDS.NEEDS_ATTENTION_MAX) return 'developing';
  return 'needs_attention';
}

export interface SkillComputationInput {
  skillId: string;
  name: string;
  category: SkillCategory;
  correctCount: number;
  totalAttempts: number;
  lastAttemptDate?: string | null;
  consecutiveMistakes?: number;
}

/**
 * Calculates a 0-100 mastery score with confidence damping and recency adjustment
 */
export function computeDeterministicSkillMastery(input: SkillComputationInput): SkillMastery {
  const { skillId, name, category, correctCount, totalAttempts, lastAttemptDate, consecutiveMistakes = 0 } = input;

  if (totalAttempts <= 0) {
    return {
      skillId,
      name,
      category,
      score: 0,
      state: 'needs_attention',
      sampleCount: 0,
      lastAssessedAt: null,
      isMeasurable: false,
      explanation: 'No activity recorded yet for this skill area.',
    };
  }

  // 1. Raw Accuracy (0 - 100)
  const rawAccuracy = (correctCount / totalAttempts) * 100;

  // 2. Sample Volume Damping: Minimum 3 attempts needed for full confidence
  // 1 attempt = 0.35 weight; 2 attempts = 0.70 weight; >= 3 attempts = 1.0 weight
  const confidenceDamping = Math.min(1.0, Math.max(0.35, totalAttempts / 3));

  // 3. Recency factor based on days since last activity
  let recencyFactor = 1.0;
  if (lastAttemptDate) {
    const daysSince = Math.max(0, (Date.now() - new Date(lastAttemptDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) recencyFactor = 0.75;
    else if (daysSince > 14) recencyFactor = 0.85;
    else if (daysSince > 7) recencyFactor = 0.95;
  }

  // 4. Repeated mistake penalty
  const mistakePenalty = Math.min(25, consecutiveMistakes * 6);

  // 5. Final deterministic score
  const finalScore = Math.round(
    Math.min(100, Math.max(0, rawAccuracy * confidenceDamping * recencyFactor - mistakePenalty))
  );

  const state = resolveMasteryState(finalScore);

  let explanation = `${correctCount} of ${totalAttempts} attempts correct (${Math.round(rawAccuracy)}% accuracy).`;
  if (confidenceDamping < 1.0) {
    explanation += ' Preliminary score damped pending more practice repetitions.';
  }
  if (consecutiveMistakes >= 2) {
    explanation += ` Penalty applied for ${consecutiveMistakes} consecutive mistakes.`;
  }

  return {
    skillId,
    name,
    category,
    score: finalScore,
    state,
    sampleCount: totalAttempts,
    lastAssessedAt: lastAttemptDate || null,
    isMeasurable: true,
    explanation,
  };
}

/**
 * Calculates overall mastery across measurable skills with dynamic weight normalization
 */
export function computeOverallMastery(skills: SkillMastery[]): {
  overallScore: number;
  state: MasteryState;
  hasSufficientData: boolean;
} {
  const measurable = skills.filter((s) => s.isMeasurable);

  if (measurable.length === 0) {
    return {
      overallScore: 0,
      state: 'needs_attention',
      hasSufficientData: false,
    };
  }

  // Preset weights per category
  const categoryWeights: Record<SkillCategory, number> = {
    vocabulary: 25,
    grammar: 25,
    sentence_construction: 25,
    listening: 15,
    conversation: 10,
  };

  let totalWeightedScore = 0;
  let totalAssignedWeight = 0;

  for (const skill of measurable) {
    const weight = categoryWeights[skill.category] || 20;
    totalWeightedScore += skill.score * weight;
    totalAssignedWeight += weight;
  }

  const normalizedScore =
    totalAssignedWeight > 0 ? Math.round(totalWeightedScore / totalAssignedWeight) : 0;

  return {
    overallScore: Math.min(100, Math.max(0, normalizedScore)),
    state: resolveMasteryState(normalizedScore),
    hasSufficientData: measurable.some((s) => s.sampleCount >= 2),
  };
}

