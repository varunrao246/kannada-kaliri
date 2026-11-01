import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOnboardingCompleted } from '@/lib/services/profile';
import { getScenarioById } from '@/lib/scenarios/data';
import { buildLearnerTutoringContext } from '@/lib/ai/tutor/context';
import {
  getOrCreateActiveScenarioAttempt,
  getScenarioMessages,
} from '@/lib/services/scenarios';
import { isTutorAIConfigured, getTutorAIConfig } from '@/lib/ai/tutor/config';
import { ScenarioSimulatorView } from '@/components/scenarios/ScenarioSimulatorView';

interface ScenarioPageProps {
  params: Promise<{ scenarioId: string }>;
}

export async function generateMetadata({ params }: ScenarioPageProps) {
  const { scenarioId } = await params;
  const scenario = getScenarioById(scenarioId);

  return {
    title: scenario
      ? `${scenario.title} (${scenario.character.name}) | Conversation Simulator`
      : 'Scenario Simulator | Kannada Kaliri',
    description: scenario?.description || 'Practise spoken Kannada in real-world scenarios.',
  };
}

export const dynamic = 'force-dynamic';

export default async function ScenarioDetailPage({ params }: ScenarioPageProps) {
  const { scenarioId } = await params;
  const scenario = getScenarioById(scenarioId);

  if (!scenario) {
    notFound();
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect(`/login?redirect=/scenarios/${scenarioId}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/scenarios/${scenarioId}`);
  }

  const completed = await isOnboardingCompleted(user.id, supabase);
  if (!completed) {
    redirect('/onboarding');
  }

  const [learnerContext, attempt] = await Promise.all([
    buildLearnerTutoringContext(user.id, supabase),
    getOrCreateActiveScenarioAttempt(user.id, scenario.id, supabase),
  ]);

  const messages = await getScenarioMessages(attempt.id, supabase);
  const config = getTutorAIConfig();
  const isAIConfigured = isTutorAIConfigured() || config.provider === 'mock';

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <ScenarioSimulatorView
        scenario={scenario}
        learnerContext={learnerContext}
        attemptId={attempt.id}
        initialMessages={messages}
        isAIConfigured={isAIConfigured}
      />
    </main>
  );
}

