/**
 * AI Conversation Simulator — Scenario Completion & Feedback Route
 * Kannada Kaliri — Milestone 07 & 11 Hardened
 *
 * Endpoint: POST /api/scenarios/complete
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScenarioById } from '@/lib/scenarios/data';
import { buildLearnerTutoringContext } from '@/lib/ai/tutor/context';
import { evaluateScenarioCompletion } from '@/lib/scenarios/engine';
import { finalizeScenarioAttempt } from '@/lib/services/scenarios';
import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import { sanitizeErrorMessage } from '@/lib/security/validation';

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
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Rate Limiting
    const rateLimit = checkRateLimit(
      getClientIdentifier(request, user.id),
      RATE_LIMITS.SCENARIO
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Scenario completion rate limit reached. Please wait a moment.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.scenarioId) {
      return NextResponse.json(
        { error: 'scenarioId is required' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const scenario = getScenarioById(body.scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const attemptId = body.attemptId || `attempt-local-${Date.now()}`;
    const transcript = Array.isArray(body.transcript) ? body.transcript.slice(-20) : [];

    const learnerContext = await buildLearnerTutoringContext(user.id, supabase);

    // Compute evaluation feedback
    const feedback = await evaluateScenarioCompletion(scenario, learnerContext, transcript);

    // Persist finalized attempt
    await finalizeScenarioAttempt(attemptId, user.id, feedback, supabase);

    return NextResponse.json(
      {
        success: true,
        feedback,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('[ScenarioComplete] Error:', error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Failed to evaluate scenario completion.') },
      { status: 500 }
    );
  }
}
