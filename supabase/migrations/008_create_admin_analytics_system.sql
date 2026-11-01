-- ============================================================================
-- Migration 008: Admin Dashboard & Learning Analytics Platform
-- Kannada Kaliri — Milestone 10
-- ============================================================================

-- 1. Create admin_users table (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'analyst')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_admin_user UNIQUE(user_id)
);

-- 2. Create admin_audit_logs table (Auditing & Sensitive Operation Tracking)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_resource TEXT DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id
    ON public.admin_users(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_users_active
    ON public.admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user
    ON public.admin_audit_logs(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
    ON public.admin_audit_logs(action, created_at DESC);

-- Analytics performance indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_daily_activity_date
    ON public.daily_activity(activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_learning_progress_status_completed
    ON public.learning_progress(status, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_results_completed
    ON public.assessment_results(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_correct
    ON public.exercise_attempts(is_correct, attempted_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for admin_users
CREATE POLICY "Admins can view admin users"
    ON public.admin_users
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Super admins can insert or update admin users"
    ON public.admin_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true AND au.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true AND au.role = 'super_admin'
        )
    );

-- 6. RLS Policies for admin_audit_logs
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Admins can insert audit logs"
    ON public.admin_audit_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = admin_user_id
        AND EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

