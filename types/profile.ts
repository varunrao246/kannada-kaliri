/**
 * Learner Profile Domain Types, DTOs, Constants, and Type Guards
 * Kannada Kaliri — Milestone 02
 */

export type NativeLanguage = 'en' | 'hi' | 'ta' | 'te' | 'ml';

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate';

export type DailyGoalMinutes = 5 | 10 | 15 | 20;

export type LearningGoal =
  | 'everyday_conversations'
  | 'college_and_education'
  | 'workplace_communication'
  | 'shopping_and_daily_activities'
  | 'travel_and_exploring_karnataka'
  | 'communicating_with_local_communities'
  | 'understanding_kannada_culture';

/**
 * Complete Learner Profile entity matching PostgreSQL `learner_profiles` table
 */
export interface LearnerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  native_language: NativeLanguage;
  target_language: string; // 'kn'
  proficiency_level: ProficiencyLevel;
  learning_goals: string[];
  daily_goal_minutes: DailyGoalMinutes;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Data Transfer Object for creating or upserting a learner profile
 */
export interface CreateLearnerProfileDTO {
  user_id?: string; // Optional if resolved from session
  full_name?: string | null;
  avatar_url?: string | null;
  native_language: NativeLanguage;
  target_language?: string; // Defaults to 'kn'
  proficiency_level: ProficiencyLevel;
  learning_goals: string[];
  daily_goal_minutes: DailyGoalMinutes;
  onboarding_completed?: boolean; // Defaults to true upon completing wizard
}

/**
 * Data Transfer Object for updating an existing learner profile
 */
export interface UpdateLearnerProfileDTO {
  full_name?: string | null;
  avatar_url?: string | null;
  native_language?: NativeLanguage;
  target_language?: string;
  proficiency_level?: ProficiencyLevel;
  learning_goals?: string[];
  daily_goal_minutes?: DailyGoalMinutes;
  onboarding_completed?: boolean;
}

/**
 * Supported constants matching database CHECK constraints
 */
export const SUPPORTED_NATIVE_LANGUAGES: readonly NativeLanguage[] = [
  'en',
  'hi',
  'ta',
  'te',
  'ml',
] as const;

export const SUPPORTED_PROFICIENCY_LEVELS: readonly ProficiencyLevel[] = [
  'beginner',
  'elementary',
  'intermediate',
] as const;

export const SUPPORTED_DAILY_GOALS: readonly DailyGoalMinutes[] = [
  5,
  10,
  15,
  20,
] as const;

export const SUPPORTED_LEARNING_GOALS: readonly LearningGoal[] = [
  'everyday_conversations',
  'college_and_education',
  'workplace_communication',
  'shopping_and_daily_activities',
  'travel_and_exploring_karnataka',
  'communicating_with_local_communities',
  'understanding_kannada_culture',
] as const;

/**
 * Runtime Type Guards (Zero 'any' validation)
 */
export function isNativeLanguage(value: unknown): value is NativeLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_NATIVE_LANGUAGES as readonly string[]).includes(value)
  );
}

export function isProficiencyLevel(value: unknown): value is ProficiencyLevel {
  return (
    typeof value === 'string' &&
    (SUPPORTED_PROFICIENCY_LEVELS as readonly string[]).includes(value)
  );
}

export function isDailyGoalMinutes(value: unknown): value is DailyGoalMinutes {
  return (
    typeof value === 'number' &&
    (SUPPORTED_DAILY_GOALS as readonly number[]).includes(value)
  );
}

export function isLearningGoal(value: unknown): value is LearningGoal {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LEARNING_GOALS as readonly string[]).includes(value)
  );
}

/**
 * Custom strongly-typed error for profile service operations
 */
export class ProfileServiceError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(
    message: string,
    code = 'PROFILE_SERVICE_ERROR',
    statusCode = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'ProfileServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
