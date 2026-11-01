/**
 * Admin Reports & CSV Export API Route
 * Kannada Kaliri — Milestone 10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser, recordAdminAuditLog } from '@/lib/services/admin-auth';
import {
  getPlatformKPIs,
  getLearnersManagementData,
  getCurriculumAnalytics,
  exportToCSV,
} from '@/lib/services/admin-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Auth service unavailable' }, { status: 500 });
    }

    const adminAuth = await verifyAdminUser(supabase);
    if (!adminAuth.isAdmin || !adminAuth.userId) {
      return NextResponse.json(
        { error: adminAuth.error || 'Access denied. Administrator privileges required.' },
        { status: adminAuth.userId ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const today = new Date().toISOString().slice(0, 10);

    let csvContent = '';
    const filename = `kannada-kaliri-${reportType}-${today}.csv`;

    if (reportType === 'learners') {
      const data = await getLearnersManagementData(supabase, { limit: 500 });
      csvContent = exportToCSV(
        data.learners as unknown as Array<Record<string, unknown>>,
        [
          { key: 'userId', label: 'Learner User ID' },
          { key: 'fullName', label: 'Learner Name' },
          { key: 'nativeLanguage', label: 'Native Language' },
          { key: 'proficiencyLevel', label: 'Proficiency' },
          { key: 'completedLessonsCount', label: 'Completed Lessons' },
          { key: 'assessmentCount', label: 'Assessments Taken' },
          { key: 'averageScore', label: 'Average Score (%)' },
          { key: 'currentStreak', label: 'Streak Days' },
          { key: 'totalXP', label: 'Total XP' },
          { key: 'registrationDate', label: 'Registered At' },
          { key: 'lastActiveDate', label: 'Last Active' },
        ]
      );
    } else if (reportType === 'curriculum') {
      const data = await getCurriculumAnalytics(supabase);
      csvContent = exportToCSV(
        data.lessonStats as unknown as Array<Record<string, unknown>>,
        [
          { key: 'lessonId', label: 'Lesson ID' },
          { key: 'title', label: 'Lesson Title' },
          { key: 'kannadaTitle', label: 'Kannada Title' },
          { key: 'moduleNumber', label: 'Module #' },
          { key: 'completionCount', label: 'Completions' },
          { key: 'completionRate', label: 'Completion Rate (%)' },
          { key: 'avgAssessmentScore', label: 'Avg Assessment Score (%)' },
          { key: 'sampleSize', label: 'Sample Size' },
          { key: 'dropoffCount', label: 'Learner Dropoff' },
        ]
      );
    } else if (reportType === 'assessments') {
      const { data } = await supabase
        .from('assessment_results')
        .select('id, user_id, lesson_id, score_percentage, total_questions, correct_answers, completed_at')
        .order('completed_at', { ascending: false })
        .limit(1000);

      csvContent = exportToCSV(
        (data || []) as unknown as Array<Record<string, unknown>>,
        [
          { key: 'id', label: 'Assessment Result ID' },
          { key: 'user_id', label: 'Learner User ID' },
          { key: 'lesson_id', label: 'Lesson ID' },
          { key: 'score_percentage', label: 'Score (%)' },
          { key: 'correct_answers', label: 'Correct Answers' },
          { key: 'total_questions', label: 'Total Questions' },
          { key: 'completed_at', label: 'Completed At' },
        ]
      );
    } else if (reportType === 'gamification') {
      const { data } = await supabase
        .from('xp_transactions')
        .select('id, user_id, activity_type, xp_amount, description, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      csvContent = exportToCSV(
        (data || []) as unknown as Array<Record<string, unknown>>,
        [
          { key: 'id', label: 'Transaction ID' },
          { key: 'user_id', label: 'Learner User ID' },
          { key: 'activity_type', label: 'Activity Type' },
          { key: 'xp_amount', label: 'XP Amount' },
          { key: 'description', label: 'Description' },
          { key: 'created_at', label: 'Timestamp' },
        ]
      );
    } else {
      // Default: Overview KPI summary
      const kpis = await getPlatformKPIs(supabase, { preset: '30d', startDate: '', endDate: '' });
      const rows = [
        { metric: 'Total Registered Learners', current: kpis.totalLearners.current, previous: kpis.totalLearners.previous, change: kpis.totalLearners.percentageChange },
        { metric: 'New Registrations (30d)', current: kpis.newRegistrations.current, previous: kpis.newRegistrations.previous, change: kpis.newRegistrations.percentageChange },
        { metric: 'Daily Active Learners', current: kpis.dailyActiveLearners.current, previous: kpis.dailyActiveLearners.previous, change: kpis.dailyActiveLearners.percentageChange },
        { metric: 'Weekly Active Learners', current: kpis.weeklyActiveLearners.current, previous: kpis.weeklyActiveLearners.previous, change: kpis.weeklyActiveLearners.percentageChange },
        { metric: 'Monthly Active Learners', current: kpis.monthlyActiveLearners.current, previous: kpis.monthlyActiveLearners.previous, change: kpis.monthlyActiveLearners.percentageChange },
        { metric: 'Completed Lessons', current: kpis.completedLessons.current, previous: kpis.completedLessons.previous, change: kpis.completedLessons.percentageChange },
        { metric: 'Assessment Attempts', current: kpis.assessmentAttempts.current, previous: kpis.assessmentAttempts.previous, change: kpis.assessmentAttempts.percentageChange },
        { metric: 'Completed Scenarios', current: kpis.completedScenarios.current, previous: kpis.completedScenarios.previous, change: kpis.completedScenarios.percentageChange },
        { metric: 'Total XP Awarded', current: kpis.totalXPAwarded.current, previous: kpis.totalXPAwarded.previous, change: kpis.totalXPAwarded.percentageChange },
        { metric: 'Average Mastery Score (%)', current: kpis.averageMasteryScore.current, previous: kpis.averageMasteryScore.previous, change: kpis.averageMasteryScore.percentageChange },
        { metric: 'Active Streak Average (Days)', current: kpis.activeStreakAverage.current, previous: kpis.activeStreakAverage.previous, change: kpis.activeStreakAverage.percentageChange },
      ];

      csvContent = exportToCSV(
        rows as unknown as Array<Record<string, unknown>>,
        [
          { key: 'metric', label: 'KPI Metric' },
          { key: 'current', label: 'Current Period (30d)' },
          { key: 'previous', label: 'Previous Period' },
          { key: 'change', label: '% Change' },
        ]
      );
    }

    // Record audit log for security
    await recordAdminAuditLog(supabase, {
      adminUserId: adminAuth.userId,
      action: 'export_csv_report',
      targetResource: `report:${reportType}`,
      metadata: { reportType, rowCount: csvContent.split('\n').length - 1 },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[AdminAPI] Export report error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while exporting report.' },
      { status: 500 }
    );
  }
}
