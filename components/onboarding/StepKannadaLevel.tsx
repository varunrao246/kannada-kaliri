'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Sprout,
  BookOpen,
  MessageSquareQuote,
  Target,
} from 'lucide-react';
import type { ProficiencyLevel } from '@/types/profile';

export interface StepKannadaLevelProps {
  selected?: ProficiencyLevel | null;
  onSelect?: (level: ProficiencyLevel) => void;
  onContinue?: () => void;
  onBack?: () => void;
  canContinue?: boolean;
  selectedLevel?: ProficiencyLevel | null;
  onSelectLevel?: (level: ProficiencyLevel) => void;
  onNext?: () => void;
}

export interface LevelOption {
  code: ProficiencyLevel;
  title: string;
  kannadaTitle: string;
  description: string;
  subtext: string;
}

export const KANNADA_LEVELS: LevelOption[] = [
  {
    code: 'beginner',
    title: 'Beginner',
    kannadaTitle: 'ಪ್ರಾರಂಭಿಕ (Prārambhika)',
    description: 'I am completely new to Kannada',
    subtext: 'We will start with essential sounds, greetings, and survival phrases.',
  },
  {
    code: 'elementary',
    title: 'Elementary',
    kannadaTitle: 'ಪ್ರಾಥಮಿಕ (Prāthamika)',
    description: 'I know a few words and basic phrases',
    subtext: 'We will connect words into practical full sentences for daily interactions.',
  },
  {
    code: 'intermediate',
    title: 'Intermediate',
    kannadaTitle: 'ಮಧ್ಯಂತರ (Madhyantara)',
    description: 'I can understand some Kannada but struggle to speak confidently',
    subtext: 'We will focus on fluid speech, listening comprehension, and colloquial nuances.',
  },
];

export function StepKannadaLevel({
  selected,
  onSelect,
  onContinue,
  onBack,
  canContinue,
  selectedLevel,
  onSelectLevel,
  onNext,
}: StepKannadaLevelProps) {
  const shouldReduceMotion = useReducedMotion();

  const currentSelection = selected ?? selectedLevel ?? null;

  const handleSelect = (level: ProficiencyLevel) => {
    if (onSelect) onSelect(level);
    if (onSelectLevel) onSelectLevel(level);
  };

  const handleAdvance = () => {
    if (onContinue) onContinue();
    else if (onNext) onNext();
  };

  const isEnabled = canContinue !== undefined ? canContinue : currentSelection !== null;

  const getIcon = (code: ProficiencyLevel) => {
    switch (code) {
      case 'beginner':
        return <Sprout className="w-6 h-6" />;
      case 'elementary':
        return <BookOpen className="w-6 h-6" />;
      case 'intermediate':
        return <MessageSquareQuote className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-2xl mx-auto px-4 sm:px-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D5A64A]/10 border border-[#D5A64A]/30 text-xs text-[#D5A64A] uppercase tracking-wider font-semibold mb-3">
          <Target className="w-3.5 h-3.5" />
          <span>Step 3 of 5</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EE] mb-2">
          Your Kannada Level
        </h2>
        <p className="text-[#EDE5D6]/80 text-sm sm:text-base max-w-md mx-auto">
          Choose the description that best captures your current comfort with Kannada.
        </p>
      </div>

      {/* Level Cards Stack (R1-F04) */}
      <div
        role="radiogroup"
        aria-label="Select your Kannada proficiency baseline"
        className="flex flex-col gap-4 mb-8"
      >
        {KANNADA_LEVELS.map((level) => {
          const isSelected = currentSelection === level.code;

          return (
            <motion.button
              key={level.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
              onClick={() => handleSelect(level.code)}
              className={`p-5 rounded-xl text-left border transition-all duration-200 flex items-start justify-between min-h-[96px] focus:outline-none focus:ring-2 focus:ring-[#D5A64A] cursor-pointer ${
                isSelected
                  ? 'border-[#D5A64A] bg-[#1A2E56]/80 shadow-lg gold-glow-subtle'
                  : 'border-[#D5A64A]/20 bg-[#101D36]/60 hover:border-[#D5A64A]/45 hover:bg-[#101D36]/80'
              }`}
            >
              <div className="flex items-start gap-4 pr-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#D5A64A] to-[#B5862B] text-[#101D36]'
                      : 'bg-[#1A2E56] text-[#D5A64A]'
                  }`}
                >
                  {getIcon(level.code)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif text-xl font-bold text-[#F8F5EE]">
                      {level.title}
                    </span>
                    <span className="font-kannada text-xs text-[#D5A64A] bg-[#101D36] px-2 py-0.5 rounded border border-[#D5A64A]/25">
                      {level.kannadaTitle}
                    </span>
                  </div>
                  {/* Verbatim descriptive helper copy (R1-F04) */}
                  <p className="text-sm font-semibold text-[#EDE5D6] mb-1">
                    {level.description}
                  </p>
                  <p className="text-xs text-[#EDE5D6]/70 leading-relaxed">
                    {level.subtext}
                  </p>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                  isSelected
                    ? 'border-[#D5A64A] bg-[#D5A64A] text-[#101D36]'
                    : 'border-[#EDE5D6]/40 bg-transparent'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#D5A64A]/20">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#D5A64A]/30 text-[#EDE5D6] hover:text-[#F8F5EE] hover:bg-[#1A2E56]/40 transition min-h-[44px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="w-10" />
        )}

        <button
          type="button"
          onClick={handleAdvance}
          disabled={!isEnabled}
          className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all min-h-[48px] ${
            isEnabled
              ? 'bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A] text-[#101D36] shadow-lg hover:shadow-[#D5A64A]/25 cursor-pointer'
              : 'bg-[#1A2E56] text-[#EDE5D6]/40 cursor-not-allowed border border-white/5 opacity-50'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default StepKannadaLevel;
