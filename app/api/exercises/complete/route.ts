import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateAssessmentScore,
  completeAssessment,
  getAdaptiveRecommendation,
} from '@/lib/services/assessment';
import { completeLesson } from '@/lib/services/learning-progress';
import type { ExerciseAttempt } from '@/lib/exercises/types';
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
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated. Please sign in to complete exercises.' },
        { status: 401 }
      );
    }

    // Rate Limiting
    const rateLimit = checkRateLimit(
      getClientIdentifier(request, user.id),
      RATE_LIMITS.EXERCISE
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many completion submissions. Please slow down.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { userId, lessonId, attempts, startedAt } = body as {
      userId?: string;
      lessonId: string;
      attempts: Record<string, ExerciseAttempt>;
      startedAt: string;
    };

    // IDOR Defense: Prevent client from completing lessons on behalf of another user
    if (userId && userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot complete lessons for another user.' },
        { status: 403 }
      );
    }

    const targetUserId = user.id;
    if (!lessonId || !attempts) {
      return NextResponse.json(
        { error: 'Missing required parameters: lessonId and attempts are required.' },
        { status: 400 }
      );
    }

    const attemptsMap = new Map<string, ExerciseAttempt>(Object.entries(attempts));
    const score = calculateAssessmentScore(lessonId, attemptsMap, startedAt || new Date().toISOString());

    // Persist assessment result
    await completeAssessment(targetUserId, score, supabase);

    // If score is passing (>= 60%), automatically record lesson completion and add minutes
    if (score.scorePercentage >= 60) {
      const estimatedMinutes = Math.max(5, Math.ceil(score.timeTakenSeconds / 60));
      await completeLesson(targetUserId, lessonId, estimatedMinutes, supabase);
    }

    const recommendation = getAdaptiveRecommendation(score);

    return NextResponse.json(
      { score, recommendation },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('Error in /api/exercises/complete:', error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Internal server error while saving lesson completion.') },
      { status: 500 }
    );
  }
}
