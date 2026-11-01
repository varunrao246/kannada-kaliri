/**
 * Adaptive Learning Intelligence Engine — Domain Types
 * Kannada Kaliri — Milestone 08
 */

import type { ExerciseDifficulty, ExerciseType } from '@/lib/exercises/types';

export type MasteryState = 'needs_attention' | 'developing' | 'proficient' | 'mastered';

export type SkillCategory =
  | 'vocabulary'
  | 'grammar'
  | 'sentence_construction'
  | 'listening'
  | 'conversation';

export interface SkillMastery {
  skillId: string;
  name: string;
  category: SkillCategory;
  score: number; // 0 to 100
  state: MasteryState;
  sampleCount: number;
  lastAssessedAt: string | null;
  isMeasurable: boolean;
  explanation: string;
}

export type KnowledgeGapPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface KnowledgeGap {
  id: string;
  topic: string;
  category: SkillCategory;
  currentMastery: number; // 0 to 100
  evidence: string;
  recommendedAction: string;
  priority: KnowledgeGapPriority;
  relatedLessonId?: string;
  relatedExerciseType?: ExerciseType;
  actionUrl: string;
}

export type RecommendationType =
  | 'lesson_resume'
  | 'lesson_next'
  | 'lesson_revise'
  | 'exercise_targeted'
  | 'vocab_practice'
  | 'guru_consult'
  | 'scenario_roleplay'
  | 'review_mastered';

export interface AdaptiveRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  kannadaTitle?: string;
  description: string;
  reason: string;
  difficulty: ExerciseDifficulty;
  priority: KnowledgeGapPriority;
  estimatedMinutes: number;
  actionUrl: string;
  ctaText: string;
}

export interface LearningPathStep {
  stepNumber: number;
  title: string;
  kannadaTitle?: string;
  status: 'completed' | 'in_progress' | 'recommended' | 'upcoming';
  type: 'lesson' | 'assessment' | 'scenario' | 'milestone';
  reason: string;
  targetId: string;
  actionUrl: string;
}

export interface LearningConsistencyMetrics {
  streakDays: number;
  totalMinutesSpent: number;
  activeDaysLast14: number;
  consistencyScore: number; // 0 to 100
  trend: 'improving' | 'stable' | 'declining' | 'new_learner';
}

export interface AdaptiveDifficultyState {
  currentLevel: ExerciseDifficulty;
  accuracyRecent: number; // 0 to 100
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  explanation: string;
}

export interface LearnerAnalyticsSnapshot {
  userId: string;
  overallMastery: number; // 0 to 100
  masteryState: MasteryState;
  hasSufficientData: boolean;
  totalAssessmentsTaken: number;
  totalExercisesAttempted: number;
  totalVocabularyTracked: number;
  totalScenariosCompleted: number;
  skillMasteries: SkillMastery[];
  knowledgeGaps: KnowledgeGap[];
  recommendations: AdaptiveRecommendation[];
  learningPath: LearningPathStep[];
  consistency: LearningConsistencyMetrics;
  difficulty: AdaptiveDifficultyState;
  updatedAt: string;
}

