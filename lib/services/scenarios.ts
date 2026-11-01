/**
 * AI Conversation Simulator — Persistence Service
 * Kannada Kaliri — Milestone 07
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import type {
  ScenarioAttempt,
  ScenarioChatMessage,
  ScenarioCompletionFeedback,
} from '@/lib/scenarios/types';
import { awardXP } from '@/lib/services/gamification';
import { XP_REWARDS } from '@/lib/gamification/constants';

export async function getOrCreateActiveScenarioAttempt(
  userId: string,
  scenarioId: string,
  supabase: SupabaseClient<Database>
): Promise<ScenarioAttempt> {
  // Check for recent in-progress attempt
  const { data: existing } = await supabase
    .from('scenario_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      userId: existing.user_id,
      scenarioId: existing.scenario_id,
      status: existing.status as 'in_progress' | 'completed' | 'abandoned',
      turnsCompleted: existing.turns_completed,
      confidenceScore: existing.confidence_score ? Number(existing.confidence_score) : null,
      feedback: existing.feedback as unknown as ScenarioCompletionFeedback | null,
      startedAt: existing.started_at,
      completedAt: existing.completed_at,
    };
  }

  // Create new attempt
  const { data: created, error } = await supabase
    .from('scenario_attempts')
    .insert({
      user_id: userId,
      scenario_id: scenarioId,
      status: 'in_progress',
      turns_completed: 0,
    })
    .select()
    .single();

  if (error || !created) {
    console.warn('[ScenarioService] Failed to create scenario_attempt in DB, using local fallback:', error?.message);
    return {
      id: `attempt-local-${Date.now()}`,
      userId,
      scenarioId,
      status: 'in_progress',
      turnsCompleted: 0,
      startedAt: new Date().toISOString(),
    };
  }

  return {
    id: created.id,
    userId: created.user_id,
    scenarioId: created.scenario_id,
    status: created.status as 'in_progress' | 'completed' | 'abandoned',
    turnsCompleted: created.turns_completed,
    confidenceScore: created.confidence_score ? Number(created.confidence_score) : null,
    feedback: created.feedback as unknown as ScenarioCompletionFeedback | null,
    startedAt: created.started_at,
    completedAt: created.completed_at,
  };
}

export async function getScenarioMessages(
  attemptId: string,
  supabase: SupabaseClient<Database>
): Promise<ScenarioChatMessage[]> {
  if (attemptId.startsWith('attempt-local-')) {
    return [];
  }

  const { data, error } = await supabase
    .from('scenario_messages')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    attemptId: row.attempt_id,
    role: row.role as 'character' | 'user' | 'system',
    kannadaText: row.kannada_text,
    transliteration: row.transliteration || undefined,
    englishTranslation: row.english_translation || undefined,
    grammarExplanation: row.grammar_explanation || undefined,
    suggestedReplies: Array.isArray(row.suggested_replies)
      ? (row.suggested_replies as string[])
      : undefined,
    createdAt: row.created_at,
  }));
}

export async function saveScenarioMessage(
  attemptId: string,
  userId: string,
  role: 'character' | 'user' | 'system',
  kannadaText: string,
  transliteration?: string | null,
  englishTranslation?: string | null,
  grammarExplanation?: string | null,
  suggestedReplies?: string[] | null,
  supabase?: SupabaseClient<Database>
): Promise<ScenarioChatMessage> {
  const fallbackId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (!supabase || attemptId.startsWith('attempt-local-')) {
    return {
      id: fallbackId,
      attemptId,
      role,
      kannadaText,
      transliteration: transliteration || undefined,
      englishTranslation: englishTranslation || undefined,
      grammarExplanation: grammarExplanation || undefined,
      suggestedReplies: suggestedReplies || undefined,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .from('scenario_messages')
      .insert({
        attempt_id: attemptId,
        user_id: userId,
        role,
        kannada_text: kannadaText,
        transliteration: transliteration || null,
        english_translation: englishTranslation || null,
        grammar_explanation: grammarExplanation || null,
        suggested_replies: (suggestedReplies as unknown as Json) || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('[ScenarioService] Failed to insert message:', error?.message);
      return {
        id: fallbackId,
        attemptId,
        role,
        kannadaText,
        transliteration: transliteration || undefined,
        englishTranslation: englishTranslation || undefined,
        grammarExplanation: grammarExplanation || undefined,
        suggestedReplies: suggestedReplies || undefined,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: data.id,
      attemptId: data.attempt_id,
      role: data.role as 'character' | 'user' | 'system',
      kannadaText: data.kannada_text,
      transliteration: data.transliteration || undefined,
      englishTranslation: data.english_translation || undefined,
      grammarExplanation: data.grammar_explanation || undefined,
      suggestedReplies: Array.isArray(data.suggested_replies)
        ? (data.suggested_replies as string[])
        : undefined,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.warn('[ScenarioService] Error saving message:', err);
    return {
      id: fallbackId,
      attemptId,
      role,
      kannadaText,
      transliteration: transliteration || undefined,
      englishTranslation: englishTranslation || undefined,
      grammarExplanation: grammarExplanation || undefined,
      suggestedReplies: suggestedReplies || undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function finalizeScenarioAttempt(
  attemptId: string,
  userId: string,
  feedback: ScenarioCompletionFeedback,
  supabase: SupabaseClient<Database>
): Promise<void> {
  if (attemptId.startsWith('attempt-local-')) return;

  await supabase
    .from('scenario_attempts')
    .update({
      status: 'completed',
      turns_completed: feedback.turnsCompleted,
      confidence_score: feedback.confidenceScore,
      feedback: feedback as unknown as Json,
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', userId);

  // Award Gamification XP idempotently
  try {
    await awardXP(
      userId,
      'scenario_completion',
      `scenario:${userId}:${attemptId}`,
      `Completed real-world conversation scenario attempt: ${attemptId}`,
      XP_REWARDS.SCENARIO_COMPLETION,
      { attemptId, confidenceScore: feedback.confidenceScore },
      supabase
    );
  } catch (xpErr) {
    console.warn('[ScenarioService] Non-blocking XP award error:', xpErr);
  }
}

export async function getUserScenarioDashboardStats(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{
  completedCount: number;
  recentAttempts: Array<{
    scenarioId: string;
    confidenceScore: number | null;
    completedAt: string | null;
  }>;
}> {
  try {
    const { data } = await supabase
      .from('scenario_attempts')
      .select('scenario_id, confidence_score, status, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);

    return {
      completedCount: data?.length || 0,
      recentAttempts:
        data?.map((r) => ({
          scenarioId: r.scenario_id,
          confidenceScore: r.confidence_score ? Number(r.confidence_score) : null,
          completedAt: r.completed_at,
        })) || [],
    };
  } catch {
    return {
      completedCount: 0,
      recentAttempts: [],
    };
  }
}
