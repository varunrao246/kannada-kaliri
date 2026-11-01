/**
 * Curriculum & Learning Progress Domain Types
 * Kannada Kaliri — Milestone 03
 */

import type { NativeLanguage } from './profile';

export type CourseLevel = 'A1' | 'A2' | 'B1' | 'B2';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface VocabularyItem {
  id: string;
  kannada: string;
  transliteration: string;
  meaningEn: string;
  meaningNative?: Partial<Record<NativeLanguage, string>>;
  partOfSpeech?: string;
  culturalNote?: string;
}

export interface ExampleSentence {
  id: string;
  kannada: string;
  transliteration: string;
  english: string;
  nativeExplanation?: Partial<Record<NativeLanguage, string>>;
}

export interface GrammarTip {
  title: string;
  explanation: string;
  nativeTip?: Partial<Record<NativeLanguage, string>>;
  example?: string;
}

export interface LessonContent {
  introduction: string;
  objectives: string[];
  vocabulary: VocabularyItem[];
  grammarTips: GrammarTip[];
  examples: ExampleSentence[];
  culturalContext?: string;
  completionCriteria: string;
}

export interface Course {
  id: string;
  title: string;
  kannadaTitle?: string;
  description: string;
  languageCode: string;
  level: CourseLevel;
  displayOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  kannadaTitle?: string;
  description: string;
  displayOrder: number;
  lessons?: Lesson[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  kannadaTitle?: string;
  description: string;
  estimatedMinutes: number;
  displayOrder: number;
  content: LessonContent;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonWithProgress extends Lesson {
  moduleTitle?: string;
  moduleKannadaTitle?: string;
  status: ProgressStatus;
  completionPercentage: number;
  completedAt?: string | null;
}

export interface LearningProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  completionPercentage: number;
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt: string;
}

export interface DailyActivity {
  id: string;
  userId: string;
  activityDate: string; // YYYY-MM-DD
  minutesSpent: number;
  lessonsCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyGoalStats {
  goalMinutes: number;
  completedMinutesToday: number;
  percentage: number;
  remainingMinutes: number;
}

export interface DayActivityStatus {
  dayName: string; // 'Mon', 'Tue', etc.
  date: string;    // 'YYYY-MM-DD'
  minutes: number;
  hasActivity: boolean;
  isToday: boolean;
}

export interface LearningStreakStats {
  currentStreak: number;
  bestStreak: number;
  weeklyActivity: DayActivityStatus[];
}

export interface SkillsOverview {
  hasStarted: boolean;
  vocabulary: { level: string; progress: number };
  grammar: { level: string; progress: number };
  listening: { level: string; progress: number };
  speaking: { level: string; progress: number };
  totalLessonsCompleted: number;
}

export interface DailyRecommendation {
  type: 'next_lesson' | 'review' | 'cultural';
  lesson: LessonWithProgress;
  reason: string;
}

