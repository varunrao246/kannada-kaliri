/**
 * AI Kannada Guru — Chat History Service
 * Kannada Kaliri — Milestone 06
 *
 * Persists and retrieves conversations and messages from Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import type {
  TutorChatMessage,
  TutorConversation,
  TutorMessageRole,
  TutorStructuredResponse,
} from '@/lib/ai/tutor/types';

export async function getOrCreateActiveConversation(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<TutorConversation> {
  // Fetch latest active conversation
  const { data: existing, error } = await supabase
    .from('guru_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // If table doesn't exist yet (before migration runs), fallback gracefully
    console.warn('[GuruHistory] Failed to query guru_conversations:', error.message);
  }

  if (existing) {
    return {
      id: existing.id,
      userId: existing.user_id,
      title: existing.title,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at,
    };
  }

  // Create initial conversation
  const { data: created, error: createError } = await supabase
    .from('guru_conversations')
    .insert({
      user_id: userId,
      title: 'ಕನ್ನಡ ಕಲಿಕೆ — Conversation',
    })
    .select()
    .single();

  if (createError) {
    console.warn('[GuruHistory] Failed to create conversation:', createError.message);
    // Return ephemeral fallback conversation if DB table is unmigrated
    return {
      id: 'ephemeral-session',
      userId,
      title: 'ಕನ್ನಡ ಕಲಿಕೆ — Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: created.id,
    userId: created.user_id,
    title: created.title,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  };
}

export async function getConversationMessages(
  conversationId: string,
  supabase: SupabaseClient<Database>
): Promise<TutorChatMessage[]> {
  if (conversationId === 'ephemeral-session') {
    return [];
  }

  const { data, error } = await supabase
    .from('guru_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    console.warn('[GuruHistory] Failed to get messages:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as TutorMessageRole,
    content: row.content,
    structuredResponse: row.structured_response as unknown as TutorStructuredResponse | null,
    createdAt: row.created_at,
  }));
}

export async function saveGuruMessage(
  conversationId: string,
  userId: string,
  role: TutorMessageRole,
  content: string,
  structuredResponse: TutorStructuredResponse | null,
  supabase: SupabaseClient<Database>
): Promise<TutorChatMessage> {
  if (conversationId === 'ephemeral-session') {
    return {
      id: `msg-${Date.now()}`,
      conversationId,
      role,
      content,
      structuredResponse,
      createdAt: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('guru_messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      structured_response: (structuredResponse as unknown as Json) ?? null,
    })
    .select()
    .single();

  if (error) {
    console.warn('[GuruHistory] Failed to save message:', error.message);
    return {
      id: `fallback-${Date.now()}`,
      conversationId,
      role,
      content,
      structuredResponse,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    role: data.role as TutorMessageRole,
    content: data.content,
    structuredResponse: data.structured_response as unknown as TutorStructuredResponse | null,
    createdAt: data.created_at,
  };
}

export async function clearConversationMessages(
  conversationId: string,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  if (conversationId === 'ephemeral-session') {
    return true;
  }

  const { error } = await supabase
    .from('guru_messages')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  return !error;
}

