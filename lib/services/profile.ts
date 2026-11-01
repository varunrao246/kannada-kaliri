/**
 * Profile Persistence Service
 * Kannada Kaliri — Milestone 02
 *
 * Provides strongly-typed CRUD operations and onboarding status verification
 * with dual client support (browser / server) and idempotent upsert mechanics.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  LearnerProfile,
  CreateLearnerProfileDTO,
  ProfileServiceError,
  isNativeLanguage,
  isProficiencyLevel,
  isDailyGoalMinutes,
} from '@/types/profile';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

export type ProfileSupabaseClient = SupabaseClient<Database>;

/**
 * Maps PostgreSQL and Supabase errors to friendly ProfileServiceError instances
 */
function mapDatabaseError(error: { code?: string; message?: string; details?: unknown }): ProfileServiceError {
  const code = error.code || 'DATABASE_ERROR';
  const msg = error.message || '';

  if (code === '23514') {
    if (msg.includes('chk_learner_profiles_native_language')) {
      return new ProfileServiceError(
        'Selected native language is not supported. Please select English, Hindi, Tamil, Telugu, or Malayalam.',
        'CHECK_CONSTRAINT_VIOLATION',
        400,
        error
      );
    }
    if (msg.includes('chk_learner_profiles_proficiency_level')) {
      return new ProfileServiceError(
        'Invalid Kannada proficiency level. Please select Beginner, Elementary, or Intermediate.',
        'CHECK_CONSTRAINT_VIOLATION',
        400,
        error
      );
    }
    if (msg.includes('chk_learner_profiles_daily_goal_minutes')) {
      return new ProfileServiceError(
        'Invalid daily learning commitment. Allowed options: 5, 10, 15, or 20 minutes.',
        'CHECK_CONSTRAINT_VIOLATION',
        400,
        error
      );
    }
    if (msg.includes('chk_learner_profiles_target_language')) {
      return new ProfileServiceError(
        "Target language must be Kannada ('kn').",
        'CHECK_CONSTRAINT_VIOLATION',
        400,
        error
      );
    }
    return new ProfileServiceError(
      'Database check constraint validation failed: ' + msg,
      'CHECK_CONSTRAINT_VIOLATION',
      400,
      error
    );
  }

  if (code === '23503') {
    return new ProfileServiceError(
      'User account not recognized or referenced user does not exist. Please sign in again.',
      'FOREIGN_KEY_VIOLATION',
      400,
      error
    );
  }

  if (code === '42501') {
    return new ProfileServiceError(
      'You do not have permission to modify this profile.',
      'INSUFFICIENT_PRIVILEGES',
      403,
      error
    );
  }

  return new ProfileServiceError(
    `Failed to persist learner profile: ${msg}`,
    code,
    500,
    error
  );
}

/**
 * Resolves the Supabase client instance.
 * 1. Returns caller-supplied client directly if provided.
 * 2. In browser environments, auto-resolves browser client from '@/lib/supabase/client'.
 * 3. In server environments, dynamically loads server client from '@/lib/supabase/server'.
 */
async function resolveSupabaseClient(
  client?: ProfileSupabaseClient
): Promise<ProfileSupabaseClient> {
  if (client) {
    return client;
  }

  // 1. Browser Environment
  if (typeof window !== 'undefined') {
    const browserClient = createBrowserClient() as ProfileSupabaseClient | null;
    if (!browserClient) {
      throw new ProfileServiceError(
        'Supabase client is not configured in browser environment',
        'SUPABASE_NOT_CONFIGURED',
        500
      );
    }
    return browserClient;
  }

  // 2. Server Environment (Server Components, Route Handlers, Server Actions)
  // In server environments, the authenticated Supabase client must be supplied by the caller
  throw new ProfileServiceError(
    'Supabase client must be supplied when calling ProfileService from server environments without request cookies',
    'CLIENT_RESOLUTION_ERROR',
    500
  );
}

/**
 * Resolves the user ID either from argument or from current authenticated session.
 */
