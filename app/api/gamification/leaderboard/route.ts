/**
 * Leaderboard Rankings API Route
 * Kannada Kaliri — Milestone 09
 *
 * GET: Retrieves privacy-conscious leaderboard rankings for weekly, monthly, or all-time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLeaderboard } from '@/lib/services/gamification';

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

    const { searchParams } = new URL(request.url);
    const timeframeParam = searchParams.get('timeframe') || 'weekly';
    const limitParam = parseInt(searchParams.get('limit') || '25', 10);

    const timeframe =
      timeframeParam === 'monthly' || timeframeParam === 'all_time'
        ? timeframeParam
        : 'weekly';
    const limit = Math.min(Math.max(limitParam || 25, 5), 50);

    const result = await getLeaderboard(timeframe, limit, user?.id, supabase);

    return NextResponse.json({
      success: true,
      timeframe,
      ...result,
    });
  } catch (error) {
    console.error('[GamificationAPI] Leaderboard error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching leaderboard.' },
      { status: 500 }
    );
  }
}

