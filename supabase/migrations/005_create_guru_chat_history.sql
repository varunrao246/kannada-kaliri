-- ============================================================================
-- Migration 005: AI Kannada Guru Chat History Persistence
-- Kannada Kaliri — Milestone 06
-- ============================================================================

-- 1. Create guru_conversations table
CREATE TABLE IF NOT EXISTS public.guru_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Kannada Tutoring Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create guru_messages table
CREATE TABLE IF NOT EXISTS public.guru_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.guru_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    structured_response JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_guru_conversations_user_id
    ON public.guru_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_guru_messages_conversation_id
    ON public.guru_messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_guru_messages_user_id
    ON public.guru_messages(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.guru_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for guru_conversations
CREATE POLICY "Users can view their own guru conversations"
    ON public.guru_conversations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own guru conversations"
    ON public.guru_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guru conversations"
    ON public.guru_conversations
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guru conversations"
    ON public.guru_conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. RLS Policies for guru_messages
CREATE POLICY "Users can view their own guru messages"
    ON public.guru_messages
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guru messages"
    ON public.guru_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guru messages"
    ON public.guru_messages
    FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Trigger to update updated_at on guru_conversations when messages arrive
CREATE OR REPLACE FUNCTION public.handle_guru_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.guru_conversations
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_guru_message_inserted ON public.guru_messages;
CREATE TRIGGER on_guru_message_inserted
    AFTER INSERT ON public.guru_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_guru_conversation_updated_at();

