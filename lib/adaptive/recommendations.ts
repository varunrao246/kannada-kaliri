/**
 * Adaptive Learning Intelligence Engine — Adaptive Recommendations
 * Kannada Kaliri — Milestone 08
 *
 * Recommends actionable, personalized learning steps based on:
 * - Active in-progress lessons
 * - Detected knowledge gaps
 * - Assessment performance
 * - Inactive retention decay
 */

import type { AdaptiveRecommendation, KnowledgeGap } from './types';
import type { Database } from '@/types/database';
import { getAllLessons } from '@/lib/curriculum';

type LearningProgressRow = Database['public']['Tables']['learning_progress']['Row'];
type AssessmentResultRow = Database['public']['Tables']['assessment_results']['Row'];
type VocabularyProgressRow = Database['public']['Tables']['vocabulary_progress']['Row'];
type ScenarioAttemptRow = Database['public']['Tables']['scenario_attempts']['Row'];

export interface RecommendationInput {
  progressRows: LearningProgressRow[];
  assessmentResults: AssessmentResultRow[];
  vocabProgress: VocabularyProgressRow[];
  scenarioAttempts: ScenarioAttemptRow[];
  knowledgeGaps: KnowledgeGap[];
  daysSinceLastActivity: number;
}

export function generateAdaptiveRecommendations(input: RecommendationInput): AdaptiveRecommendation[] {
  const {
    progressRows,
    assessmentResults,
    vocabProgress,
    scenarioAttempts,
    knowledgeGaps,
    daysSinceLastActivity,
  } = input;

  const recommendations: AdaptiveRecommendation[] = [];
  const allLessons = getAllLessons();

  const completedSet = new Set(
    progressRows.filter((p) => p.status === 'completed').map((p) => p.lesson_id)
  );

  // 1. RULE 1: In-progress lesson (Highest Priority to maintain continuity)
  const inProgress = progressRows.find((p) => p.status === 'in_progress');
  if (inProgress) {
    const lesson = allLessons.find((l) => l.id === inProgress.lesson_id);
    if (lesson) {
      recommendations.push({
        id: `rec-resume-${lesson.id}`,
        type: 'lesson_resume',
        title: `Resume: ${lesson.title}`,
        kannadaTitle: lesson.kannadaTitle,
        description: `Pick up where you left off in ${lesson.title} (${inProgress.completion_percentage || 0}% complete).`,
        reason: 'You have an active unfinished lesson session. Finishing it solidifies your progress.',
        difficulty: 'medium',
        priority: 'urgent',
        estimatedMinutes: 8,
        actionUrl: `/learn/${lesson.id}`,
        ctaText: 'Resume Lesson',
      });
    }
  }

  // 1.5 RULE 1.5: Brand new learner (Cold Start)
  if (completedSet.size === 0 && !inProgress && allLessons.length > 0) {
    const firstLesson = allLessons[0];
    recommendations.push({
      id: `rec-next-${firstLesson.id}`,
      type: 'lesson_next',
      title: `Begin: ${firstLesson.title}`,
      kannadaTitle: firstLesson.kannadaTitle,
      description: firstLesson.description || 'Start with Kannada Foundations to learn essential sounds and greetings.',
      reason: 'Start with Kannada Foundations to learn essential sounds and polite greetings.',
      difficulty: 'medium',
      priority: 'urgent',
      estimatedMinutes: firstLesson.estimatedMinutes || 10,
      actionUrl: `/learn/${firstLesson.id}`,
      ctaText: 'Start Lesson 1',
    });
  }

  // 2. RULE 2: Targeted Practice for Urgent/High Knowledge Gaps
  const topGap = knowledgeGaps[0];
  if (topGap && (topGap.priority === 'urgent' || topGap.priority === 'high')) {
    recommendations.push({
      id: `rec-gap-${topGap.id}`,
      type: 'exercise_targeted',
      title: `Reinforce: ${topGap.topic}`,
      description: topGap.recommendedAction,
      reason: `Identified gap: ${topGap.evidence} (Current mastery: ${topGap.currentMastery}%).`,
      difficulty: topGap.currentMastery < 40 ? 'easy' : 'medium',
      priority: 'high',
      estimatedMinutes: 5,
      actionUrl: topGap.actionUrl,
      ctaText: 'Targeted Practice',
    });

    // Also suggest asking Guru if it is a grammatical topic
    if (topGap.category === 'grammar' || topGap.category === 'sentence_construction') {
      recommendations.push({
        id: `rec-guru-${topGap.id}`,
        type: 'guru_consult',
        title: `Ask Guru: ${topGap.topic}`,
        description: `Get a personalized multilingual explanation of ${topGap.topic} from your AI Kannada Guru.`,
        reason: 'Speaking with Guru will clarify the underlying grammatical rule in your native language.',
        difficulty: 'easy',
        priority: 'medium',
        estimatedMinutes: 4,
        actionUrl: '/guru',
        ctaText: 'Consult Guru',
      });
    }
  }

  // 3. RULE 3: Low Assessment Score Revision (< 70%)
  const lowScores = assessmentResults.filter(
    (a) => a.score_percentage !== null && Number(a.score_percentage) < 70
  );
  if (lowScores.length > 0) {
    const latestLow = lowScores[0];
    const lesson = allLessons.find((l) => l.id === latestLow.lesson_id);
    if (lesson && !recommendations.some((r) => r.actionUrl.includes(lesson.id))) {
      recommendations.push({
        id: `rec-revise-${lesson.id}`,
        type: 'lesson_revise',
        title: `Revise: ${lesson.title}`,
        kannadaTitle: lesson.kannadaTitle,
        description: `Retake exercises in ${lesson.title} to improve your ${latestLow.score_percentage}% score.`,
        reason: 'Mastering prerequisite lessons ensures you do not struggle in future modules.',
        difficulty: 'medium',
        priority: 'high',
        estimatedMinutes: 6,
        actionUrl: `/learn/${lesson.id}`,
        ctaText: 'Revise Lesson',
      });
    }
  }

  // 4. RULE 4: Vocabulary Needing Practice
  const strugglingVocab = vocabProgress.filter(
    (v) => v.mastery_status === 'struggling' || (v.times_incorrect ?? 0) > (v.times_correct ?? 0)
  );
  if (strugglingVocab.length >= 2 && !recommendations.some((r) => r.type === 'vocab_practice')) {
    recommendations.push({
      id: 'rec-vocab-practice',
      type: 'vocab_practice',
      title: 'Vocabulary Revision Drill',
      description: `Practise ${strugglingVocab.length} words that need reinforcement to strengthen your recall.`,
      reason: 'Regular spaced retrieval ensures new Kannada vocabulary moves to permanent memory.',
      difficulty: 'easy',
      priority: 'medium',
      estimatedMinutes: 5,
      actionUrl: '/learn#vocab',
      ctaText: 'Review Vocabulary',
    });
  }

  // 5. RULE 5: Inactivity Refresh (> 5 days)
  if (daysSinceLastActivity >= 5 && progressRows.length > 0 && !recommendations.some((r) => r.type === 'review_mastered')) {
    recommendations.push({
      id: 'rec-inactivity-refresh',
      type: 'review_mastered',
      title: 'Quick Welcome-Back Review',
      description: 'Refresh your memory with a fast 5-minute review of fundamental Kannada phrases.',
      reason: `It has been ${daysSinceLastActivity} days since your last session. A quick refresher restores learning momentum.`,
      difficulty: 'easy',
      priority: 'medium',
      estimatedMinutes: 5,
      actionUrl: '/learn',
      ctaText: 'Quick Review',
    });
  }

  // 6. RULE 6: Real-World Conversation Simulator (Available after at least 1 lesson completed)
  const completedScenariosCount = scenarioAttempts.filter((s) => s.status === 'completed').length;
  if (completedSet.size >= 1 && completedScenariosCount < 3 && !recommendations.some((r) => r.type === 'scenario_roleplay')) {
    recommendations.push({
      id: 'rec-scenario-darshini',
      type: 'scenario_roleplay',
      title: 'Roleplay: Ordering at a Darshini',
      kannadaTitle: 'ಹೋಟೆಲ್ / ದರ್ಶಿನಿಯಲ್ಲಿ ತಿಂಡಿ',
      description: 'Put your classroom Kannada to the test by ordering food with our lively Darshini cashier.',
      reason: 'Conversational roleplay bridges the gap between structured lessons and real-world spoken fluency.',
      difficulty: 'medium',
      priority: 'medium',
      estimatedMinutes: 5,
      actionUrl: '/scenarios/restaurant-darshini',
      ctaText: 'Start Roleplay',
    });
  }

  // 7. RULE 7: Progress to Next Lesson in Sequence
  const nextLesson = allLessons.find((l) => !completedSet.has(l.id));

  if (nextLesson && !recommendations.some((r) => r.actionUrl.includes(nextLesson.id))) {
    const isFirstEver = completedSet.size === 0 && !inProgress;
    recommendations.push({
      id: `rec-next-${nextLesson.id}`,
      type: 'lesson_next',
      title: isFirstEver ? `Begin: ${nextLesson.title}` : `Next Up: ${nextLesson.title}`,
      kannadaTitle: nextLesson.kannadaTitle,
      description: nextLesson.description || 'Continue your structured Kannada learning curriculum.',
      reason: isFirstEver
        ? 'Start with Kannada Foundations to learn essential sounds and polite greetings.'
        : 'You have satisfied the prerequisites for this next lesson.',
      difficulty: 'medium',
      priority: isFirstEver ? 'urgent' : 'high',
      estimatedMinutes: nextLesson.estimatedMinutes || 10,
      actionUrl: `/learn/${nextLesson.id}`,
      ctaText: isFirstEver ? 'Start Lesson 1' : 'Next Lesson',
    });
  }

  // Limit to top 4 recommendations
  return recommendations.slice(0, 4);
}
