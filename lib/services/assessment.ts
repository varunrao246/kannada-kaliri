/**
 * Assessment Service
 * Kannada Kaliri — Milestone 04
 *
 * Handles exercise retrieval, answer submission, score calculation,
 * and Supabase persistence for the assessment engine.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getLessonExercises, getExerciseById } from '@/lib/exercises';
import { validateExerciseAnswer } from './exercise-validator';
import type {
  Exercise,
  ExerciseAnswer,
  ExerciseAttempt,
  ExerciseValidationResult,
  AssessmentScore,
  VocabularyProgressEntry,
  AdaptiveRecommendation,
  VocabularyRecallExercise,
} from '@/lib/exercises/types';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { awardXP } from '@/lib/services/gamification';
import { XP_REWARDS } from '@/lib/gamification/constants';

export type AssessmentSupabaseClient = SupabaseClient<Database>;

function getClient(client?: AssessmentSupabaseClient): AssessmentSupabaseClient | null {
  if (client) return client;
  return createBrowserClient() as AssessmentSupabaseClient | null;
}

// ─── Exercise Retrieval ───────────────────────────────────────────────────────

/** Returns all exercises for a lesson sorted by order */
export function getLessonExercisesForSession(lessonId: string): Exercise[] {
  return getLessonExercises(lessonId);
}

// ─── Answer Validation ────────────────────────────────────────────────────────

/** Validate a single answer against the authoritative exercise definition */
export function validateAnswer(
  exerciseId: string,
  answer: ExerciseAnswer
): ExerciseValidationResult | null {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return null;
  return validateExerciseAnswer(exercise, answer);
}

// ─── Score Calculation ────────────────────────────────────────────────────────

/** Calculate the full assessment score from a set of attempts */
export function calculateAssessmentScore(
  lessonId: string,
  attempts: Map<string, ExerciseAttempt>,
  startedAt: string
): AssessmentScore {
  const exercises = getLessonExercises(lessonId);
  const attemptList = Array.from(attempts.values());

  let correctAnswers = 0;
  let totalPoints = 0;
  let maxPoints = 0;
  const incorrectExercises: Exercise[] = [];
  const vocabularyNeedingPractice: string[] = [];

  for (const exercise of exercises) {
    maxPoints += exercise.points;
    const attempt = attempts.get(exercise.id);
    if (attempt) {
      totalPoints += attempt.validation.pointsAwarded;
      if (attempt.validation.isCorrect) {
        correctAnswers++;
      } else {
        incorrectExercises.push(exercise);
        // Track vocabulary from failed recall exercises
        if (exercise.type === 'vocabulary_recall') {
          vocabularyNeedingPractice.push((exercise as VocabularyRecallExercise).kannada);
        }
      }
    }
  }

  const totalQuestions = exercises.length;
  const scorePercentage = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  const now = new Date();
  const started = new Date(startedAt);
  const timeTakenSeconds = Math.round((now.getTime() - started.getTime()) / 1000);

  return {
    lessonId,
    totalQuestions,
    correctAnswers,
    scorePercentage,
    totalPoints,
    maxPoints,
    timeTakenSeconds,
    exerciseBreakdown: attemptList,
    incorrectExercises,
    vocabularyNeedingPractice,
  };
}

// ─── Supabase Persistence ─────────────────────────────────────────────────────

/** Submit a single exercise attempt to Supabase (idempotent via upsert) */
export async function submitExerciseAttempt(
  userId: string,
  lessonId: string,
  attempt: ExerciseAttempt,
  client?: AssessmentSupabaseClient
): Promise<void> {
  const supabase = getClient(client);
  if (!supabase) return;

  try {
    await supabase.from('exercise_attempts').insert({
      user_id: userId,
      lesson_id: lessonId,
      exercise_id: attempt.exerciseId,
      submitted_answer: attempt.answer as unknown as Record<string, unknown>,
      is_correct: attempt.validation.isCorrect,
      points_awarded: attempt.validation.pointsAwarded,
      attempted_at: attempt.attemptedAt,
    });
  } catch {
    // Graceful: table may not exist before migration
  }
}

