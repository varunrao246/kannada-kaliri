import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOnboardingCompleted } from '@/lib/services/profile';
import { buildLearnerTutoringContext } from '@/lib/ai/tutor/context';
import {
  getOrCreateActiveConversation,
  getConversationMessages,
} from '@/lib/services/guru-history';
import { isTutorAIConfigured, getTutorAIConfig } from '@/lib/ai/tutor/config';
import { GuruChatView } from '@/components/guru/GuruChatView';

export const metadata = {
  title: 'AI Kannada Guru | Kannada Kaliri',
  description: 'Personalized AI Kannada language tutor with cultural context and native-language explanations.',
};

export const dynamic = 'force-dynamic';

export default async function GuruPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/guru');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/guru');
  }

  // Confirm learner has finished onboarding
  const completed = await isOnboardingCompleted(user.id, supabase);
  if (!completed) {
    redirect('/onboarding');
  }

  // Load learner tutoring context & conversation history
  const [learnerContext, conversation] = await Promise.all([
    buildLearnerTutoringContext(user.id, supabase),
    getOrCreateActiveConversation(user.id, supabase),
  ]);

  const messages = await getConversationMessages(conversation.id, supabase);
  const config = getTutorAIConfig();
  const isAIConfigured = isTutorAIConfigured() || config.provider === 'mock';

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <GuruChatView
        initialContext={learnerContext}
        initialMessages={messages}
        conversationId={conversation.id}
        isAIConfigured={isAIConfigured}
      />
    </main>
  );
}

