/**
 * AI Kannada Guru — Learner Context Generator
 * Kannada Kaliri — Milestone 06
 *
 * Assembles real, personalized learner context from Supabase tables:
 * - learner_profiles
 * - learning_progress
 * - assessment_results
 * - exercise_attempts
 * - vocabulary_progress
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { LearnerTutoringContext } from './types';
import type { NativeLanguage } from '@/types/profile';
import { getAllLessons } from '@/lib/curriculum';
import { getExerciseById } from '@/lib/exercises';

const NATIVE_LANGUAGE_NAMES: Record<string, { label: string; script: string }> = {
  en: { label: 'English', script: 'English' },
  hi: { label: 'Hindi', script: 'हिन्दी' },
  ta: { label: 'Tamil', script: 'தமிழ்' },
  te: { label: 'Telugu', script: 'తెలుగు' },
  ml: { label: 'Malayalam', script: 'മലയാളം' },
};

export async function buildLearnerTutoringContext(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<LearnerTutoringContext> {
  const allLessons = getAllLessons();

  // 1. Fetch learner profile
  const { data: profile } = await supabase
    .from('learner_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const nativeLanguage = (profile?.native_language || 'en') as NativeLanguage;
  const nativeLanguageName =
    NATIVE_LANGUAGE_NAMES[nativeLanguage]?.label || 'English';

  // 2. Fetch learning progress to find current lesson & completion count
  const { data: progressRows } = await supabase
    .from('learning_progress')
    .select('lesson_id, status, completion_percentage, updated_at')
    .eq('user_id', userId);

  const completedLessonsCount =
    progressRows?.filter((r) => r.status === 'completed').length || 0;

  // Find active or next lesson
  let currentLessonTitle = 'Lesson 1: Common Greetings (ನಮಸ್ಕಾರ)';
  const inProgress = progressRows?.find((r) => r.status === 'in_progress');
  if (inProgress) {
    const matched = allLessons.find((l) => l.id === inProgress.lesson_id);
    if (matched) {
      currentLessonTitle = `${matched.title} (${matched.kannadaTitle || ''})`;
    }
  } else if (completedLessonsCount > 0) {
    const completedSet = new Set(
      progressRows?.filter((r) => r.status === 'completed').map((r) => r.lesson_id)
    );
    const nextLesson = allLessons.find((l) => !completedSet.has(l.id));
    if (nextLesson) {
      currentLessonTitle = `${nextLesson.title} (${nextLesson.kannadaTitle || ''})`;
    }
  }

  // 3. Fetch recent assessment score
  const { data: recentAssessments } = await supabase
    .from('assessment_results')
    .select('score_percentage, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1);

  const recentAssessmentScore =
    recentAssessments && recentAssessments.length > 0
      ? recentAssessments[0].score_percentage
      : null;

  // 4. Fetch recent incorrect exercise attempts to find struggling concepts
  const { data: recentMistakes } = await supabase
    .from('exercise_attempts')
    .select('exercise_id, is_correct, attempted_at')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .order('attempted_at', { ascending: false })
    .limit(10);

  const strugglingTypes = new Set<string>();
  if (recentMistakes) {
    for (const m of recentMistakes) {
      const exercise = getExerciseById(m.exercise_id);
      if (exercise) {
        if (exercise.type === 'sentence_construction') {
          strugglingTypes.add('Sentence Word Order (SOV)');
        } else if (exercise.type === 'fill_in_the_blank') {
          strugglingTypes.add('Missing Verb/Noun Endings');
        } else if (exercise.type === 'listening_comprehension') {
          strugglingTypes.add('Spoken Kannada Listening');
        } else if (exercise.type === 'word_matching' || exercise.type === 'vocabulary_recall') {
          strugglingTypes.add('Vocabulary Recall');
        }
      }
    }
  }

  // 5. Fetch vocabulary needing revision
  const { data: vocabRows } = await supabase
    .from('vocabulary_progress')
    .select('vocabulary_id, mastery_status, times_incorrect, updated_at')
    .eq('user_id', userId)
    .in('mastery_status', ['learning', 'struggling'])
    .order('updated_at', { ascending: false })
    .limit(5);

  const wordsNeedingRevision =
    vocabRows?.map((v) => `Word ID: ${v.vocabulary_id} (Status: ${v.mastery_status})`) || [];

  // 6. Fetch Adaptive Engine Summary
  let overallMastery: number | undefined;
  let masteryState: string | undefined;
  let topKnowledgeGaps: string[] | undefined;
  let adaptiveRecommendationsSummary: string[] | undefined;

  try {
    const { getLearnerAdaptiveAnalytics } = await import('@/lib/adaptive/analytics');
    const analytics = await getLearnerAdaptiveAnalytics(userId, supabase);
    overallMastery = analytics.overallMastery;
    masteryState = analytics.masteryState;
    topKnowledgeGaps = analytics.knowledgeGaps.slice(0, 3).map((g) => `${g.topic} (${g.evidence})`);
    adaptiveRecommendationsSummary = analytics.recommendations.map((r) => `${r.title}: ${r.reason}`);
  } catch {
    // Graceful fallback if adaptive engine is loading
  }

  return {
    learnerName: profile?.full_name || 'Learner',
    nativeLanguage,
    nativeLanguageName,
    proficiencyLevel: profile?.proficiency_level || 'beginner',
    learningGoals: profile?.learning_goals || ['Daily Conversation'],
    dailyGoalMinutes: profile?.daily_goal_minutes || 10,
    currentLessonTitle,
    completedLessonsCount,
    recentAssessmentScore,
    strugglingConcepts: Array.from(strugglingTypes),
    wordsNeedingRevision,
    overallMastery,
    masteryState,
    topKnowledgeGaps,
    adaptiveRecommendationsSummary,
  };
}
