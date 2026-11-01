/**
 * Achievements, Badges & Leaderboard Page
 * Kannada Kaliri — Milestone 09
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOnboardingCompleted } from '@/lib/services/profile';
import { getUserGamificationSummary } from '@/lib/services/gamification';
import { GamificationDashboardView } from '@/components/gamification/GamificationDashboardView';

export const metadata = {
  title: 'ಸಾಧನೆಗಳು & ಶ್ರೇಯಾಂಕಗಳು • Achievements | Kannada Kaliri',
  description: 'Track your Kannada learning XP, streaks, levels, daily challenges, and leaderboard ranking.',
};

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/achievements');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/achievements');
  }

  const completed = await isOnboardingCompleted(user.id, supabase);
  if (!completed) {
    redirect('/onboarding');
  }

  const summary = await getUserGamificationSummary(user.id, supabase);

  return <GamificationDashboardView summary={summary} />;
}

