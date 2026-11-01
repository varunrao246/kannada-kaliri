import { NextResponse } from 'next/server';
import { getExerciseById } from '@/lib/exercises';
import { validateExerciseAnswer } from '@/lib/services/exercise-validator';
import type { ExerciseAnswer } from '@/lib/exercises/types';
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
    // Rate Limiting by IP/Client
    const rateLimit = checkRateLimit(
      getClientIdentifier(request),
      RATE_LIMITS.EXERCISE
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many validation requests. Please slow down.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { exerciseId, answer } = body as {
      exerciseId: string;
      answer: ExerciseAnswer;
    };

    if (!exerciseId || !answer) {
      return NextResponse.json(
        { error: 'Missing exerciseId or answer' },
        { status: 400 }
      );
    }

    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    const validation = validateExerciseAnswer(exercise, answer);

    return NextResponse.json({ validation }, { headers: getRateLimitHeaders(rateLimit) });
  } catch (error) {
    console.error('Error in /api/exercises/validate:', error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Internal server error validating exercise.') },
      { status: 500 }
    );
  }
}
