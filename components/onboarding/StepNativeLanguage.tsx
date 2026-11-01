'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Languages } from 'lucide-react';
import type { NativeLanguage } from '@/types/profile';

export interface StepNativeLanguageProps {
  selected?: NativeLanguage | null;
  onSelect?: (lang: NativeLanguage) => void;
  onContinue?: () => void;
  onBack?: () => void;
  canContinue?: boolean;
  selectedLanguage?: NativeLanguage | null;
  onSelectLanguage?: (lang: NativeLanguage) => void;
  onNext?: () => void;
}

export interface LanguageOption {
  code: NativeLanguage;
  name: string;
  nativeScript: string;
  sampleGreeting: string;
  badge: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeScript: 'English',
    sampleGreeting: 'Welcome',
    badge: 'Universal',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeScript: 'हिन्दी',
    sampleGreeting: 'नमस्ते',
    badge: 'Devanagari',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeScript: 'தமிழ்',
    sampleGreeting: 'வணக்கம்',
    badge: 'Dravidian Sister',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeScript: 'తెలుగు',
    sampleGreeting: 'నమస్కారం',
    badge: 'Closely Related Script',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeScript: 'മലയാളം',
    sampleGreeting: 'നമസ്കാരം',
    badge: 'Dravidian Sister',
  },
];

export function StepNativeLanguage({
  selected,
  onSelect,
  onContinue,
  onBack,
  canContinue,
  selectedLanguage,
  onSelectLanguage,
  onNext,
}: StepNativeLanguageProps) {
  const shouldReduceMotion = useReducedMotion();

  const currentSelection = selected ?? selectedLanguage ?? null;

  const handleSelect = (lang: NativeLanguage) => {
    if (onSelect) onSelect(lang);
    if (onSelectLanguage) onSelectLanguage(lang);
  };

  const handleAdvance = () => {
    if (onContinue) onContinue();
    else if (onNext) onNext();
  };

  const isEnabled = canContinue !== undefined ? canContinue : currentSelection !== null;

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
          <Languages className="w-3.5 h-3.5" />
          <span>Step 2 of 5</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EE] mb-2">
          Your Native Language
        </h2>
        <p className="text-[#EDE5D6]/80 text-sm sm:text-base max-w-md mx-auto">
          We will explain Kannada grammar, pronunciation, and vocabulary using phonetic and conceptual parallels from your primary language.
        </p>
      </div>

      {/* Language Cards Grid (R1-F03) */}
      <div
        role="radiogroup"
        aria-label="Select your native language"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8"
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentSelection === lang.code;

          return (
            <motion.button
              key={lang.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              whileHover={shouldReduceMotion ? {} : { scale: 1.015 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
              onClick={() => handleSelect(lang.code)}
              className={`p-4 rounded-xl text-left border transition-all duration-200 flex items-center justify-between min-h-[72px] focus:outline-none focus:ring-2 focus:ring-[#D5A64A] cursor-pointer ${
                isSelected
                  ? 'border-[#D5A64A] bg-[#1A2E56]/80 shadow-lg gold-glow-subtle'
                  : 'border-[#D5A64A]/20 bg-[#101D36]/60 hover:border-[#D5A64A]/45 hover:bg-[#101D36]/80'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl sm:text-2xl transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#D5A64A] to-[#B5862B] text-[#101D36]'
                      : 'bg-[#1A2E56] text-[#D5A64A]'
                  }`}
                >
                  {lang.nativeScript.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#F8F5EE]">
                      {lang.nativeScript}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#101D36] text-[#D5A64A] border border-[#D5A64A]/25">
                      {lang.name}
                    </span>
                  </div>
                  <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
                    Greeting: &ldquo;{lang.sampleGreeting}&rdquo; • {lang.badge}
                  </p>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
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

export default StepNativeLanguage;
