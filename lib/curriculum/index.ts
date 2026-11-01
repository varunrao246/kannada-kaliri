/**
 * Kannada Curriculum Engine - Master Aggregator
 * Kannada Kaliri — Milestone 03
 */

import type { Course, Module, Lesson } from '@/types/curriculum';
import { module01 } from './a1/module-01';
import { module02 } from './a1/module-02';
import { module03 } from './a1/module-03';
import { module04 } from './a1/module-04';
import { module05 } from './a1/module-05';

export const A1_MODULES: Module[] = [
  module01,
  module02,
  module03,
  module04,
  module05,
];

export const COURSES: Course[] = [
  {
    id: 'course-a1-beginner',
    title: 'A1: Spoken Kannada Foundations',
    kannadaTitle: 'ಕನ್ನಡ ಅಡಿಪಾಯ - ಹಂತ A1',
    description:
      'Master the sounds of Kannada, everyday vocabulary, essential questions, restaurant ordering, and Bangalore auto conversations from absolute zero.',
    languageCode: 'kn',
    level: 'A1',
    displayOrder: 1,
    isPublished: true,
  },
  {
    id: 'course-a2-elementary',
    title: 'A2: Everyday Fluency & Contexts',
    kannadaTitle: 'ದೈನಂದಿನ ಮಾತುಕತೆ - ಹಂತ A2',
    description:
      'Expand into past and future tense dialogues, market bargaining, hospital visits, landlord discussions, and cultural festivals.',
    languageCode: 'kn',
    level: 'A2',
    displayOrder: 2,
    isPublished: false, // Planned
  },
  {
    id: 'course-b1-intermediate',
    title: 'B1: Professional & Cultural Mastery',
    kannadaTitle: 'ವೃತ್ತಿಪರ ಹಾಗೂ ಸಾಹಿತ್ಯಿಕ ಕನ್ನಡ - ಹಂತ B1',
    description:
      'Engage in complex workplace negotiations, express nuanced opinions, and understand classic Vachanas, poems, and cinema.',
    languageCode: 'kn',
    level: 'B1',
    displayOrder: 3,
    isPublished: false, // Planned
  },
];

/**
 * Return all lessons in a flat ordered array across all A1 modules
 */
export function getAllLessons(): Lesson[] {
  const all: Lesson[] = [];
  for (const mod of A1_MODULES) {
    if (mod.lessons) {
      all.push(...mod.lessons);
    }
  }
  return all;
}

/**
 * Look up a lesson by its unique slug/id
 */
export function getLessonById(lessonId: string): (Lesson & { module: Module }) | null {
  for (const mod of A1_MODULES) {
    if (mod.lessons) {
      const found = mod.lessons.find((l) => l.id === lessonId);
      if (found) {
        return { ...found, module: mod };
      }
    }
  }
  return null;
}

/**
 * Look up a module by id
 */
export function getModuleById(moduleId: string): Module | null {
  return A1_MODULES.find((m) => m.id === moduleId) || null;
}

