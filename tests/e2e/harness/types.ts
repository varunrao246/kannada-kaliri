/**
 * Types & Domain Models for Milestone 02 E2E Test Suite
 * Authoritative interface contracts derived from PROJECT.md and ORIGINAL_REQUEST.md
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

export interface CreateLearnerProfileDTO {
  user_id?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  native_language: NativeLanguage;
  target_language?: string;
  proficiency_level: ProficiencyLevel;
  learning_goals: string[];
  daily_goal_minutes: DailyGoalMinutes;
  onboarding_completed?: boolean;
}

export interface UpdateLearnerProfileDTO {
  full_name?: string | null;
  avatar_url?: string | null;
  native_language?: NativeLanguage;
  proficiency_level?: ProficiencyLevel;
  learning_goals?: string[];
  daily_goal_minutes?: DailyGoalMinutes;
  onboarding_completed?: boolean;
}

export interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    [key: string]: unknown;
  };
}

export interface MockSession {
  user: MockUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface RoutingDecision {
  allow: boolean;
  redirectUrl?: string;
  statusCode: number;
  reason: string;
}

export interface TestResult {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  feature: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SuiteSummary {
  tier: number;
  name: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}
