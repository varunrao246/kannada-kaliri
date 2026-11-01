/**
 * Gamification Summary API Route
 * Kannada Kaliri — Milestone 09
 *
 * GET: Retrieves learner level, XP, daily streak, badges, challenges, and preferences.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserGamificationSummary } from '@/lib/services/gamification';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
        { error: 'Unauthenticated. Please sign in to view gamification summary.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || undefined;

    const summary = await getUserGamificationSummary(user.id, supabase, dateParam);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('[GamificationAPI] Summary error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while compiling gamification summary.' },
      { status: 500 }
    );
  }
}

