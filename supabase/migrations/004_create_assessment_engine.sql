-- ============================================================================
-- Migration: 004_create_assessment_engine.sql
-- Description: Creates assessment tables (assessment_results, exercise_attempts,
--              vocabulary_progress) with RLS policies, indexes, and triggers.
-- Milestone: M04 - Interactive Learning & Assessment Engine
-- Supabase Project: https://xepgknlbisdxgcqmfrwx.supabase.co
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Open your Supabase project → SQL Editor
-- 2. Paste this entire file and click Run
-- 3. Verify the 3 new tables appear in Table Editor
-- 4. Existing tables (courses, modules, lessons, learning_progress,
--    daily_activity, learner_profiles) are NOT modified.
-- ============================================================================

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FUNCTION: handle_updated_at (reuse if already exists from migration 002/003)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE 1: assessment_results
-- Stores one row per completed lesson assessment per user.
-- Duplicate prevention: A user can retake an assessment (multiple rows allowed),
-- but the dashboard displays only the most recent score.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       TEXT        NOT NULL,
  total_questions INTEGER     NOT NULL DEFAULT 0,
  correct_answers INTEGER     NOT NULL DEFAULT 0,
  score_percentage INTEGER    NOT NULL DEFAULT 0
    CHECK (score_percentage BETWEEN 0 AND 100),
  total_points    INTEGER     NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id
  ON public.assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_lesson_id
  ON public.assessment_results(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_completed_at
  ON public.assessment_results(user_id, completed_at DESC);

-- ============================================================================
-- TABLE 2: exercise_attempts
-- Stores each individual exercise answer submission.
-- Multiple attempts are allowed (retakes). Duplicate prevention is handled
-- in the application layer (session deduplication).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id        TEXT        NOT NULL,
  exercise_id      TEXT        NOT NULL,
  submitted_answer JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_correct       BOOLEAN     NOT NULL DEFAULT false,
  points_awarded   INTEGER     NOT NULL DEFAULT 0,
  attempted_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id
  ON public.exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_lesson_id
  ON public.exercise_attempts(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id
  ON public.exercise_attempts(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_incorrect
  ON public.exercise_attempts(user_id, lesson_id, is_correct);

-- ============================================================================
-- TABLE 3: vocabulary_progress
-- Tracks per-user vocabulary mastery based on recall exercises.
-- One row per (user, vocabulary_id) — upserted on each recall review.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vocabulary_progress (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id   TEXT        NOT NULL,
  times_seen      INTEGER     NOT NULL DEFAULT 0,
  times_correct   INTEGER     NOT NULL DEFAULT 0,
  times_incorrect INTEGER     NOT NULL DEFAULT 0,
  mastery_status  TEXT        NOT NULL DEFAULT 'new'
    CHECK (mastery_status IN ('new', 'learning', 'familiar', 'mastered')),
  last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_vocabulary_progress_user_vocab UNIQUE (user_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_user_id
  ON public.vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_mastery
  ON public.vocabulary_progress(user_id, mastery_status);

-- ============================================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS set_vocabulary_progress_updated_at ON public.vocabulary_progress;
CREATE TRIGGER set_vocabulary_progress_updated_at
  BEFORE UPDATE ON public.vocabulary_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.assessment_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_progress  ENABLE ROW LEVEL SECURITY;

-- ─── assessment_results ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Learners can view own assessment results" ON public.assessment_results;
CREATE POLICY "Learners can view own assessment results"
  ON public.assessment_results FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Learners can insert own assessment results" ON public.assessment_results;
CREATE POLICY "Learners can insert own assessment results"
  ON public.assessment_results FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- No UPDATE or DELETE allowed on assessment_results (immutable history)

-- ─── exercise_attempts ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Learners can view own exercise attempts" ON public.exercise_attempts;
CREATE POLICY "Learners can view own exercise attempts"
  ON public.exercise_attempts FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Learners can insert own exercise attempts" ON public.exercise_attempts;
CREATE POLICY "Learners can insert own exercise attempts"
  ON public.exercise_attempts FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- No UPDATE or DELETE (immutable attempt log)

-- ─── vocabulary_progress ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Learners can view own vocabulary progress" ON public.vocabulary_progress;
CREATE POLICY "Learners can view own vocabulary progress"
  ON public.vocabulary_progress FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Learners can insert own vocabulary progress" ON public.vocabulary_progress;
CREATE POLICY "Learners can insert own vocabulary progress"
  ON public.vocabulary_progress FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Learners can update own vocabulary progress" ON public.vocabulary_progress;
CREATE POLICY "Learners can update own vocabulary progress"
  ON public.vocabulary_progress FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT, INSERT ON public.assessment_results  TO authenticated;
GRANT SELECT, INSERT ON public.exercise_attempts   TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vocabulary_progress TO authenticated;

GRANT ALL ON public.assessment_results  TO service_role;
GRANT ALL ON public.exercise_attempts   TO service_role;
GRANT ALL ON public.vocabulary_progress TO service_role;

-- ============================================================================
-- END OF MIGRATION 004
-- ============================================================================

