/**
 * Admin Individual Learner Analytics API Route
 * Kannada Kaliri — Milestone 10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/services/admin-auth';
import { getIndividualLearnerAnalytics } from '@/lib/services/admin-analytics';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Auth service unavailable' }, { status: 500 });
    }

    const adminAuth = await verifyAdminUser(supabase);
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: adminAuth.error || 'Access denied. Administrator privileges required.' },
        { status: adminAuth.userId ? 403 : 401 }
      );
    }

    const { userId } = await context.params;
    if (!userId) {
      return NextResponse.json({ error: 'Learner User ID required' }, { status: 400 });
    }

    const learnerData = await getIndividualLearnerAnalytics(supabase, userId);

    if (!learnerData.profile) {
      return NextResponse.json({ error: 'Learner profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      learner: learnerData,
    });
  } catch (error) {
    console.error('[AdminAPI] Learner detail error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching learner details.' },
      { status: 500 }
    );
  }
}

