/**
 * Learning Progress & Curriculum Service
 * Kannada Kaliri — Milestone 03
 *
 * Provides typed operations for curriculum retrieval, lesson tracking,
 * daily goal calculation, streak computation, and skills overview.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  COURSES,
  A1_MODULES,
  getAllLessons,
  getLessonById as getStaticLessonById,
} from '@/lib/curriculum';
import type {
  LessonWithProgress,
  DailyGoalStats,
  LearningStreakStats,
  SkillsOverview,
  DailyRecommendation,
  ProgressStatus,
  DayActivityStatus,
} from '@/types/curriculum';
import type { LearnerProfile } from '@/types/profile';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { awardXP } from '@/lib/services/gamification';
import { XP_REWARDS } from '@/lib/gamification/constants';

export type ProgressSupabaseClient = SupabaseClient<Database>;

export interface ModuleWithProgress extends Omit<typeof A1_MODULES[number], 'lessons'> {
  lessons: LessonWithProgress[];
}

function getClient(client?: ProgressSupabaseClient): ProgressSupabaseClient | null {
  if (client) return client;
  return createBrowserClient() as ProgressSupabaseClient | null;
}

/**
 * Get all published courses
 */
export async function getCourses() {
  return COURSES.filter((c) => c.isPublished);
}

/**
 * Get curriculum modules with lessons and learner's progress attached
 */
export async function getCurriculumWithProgress(
  userId: string,
  client?: ProgressSupabaseClient
): Promise<ModuleWithProgress[]> {
  const progressMap = await getLearnerProgressMap(userId, client);

  return A1_MODULES.map((module) => ({
    ...module,
    lessons: (module.lessons || []).map((lesson) => {
      const prog = progressMap.get(lesson.id);
      return {
        ...lesson,
        status: (prog?.status as ProgressStatus) || 'not_started',
        completionPercentage: prog?.completionPercentage || 0,
        completedAt: prog?.completedAt || null,
      } as LessonWithProgress;
    }),
  }));
}

/**
 * Internal helper to get a map of lessonId -> progress
 */
async function getLearnerProgressMap(
  userId: string,
  client?: ProgressSupabaseClient
): Promise<Map<string, { status: string; completionPercentage: number; completedAt: string | null }>> {
  const map = new Map<string, { status: string; completionPercentage: number; completedAt: string | null }>();
  const supabase = getClient(client);
  if (!supabase || !userId) return map;

  try {
    const { data, error } = await supabase
      .from('learning_progress')
      .select('lesson_id, status, completion_percentage, completed_at')
      .eq('user_id', userId);

    if (error) {
      // Table might not exist yet before migration, safely return empty map
      return map;
    }

    if (data) {
      for (const row of data) {
        map.set(row.lesson_id, {
          status: row.status,
          completionPercentage: row.completion_percentage,
          completedAt: row.completed_at,
        });
      }
    }
  } catch {
    // Graceful fallback
  }

  return map;
}

/**
 * Get specific lesson with user progress
 */
export async function getLessonWithProgress(
  lessonId: string,
  userId: string,
  client?: ProgressSupabaseClient
): Promise<LessonWithProgress | null> {
  const staticFound = getStaticLessonById(lessonId);
  if (!staticFound) return null;

  const progressMap = await getLearnerProgressMap(userId, client);
  const prog = progressMap.get(lessonId);

  return {
    ...staticFound,
    moduleTitle: staticFound.module.title,
    moduleKannadaTitle: staticFound.module.kannadaTitle,
    status: (prog?.status as ProgressStatus) || 'not_started',
    completionPercentage: prog?.completionPercentage || 0,
    completedAt: prog?.completedAt || null,
  };
}

/**
 * Get next available lesson for learner
 */
