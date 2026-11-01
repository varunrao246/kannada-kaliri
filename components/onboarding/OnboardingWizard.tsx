'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type {
  NativeLanguage,
  ProficiencyLevel,
  DailyGoalMinutes,
  CreateLearnerProfileDTO,
} from '@/types/profile';
import { createLearnerProfile } from '@/lib/services/profile';
import StepIndicator from './StepIndicator';
import StepWelcome from './StepWelcome';
import StepNativeLanguage from './StepNativeLanguage';
import StepKannadaLevel from './StepKannadaLevel';
import StepLearningGoals from './StepLearningGoals';
import StepCommitmentSummary from './StepCommitmentSummary';
import OnboardingSuccess from './OnboardingSuccess';
import { AlertCircle } from 'lucide-react';

export interface OnboardingWizardProps {
  initialUser: SupabaseUser;
}

export interface WizardFormData {
  native_language: NativeLanguage | null;
  proficiency_level: ProficiencyLevel | null;
  learning_goals: string[];
  daily_goal_minutes: DailyGoalMinutes;
}

export function resolveDisplayName(
  meta?: { full_name?: string | null; name?: string | null },
  email?: string
): string {
  const raw = meta?.full_name?.trim() || meta?.name?.trim();
  if (raw) return raw;
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0].trim();
    if (prefix) return prefix;
  }
  return 'Learner';
}

export function resolveAvatarUrl(meta?: {
  avatar_url?: string | null;
  picture?: string | null;
}): string | null {
  return meta?.avatar_url || meta?.picture || null;
}

export default function OnboardingWizard({ initialUser }: OnboardingWizardProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<WizardFormData>({
    native_language: null,
    proficiency_level: null,
    learning_goals: [],
    daily_goal_minutes: 10,
  });

  const displayName = resolveDisplayName(
    initialUser.user_metadata as { full_name?: string | null; name?: string | null } | undefined,
    initialUser.email
  );
  const avatarUrl = resolveAvatarUrl(
    initialUser.user_metadata as { avatar_url?: string | null; picture?: string | null } | undefined
  );

  // Validation Rules per step
  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return formData.native_language !== null;
      case 3:
        return formData.proficiency_level !== null;
      case 4:
        return formData.learning_goals.length >= 1;
      case 5:
        return formData.daily_goal_minutes !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    setError(null);
    if (step < 5) {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1 && !isSubmitting) {
      setError(null);
      setDirection(-1);
      setStep((prev) => prev - 1);
    }
  };

  const handleStart = () => {
    setDirection(1);
    setStep(2);
  };

  const handleEditStep = (targetStep: number) => {
    if (targetStep >= 1 && targetStep <= 5 && !isSubmitting) {
      setError(null);
      setDirection(targetStep < step ? -1 : 1);
      setStep(targetStep);
    }
  };

  const setNativeLanguage = (code: NativeLanguage) => {
    setFormData((prev) => ({ ...prev, native_language: code }));
  };

  const setProficiencyLevel = (level: ProficiencyLevel) => {
    setFormData((prev) => ({ ...prev, proficiency_level: level }));
  };

  const toggleLearningGoal = (goalCode: string) => {
    setFormData((prev) => {
      const exists = prev.learning_goals.includes(goalCode);
      const updated = exists
        ? prev.learning_goals.filter((g) => g !== goalCode)
        : [...new Set([...prev.learning_goals, goalCode])];
      return { ...prev, learning_goals: updated };
    });
  };

  const setCommitment = (minutes: DailyGoalMinutes) => {
    setFormData((prev) => ({ ...prev, daily_goal_minutes: minutes }));
  };

  const handleSubmit = async () => {
    if (
      !formData.native_language ||
      !formData.proficiency_level ||
      formData.learning_goals.length === 0
    ) {
      setError('Please complete all required selections before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateLearnerProfileDTO = {
        user_id: initialUser.id,
        full_name: displayName,
        avatar_url: avatarUrl,
        native_language: formData.native_language,
        target_language: 'kn',
        proficiency_level: formData.proficiency_level,
        learning_goals: formData.learning_goals,
        daily_goal_minutes: formData.daily_goal_minutes,
        onboarding_completed: true,
      };

      await createLearnerProfile(payload);
      router.refresh();
      setIsCompleted(true);
    } catch (err) {
      console.error('Failed to create profile:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save your profile. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Directional Animation Variants with Reduced Motion Fallback
  const variants: Variants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? 30 : -30,
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.99,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.15 : 0.3,
        ease: 'easeOut' as const,
      },
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir < 0 ? 30 : -30,
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.99,
      transition: {
        duration: shouldReduceMotion ? 0.1 : 0.2,
        ease: 'easeIn' as const,
      },
    }),
  };

  if (isCompleted) {
    return (
      <div className="w-full max-w-3xl mx-auto py-6 sm:py-10">
        <OnboardingSuccess
          formData={{
            native_language: formData.native_language,
            proficiency_level: formData.proficiency_level,
            learning_goals: formData.learning_goals,
            daily_goal_minutes: formData.daily_goal_minutes,
          }}
          userName={displayName}
          onEnterDashboard={() => router.push('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 py-4 sm:py-8">
      {/* Step Indicator Header (Steps 2-5) */}
      {step > 1 && (
        <StepIndicator
          currentStep={step}
          totalSteps={5}
          onBack={handleBack}
          canGoBack={step > 1 && !isSubmitting}
        />
      )}

      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-sm flex items-start gap-3 backdrop-blur-md animate-fade-in"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Submission Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Step Container with Framer Motion */}
      <div className="relative rounded-3xl bg-[#0A1222]/90 border border-[#D5A64A]/30 p-6 sm:p-10 shadow-2xl overflow-hidden glass-panel">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            {step === 1 && (
              <StepWelcome
                displayName={displayName}
                avatarUrl={avatarUrl}
                onStart={handleStart}
              />
            )}

            {step === 2 && (
              <StepNativeLanguage
                selected={formData.native_language}
                onSelect={setNativeLanguage}
                onContinue={handleNext}
                onBack={handleBack}
                canContinue={canAdvance()}
              />
            )}

            {step === 3 && (
              <StepKannadaLevel
                selected={formData.proficiency_level}
                onSelect={setProficiencyLevel}
                onContinue={handleNext}
                onBack={handleBack}
                canContinue={canAdvance()}
              />
            )}

            {step === 4 && (
              <StepLearningGoals
                selectedGoals={formData.learning_goals}
                onToggleGoal={toggleLearningGoal}
                onContinue={handleNext}
                onBack={handleBack}
                canContinue={canAdvance()}
              />
            )}

            {step === 5 && (
              <StepCommitmentSummary
                formData={formData}
                selectedCommitment={formData.daily_goal_minutes}
                onSelectCommitment={setCommitment}
                onEditStep={handleEditStep}
                onSubmit={handleSubmit}
                onBack={handleBack}
                isSubmitting={isSubmitting}
                error={error}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
