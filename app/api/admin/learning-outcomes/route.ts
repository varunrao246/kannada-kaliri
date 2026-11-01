/**
 * Admin Learning Outcomes Analytics API Route
 * Kannada Kaliri — Milestone 10
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/services/admin-auth';
import { getLearningOutcomeAnalytics } from '@/lib/services/admin-analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const outcomes = await getLearningOutcomeAnalytics(supabase);

    return NextResponse.json({
      success: true,
      outcomes,
    });
  } catch (error) {
    console.error('[AdminAPI] Learning outcomes error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while compiling learning outcome analytics.' },
      { status: 500 }
    );
  }
}