export async function getNextLesson(
  userId: string,
  client?: ProgressSupabaseClient
): Promise<LessonWithProgress> {
  const allLessons = getAllLessons();
  const progressMap = await getLearnerProgressMap(userId, client);

  // Find the first lesson that is not completed
  for (const lesson of allLessons) {
    const prog = progressMap.get(lesson.id);
    if (!prog || prog.status !== 'completed') {
      const staticFound = getStaticLessonById(lesson.id);
      return {
        ...lesson,
        moduleTitle: staticFound?.module.title,
        moduleKannadaTitle: staticFound?.module.kannadaTitle,
        status: (prog?.status as ProgressStatus) || 'not_started',
        completionPercentage: prog?.completionPercentage || 0,
        completedAt: prog?.completedAt || null,
      };
    }
  }

  // If all completed, return first lesson as review
  const first = allLessons[0];
  const staticFirst = getStaticLessonById(first.id);
  const prog = progressMap.get(first.id);

  return {
    ...first,
    moduleTitle: staticFirst?.module.title,
    moduleKannadaTitle: staticFirst?.module.kannadaTitle,
    status: (prog?.status as ProgressStatus) || 'completed',
    completionPercentage: prog?.completionPercentage || 100,
    completedAt: prog?.completedAt || null,
  };
}

/**
 * Start a lesson (mark in_progress)
 */
