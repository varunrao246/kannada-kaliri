/**
 * AI Kannada Guru — Conversations Route Handler
 * Kannada Kaliri — Milestone 06
 *
 * GET: Retrieves the user's active conversation and message history
 * DELETE: Clears the message history for a fresh start
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOrCreateActiveConversation,
  getConversationMessages,
  clearConversationMessages,
} from '@/lib/services/guru-history';
import { isTutorAIConfigured, getTutorAIConfig } from '@/lib/ai/tutor/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const conversation = await getOrCreateActiveConversation(user.id, supabase);
    const messages = await getConversationMessages(conversation.id, supabase);
    const config = getTutorAIConfig();
    const isConfigured = isTutorAIConfigured() || config.provider === 'mock';

    return NextResponse.json({
      conversation,
      messages,
      isConfigured,
      provider: config.provider,
      model: config.model,
    });
  } catch (error) {
    console.error('[GuruConversations] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const conversation = await getOrCreateActiveConversation(user.id, supabase);
    await clearConversationMessages(conversation.id, user.id, supabase);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[GuruConversations] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to clear conversation' },
      { status: 500 }
    );
  }
}

