-- ============================================================================
-- Migration 007: Gamification, Rewards & Motivation Engine
-- Kannada Kaliri — Milestone 09
-- ============================================================================

-- 1. Create xp_transactions table (Idempotent XP Ledger)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_xp_user_idempotency UNIQUE(user_id, idempotency_key)
);

-- 2. Create learner_achievements table
CREATE TABLE IF NOT EXISTS public.learner_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_learner_achievement UNIQUE(user_id, achievement_id)
);

-- 3. Create daily_challenge_progress table
CREATE TABLE IF NOT EXISTS public.daily_challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    challenge_date DATE NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 1,
    current_count INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_daily_challenge UNIQUE(user_id, challenge_id, challenge_date)
);

-- 4. Create leaderboard_preferences table
CREATE TABLE IF NOT EXISTS public.leaderboard_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opt_in BOOLEAN NOT NULL DEFAULT true,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_leaderboard_user UNIQUE(user_id)
);

-- 5. Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_created
    ON public.xp_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_created
    ON public.xp_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_learner_achievements_user
    ON public.learner_achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date
    ON public.daily_challenge_progress(user_id, challenge_date);

CREATE INDEX IF NOT EXISTS idx_leaderboard_prefs_optin
    ON public.leaderboard_preferences(opt_in);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_preferences ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for xp_transactions
CREATE POLICY "Users can view own XP transactions and opt-in leaderboard peers"
    ON public.xp_transactions
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.leaderboard_preferences lp
            WHERE lp.user_id = xp_transactions.user_id AND lp.opt_in = true
        )
    );

CREATE POLICY "Users can insert their own XP transactions"
    ON public.xp_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 8. RLS Policies for learner_achievements
CREATE POLICY "Users can view their own achievements"
    ON public.learner_achievements
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
    ON public.learner_achievements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 9. RLS Policies for daily_challenge_progress
CREATE POLICY "Users can view their own challenge progress"
    ON public.daily_challenge_progress
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress"
    ON public.daily_challenge_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
    ON public.daily_challenge_progress
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 10. RLS Policies for leaderboard_preferences
CREATE POLICY "Users can view leaderboard preferences"
    ON public.leaderboard_preferences
    FOR SELECT
    USING (auth.uid() = user_id OR opt_in = true);

CREATE POLICY "Users can insert their own leaderboard preferences"
    ON public.leaderboard_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard preferences"
    ON public.leaderboard_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