export async function startLesson(
  userId: string,
  lessonId: string,
  client?: ProgressSupabaseClient
): Promise<void> {
  const supabase = getClient(client);
  if (!supabase || !userId || !lessonId) return;

  try {
    const { data: existing } = await supabase
      .from('learning_progress')
      .select('status')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('learning_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        status: 'in_progress',
        completion_percentage: 25,
        started_at: new Date().toISOString(),
      });
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Complete a lesson idempotently and update daily activity
 */
export async function completeLesson(
  userId: string,
  lessonId: string,
  minutesSpent: number = 10,
  client?: ProgressSupabaseClient
): Promise<void> {
  const supabase = getClient(client);
  if (!supabase || !userId || !lessonId) return;

  const now = new Date().toISOString();
  const todayDate = new Date().toISOString().split('T')[0];

  try {
    // 1. Check if already completed to ensure idempotency
    const { data: existing } = await supabase
      .from('learning_progress')
      .select('status')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const wasAlreadyCompleted = existing?.status === 'completed';

    // 2. Upsert completion
    await supabase.from('learning_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completion_percentage: 100,
        completed_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,lesson_id' }
    );

    // 3. Update daily activity only if not previously completed or first time today
    if (!wasAlreadyCompleted) {
      const { data: activity } = await supabase
        .from('daily_activity')
        .select('minutes_spent, lessons_completed')
        .eq('user_id', userId)
        .eq('activity_date', todayDate)
        .maybeSingle();

      const newMinutes = (activity?.minutes_spent || 0) + minutesSpent;
      const newLessons = (activity?.lessons_completed || 0) + 1;

      await supabase.from('daily_activity').upsert(
        {
          user_id: userId,
          activity_date: todayDate,
          minutes_spent: newMinutes,
          lessons_completed: newLessons,
          updated_at: now,
        },
        { onConflict: 'user_id,activity_date' }
      );

      // 4. Award Gamification XP idempotently
      try {
        const idempotencyKey = `lesson:${userId}:${lessonId}`;
        await awardXP(
          userId,
          'lesson_completion',
          idempotencyKey,
          `Completed lesson: ${lessonId}`,
          XP_REWARDS.LESSON_COMPLETION,
          { lessonId, minutesSpent },
          supabase
        );
      } catch (xpErr) {
        console.warn('[LearningProgressService] Non-blocking XP award error:', xpErr);
      }
    }
  } catch (err) {
    console.error('Error completing lesson:', err);
  }
}

/**
 * Calculate Daily Goal stats
 */
export async function getDailyGoalStats(
  userId: string,
  targetGoalMinutes: number = 15,
  client?: ProgressSupabaseClient
): Promise<DailyGoalStats> {
  const supabase = getClient(client);
  const todayDate = new Date().toISOString().split('T')[0];

  let completedMinutesToday = 0;

  if (supabase && userId) {
    try {
      const { data } = await supabase
        .from('daily_activity')
        .select('minutes_spent')
        .eq('user_id', userId)
        .eq('activity_date', todayDate)
        .maybeSingle();

      if (data) {
        completedMinutesToday = data.minutes_spent || 0;
      }
    } catch {
      completedMinutesToday = 0;
    }
  }

  const percentage = Math.min(
    100,
    Math.round((completedMinutesToday / targetGoalMinutes) * 100)
  );
  const remainingMinutes = Math.max(0, targetGoalMinutes - completedMinutesToday);

  return {
    goalMinutes: targetGoalMinutes,
    completedMinutesToday,
    percentage,
    remainingMinutes,
  };
}

/**
 * Compute Learning Streak & Weekly Activity
 */
export async function getLearningStreak(
  userId: string,
  client?: ProgressSupabaseClient
): Promise<LearningStreakStats> {
  const supabase = getClient(client);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Build the last 7 calendar days
  const past7Days: DayActivityStatus[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    past7Days.push({
      dayName: dayNames[d.getDay()],
      date: dateStr,
      minutes: 0,
      hasActivity: false,
      isToday: dateStr === todayStr,
    });
  }

  let currentStreak = 0;
  let bestStreak = 0;

  if (supabase && userId) {
    try {
      const { data } = await supabase
        .from('daily_activity')
        .select('activity_date, minutes_spent, lessons_completed')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false });

      if (data && data.length > 0) {
        const activeDatesSet = new Set(
          data.filter((r) => r.minutes_spent > 0 || r.lessons_completed > 0).map((r) => r.activity_date)
        );

        // Fill past 7 days
        for (const item of past7Days) {
          const found = data.find((r) => r.activity_date === item.date);
          if (found && (found.minutes_spent > 0 || found.lessons_completed > 0)) {
            item.minutes = found.minutes_spent;
            item.hasActivity = true;
          }
        }

        // Calculate consecutive streak backwards starting from today or yesterday
        const checkDate = new Date(today);
        let checkDateStr = checkDate.toISOString().split('T')[0];

        // If today has no activity yet, check starting from yesterday
        if (!activeDatesSet.has(checkDateStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = checkDate.toISOString().split('T')[0];
        }

        while (activeDatesSet.has(checkDateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = checkDate.toISOString().split('T')[0];
        }

        bestStreak = Math.max(currentStreak, data.length);
      }
    } catch {
      // Fallback
    }
  }

  return {
    currentStreak,
    bestStreak,
    weeklyActivity: past7Days,
  };
}

/**
 * Compute Skills Overview
 */
export async function getSkillsOverview(
  userId: string,
  client?: ProgressSupabaseClient
): Promise<SkillsOverview> {
  const allLessons = getAllLessons();
  const progressMap = await getLearnerProgressMap(userId, client);

  let completedCount = 0;
  for (const lesson of allLessons) {
    const p = progressMap.get(lesson.id);
    if (p && p.status === 'completed') {
      completedCount++;
    }
  }

  const hasStarted = completedCount > 0;
  const ratio = Math.min(1, completedCount / allLessons.length);

  return {
    hasStarted,
    totalLessonsCompleted: completedCount,
    vocabulary: {
      level: completedCount >= 5 ? 'A1 Active' : 'Beginner',
      progress: Math.round(ratio * 100),
    },
    grammar: {
      level: completedCount >= 8 ? 'Basic Sentences' : 'Fundamental',
      progress: Math.round(ratio * 85),
    },
    listening: {
      level: completedCount >= 3 ? 'Phrasal' : 'Syllable Level',
      progress: Math.round(ratio * 90),
    },
    speaking: {
      level: completedCount >= 2 ? 'Polite Greetings' : 'Getting Started',
      progress: Math.round(ratio * 75),
    },
  };
}

/**
 * Generate Daily Recommendation tailored to profile & goals
 */
export async function getDailyRecommendation(
  userId: string,
  profile?: LearnerProfile | null,
  client?: ProgressSupabaseClient
): Promise<DailyRecommendation> {
  const nextLesson = await getNextLesson(userId, client);

  // Personalized reason based on profile goals
  let reason = 'Next recommended lesson in your A1 Foundations pathway.';

  if (profile?.learning_goals?.includes('shopping_and_daily_activities')) {
    reason = 'Key preparation for shopping, numbers, and ordering in Bengaluru.';
  } else if (profile?.learning_goals?.includes('workplace_communication')) {
    reason = 'Helpful for everyday conversations with colleagues and team members.';
  } else if (profile?.learning_goals?.includes('everyday_conversations')) {
    reason = 'Build your everyday speaking fluency and natural cadence.';
  }

  return {
    type: 'next_lesson',
    lesson: nextLesson,
    reason,
  };
}
