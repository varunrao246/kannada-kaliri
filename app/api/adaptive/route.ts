/**
 * Adaptive Learning Intelligence Engine — Analytics API Route
 * Kannada Kaliri — Milestone 08
 *
 * GET: Retrieves real-time adaptive analytics, skill masteries, knowledge gaps, and recommendations.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLearnerAdaptiveAnalytics } from '@/lib/adaptive/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
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
        { error: 'Unauthenticated. Please sign in to view adaptive analytics.' },
        { status: 401 }
      );
    }

    const analytics = await getLearnerAdaptiveAnalytics(user.id, supabase);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('[AdaptiveAPI] Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while compiling adaptive analytics.' },
      { status: 500 }
    );
  }
}

