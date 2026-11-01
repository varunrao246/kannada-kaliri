/**
 * Admin Engagement Analytics API Route
 * Kannada Kaliri — Milestone 10
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/services/admin-auth';
import { getEngagementAnalytics } from '@/lib/services/admin-analytics';

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

    const engagement = await getEngagementAnalytics(supabase);

    return NextResponse.json({
      success: true,
      engagement,
    });
  } catch (error) {
    console.error('[AdminAPI] Engagement error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while compiling engagement analytics.' },
      { status: 500 }
    );
  }
}

