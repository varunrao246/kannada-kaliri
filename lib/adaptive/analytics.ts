/**
 * Adaptive Learning Intelligence Engine — Master Analytics Service
 * Kannada Kaliri — Milestone 08
 *
 * Integrates performance data from all platform touchpoints and derives:
 * - Skill-by-skill deterministic mastery scores
 * - Knowledge gaps with supporting performance evidence
 * - Personalized adaptive recommendations
 * - Learning consistency and trend
 * - Calibrated exercise difficulty
 * - Dynamic learning path
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type {
  LearnerAnalyticsSnapshot,
  SkillMastery,
  LearningConsistencyMetrics,
} from './types';
import {
  computeDeterministicSkillMastery,
  computeOverallMastery,
} from './mastery';
import { detectKnowledgeGaps } from './gaps';
import { generateAdaptiveRecommendations } from './recommendations';
import { calculateAdaptiveDifficulty } from './difficulty';
import { generatePersonalizedLearningPath } from './path';

export async function getLearnerAdaptiveAnalytics(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<LearnerAnalyticsSnapshot> {
  // 1. Fetch relevant performance tables concurrently
  const [
    progressResult,
    assessmentsResult,
    attemptsResult,
    vocabResult,
    activityResult,
    scenarioResult,
  ] = await Promise.all([
    supabase.from('learning_progress').select('*').eq('user_id', userId),
    supabase.from('assessment_results').select('*').eq('user_id', userId).order('completed_at', { ascending: false }),
    supabase.from('exercise_attempts').select('*').eq('user_id', userId).order('attempted_at', { ascending: false }),
    supabase.from('vocabulary_progress').select('*').eq('user_id', userId),
    supabase.from('daily_activity').select('*').eq('user_id', userId).order('activity_date', { ascending: false }).limit(14),
    supabase.from('scenario_attempts').select('*').eq('user_id', userId).order('started_at', { ascending: false }),
  ]);

  const progressRows = progressResult.data || [];
  const assessmentResults = assessmentsResult.data || [];
  const exerciseAttempts = attemptsResult.data || [];
  const vocabRows = vocabResult.data || [];
  const dailyActivities = activityResult.data || [];
  const scenarioAttempts = scenarioResult.data || [];

  // 2. Compute Individual Skill Masteries
  // A. Vocabulary Skill
  const vocabCorrect = vocabRows.reduce((acc, v) => acc + (v.times_correct ?? 0), 0);
  const vocabTotal = vocabRows.reduce((acc, v) => acc + (v.times_seen ?? 0), 0);
  const vocabLastReviewed = vocabRows[0]?.last_reviewed_at || null;
  const vocabularySkill = computeDeterministicSkillMastery({
    skillId: 'skill-vocab',
    name: 'Vocabulary Recall',
    category: 'vocabulary',
    correctCount: vocabCorrect,
    totalAttempts: vocabTotal,
    lastAttemptDate: vocabLastReviewed,
    consecutiveMistakes: vocabRows.filter((v) => v.mastery_status === 'struggling').length,
  });

  // B. Grammar Skill (from fill_in_the_blank and general assessments)
  const grammarAttempts = exerciseAttempts.filter((a) => a.exercise_id.includes('fill') || a.exercise_id.includes('mc'));
  const grammarCorrect = grammarAttempts.filter((a) => a.is_correct).length;
  const grammarSkill = computeDeterministicSkillMastery({
    skillId: 'skill-grammar',
    name: 'Grammar & Inflections',
    category: 'grammar',
    correctCount: grammarCorrect,
    totalAttempts: grammarAttempts.length,
    lastAttemptDate: grammarAttempts[0]?.attempted_at,
    consecutiveMistakes: computeRecentConsecutiveMistakes(grammarAttempts),
  });

  // C. Sentence Construction (SOV Word Order)
  const sentenceAttempts = exerciseAttempts.filter((a) => a.exercise_id.includes('sentence') || a.exercise_id.includes('m03'));
  const sentenceCorrect = sentenceAttempts.filter((a) => a.is_correct).length;
  const sentenceSkill = computeDeterministicSkillMastery({
    skillId: 'skill-sentence',
    name: 'Sentence Construction (SOV)',
    category: 'sentence_construction',
    correctCount: sentenceCorrect,
    totalAttempts: sentenceAttempts.length,
    lastAttemptDate: sentenceAttempts[0]?.attempted_at,
    consecutiveMistakes: computeRecentConsecutiveMistakes(sentenceAttempts),
  });

  // D. Listening Comprehension
  const listenAttempts = exerciseAttempts.filter((a) => a.exercise_id.includes('listen'));
  const listenCorrect = listenAttempts.filter((a) => a.is_correct).length;
  const listeningSkill = computeDeterministicSkillMastery({
    skillId: 'skill-listening',
    name: 'Listening Comprehension',
    category: 'listening',
    correctCount: listenCorrect,
    totalAttempts: listenAttempts.length,
    lastAttemptDate: listenAttempts[0]?.attempted_at,
    consecutiveMistakes: computeRecentConsecutiveMistakes(listenAttempts),
  });

  // E. Conversational Fluency (from Scenarios)
  const completedScenarios = scenarioAttempts.filter((s) => s.status === 'completed');
  const avgScenarioScore =
    completedScenarios.length > 0
      ? Math.round(
          completedScenarios.reduce((sum, s) => sum + (Number(s.confidence_score) || 70), 0) /
            completedScenarios.length
        )
      : 0;

  const conversationSkill: SkillMastery = {
    skillId: 'skill-conversation',
    name: 'Conversational Fluency',
    category: 'conversation',
    score: avgScenarioScore,
    state: avgScenarioScore >= 80 ? 'mastered' : avgScenarioScore >= 60 ? 'proficient' : avgScenarioScore >= 40 ? 'developing' : 'needs_attention',
    sampleCount: completedScenarios.length,
    lastAssessedAt: completedScenarios[0]?.completed_at || null,
    isMeasurable: completedScenarios.length > 0,
    explanation:
      completedScenarios.length > 0
        ? `Average ${avgScenarioScore}% confidence across ${completedScenarios.length} roleplay scenarios.`
        : 'Practise real-world conversation scenarios to measure conversational fluency.',
  };

  const skillMasteries: SkillMastery[] = [
    vocabularySkill,
    grammarSkill,
    sentenceSkill,
    listeningSkill,
    conversationSkill,
  ];

  // 3. Overall Mastery
  const { overallScore, state: masteryState, hasSufficientData } = computeOverallMastery(skillMasteries);

  // 4. Knowledge Gaps
  const knowledgeGaps = detectKnowledgeGaps({
    exerciseAttempts,
    vocabProgress: vocabRows,
    scenarioAttempts,
    skillMasteries,
  });

  // 5. Inactivity Calculation
  let daysSinceLastActivity = 0;
  if (dailyActivities.length > 0) {
    const lastDate = new Date(dailyActivities[0].activity_date).getTime();
    daysSinceLastActivity = Math.max(0, Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24)));
  }

  // 6. Adaptive Recommendations
  const recommendations = generateAdaptiveRecommendations({
    progressRows,
    assessmentResults,
    vocabProgress: vocabRows,
    scenarioAttempts,
    knowledgeGaps,
    daysSinceLastActivity,
  });

  // 7. Learning Consistency & Trend
  const consistency = computeLearningConsistency(dailyActivities, exerciseAttempts);

  // 8. Adaptive Difficulty
  const difficulty = calculateAdaptiveDifficulty(exerciseAttempts);

  // 9. Personalized Learning Path
  const learningPath = generatePersonalizedLearningPath(progressRows, knowledgeGaps);

  return {
    userId,
    overallMastery: overallScore,
    masteryState,
    hasSufficientData,
    totalAssessmentsTaken: assessmentResults.length,
    totalExercisesAttempted: exerciseAttempts.length,
    totalVocabularyTracked: vocabRows.length,
    totalScenariosCompleted: completedScenarios.length,
    skillMasteries,
    knowledgeGaps,
    recommendations,
    learningPath,
    consistency,
    difficulty,
    updatedAt: new Date().toISOString(),
  };
}

function computeRecentConsecutiveMistakes(
  attempts: Database['public']['Tables']['exercise_attempts']['Row'][]
): number {
  let count = 0;
  for (const att of attempts) {
    if (!att.is_correct) count += 1;
    else break;
  }
  return count;
}

function computeLearningConsistency(
  dailyActivities: Database['public']['Tables']['daily_activity']['Row'][],
  exerciseAttempts: Database['public']['Tables']['exercise_attempts']['Row'][]
): LearningConsistencyMetrics {
  if (dailyActivities.length === 0 && exerciseAttempts.length === 0) {
    return {
      streakDays: 0,
      totalMinutesSpent: 0,
      activeDaysLast14: 0,
      consistencyScore: 0,
      trend: 'new_learner',
    };
  }

  const totalMinutes = dailyActivities.reduce((acc, d) => acc + (d.minutes_spent ?? 0), 0);
  const activeDaysLast14 = dailyActivities.length;

  // Consistency score: active days out of 14 * weight + minimum session baseline
  const consistencyScore = Math.min(100, Math.round((activeDaysLast14 / 14) * 100));

  // Determine trend by comparing recent 3 days vs earlier 3 days
  let trend: LearningConsistencyMetrics['trend'] = 'stable';
  if (exerciseAttempts.length >= 6) {
    const recent3 = exerciseAttempts.slice(0, 3).filter((a) => a.is_correct).length;
    const earlier3 = exerciseAttempts.slice(3, 6).filter((a) => a.is_correct).length;
    if (recent3 > earlier3) trend = 'improving';
    else if (recent3 < earlier3) trend = 'declining';
  } else if (exerciseAttempts.length > 0) {
    trend = 'improving';
  }

  return {
    streakDays: activeDaysLast14 > 0 ? Math.min(activeDaysLast14, 7) : 0,
    totalMinutesSpent: totalMinutes,
    activeDaysLast14,
    consistencyScore,
    trend,
  };
}

