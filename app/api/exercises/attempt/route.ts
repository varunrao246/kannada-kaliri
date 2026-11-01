import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitExerciseAttempt, updateVocabularyProgress } from '@/lib/services/assessment';
import type { ExerciseAttempt, VocabularyRecallAnswer } from '@/lib/exercises/types';
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
        { error: 'Unauthenticated. Please sign in to submit exercise attempts.' },
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
        { error: 'Too many exercise submissions. Please slow down.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { userId, lessonId, attempt } = body as {
      userId?: string;
      lessonId: string;
      attempt: ExerciseAttempt;
    };

    // IDOR Defense: Prevent client from specifying or modifying another user's attempts
    if (userId && userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot submit exercise attempts for another user.' },
        { status: 403 }
      );
    }

    const targetUserId = user.id;
    if (!lessonId || !attempt) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId and attempt are required.' },
        { status: 400 }
      );
    }

    // Persist attempt
    await submitExerciseAttempt(targetUserId, lessonId, attempt, supabase);

    // If vocabulary recall, update vocabulary progress
    if (attempt.exerciseType === 'vocabulary_recall') {
      const vocabAnswer = attempt.answer as VocabularyRecallAnswer;
      const isKnown = vocabAnswer.selfAssessment === 'known';
      await updateVocabularyProgress(targetUserId, attempt.exerciseId, isKnown, supabase);
    }

    return NextResponse.json({ success: true }, { headers: getRateLimitHeaders(rateLimit) });
  } catch (error) {
    console.error('Error in /api/exercises/attempt:', error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Internal server error while saving exercise attempt.') },
      { status: 500 }
    );
  }
}
