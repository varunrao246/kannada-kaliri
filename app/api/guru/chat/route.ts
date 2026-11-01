/**
 * AI Kannada Guru — Chat Route Handler
 * Kannada Kaliri — Milestone 06 & 11 Hardened
 *
 * Endpoint: POST /api/guru/chat
 * Features:
 * - Server-side authentication via Supabase
 * - Centralized sliding-window rate-limiting (20 req/min)
 * - Input validation & prompt injection defenses (1000 char cap, token stripping)
 * - Real learner context synthesis
 * - Provider invocation (Gemini / OpenAI / Groq / Mock)
 * - Safe response validation
 * - Message & conversation persistence
 * - Honest unconfigured reporting
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildLearnerTutoringContext } from '@/lib/ai/tutor/context';
import { getTutorAIProvider, TutorAIError } from '@/lib/ai/tutor/provider';
import { getTutorConfigurationStatus } from '@/lib/ai/tutor/config';
import {
  getOrCreateActiveConversation,
  getConversationMessages,
  saveGuruMessage,
} from '@/lib/services/guru-history';
import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import { sanitizeErrorMessage, validateGuruPrompt } from '@/lib/security/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
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
        { error: 'Unauthenticated. Please sign in to consult with your AI Guru.' },
        { status: 401 }
      );
    }

    // 2. Check rate limit
    const rateLimit = checkRateLimit(
      getClientIdentifier(request, user.id),
      RATE_LIMITS.GURU
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before sending another message.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 3. Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. "message" field is required.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const validation = validateGuruPrompt(body.message);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || 'Invalid message.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const userMessageText = validation.data;

    // 4. Resolve or create active conversation
    const conversation = await getOrCreateActiveConversation(user.id, supabase);

    // 5. Save incoming user message
    const userMessage = await saveGuruMessage(
      conversation.id,
      user.id,
      'user',
      userMessageText,
      null,
      supabase
    );

    // 6. Check if runtime AI provider is configured
    const configStatus = getTutorConfigurationStatus();
    if (!configStatus.isConfigured && configStatus.provider !== 'mock') {
      return NextResponse.json(
        {
          error: 'AI_PROVIDER_NOT_CONFIGURED',
          message: configStatus.message,
          configured: false,
          isPlaceholder: configStatus.isPlaceholder,
          userMessage,
        },
        { status: 503, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 7. Assemble real learner context from database
    const learnerContext = await buildLearnerTutoringContext(user.id, supabase);

    // 8. Fetch previous messages for context continuity (last 6 messages)
    const recentDbMessages = await getConversationMessages(conversation.id, supabase);
    const messagesForProvider = recentDbMessages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Ensure the latest message is in the payload
    if (!messagesForProvider.some((m) => m.content === userMessageText)) {
      messagesForProvider.push({ role: 'user', content: userMessageText });
    }

    // 9. Invoke AI Provider
    const provider = getTutorAIProvider();
    const result = await provider.generateTutoringResponse({
      messages: messagesForProvider,
      learnerContext,
    });

    // 10. Persist Assistant structured response
    const assistantMessage = await saveGuruMessage(
      conversation.id,
      user.id,
      'assistant',
      result.structured.message,
      result.structured,
      supabase
    );

    return NextResponse.json(
      {
        success: true,
        conversationId: conversation.id,
        userMessage,
        assistantMessage,
        response: result.structured,
        provider: result.provider,
        model: result.model,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: unknown) {
    if (error instanceof TutorAIError) {
      return NextResponse.json(
        {
          error: error.code,
          message: sanitizeErrorMessage(error.message),
          configured: error.code !== 'AI_PROVIDER_NOT_CONFIGURED',
        },
        { status: error.statusCode }
      );
    }

    console.error('[GuruAPI] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while communicating with the Kannada Guru.',
      },
      { status: 500 }
    );
  }
}
