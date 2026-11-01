/**
 * Admin Learners Management API Route
 * Kannada Kaliri — Milestone 10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/services/admin-auth';
import { getLearnersManagementData } from '@/lib/services/admin-analytics';

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
    const search = searchParams.get('search') || undefined;
    const nativeLang = searchParams.get('nativeLang') || undefined;
    const proficiency = searchParams.get('proficiency') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const data = await getLearnersManagementData(supabase, {
      search,
      nativeLang,
      proficiency,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[AdminAPI] Learners error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching learners.' },
      { status: 500 }
    );
  }
}

