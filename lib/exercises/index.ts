/**
 * Exercise Registry — Master Aggregator
 * Kannada Kaliri — Milestone 04
 *
 * Central lookup: lessonId → exercises[]
 */

import type { Exercise, LessonExerciseSet } from './types';
import { module01Exercises } from './module-01';
import { module02Exercises } from './module-02';
import { module03Exercises, module04Exercises, module05Exercises } from './module-03-05';

const ALL_EXERCISE_SETS: LessonExerciseSet[] = [
  ...module01Exercises,
  ...module02Exercises,
  ...module03Exercises,
  ...module04Exercises,
  ...module05Exercises,
];

/** Map of lessonId → sorted exercises for O(1) lookup */
const EXERCISE_MAP = new Map<string, Exercise[]>();
for (const set of ALL_EXERCISE_SETS) {
  EXERCISE_MAP.set(set.lessonId, [...set.exercises].sort((a, b) => a.order - b.order));
}

/**
 * Get all exercises for a given lesson, sorted by order.
 * Returns an empty array if the lesson has no exercises yet.
 */
export function getLessonExercises(lessonId: string): Exercise[] {
  return EXERCISE_MAP.get(lessonId) ?? [];
}

/**
 * Get a single exercise by id across all lessons.
 */
export function getExerciseById(exerciseId: string): Exercise | null {
  for (const exercises of EXERCISE_MAP.values()) {
    const found = exercises.find((e) => e.id === exerciseId);
    if (found) return found;
  }
  return null;
}

/**
 * Get total exercise count across all A1 curriculum lessons.
 */
export function getTotalExerciseCount(): number {
  let count = 0;
  for (const exercises of EXERCISE_MAP.values()) {
    count += exercises.length;
  }
  return count;
}

/**
 * Get total lessons with exercises.
 */
export function getLessonsWithExercises(): string[] {
  return Array.from(EXERCISE_MAP.keys());
}

export { ALL_EXERCISE_SETS };
export type { Exercise, LessonExerciseSet };

