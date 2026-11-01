'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Clock,
  Edit3,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import type {
  NativeLanguage,
  ProficiencyLevel,
  DailyGoalMinutes,
} from '@/types/profile';

export interface StepCommitmentSummaryProps {
  selectedCommitment: DailyGoalMinutes;
  onSelectCommitment: (minutes: DailyGoalMinutes) => void;
  formData?: {
    native_language: NativeLanguage | null;
    proficiency_level: ProficiencyLevel | null;
    learning_goals: string[];
    daily_goal_minutes?: DailyGoalMinutes;
  };
  summaryData?: {
    nativeLanguage: NativeLanguage | null;
    proficiencyLevel: ProficiencyLevel | null;
    learningGoals: string[];
  };
  onEditStep: (stepNumber: number) => void;
  onSubmit: () => void;
  onBack?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export interface CommitmentCard {
  minutes: DailyGoalMinutes;
  label: string;
  kannadaLabel: string;
  paceDescription: string;
  tag: string;
}

export const COMMITMENT_INTERVALS: CommitmentCard[] = [
  {
    minutes: 5,
    label: '5 Minutes',
    kannadaLabel: '೫ ನಿಮಿಷ / ದಿನ',
    paceDescription: 'Quick bite-sized micro lessons for busy days',
    tag: 'Casual',
  },
  {
    minutes: 10,
    label: '10 Minutes',
    kannadaLabel: '೧೦ ನಿಮಿಷ / ದಿನ',
    paceDescription: 'Consistent habit ideal for long-term retention',
    tag: 'Recommended',
  },
  {
    minutes: 15,
    label: '15 Minutes',
    kannadaLabel: '೧೫ ನಿಮಿಷ / ದಿನ',
    paceDescription: 'Accelerated path with deep conversational drills',
    tag: 'Fast Pace',
  },
  {
    minutes: 20,
    label: '20 Minutes',
    kannadaLabel: '೨೦ ನಿಮಿಷ / ದಿನ',
    paceDescription: 'Intensive immersion for rapid conversational fluency',
    tag: 'Deep Dive',
  },
];

const LANGUAGE_LABELS: Record<NativeLanguage, { name: string; script: string }> = {
  en: { name: 'English', script: 'English' },
  hi: { name: 'Hindi', script: 'हिन्दी' },
  ta: { name: 'Tamil', script: 'தமிழ்' },
  te: { name: 'Telugu', script: 'తెలుగు' },
  ml: { name: 'Malayalam', script: 'മലയാളം' },
};

const LEVEL_LABELS: Record<ProficiencyLevel, { title: string; desc: string }> = {
  beginner: { title: 'Beginner', desc: 'I am completely new to Kannada' },
  elementary: { title: 'Elementary', desc: 'I know a few words and basic phrases' },
  intermediate: {
    title: 'Intermediate',
    desc: 'I can understand some Kannada but struggle to speak confidently',
  },
};

const GOAL_LABELS: Record<string, string> = {
  everyday_conversations: 'Everyday conversations',
  college_and_education: 'College and education',
  workplace_communication: 'Workplace communication',
  shopping_and_daily_activities: 'Shopping and daily activities',
  travel_and_exploring_karnataka: 'Travel and exploring Karnataka',
  communicating_with_local_communities: 'Communicating with local communities',
  understanding_kannada_culture: 'Understanding Kannada culture',
};

export function StepCommitmentSummary({
  selectedCommitment,
  onSelectCommitment,
  formData,
  summaryData,
  onEditStep,
  onSubmit,
  onBack,
  isSubmitting = false,
  error = null,
}: StepCommitmentSummaryProps) {
  const shouldReduceMotion = useReducedMotion();

  const nativeLanguage =
    summaryData?.nativeLanguage ?? formData?.native_language ?? null;
  const proficiencyLevel =
    summaryData?.proficiencyLevel ?? formData?.proficiency_level ?? null;
  const learningGoals =
    summaryData?.learningGoals ?? formData?.learning_goals ?? [];

  const langInfo = nativeLanguage
    ? LANGUAGE_LABELS[nativeLanguage]
    : { name: 'Not selected', script: '' };

  const levelInfo = proficiencyLevel
    ? LEVEL_LABELS[proficiencyLevel]
    : { title: 'Not selected', desc: '' };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-2xl mx-auto px-4 sm:px-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D5A64A]/10 border border-[#D5A64A]/30 text-xs text-[#D5A64A] uppercase tracking-wider font-semibold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Step 5 of 5</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EE] mb-2">
          Your Daily Learning Commitment &amp; Summary
        </h2>
        <p className="text-[#EDE5D6]/80 text-sm sm:text-base max-w-md mx-auto">
          Choose how much time you want to spend each day, then review your profile before beginning.
        </p>
      </div>

      {/* Error Banner if submission fails */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-start gap-3 backdrop-blur-md animate-fade-in"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-sm">Submission Error</div>
            <div className="text-xs text-red-300 mt-0.5 leading-relaxed">{error}</div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="mt-2 text-xs font-bold text-[#D5A64A] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Retry Submission &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Daily Commitment Single-Select Cards (R1-F06) */}
      <div className="mb-8">
        <label className="block text-xs uppercase tracking-wider text-[#D5A64A] font-semibold mb-3">
          Select Your Daily Goal:
        </label>
        <div
          role="radiogroup"
          aria-label="Select daily commitment"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {COMMITMENT_INTERVALS.map((item) => {
            const isSelected = selectedCommitment === item.minutes;

            return (
              <button
                key={item.minutes}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectCommitment(item.minutes)}
                className={`p-3.5 rounded-xl text-center border transition-all duration-200 flex flex-col items-center justify-between min-h-[96px] focus:outline-none focus:ring-2 focus:ring-[#D5A64A] cursor-pointer ${
                  isSelected
                    ? 'border-[#D5A64A] bg-[#1A2E56] shadow-md gold-glow-subtle'
                    : 'border-[#D5A64A]/20 bg-[#101D36]/60 hover:border-[#D5A64A]/45 hover:bg-[#101D36]/80'
                }`}
              >
                <span className="text-xs font-semibold text-[#D5A64A] mb-1">
                  {item.tag}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#F8F5EE]">
                  {item.minutes} min
                </span>
                <span className="font-kannada text-[11px] text-[#EDE5D6]/70 mt-1">
                  {item.kannadaLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Summary Card (R1-F06) */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-[#D5A64A]/30 mb-8 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D5A64A]/20">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#D5A64A]" />
            <h3 className="font-serif text-lg font-bold text-[#F8F5EE]">
              Your Profile Confirmation
            </h3>
          </div>
          <span className="text-xs text-[#D5A64A] bg-[#101D36] px-2.5 py-1 rounded-full border border-[#D5A64A]/25">
            Ready to Build
          </span>
        </div>

        <div className="space-y-4 text-left">
          {/* Native Language Summary Row */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
            <div>
              <span className="text-xs text-[#D5A64A] uppercase tracking-wider block font-semibold">
                Native Language
              </span>
              <span className="text-base font-bold text-[#F8F5EE]">
                {langInfo.name} ({langInfo.script})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="inline-flex items-center gap-1 text-xs text-[#D5A64A] hover:text-[#E8C77F] p-1.5 rounded-lg hover:bg-[#1A2E56]/50 transition cursor-pointer"
              title="Change native language"
              aria-label="Edit native language"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Kannada Baseline Row */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
            <div>
              <span className="text-xs text-[#D5A64A] uppercase tracking-wider block font-semibold">
                Kannada Level
              </span>
              <span className="text-base font-bold text-[#F8F5EE] block">
                {levelInfo.title}
              </span>
              <span className="text-xs text-[#EDE5D6]/80 block mt-0.5">
                &ldquo;{levelInfo.desc}&rdquo;
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="inline-flex items-center gap-1 text-xs text-[#D5A64A] hover:text-[#E8C77F] p-1.5 rounded-lg hover:bg-[#1A2E56]/50 transition cursor-pointer"
              title="Change Kannada level"
              aria-label="Edit Kannada level"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Learning Goals Row */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex-1 pr-2">
              <span className="text-xs text-[#D5A64A] uppercase tracking-wider block font-semibold mb-1.5">
                Learning Goals ({learningGoals.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {learningGoals.map((goalCode) => (
                  <span
                    key={goalCode}
                    className="text-xs px-2.5 py-1 rounded-md bg-[#1A2E56] text-[#F8F5EE] border border-[#D5A64A]/25"
                  >
                    {GOAL_LABELS[goalCode] || goalCode}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="inline-flex items-center gap-1 text-xs text-[#D5A64A] hover:text-[#E8C77F] p-1.5 rounded-lg hover:bg-[#1A2E56]/50 transition shrink-0 cursor-pointer"
              title="Change learning goals"
              aria-label="Edit learning goals"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Daily Commitment Row */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-[#D5A64A] uppercase tracking-wider block font-semibold">
                Daily Goal
              </span>
              <span className="text-base font-bold text-[#F8F5EE]">
                {selectedCommitment} minutes every day
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Action (R1-F06) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#D5A64A]/20">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#D5A64A]/30 text-[#EDE5D6] hover:text-[#F8F5EE] hover:bg-[#1A2E56]/40 transition min-h-[44px] disabled:opacity-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="w-10" />
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A] text-[#101D36] font-bold text-base sm:text-lg rounded-xl shadow-xl hover:shadow-[#D5A64A]/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#D5A64A] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#101D36]" />
              <span>Creating Your Journey...</span>
            </>
          ) : (
            <>
              <span>Create My Learning Journey</span>
              <Sparkles className="w-5 h-5 text-[#101D36]" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default StepCommitmentSummary;
