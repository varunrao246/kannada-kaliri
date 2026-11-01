import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOnboardingCompleted } from '@/lib/services/profile';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Personalize Your Journey | Kannada for Everyone',
  description: 'Set up your personalized Kannada learning experience.',
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  // R4-F01 / T3-C01: Unauthenticated requests redirect to /login
  if (!supabase) {
    redirect('/login?redirect=/onboarding');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/onboarding');
  }

  // R4-F05 / T3-C08: Completed users accessing /onboarding redirect to /dashboard
  const completed = await isOnboardingCompleted(user.id, supabase);
  if (completed) {
    redirect('/dashboard');
  }

  // Render wizard container with authenticated user session
  return (
    <div className="min-h-screen bg-[#101D36] text-[#F8F5EE] flex flex-col justify-between selection:bg-[#D5A64A]/30">
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <OnboardingWizard initialUser={user} />
      </main>
    </div>
  );
}
