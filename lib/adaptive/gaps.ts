/**
 * Adaptive Learning Intelligence Engine — Knowledge Gap Detection
 * Kannada Kaliri — Milestone 08
 *
 * Discovers real, evidence-backed knowledge gaps from:
 * - exercise_attempts
 * - vocabulary_progress
 * - scenario_attempts
 *
 * Never fabricates weaknesses.
 */

import type { KnowledgeGap, KnowledgeGapPriority, SkillMastery } from './types';
import type { Database } from '@/types/database';

type ExerciseAttemptRow = Database['public']['Tables']['exercise_attempts']['Row'];
type VocabularyProgressRow = Database['public']['Tables']['vocabulary_progress']['Row'];
type ScenarioAttemptRow = Database['public']['Tables']['scenario_attempts']['Row'];

export interface GapDetectionInput {
  exerciseAttempts: ExerciseAttemptRow[];
  vocabProgress: VocabularyProgressRow[];
  scenarioAttempts: ScenarioAttemptRow[];
  skillMasteries: SkillMastery[];
}

export function detectKnowledgeGaps(input: GapDetectionInput): KnowledgeGap[] {
  const { exerciseAttempts, vocabProgress, scenarioAttempts, skillMasteries } = input;
  const gaps: KnowledgeGap[] = [];

  // Helper to find computed skill score
  const getSkillScore = (cat: string) =>
    skillMasteries.find((s) => s.category === cat)?.score ?? 50;

  // 1. Analyze Sentence Construction & Word Order (SOV)
  const sentenceAttempts = exerciseAttempts.filter((a) =>
    a.exercise_id.includes('sentence') || a.exercise_id.includes('m03')
  );
  const sentenceWrong = sentenceAttempts.filter((a) => !a.is_correct);

  if (sentenceWrong.length >= 2) {
    const mastery = getSkillScore('sentence_construction');
    const priority: KnowledgeGapPriority =
      sentenceWrong.length >= 3 && mastery < 40 ? 'urgent' : mastery < 55 ? 'high' : 'medium';

    gaps.push({
      id: 'gap-sov-word-order',
      topic: 'Sentence Word Order (SOV)',
      category: 'sentence_construction',
      currentMastery: mastery,
      evidence: `Recorded ${sentenceWrong.length} incorrect sentence ordering attempts out of ${sentenceAttempts.length}.`,
      recommendedAction:
        'Reinforce Kannada Subject-Object-Verb structure: Subject + Object + Verb at the end.',
      priority,
      relatedLessonId: sentenceWrong[0]?.lesson_id || 'm03-l01',
      relatedExerciseType: 'sentence_construction',
      actionUrl: `/learn/${sentenceWrong[0]?.lesson_id || 'm03-l01'}`,
    });
  }

  // 2. Analyze Fill in the Blanks / Verb & Noun Suffixes
  const fillAttempts = exerciseAttempts.filter((a) =>
    a.exercise_id.includes('fill')
  );
  const fillWrong = fillAttempts.filter((a) => !a.is_correct);

  if (fillWrong.length >= 2) {
    const mastery = getSkillScore('grammar');
    const priority: KnowledgeGapPriority =
      fillWrong.length >= 3 && mastery < 40 ? 'urgent' : mastery < 55 ? 'high' : 'medium';

    gaps.push({
      id: 'gap-verb-suffixes',
      topic: 'Verb Endings & Noun Suffixes',
      category: 'grammar',
      currentMastery: mastery,
      evidence: `Struggled with ${fillWrong.length} fill-in-the-blank inflection exercises.`,
      recommendedAction:
        'Practise polite imperative endings like "-ಕೊಡಿ" (kodi) and present continuous "-ಇದ್ದೇನೆ" (iddēne).',
      priority,
      relatedLessonId: fillWrong[0]?.lesson_id || 'm02-l02',
      relatedExerciseType: 'fill_in_the_blank',
      actionUrl: `/learn/${fillWrong[0]?.lesson_id || 'm02-l02'}`,
    });
  }

  // 3. Analyze Listening Comprehension
  const listenAttempts = exerciseAttempts.filter((a) =>
    a.exercise_id.includes('listen')
  );
  const listenWrong = listenAttempts.filter((a) => !a.is_correct);

  if (listenWrong.length >= 2) {
    const mastery = getSkillScore('listening');
    gaps.push({
      id: 'gap-listening-discrimination',
      topic: 'Spoken Kannada Listening Comprehension',
      category: 'listening',
      currentMastery: mastery,
      evidence: `${listenWrong.length} listening questions answered incorrectly.`,
      recommendedAction:
        'Listen to audio lessons repeatedly to discern short vs long Kannada vowels (ಅ vs ಆ).',
      priority: mastery < 45 ? 'high' : 'medium',
      relatedLessonId: listenWrong[0]?.lesson_id || 'm01-l03',
      relatedExerciseType: 'listening_comprehension',
      actionUrl: `/learn/${listenWrong[0]?.lesson_id || 'm01-l03'}`,
    });
  }

  // 4. Analyze Vocabulary Retention
  const strugglingVocab = vocabProgress.filter(
    (v) => v.mastery_status === 'struggling' || (v.times_incorrect ?? 0) > (v.times_correct ?? 0)
  );

  if (strugglingVocab.length >= 2) {
    const mastery = getSkillScore('vocabulary');
    gaps.push({
      id: 'gap-vocab-retention',
      topic: 'Everyday Vocabulary Recall',
      category: 'vocabulary',
      currentMastery: mastery,
      evidence: `${strugglingVocab.length} vocabulary words marked as struggling with high error rate.`,
      recommendedAction:
        'Review flashcards and recall exercises for high-frequency daily items.',
      priority: strugglingVocab.length >= 4 ? 'high' : 'medium',
      actionUrl: '/learn#vocab',
    });
  }

  // 5. Analyze Real-World Conversation Confidence
  const completedScenarios = scenarioAttempts.filter((s) => s.status === 'completed');
  const lowConfidenceScenarios = completedScenarios.filter(
    (s) => s.confidence_score !== null && Number(s.confidence_score) < 65
  );

  if (lowConfidenceScenarios.length >= 1) {
    const mastery = getSkillScore('conversation');
    gaps.push({
      id: 'gap-scenario-confidence',
      topic: 'Conversational Fluency in Real Scenarios',
      category: 'conversation',
      currentMastery: mastery,
      evidence: `Recorded confidence score below 65% in recent scenario attempt (${lowConfidenceScenarios[0].scenario_id}).`,
      recommendedAction:
        'Practise beginner conversation scenarios like ordering at a Darshini or buying groceries.',
      priority: 'medium',
      actionUrl: `/scenarios/${lowConfidenceScenarios[0].scenario_id}`,
    });
  }

  // Sort by priority (urgent -> high -> medium -> low)
  const priorityWeight: Record<KnowledgeGapPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return gaps.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
}

