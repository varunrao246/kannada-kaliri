'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen, Compass, Award } from 'lucide-react';

export interface StepWelcomeProps {
  displayName?: string;
  avatarUrl?: string | null;
  user?: {
    fullName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  onStart?: () => void;
  onNext?: () => void;
}

export function StepWelcome({
  displayName: propDisplayName,
  avatarUrl: propAvatarUrl,
  user,
  onStart,
  onNext,
}: StepWelcomeProps) {
  const shouldReduceMotion = useReducedMotion();
  const [imageError, setImageError] = useState(false);

  const handleAdvance = () => {
    if (onStart) {
      onStart();
    } else if (onNext) {
      onNext();
    }
  };

  // Fallback Name Resolution (R1-B01)
  const resolvedName =
    propDisplayName?.trim() ||
    user?.fullName?.trim() ||
    (user?.email && user.email.includes('@') ? user.email.split('@')[0].trim() : '') ||
    'Learner';

  const resolvedAvatarUrl = propAvatarUrl ?? user?.avatarUrl ?? null;
  const avatarInitial = (resolvedName[0] || 'L').toUpperCase();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-2xl mx-auto text-center px-4 sm:px-6"
    >
      {/* Avatar Badge with Stylized Fallback (R1-F02) */}
      <div className="flex justify-center mb-6">
        <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#D5A64A] via-[#E8C77F] to-[#B5862B] shadow-xl gold-glow-subtle">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#101D36] flex items-center justify-center border-2 border-[#101D36]">
            {resolvedAvatarUrl && !imageError ? (
              <Image
                src={resolvedAvatarUrl}
                alt={resolvedName}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#D5A64A]">
                {avatarInitial}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#D5A64A] text-[#101D36] p-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Kannada Greeting & Welcome Header (R1-F01) */}
      <h1 className="font-kannada text-4xl sm:text-5xl font-bold gold-gradient-text tracking-wide mb-3 leading-relaxed">
        ನಮಸ್ಕಾರ!
      </h1>
      <p className="font-serif text-2xl sm:text-3xl text-[#F8F5EE] font-semibold mb-4">
        Welcome, {resolvedName}
      </p>

      {/* Verbatim Supporting Copy (R1-F01) */}
      <p className="text-[#EDE5D6]/90 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8 font-sans">
        Let&apos;s make Kannada a part of your everyday life. Tell us a little about yourself. We&apos;ll create a Kannada learning experience that matches your language, pace and goals.
      </p>

      {/* Value Pillars Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 text-left">
        <div className="glass-panel p-3.5 rounded-xl border border-[#D5A64A]/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D5A64A]/15 flex items-center justify-center text-[#D5A64A] shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#D5A64A] font-semibold uppercase tracking-wider">Pillar 1</div>
            <div className="text-xs text-[#F8F5EE] font-medium">Tailored to Your Mother Tongue</div>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-[#D5A64A]/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D5A64A]/15 flex items-center justify-center text-[#D5A64A] shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#D5A64A] font-semibold uppercase tracking-wider">Pillar 2</div>
            <div className="text-xs text-[#F8F5EE] font-medium">Real-Life Contexts</div>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-[#D5A64A]/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D5A64A]/15 flex items-center justify-center text-[#D5A64A] shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#D5A64A] font-semibold uppercase tracking-wider">Pillar 3</div>
            <div className="text-xs text-[#F8F5EE] font-medium">Your Daily Pace</div>
          </div>
        </div>
      </div>

      {/* CTA Button "Let's Begin" (R1-F01) */}
      <button
        type="button"
        onClick={handleAdvance}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A] text-[#101D36] font-bold text-lg rounded-xl shadow-lg hover:shadow-[#D5A64A]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#D5A64A] focus:ring-offset-2 focus:ring-offset-[#101D36] cursor-pointer"
      >
        <span>Let&apos;s Begin</span>
        <ArrowRight className="w-5 h-5 text-[#101D36]" />
      </button>
    </motion.div>
  );
}

export default StepWelcome;
