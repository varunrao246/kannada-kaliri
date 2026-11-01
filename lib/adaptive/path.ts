/**
 * Adaptive Learning Intelligence Engine — Personalized Learning Path
 * Kannada Kaliri — Milestone 08
 *
 * Dynamically builds a personalized progression path taking into account:
 * - Completed lessons & milestones
 * - Active in-progress lessons
 * - Recommended next step
 * - Prerequisite sequencing
 */

import type { LearningPathStep, KnowledgeGap } from './types';
import type { Database } from '@/types/database';
import { getAllLessons } from '@/lib/curriculum';

type LearningProgressRow = Database['public']['Tables']['learning_progress']['Row'];

export function generatePersonalizedLearningPath(
  progressRows: LearningProgressRow[],
  knowledgeGaps: KnowledgeGap[]
): LearningPathStep[] {
  const allLessons = getAllLessons();
  const progressMap = new Map<string, LearningProgressRow>();
  for (const p of progressRows) {
    progressMap.set(p.lesson_id, p);
  }

  const steps: LearningPathStep[] = [];
  let foundRecommended = false;

  for (let idx = 0; idx < allLessons.length; idx++) {
    const lesson = allLessons[idx];
    const progress = progressMap.get(lesson.id);
    const stepNumber = idx + 1;

    let status: LearningPathStep['status'] = 'upcoming';
    let reason = 'Curriculum prerequisite to be unlocked.';

    if (progress?.status === 'completed') {
      status = 'completed';
      reason = 'Mastered lesson concepts and completed assessment.';
    } else if (progress?.status === 'in_progress') {
      status = 'in_progress';
      reason = `In progress (${progress.completion_percentage || 0}%). Finish to advance.`;
    } else if (!foundRecommended) {
      status = 'recommended';
      const gap = knowledgeGaps.find((g) => g.relatedLessonId === lesson.id);
      if (gap) {
        reason = `Recommended step: addresses detected gap in ${gap.topic}.`;
      } else {
        reason = 'Recommended next curriculum milestone based on your current proficiency.';
      }
      foundRecommended = true;
    }

    steps.push({
      stepNumber,
      title: lesson.title,
      kannadaTitle: lesson.kannadaTitle,
      status,
      type: 'lesson',
      reason,
      targetId: lesson.id,
      actionUrl: `/learn/${lesson.id}`,
    });
  }

  return steps;
}
