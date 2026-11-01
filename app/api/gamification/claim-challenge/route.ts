/**
 * Claim Daily Challenge Reward API Route
 * Kannada Kaliri — Milestone 09 & 11 Hardened
 *
 * POST: Validates completion and awards +30 XP for a completed daily challenge.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { claimDailyChallengeReward } from '@/lib/services/gamification';
import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import { sanitizeErrorMessage } from '@/lib/security/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
        { error: 'Unauthenticated. Please sign in to claim challenge rewards.' },
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
        { error: 'Too many reward claim attempts. Please wait a moment.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { challengeId, date } = body;

    if (!challengeId || typeof challengeId !== 'string') {
      return NextResponse.json(
        { error: 'Valid challengeId is required.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const result = await claimDailyChallengeReward(user.id, challengeId, date, supabase);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to claim challenge reward.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        awardedXP: result.awardedXP,
        message: 'Challenge reward claimed successfully!',
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('[GamificationAPI] Claim challenge error:', error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'An unexpected error occurred while claiming challenge reward.') },
      { status: 500 }
    );
  }
}
