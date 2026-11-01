-- ============================================================================
-- Migration: 003_create_curriculum_and_progress.sql
-- Description: Creates curriculum tables (courses, modules, lessons) and
--              learner tracking tables (learning_progress, daily_activity)
--              with RLS policies, indexes, and automated triggers.
-- Milestone: M03 - Personalized Student Dashboard + Curriculum Engine
-- ============================================================================

-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Courses Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  kannada_title TEXT,
  description TEXT,
  language_code TEXT NOT NULL DEFAULT 'kn',
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
  display_order INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_display_order ON public.courses(display_order);

-- ----------------------------------------------------------------------------
-- 2. Modules Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kannada_title TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_modules_course_order UNIQUE (course_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON public.modules(display_order);

-- ----------------------------------------------------------------------------
-- 3. Lessons Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kannada_title TEXT,
  description TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  display_order INTEGER NOT NULL DEFAULT 1,
  lesson_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_lessons_module_order UNIQUE (module_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_display_order ON public.lessons(display_order);

-- ----------------------------------------------------------------------------
-- 4. Learning Progress Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_learning_progress_user_lesson UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON public.learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_status ON public.learning_progress(user_id, status);

-- ----------------------------------------------------------------------------
-- 5. Daily Activity Table (for streak and daily minute tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_spent INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_daily_activity_user_date UNIQUE (user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, activity_date DESC);

-- ----------------------------------------------------------------------------
-- 6. Updated At Triggers
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_courses_updated_at ON public.courses;
CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_modules_updated_at ON public.modules;
CREATE TRIGGER set_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_lessons_updated_at ON public.lessons;
CREATE TRIGGER set_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_learning_progress_updated_at ON public.learning_progress;
CREATE TRIGGER set_learning_progress_updated_at
  BEFORE UPDATE ON public.learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_daily_activity_updated_at ON public.daily_activity;
CREATE TRIGGER set_daily_activity_updated_at
  BEFORE UPDATE ON public.daily_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Enable Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. Row Level Security Policies
-- ----------------------------------------------------------------------------

-- Courses: Anyone authenticated can read published courses
DROP POLICY IF EXISTS "Published courses are viewable by authenticated users" ON public.courses;
CREATE POLICY "Published courses are viewable by authenticated users"
  ON public.courses FOR SELECT TO authenticated
  USING (is_published = true);

-- Modules: Anyone authenticated can view modules
DROP POLICY IF EXISTS "Modules are viewable by authenticated users" ON public.modules;
CREATE POLICY "Modules are viewable by authenticated users"
  ON public.modules FOR SELECT TO authenticated
  USING (true);

-- Lessons: Anyone authenticated can view published lessons
DROP POLICY IF EXISTS "Published lessons are viewable by authenticated users" ON public.lessons;
CREATE POLICY "Published lessons are viewable by authenticated users"
  ON public.lessons FOR SELECT TO authenticated
  USING (is_published = true);

-- Learning Progress: Learners can read only their own progress
DROP POLICY IF EXISTS "Learners can view own progress" ON public.learning_progress;
CREATE POLICY "Learners can view own progress"
  ON public.learning_progress FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Learning Progress: Learners can insert only their own progress
DROP POLICY IF EXISTS "Learners can insert own progress" ON public.learning_progress;
CREATE POLICY "Learners can insert own progress"
  ON public.learning_progress FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Learning Progress: Learners can update only their own progress
DROP POLICY IF EXISTS "Learners can update own progress" ON public.learning_progress;
CREATE POLICY "Learners can update own progress"
  ON public.learning_progress FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Daily Activity: Learners can view only their own activity
DROP POLICY IF EXISTS "Learners can view own daily activity" ON public.daily_activity;
CREATE POLICY "Learners can view own daily activity"
  ON public.daily_activity FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Daily Activity: Learners can insert their own daily activity
DROP POLICY IF EXISTS "Learners can insert own daily activity" ON public.daily_activity;
CREATE POLICY "Learners can insert own daily activity"
  ON public.daily_activity FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Daily Activity: Learners can update their own daily activity
DROP POLICY IF EXISTS "Learners can update own daily activity" ON public.daily_activity;
CREATE POLICY "Learners can update own daily activity"
  ON public.daily_activity FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 9. Table Grants
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.modules TO authenticated;
GRANT SELECT ON public.lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.learning_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.daily_activity TO authenticated;

GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.lessons TO service_role;
GRANT ALL ON public.learning_progress TO service_role;
GRANT ALL ON public.daily_activity TO service_role;

