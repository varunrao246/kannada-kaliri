/**
 * Leaderboard Preferences API Route
 * Kannada Kaliri — Milestone 09
 *
 * POST: Toggles opt-in participation and anonymous nickname masking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateLeaderboardPreferences } from '@/lib/services/gamification';

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
        { error: 'Unauthenticated. Please sign in to update leaderboard preferences.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { optIn, isAnonymous } = body;

    const updated = await updateLeaderboardPreferences(
      user.id,
      {
        optIn: typeof optIn === 'boolean' ? optIn : undefined,
        isAnonymous: typeof isAnonymous === 'boolean' ? isAnonymous : undefined,
      },
      supabase
    );

    return NextResponse.json({
      success: true,
      preferences: updated,
    });
  } catch (error) {
    console.error('[GamificationAPI] Leaderboard preference error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating leaderboard preferences.' },
      { status: 500 }
    );
  }
}

