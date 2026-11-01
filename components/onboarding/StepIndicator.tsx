'use client';

import { ArrowLeft, Check } from 'lucide-react';

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  onBack: () => void;
  canGoBack?: boolean;
}

const STEP_LABELS = [
  'Welcome',
  'Native Language',
  'Kannada Level',
  'Goals',
  'Commitment',
];

export default function StepIndicator({
  currentStep,
  totalSteps = 5,
  onBack,
  canGoBack = true,
}: StepIndicatorProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Navigation Row: Back Button & Step Counter */}
      <div className="flex items-center justify-between min-h-[44px]">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5 border border-transparent hover:border-[#D5A64A]/30 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="Go back to previous step"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="w-10 min-h-[44px]" />
        )}

        <div className="text-xs uppercase tracking-widest font-semibold text-[#D5A64A]">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 rounded-full bg-[#1A2E56] border border-[#D5A64A]/20 overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Step ${currentStep} of ${totalSteps}`}
          className="h-full bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Pills / Breadcrumbs */}
      <div className="hidden sm:flex items-center justify-between pt-1">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-[#D5A64A] text-[#101D36]'
                    : isCurrent
                    ? 'bg-[#D5A64A] text-[#101D36] ring-2 ring-[#D5A64A]/50 ring-offset-2 ring-offset-[#101D36]'
                    : 'bg-[#1A2E56] text-[#EDE5D6]/40 border border-[#D5A64A]/20'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNum}
              </div>
              <span
                className={`text-xs ${
                  isCurrent
                    ? 'text-[#F8F5EE] font-semibold'
                    : isDone
                    ? 'text-[#D5A64A]'
                    : 'text-[#EDE5D6]/40'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
