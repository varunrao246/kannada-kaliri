-- ============================================================================
-- Migration 006: AI Conversation Simulator Persistence
-- Kannada Kaliri — Milestone 07
-- ============================================================================

-- 1. Create scenario_attempts table
CREATE TABLE IF NOT EXISTS public.scenario_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    turns_completed INTEGER NOT NULL DEFAULT 0,
    confidence_score NUMERIC DEFAULT NULL,
    feedback JSONB DEFAULT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ DEFAULT NULL
);

-- 2. Create scenario_messages table
CREATE TABLE IF NOT EXISTS public.scenario_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.scenario_attempts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('character', 'user', 'system')),
    kannada_text TEXT NOT NULL,
    transliteration TEXT DEFAULT NULL,
    english_translation TEXT DEFAULT NULL,
    grammar_explanation TEXT DEFAULT NULL,
    suggested_replies JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_scenario_attempts_user_id
    ON public.scenario_attempts(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_scenario_attempts_scenario
    ON public.scenario_attempts(user_id, scenario_id);

CREATE INDEX IF NOT EXISTS idx_scenario_messages_attempt
    ON public.scenario_messages(attempt_id, created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.scenario_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for scenario_attempts
CREATE POLICY "Users can view their own scenario attempts"
    ON public.scenario_attempts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scenario attempts"
    ON public.scenario_attempts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenario attempts"
    ON public.scenario_attempts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenario attempts"
    ON public.scenario_attempts
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. RLS Policies for scenario_messages
CREATE POLICY "Users can view their own scenario messages"
    ON public.scenario_messages
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenario messages"
    ON public.scenario_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenario messages"
    ON public.scenario_messages
    FOR DELETE
    USING (auth.uid() = user_id);

