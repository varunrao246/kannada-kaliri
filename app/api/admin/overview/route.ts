/**
 * Admin Overview API Route
 * Kannada Kaliri — Milestone 10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/services/admin-auth';
import {
  getPlatformKPIs,
  getRegistrationTrends,
  getLessonCompletionTrends,
} from '@/lib/services/admin-analytics';
import type { DateRangeFilter, DateRangePreset } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const preset = (searchParams.get('preset') || '30d') as DateRangePreset;
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const filter: DateRangeFilter = { preset, startDate, endDate };

    const [kpis, registrationTrends, lessonCompletionTrends] = await Promise.all([
      getPlatformKPIs(supabase, filter),
      getRegistrationTrends(supabase, filter),
      getLessonCompletionTrends(supabase, filter),
    ]);

    return NextResponse.json({
      success: true,
      kpis,
      registrationTrends,
      lessonCompletionTrends,
      filter,
    });
  } catch (error) {
    console.error('[AdminAPI] Overview error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while compiling admin overview.' },
      { status: 500 }
    );
  }
}

