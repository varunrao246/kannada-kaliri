import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardView from '@/components/dashboard/DashboardView';
import { getLearnerProfile } from '@/lib/services/profile';
import {
  getNextLesson,
  getDailyGoalStats,
  getLearningStreak,
  getSkillsOverview,
  getDailyRecommendation,
} from '@/lib/services/learning-progress';
import { getDashboardAssessmentStats } from '@/lib/services/assessment';
import { getUserScenarioDashboardStats } from '@/lib/services/scenarios';
import { getLearnerAdaptiveAnalytics } from '@/lib/adaptive/analytics';
import { getUserGamificationSummary } from '@/lib/services/gamification';

export const metadata = {
  title: 'Dashboard | Kannada Kaliri',
  description: 'Your personalized Kannada learning portal.',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Unauthenticated users visiting /dashboard redirect to /login
  if (!supabase) {
    redirect('/login?redirect=/dashboard');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  // 2. Retrieve user profile and verify onboarding status in a single query
  const profile = await getLearnerProfile(user.id, supabase);
  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  const targetGoal = profile?.daily_goal_minutes || 15;

  const [
    nextLesson,
    dailyGoalStats,
    streakStats,
    skillsOverview,
    recommendation,
    assessmentStats,
    scenarioStats,
    adaptiveAnalytics,
    gamificationSummary,
  ] = await Promise.all([
    getNextLesson(user.id, supabase),
    getDailyGoalStats(user.id, targetGoal, supabase),
    getLearningStreak(user.id, supabase),
    getSkillsOverview(user.id, supabase),
    getDailyRecommendation(user.id, profile, supabase),
    getDashboardAssessmentStats(user.id, supabase),
    getUserScenarioDashboardStats(user.id, supabase),
    getLearnerAdaptiveAnalytics(user.id, supabase),
    getUserGamificationSummary(user.id, supabase),
  ]);

  return (
    <DashboardView
      user={user}
      profile={profile}
      nextLesson={nextLesson}
      dailyGoalStats={dailyGoalStats}
      streakStats={streakStats}
      skillsOverview={skillsOverview}
      recommendation={recommendation}
      assessmentStats={assessmentStats}
      scenarioStats={scenarioStats}
      adaptiveAnalytics={adaptiveAnalytics}
      gamificationSummary={gamificationSummary}
    />
  );
}
