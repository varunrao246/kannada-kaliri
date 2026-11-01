import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import { createClient } from '@/lib/supabase/server';
import { isOnboardingCompleted } from '@/lib/services/profile';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sign In | Kannada for Everyone',
  description: 'Log in to your Kannada for Everyone account to continue learning.',
};

export default async function LoginPage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Requirement R4: Authenticated users visiting /login redirect based on onboarding completion status
    if (user) {
      const completed = await isOnboardingCompleted(user.id, supabase);
      if (completed) {
        redirect('/dashboard');
      } else {
        redirect('/onboarding');
      }
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#101D36] text-[#F8F5EE]">
      {/* LEFT COLUMN: Visual & Cultural Storytelling (Mysore Palace) */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 overflow-hidden bg-[#0A1222] border-r border-[#D5A64A]/25">
        {/* Background Image with Dark Navy Overlays */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/mysore-palace.jpg"
            alt="Mysore Palace illuminated at night"
            fill
            priority
            sizes="50vw"
            className="object-cover object-center filter brightness-[0.6] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101D36] via-[#101D36]/80 to-[#0A1222]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(213,166,74,0.12)_0%,transparent_60%)]" />
        </div>

        {/* Top: Brand Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D5A64A] via-[#B5862B] to-[#101D36] p-[1.5px] shadow-lg">
              <div className="w-full h-full bg-[#101D36] rounded-[7px] flex items-center justify-center border border-[#D5A64A]/30">
                <span className="font-serif font-bold text-lg text-[#D5A64A]">ಕ</span>
              </div>
            </div>
            <div>
              <span className="font-serif text-base font-bold tracking-wide text-[#F8F5EE] group-hover:text-[#D5A64A] transition-colors">
                KANNADA FOR EVERYONE
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#D5A64A] block">
                ಕನ್ನಡ ಕಲಿರಿ
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Editorial Brand Manifesto */}
        <div className="relative z-10 space-y-6 max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#101D36]/80 border border-[#D5A64A]/30 text-xs text-[#D5A64A] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mysuru • Bengaluru • Karnataka</span>
          </div>

          <h1 className="font-serif text-3xl xl:text-4xl font-bold text-[#F8F5EE] leading-tight">
            A new language.{' '}
            <span className="gold-gradient-text block">
              A new connection.
            </span>
          </h1>

          <p className="text-sm text-[#EDE5D6]/80 leading-relaxed font-sans">
            &quot;Kannada is more than a language. It is the warmth of a morning filter coffee, the banter with your auto driver, and the pride of belonging to Karnataka.&quot;
          </p>

          <div className="p-4 rounded-xl bg-white/[0.04] border border-[#D5A64A]/20 backdrop-blur-md">
            <span className="text-xs font-kannada text-[#D5A64A] block mb-1">
              ಕಲಿಯಿರಿ • ಮಾತನಾಡಿ • ಬೆರೆಯಿರಿ
            </span>
            <span className="text-xs text-[#EDE5D6]/70 italic">
              Learn • Speak • Belong
            </span>
          </div>
        </div>

        {/* Bottom: Back to Home link */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#EDE5D6]/70 hover:text-[#D5A64A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Kannada for Everyone homepage</span>
          </Link>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative">
        {/* Mobile Header */}
        <div className="flex items-center justify-between lg:hidden mb-8 pb-4 border-b border-[#D5A64A]/20">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D5A64A] flex items-center justify-center text-[#101D36] font-serif font-bold text-sm">
              ಕ
            </div>
            <span className="font-serif text-sm font-bold text-[#F8F5EE]">
              KANNADA FOR EVERYONE
            </span>
          </Link>
          <Link href="/" className="text-xs text-[#D5A64A] flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Home</span>
          </Link>
        </div>

        {/* Center Auth Card */}
        <div className="my-auto py-6">
          <Suspense fallback={<div className="text-center text-sm text-[#EDE5D6]/60">Loading sign in...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 text-center text-[11px] text-[#EDE5D6]/50">
          Protected by Supabase Authentication with enterprise-grade encryption.
        </div>
      </div>
    </div>
  );
}
