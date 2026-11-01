import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOnboardingCompleted } from '@/lib/services/profile';
import { getAllScenarios } from '@/lib/scenarios/data';
import { getUserScenarioDashboardStats } from '@/lib/services/scenarios';
import { ScenarioLibraryView } from '@/components/scenarios/ScenarioLibraryView';

export const metadata = {
  title: 'Real-World AI Conversation Simulator | Kannada Kaliri',
  description: 'Practise conversational Kannada in realistic Karnataka scenarios with AI characters.',
};

export const dynamic = 'force-dynamic';

export default async function ScenariosPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/scenarios');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/scenarios');
  }

  const completed = await isOnboardingCompleted(user.id, supabase);
  if (!completed) {
    redirect('/onboarding');
  }

  const scenarios = getAllScenarios();
  const stats = await getUserScenarioDashboardStats(user.id, supabase);

  const completedMap: Record<string, number | null> = {};
  for (const att of stats.recentAttempts) {
    completedMap[att.scenarioId] = att.confidenceScore;
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <ScenarioLibraryView scenarios={scenarios} completedMap={completedMap} />
    </main>
  );
}