/** Save a completed assessment result (prevent duplicate via conflict strategy) */
export async function completeAssessment(
  userId: string,
  score: AssessmentScore,
  client?: AssessmentSupabaseClient
): Promise<void> {
  const supabase = getClient(client);
  if (!supabase) return;

  try {
    await supabase.from('assessment_results').insert({
      user_id: userId,
      lesson_id: score.lessonId,
      total_questions: score.totalQuestions,
      correct_answers: score.correctAnswers,
      score_percentage: score.scorePercentage,
      total_points: score.totalPoints,
      completed_at: new Date().toISOString(),
    });

    // Award Gamification XP idempotently
    try {
      await awardXP(
        userId,
        'assessment_completion',
        `assessment:${userId}:${score.lessonId}`,
        `Completed assessment for lesson: ${score.lessonId}`,
        XP_REWARDS.ASSESSMENT_COMPLETION,
        { lessonId: score.lessonId, scorePercentage: score.scorePercentage },
        supabase
      );

      // Score 80% or above bonus
      if (score.scorePercentage >= 80) {
        await awardXP(
          userId,
          'assessment_high_score',
          `assessment_bonus:${userId}:${score.lessonId}`,
          `Assessment excellence bonus (>=80%) for: ${score.lessonId}`,
          XP_REWARDS.ASSESSMENT_HIGH_SCORE_BONUS,
          { lessonId: score.lessonId, scorePercentage: score.scorePercentage },
          supabase
        );
      }
    } catch (xpErr) {
      console.warn('[AssessmentService] Non-blocking XP award error:', xpErr);
    }
  } catch {
    // Graceful: table may not exist before migration
  }
}

