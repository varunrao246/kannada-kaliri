-- ============================================================================
-- Migration: 002_create_learner_profiles.sql
-- Description: Creates public.learner_profiles table, constraints, triggers,
--              performance indexes, and Row Level Security (RLS) policies
-- Milestone: M01 - Database Schema & Migration
-- ============================================================================

-- Ensure required cryptographic extensions are available for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Create table public.learner_profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  native_language TEXT NOT NULL,
  target_language TEXT NOT NULL DEFAULT 'kn',
  proficiency_level TEXT NOT NULL,
  learning_goals TEXT[] NOT NULL DEFAULT '{}',
  daily_goal_minutes INTEGER NOT NULL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Named Constraints for Clarity and Maintainability
  CONSTRAINT learner_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT chk_learner_profiles_native_language CHECK (
    native_language IN ('en', 'hi', 'ta', 'te', 'ml')
  ),
  CONSTRAINT chk_learner_profiles_target_language CHECK (
    target_language = 'kn'
  ),
  CONSTRAINT chk_learner_profiles_proficiency_level CHECK (
    proficiency_level IN ('beginner', 'elementary', 'intermediate')
  ),
  CONSTRAINT chk_learner_profiles_daily_goal_minutes CHECK (
    daily_goal_minutes IN (5, 10, 15, 20)
  )
);

-- ----------------------------------------------------------------------------
-- 2. Performance Indexes
-- ----------------------------------------------------------------------------
-- Unique index on user_id for fast single-row lookups and upsert conflicts
CREATE UNIQUE INDEX IF NOT EXISTS idx_learner_profiles_user_id 
  ON public.learner_profiles(user_id);

-- Index on onboarding_completed for route guard checks and progress filtering
CREATE INDEX IF NOT EXISTS idx_learner_profiles_onboarding_completed 
  ON public.learner_profiles(onboarding_completed);

-- ----------------------------------------------------------------------------
-- 3. Automatic updated_at Timestamp Function & Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Drop and recreate trigger idempotently
DROP TRIGGER IF EXISTS set_learner_profiles_updated_at ON public.learner_profiles;
CREATE TRIGGER set_learner_profiles_updated_at
  BEFORE UPDATE ON public.learner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security Policies
-- ----------------------------------------------------------------------------

-- SELECT: Authenticated learners can view only their own profile
DROP POLICY IF EXISTS "Learners can view own profile" ON public.learner_profiles;
CREATE POLICY "Learners can view own profile"
  ON public.learner_profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- INSERT: Authenticated learners can insert only their own profile
DROP POLICY IF EXISTS "Learners can insert own profile" ON public.learner_profiles;
CREATE POLICY "Learners can insert own profile"
  ON public.learner_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Authenticated learners can update only their own profile
DROP POLICY IF EXISTS "Learners can update own profile" ON public.learner_profiles;
CREATE POLICY "Learners can update own profile"
  ON public.learner_profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Authenticated learners can delete only their own profile
DROP POLICY IF EXISTS "Learners can delete own profile" ON public.learner_profiles;
CREATE POLICY "Learners can delete own profile"
  ON public.learner_profiles
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 6. Table Grants & Permissions
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_profiles TO authenticated;
GRANT ALL ON public.learner_profiles TO service_role;
