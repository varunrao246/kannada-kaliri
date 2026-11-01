'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2, Compass, BookOpen, Clock } from 'lucide-react';
import type { LearnerProfile, CreateLearnerProfileDTO } from '@/types/profile';

export interface OnboardingSuccessProps {
  formData?: {
    native_language: string | null;
    proficiency_level: string | null;
    learning_goals: string[];
    daily_goal_minutes: number;
  };
  profile?: Partial<LearnerProfile | CreateLearnerProfileDTO>;
  userName?: string;
  onEnterDashboard?: () => void;
}

export function OnboardingSuccess({
  formData,
  profile,
  userName = 'Learner',
  onEnterDashboard,
}: OnboardingSuccessProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleEnterDashboard = () => {
    if (onEnterDashboard) {
      onEnterDashboard();
    } else {
      router.push('/dashboard');
    }
  };

  const nativeLanguage =
    profile?.native_language || formData?.native_language || 'en';
  const proficiencyLevel =
    profile?.proficiency_level || formData?.proficiency_level || 'beginner';
  const dailyGoalMinutes =
    profile?.daily_goal_minutes || formData?.daily_goal_minutes || 10;
  const learningGoals =
    profile?.learning_goals || formData?.learning_goals || [];

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="max-w-2xl mx-auto text-center px-4 sm:px-6 py-6"
    >
      {/* Celebration Icon */}
      <div className="flex justify-center mb-6">
        <div className="relative p-3 rounded-full bg-gradient-to-tr from-[#D5A64A] via-[#E8C77F] to-[#B5862B] shadow-2xl gold-glow">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#101D36] flex items-center justify-center border-2 border-[#101D36]">
            <CheckCircle2 className="w-12 h-12 text-[#D5A64A]" />
          </div>
        </div>
      </div>

      {/* Verbatim Celebration Heading (R1-F07) */}
      <h1 className="font-kannada text-3xl sm:text-4xl lg:text-5xl font-bold gold-gradient-text tracking-wide mb-3 leading-relaxed">
        ನಮಸ್ಕಾರ! Your Kannada journey begins.
      </h1>

      <p className="font-serif text-xl sm:text-2xl text-[#F8F5EE] font-semibold mb-4">
        You are all set, {userName}!
      </p>

      {/* Supporting Copy */}
      <p className="text-[#EDE5D6]/90 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-8 font-sans">
        We&apos;ve customized your learning path based on your language background, proficiency baseline, and personal daily schedule.
      </p>

      {/* Quick Summary Recap Grid */}
      <div className="glass-panel p-5 rounded-2xl border border-[#D5A64A]/25 max-w-lg mx-auto mb-10 text-left grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D5A64A]/15 text-[#D5A64A] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[#D5A64A] uppercase tracking-wider block font-semibold">
              Language
            </span>
            <span className="text-sm font-bold text-[#F8F5EE] uppercase">
              {nativeLanguage} &rarr; Kannada
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D5A64A]/15 text-[#D5A64A] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[#D5A64A] uppercase tracking-wider block font-semibold">
              Level
            </span>
            <span className="text-sm font-bold text-[#F8F5EE] capitalize">
              {proficiencyLevel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D5A64A]/15 text-[#D5A64A] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[#D5A64A] uppercase tracking-wider block font-semibold">
              Daily Goal
            </span>
            <span className="text-sm font-bold text-[#F8F5EE]">
              {dailyGoalMinutes} min / day
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D5A64A]/15 text-[#D5A64A] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[#D5A64A] uppercase tracking-wider block font-semibold">
              Focus Areas
            </span>
            <span className="text-sm font-bold text-[#F8F5EE]">
              {learningGoals.length} {learningGoals.length === 1 ? 'Goal' : 'Goals'}
            </span>
          </div>
        </div>
      </div>

      {/* Verbatim CTA "Enter My Dashboard" (R1-F07) */}
      <button
        type="button"
        onClick={handleEnterDashboard}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A] text-[#101D36] font-bold text-lg rounded-xl shadow-xl hover:shadow-[#D5A64A]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#D5A64A] focus:ring-offset-2 focus:ring-offset-[#101D36] cursor-pointer"
      >
        <span>Enter My Dashboard</span>
        <ArrowRight className="w-5 h-5 text-[#101D36]" />
      </button>
    </motion.div>
  );
}

export default OnboardingSuccess;