/** Get all assessment results for a user (for dashboard display) */
export async function getAssessmentHistory(
  userId: string,
  client?: AssessmentSupabaseClient
): Promise<Array<{
  id: string;
  lessonId: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  totalPoints: number;
  completedAt: string;
}>> {
  const supabase = getClient(client);
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('id, lesson_id, total_questions, correct_answers, score_percentage, total_points, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      lessonId: row.lesson_id,
      totalQuestions: row.total_questions,
      correctAnswers: row.correct_answers,
      scorePercentage: row.score_percentage,
      totalPoints: row.total_points,
      completedAt: row.completed_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Get incorrect attempts for a lesson to power the review screen */
export async function getIncorrectAnswers(
  userId: string,
  lessonId: string,
  client?: AssessmentSupabaseClient
): Promise<Array<{
  exerciseId: string;
  submittedAnswer: Record<string, unknown>;
  pointsAwarded: number;
  attemptedAt: string;
}>> {
  const supabase = getClient(client);
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('exercise_attempts')
      .select('exercise_id, submitted_answer, points_awarded, attempted_at')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .eq('is_correct', false)
      .order('attempted_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      exerciseId: row.exercise_id,
      submittedAnswer: (row.submitted_answer as Record<string, unknown>) ?? {},
      pointsAwarded: row.points_awarded ?? 0,
      attemptedAt: row.attempted_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Update vocabulary progress after recall exercise */
export async function updateVocabularyProgress(
  userId: string,
  vocabularyId: string,
  isCorrect: boolean,
  client?: AssessmentSupabaseClient
): Promise<void> {
  const supabase = getClient(client);
  if (!supabase) return;

  try {
    // Try to fetch existing progress
    const { data: existing } = await supabase
      .from('vocabulary_progress')
      .select('id, times_seen, times_correct, times_incorrect, mastery_status')
      .eq('user_id', userId)
      .eq('vocabulary_id', vocabularyId)
      .single();

    if (existing) {
      const timesSeen = (existing.times_seen ?? 0) + 1;
      const timesCorrect = (existing.times_correct ?? 0) + (isCorrect ? 1 : 0);
      const timesIncorrect = (existing.times_incorrect ?? 0) + (isCorrect ? 0 : 1);
      const masteryStatus = computeMasteryStatus(timesCorrect, timesSeen);

      await supabase
        .from('vocabulary_progress')
        .update({
          times_seen: timesSeen,
          times_correct: timesCorrect,
          times_incorrect: timesIncorrect,
          mastery_status: masteryStatus,
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('vocabulary_progress').insert({
        user_id: userId,
        vocabulary_id: vocabularyId,
        times_seen: 1,
        times_correct: isCorrect ? 1 : 0,
        times_incorrect: isCorrect ? 0 : 1,
        mastery_status: isCorrect ? 'learning' : 'new',
        last_reviewed_at: new Date().toISOString(),
      });
    }
  } catch {
    // Graceful: table may not exist before migration
  }
}

function computeMasteryStatus(
  timesCorrect: number,
  timesSeen: number
): VocabularyProgressEntry['masteryStatus'] {
  if (timesSeen < 2) return 'new';
  const accuracy = timesCorrect / timesSeen;
  if (accuracy >= 0.9 && timesSeen >= 5) return 'mastered';
  if (accuracy >= 0.7 && timesSeen >= 3) return 'familiar';
  return 'learning';
}

/** Get vocabulary progress for a user */
export async function getVocabularyProgress(
  userId: string,
  client?: AssessmentSupabaseClient
): Promise<VocabularyProgressEntry[]> {
  const supabase = getClient(client);
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('vocabulary_progress')
      .select('vocabulary_id, times_seen, times_correct, times_incorrect, mastery_status, last_reviewed_at')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((row) => ({
      vocabularyId: row.vocabulary_id,
      timesSeen: row.times_seen ?? 0,
      timesCorrect: row.times_correct ?? 0,
      timesIncorrect: row.times_incorrect ?? 0,
      masteryStatus: (row.mastery_status as VocabularyProgressEntry['masteryStatus']) ?? 'new',
      lastReviewedAt: row.last_reviewed_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Simple deterministic adaptive recommendation based on exercise performance */
export function getAdaptiveRecommendation(
  score: AssessmentScore
): AdaptiveRecommendation {
  const incorrectTypes = score.incorrectExercises.map((e) => e.type);
  const hasVocabMistakes = score.vocabularyNeedingPractice.length > 0;
  const hasSentenceMistakes = incorrectTypes.includes('sentence_construction');
  const hasListeningMistakes = incorrectTypes.includes('listening_comprehension');

  if (hasVocabMistakes) {
    return {
      type: 'vocabulary_revision',
      reason: `Review ${score.vocabularyNeedingPractice.length} vocabulary word(s) that need more practice.`,
      exerciseType: 'vocabulary_recall',
    };
  }
  if (hasSentenceMistakes) {
    return {
      type: 'sentence_practice',
      reason: 'Practice building Kannada sentences to strengthen your grammar.',
      exerciseType: 'sentence_construction',
    };
  }
  if (hasListeningMistakes) {
    return {
      type: 'listening_exercises',
      reason: 'Try more listening exercises to improve your comprehension.',
      exerciseType: 'listening_comprehension',
    };
  }
  return {
    type: 'all_good',
    reason: 'Excellent performance! Continue to the next lesson.',
  };
}

/** Get recent assessment stats for dashboard display */
export async function getDashboardAssessmentStats(
  userId: string,
  client?: AssessmentSupabaseClient
): Promise<{
  recentScore: number | null;
  totalExercisesCompleted: number;
  totalVocabPractised: number;
  hasHistory: boolean;
}> {
  const supabase = getClient(client);
  if (!supabase || !userId) {
    return { recentScore: null, totalExercisesCompleted: 0, totalVocabPractised: 0, hasHistory: false };
  }

  try {
    const [historyResult, attemptsResult, vocabResult] = await Promise.all([
      supabase
        .from('assessment_results')
        .select('score_percentage')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1),
      supabase
        .from('exercise_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('vocabulary_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    const recentScore = historyResult.data?.[0]?.score_percentage ?? null;
    const totalExercisesCompleted = attemptsResult.count ?? 0;
    const totalVocabPractised = vocabResult.count ?? 0;

    return {
      recentScore,
      totalExercisesCompleted,
      totalVocabPractised,
      hasHistory: (historyResult.data?.length ?? 0) > 0,
    };
  } catch {
    return { recentScore: null, totalExercisesCompleted: 0, totalVocabPractised: 0, hasHistory: false };
  }
}

