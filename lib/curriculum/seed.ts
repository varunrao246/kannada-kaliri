/**
 * Repeatable Idempotent Curriculum Seeder
 * Kannada Kaliri — Milestone 03
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { COURSES, A1_MODULES } from './index';

export type CurriculumSupabaseClient = SupabaseClient<Database>;

export interface SeedResult {
  coursesSeeded: number;
  modulesSeeded: number;
  lessonsSeeded: number;
  errors: string[];
}

/**
 * Seed all A1 modules and lessons idempotently into Supabase
 */
export async function seedCurriculum(
  supabase: CurriculumSupabaseClient
): Promise<SeedResult> {
  const result: SeedResult = {
    coursesSeeded: 0,
    modulesSeeded: 0,
    lessonsSeeded: 0,
    errors: [],
  };

  try {
    // 1. Seed Courses
    for (const course of COURSES) {
      const { error: courseErr } = await supabase.from('courses').upsert(
        {
          id: course.id,
          title: course.title,
          kannada_title: course.kannadaTitle || null,
          description: course.description,
          language_code: course.languageCode,
          level: course.level,
          display_order: course.displayOrder,
          is_published: course.isPublished,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (courseErr) {
        result.errors.push(`Course ${course.id}: ${courseErr.message}`);
      } else {
        result.coursesSeeded++;
      }
    }

    // 2. Seed Modules & Lessons
    for (const mod of A1_MODULES) {
      const { error: modErr } = await supabase.from('modules').upsert(
        {
          id: mod.id,
          course_id: mod.courseId,
          title: mod.title,
          kannada_title: mod.kannadaTitle || null,
          description: mod.description,
          display_order: mod.displayOrder,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (modErr) {
        result.errors.push(`Module ${mod.id}: ${modErr.message}`);
        continue;
      }
      result.modulesSeeded++;

      if (mod.lessons) {
        for (const lesson of mod.lessons) {
          const { error: lessonErr } = await supabase.from('lessons').upsert(
            {
              id: lesson.id,
              module_id: lesson.moduleId,
              title: lesson.title,
              kannada_title: lesson.kannadaTitle || null,
              description: lesson.description,
              estimated_minutes: lesson.estimatedMinutes,
              display_order: lesson.displayOrder,
              lesson_content: lesson.content as unknown as Database['public']['Tables']['lessons']['Insert']['lesson_content'],
              is_published: lesson.isPublished,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

          if (lessonErr) {
            result.errors.push(`Lesson ${lesson.id}: ${lessonErr.message}`);
          } else {
            result.lessonsSeeded++;
          }
        }
      }
    }
  } catch (err) {
    result.errors.push(`Fatal seed error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