async function resolveUserId(
  supabase: ProfileSupabaseClient,
  userId?: string
): Promise<string | null> {
  if (userId && userId.trim() !== '') {
    return userId.trim();
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * Fetches the learner profile for a given user ID, or the currently authenticated user.
 * Returns null if the user is unauthenticated or has no profile recorded.
 * Throws ProfileServiceError if a database or network error occurs.
 *
 * @param userId - Optional target user ID (defaults to authenticated session user)
 * @param client - Optional Supabase client instance
 */
export async function getLearnerProfile(
  userId?: string,
  client?: ProfileSupabaseClient
): Promise<LearnerProfile | null> {
  const supabase = await resolveSupabaseClient(client);

  const resolvedUserId = await resolveUserId(supabase, userId);
  if (!resolvedUserId) {
    return null;
  }

  const { data, error } = await supabase
    .from('learner_profiles')
    .select('*')
    .eq('user_id', resolvedUserId)
    .maybeSingle();

  if (error) {
    throw new ProfileServiceError(
      `Failed to fetch learner profile for user ${resolvedUserId}: ${error.message}`,
      error.code,
      500,
      error
    );
  }

  if (!data) {
    return null;
  }

  return data as unknown as LearnerProfile;
}

/**
 * Creates or upserts a learner profile.
 * Uses PostgreSQL ON CONFLICT (user_id) DO UPDATE to prevent duplicate rows or race conditions.
 * Validates input types and values against schema check constraints before issuing queries.
 *
 * Preserves `id`, `user_id`, and `created_at` on upsert conflict.
 *
 * @param payload - Learner profile creation DTO
 * @param client - Optional Supabase client instance
 */
export async function createLearnerProfile(
  payload: CreateLearnerProfileDTO,
  client?: ProfileSupabaseClient
): Promise<LearnerProfile> {
  const supabase = await resolveSupabaseClient(client);

  const resolvedUserId = await resolveUserId(supabase, payload.user_id);
  if (!resolvedUserId) {
    throw new ProfileServiceError(
      'Authenticated user is required to create a learner profile',
      'UNAUTHENTICATED',
      401
    );
  }

  // Runtime Schema Validation
  if (!isNativeLanguage(payload.native_language)) {
    throw new ProfileServiceError(
      `Invalid native language "${payload.native_language}". Must be one of: en, hi, ta, te, ml`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (!isProficiencyLevel(payload.proficiency_level)) {
    throw new ProfileServiceError(
      `Invalid proficiency level "${payload.proficiency_level}". Must be one of: beginner, elementary, intermediate`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (!isDailyGoalMinutes(payload.daily_goal_minutes)) {
    throw new ProfileServiceError(
      `Invalid daily goal minutes "${payload.daily_goal_minutes}". Must be one of: 5, 10, 15, 20`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (!Array.isArray(payload.learning_goals) || payload.learning_goals.length === 0) {
    throw new ProfileServiceError(
      'At least one learning goal must be selected',
      'VALIDATION_ERROR',
      400
    );
  }

  // Construct Upsert Payload (id and created_at omitted to preserve on update)
  const insertData: Database['public']['Tables']['learner_profiles']['Insert'] = {
    user_id: resolvedUserId,
    full_name: payload.full_name ?? null,
    avatar_url: payload.avatar_url ?? null,
    native_language: payload.native_language,
    target_language: 'kn',
    proficiency_level: payload.proficiency_level,
    learning_goals: payload.learning_goals,
    daily_goal_minutes: payload.daily_goal_minutes,
    onboarding_completed: payload.onboarding_completed ?? true,
  };

  const { data, error } = await supabase
    .from('learner_profiles')
    .upsert(insertData, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    throw new ProfileServiceError(
      'No data returned after profile persistence',
      'EMPTY_PERSISTENCE_RESULT',
      500
    );
  }

  return data as unknown as LearnerProfile;
}

/**
 * Updates an existing learner profile by user ID.
 * Throws ProfileServiceError if user does not exist or validation fails.
 *
 * @param userId - Target user ID to update
 * @param updates - Partial fields to update
 * @param client - Optional Supabase client instance
 */
export async function updateLearnerProfile(
  userId: string,
  updates: Partial<CreateLearnerProfileDTO>,
  client?: ProfileSupabaseClient
): Promise<LearnerProfile> {
  if (!userId || userId.trim() === '') {
    throw new ProfileServiceError(
      'userId is required to update learner profile',
      'INVALID_ARGUMENT',
      400
    );
  }

  const cleanUserId = userId.trim();
  const supabase = await resolveSupabaseClient(client);

  // Validate fields if supplied
  if (updates.native_language !== undefined && !isNativeLanguage(updates.native_language)) {
    throw new ProfileServiceError(
      `Invalid native language "${updates.native_language}". Must be one of: en, hi, ta, te, ml`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (updates.proficiency_level !== undefined && !isProficiencyLevel(updates.proficiency_level)) {
    throw new ProfileServiceError(
      `Invalid proficiency level "${updates.proficiency_level}". Must be one of: beginner, elementary, intermediate`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (updates.daily_goal_minutes !== undefined && !isDailyGoalMinutes(updates.daily_goal_minutes)) {
    throw new ProfileServiceError(
      `Invalid daily goal minutes "${updates.daily_goal_minutes}". Must be one of: 5, 10, 15, 20`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (updates.learning_goals !== undefined && (!Array.isArray(updates.learning_goals) || updates.learning_goals.length === 0)) {
    throw new ProfileServiceError(
      'learning_goals must be a non-empty array of strings',
      'VALIDATION_ERROR',
      400
    );
  }

  const updateData: Database['public']['Tables']['learner_profiles']['Update'] = {};

  if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
  if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
  if (updates.native_language !== undefined) updateData.native_language = updates.native_language;
  if (updates.target_language !== undefined) updateData.target_language = 'kn';
  if (updates.proficiency_level !== undefined) updateData.proficiency_level = updates.proficiency_level;
  if (updates.learning_goals !== undefined) updateData.learning_goals = updates.learning_goals;
  if (updates.daily_goal_minutes !== undefined) updateData.daily_goal_minutes = updates.daily_goal_minutes;
  if (updates.onboarding_completed !== undefined) updateData.onboarding_completed = updates.onboarding_completed;

  const { data, error } = await supabase
    .from('learner_profiles')
    .update(updateData)
    .eq('user_id', cleanUserId)
    .select('*')
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    throw new ProfileServiceError(
      `No profile found to update for user ${cleanUserId}`,
      'NOT_FOUND',
      404
    );
  }

  return data as unknown as LearnerProfile;
}

/**
 * Fast-path check to determine whether a user has completed the onboarding flow.
 * - Returns false if unauthenticated or no profile exists.
 * - Returns true only if a learner profile exists and onboarding_completed === true.
 * - Queries only the onboarding_completed column for minimum database and network latency.
 *
 * @param userId - Optional target user ID (defaults to authenticated session user)
 * @param client - Optional Supabase client instance
 */
export async function isOnboardingCompleted(
  userId?: string,
  client?: ProfileSupabaseClient
): Promise<boolean> {
  try {
    const supabase = await resolveSupabaseClient(client);

    const resolvedUserId = await resolveUserId(supabase, userId);
    if (!resolvedUserId) {
      return false;
    }

    const { data, error } = await supabase
      .from('learner_profiles')
      .select('onboarding_completed')
      .eq('user_id', resolvedUserId)
      .maybeSingle();

    if (error) {
      console.warn(
        `[isOnboardingCompleted] Database query error for user ${resolvedUserId}: ${error.message}`
      );
      return false;
    }

    if (!data) {
      return false;
    }

    return Boolean(data.onboarding_completed);
  } catch (err) {
    console.warn('[isOnboardingCompleted] Failed to check status:', err);
    return false;
  }
}
