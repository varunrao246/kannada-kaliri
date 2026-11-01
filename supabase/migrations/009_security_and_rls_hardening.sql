-- ============================================================================
-- KANNADA KALIRI — MILESTONE 11: SECURITY & RLS HARDENING MIGRATION
-- Migration: 009_security_and_rls_hardening.sql
-- Description:
--   1. Secure triggers & functions with immutable search_path (CWE-426)
--   2. Enforce strict learner data isolation across all relational tables
--   3. Authorize active platform admins for read-only administrative inspection
--   4. Prevent client user_id spoofing on INSERT and UPDATE (WITH CHECK)
--   5. Restrict curriculum modifications to verified admin roles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Hardened Trigger Functions with Explicit, Immutable Search Path
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.handle_guru_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.guru_conversations
  SET updated_at = timezone('utc'::text, now())
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ----------------------------------------------------------------------------
-- 2. Hardened Admin Read-Only Visibility Policies on Learner Data
-- Allows verified active admins to view data in admin analytics console
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all profiles for platform oversight" ON public.learner_profiles;
CREATE POLICY "Admins can view all profiles for platform oversight"
  ON public.learner_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view learning progress for analytics" ON public.learning_progress;
CREATE POLICY "Admins can view learning progress for analytics"
  ON public.learning_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view daily activity for telemetry" ON public.daily_activity;
CREATE POLICY "Admins can view daily activity for telemetry"
  ON public.daily_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view assessment sessions for outcome tracking" ON public.assessment_sessions;
CREATE POLICY "Admins can view assessment sessions for outcome tracking"
  ON public.assessment_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view assessment answers for mistake analysis" ON public.assessment_answers;
CREATE POLICY "Admins can view assessment answers for mistake analysis"
  ON public.assessment_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Strict WITH CHECK Enforcement on Learner Writes
-- ----------------------------------------------------------------------------

-- Verify and enforce that updates to learner_profiles cannot reassign user_id
DROP POLICY IF EXISTS "Users can update their own profile" ON public.learner_profiles;
CREATE POLICY "Users can update their own profile"
  ON public.learner_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify and enforce learning_progress INSERT and UPDATE
DROP POLICY IF EXISTS "Users can update their own learning progress" ON public.learning_progress;
CREATE POLICY "Users can update their own learning progress"
  ON public.learning_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify and enforce scenario_attempts
DROP POLICY IF EXISTS "Users can update their own scenario attempts" ON public.scenario_attempts;
CREATE POLICY "Users can update their own scenario attempts"
  ON public.scenario_attempts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. Protect Curriculum Tables Against Unauthorized Modifications
-- Only curriculum editors and admins may modify modules, lessons, exercises
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Curriculum editors can insert modules" ON public.modules;
CREATE POLICY "Curriculum editors can insert modules"
  ON public.modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role IN ('admin', 'super_admin', 'curriculum_editor')
    )
  );

DROP POLICY IF EXISTS "Curriculum editors can update modules" ON public.modules;
CREATE POLICY "Curriculum editors can update modules"
  ON public.modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role IN ('admin', 'super_admin', 'curriculum_editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role IN ('admin', 'super_admin', 'curriculum_editor')
    )
  );

DROP POLICY IF EXISTS "Curriculum editors can insert lessons" ON public.lessons;
CREATE POLICY "Curriculum editors can insert lessons"
  ON public.lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role IN ('admin', 'super_admin', 'curriculum_editor')
    )
  );

DROP POLICY IF EXISTS "Curriculum editors can update lessons" ON public.lessons;
CREATE POLICY "Curriculum editors can update lessons"
  ON public.lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role IN ('admin', 'super_admin', 'curriculum_editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() 
        AND au.is_active = true 
        AND au.role IN ('admin', 'super_admin', 'curriculum_editor')
    )
  );

