/**
 * AI Conversation Simulator — Chat Route Handler
 * Kannada Kaliri — Milestone 07 & 11 Hardened
 *
 * Endpoint: POST /api/scenarios/chat
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScenarioById } from '@/lib/scenarios/data';
import { buildLearnerTutoringContext } from '@/lib/ai/tutor/context';
import { executeScenarioTurn } from '@/lib/scenarios/engine';
import { saveScenarioMessage } from '@/lib/services/scenarios';
import { TutorAIError } from '@/lib/ai/tutor/provider';
import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import { sanitizeErrorMessage, validateScenarioInput } from '@/lib/security/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Auth service unavailable' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated. Please sign in to simulate conversations.' },
        { status: 401 }
      );
    }

    // Rate Limiting (20 Scenario turns/min)
    const rateLimit = checkRateLimit(
      getClientIdentifier(request, user.id),
      RATE_LIMITS.SCENARIO
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Scenario conversation rate limit reached. Please wait a moment.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.scenarioId || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: scenarioId and message are required.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const inputValidation = validateScenarioInput(body.message);
    if (!inputValidation.isValid || !inputValidation.data) {
      return NextResponse.json(
        { error: inputValidation.error || 'Invalid message.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const scenario = getScenarioById(body.scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: `Scenario with id "${body.scenarioId}" not found.` },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const attemptId = body.attemptId || `attempt-local-${Date.now()}`;
    const userText = inputValidation.data;

    // 1. Save user utterance
    await saveScenarioMessage(
      attemptId,
      user.id,
      'user',
      userText,
      null,
      null,
      null,
      null,
      supabase
    );

    // 2. Fetch learner context
    const learnerContext = await buildLearnerTutoringContext(user.id, supabase);

    // 3. Assemble transcript history (safely bounded)
    const transcript = Array.isArray(body.transcript) ? body.transcript.slice(-10) : [];
    transcript.push({ role: 'user', content: userText });

    // 4. Execute turn via AI Engine
    const turnResult = await executeScenarioTurn(scenario, learnerContext, transcript);

    // 5. Save character utterance
    const characterMessage = await saveScenarioMessage(
      attemptId,
      user.id,
      'character',
      turnResult.kannadaText,
      turnResult.transliteration,
      turnResult.englishTranslation,
      turnResult.grammarExplanation,
      turnResult.suggestedReplies,
      supabase
    );

    return NextResponse.json(
      {
        success: true,
        characterMessage,
        isObjectiveCompleted: turnResult.isObjectiveCompleted,
        provider: turnResult.provider,
        model: turnResult.model,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: unknown) {
    if (error instanceof TutorAIError) {
      return NextResponse.json(
        {
          error: error.code,
          message: sanitizeErrorMessage(error.message),
          configured: false,
        },
        { status: error.statusCode }
      );
    }

    console.error('[ScenarioChat] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during the roleplay turn.',
      },
      { status: 500 }
    );
  }
}
