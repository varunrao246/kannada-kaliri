'use client';

import { useState } from 'react';
import { BookOpen, Mic, Sparkles, Compass, Check, ArrowRight, Volume2 } from 'lucide-react';
import Link from 'next/link';

interface Pillar {
  id: string;
  badge: string;
  kannadaTitle: string;
  title: string;
  tagline: string;
  description: string;
  icon: typeof BookOpen;
  features: string[];
  mockup: {
    label: string;
    phrase: string;
    transliteration: string;
    meaning: string;
    detail: string;
  };
}

const PILLARS: Pillar[] = [
  {
    id: 'learn',
    badge: 'Pillar 01',
    kannadaTitle: 'ಕನ್ನಡ ಕಲಿಯಿರಿ',
    title: 'LEARN KANNADA',
    tagline: 'Structured, intuitive foundational pedagogy',
    description:
      'Master Kannada effortlessly from scratch. Build your core vocabulary, understand pronunciation phonetic subtleties, and construct grammatically sound sentences through bite-sized modules.',
    icon: BookOpen,
    features: [
      'Phonetic Kannada alphabets with native audio syllables',
      'High-frequency vocabulary used in 90% of daily conversations',
      'Clear grammar rules explained through your native language',
      'Daily spaced-repetition micro-quizzes for lasting recall',
    ],
    mockup: {
      label: 'Interactive Lesson',
      phrase: 'ನೀವು ಹೇಗಿದ್ದೀರಾ?',
      transliteration: 'Neevu hegiddira?',
      meaning: 'How are you? (Polite & respectful)',
      detail: 'Breakdown: Neevu (You) + Hegiddira (Are doing well)',
    },
  },
  {
    id: 'speak',
    badge: 'Pillar 02',
    kannadaTitle: 'ಕನ್ನಡ ಮಾತನಾಡಿ',
    title: 'SPEAK KANNADA',
    tagline: 'AI-powered voice tutor with instant feedback',
    description:
      'Overcome speech hesitation before stepping onto the street. Speak freely with your AI Kannada Guru, practicing colloquial dialogues and receiving gentle, real-time pronunciation corrections.',
    icon: Mic,
    features: [
      'Voice-to-voice interactive conversational dialogues',
      'Indian accent-trained AI speech recognition',
      'Tone and inflection feedback for natural conversational cadence',
      'Zero judgment practice environment to build true speaking confidence',
    ],
    mockup: {
      label: 'AI Voice Feedback',
      phrase: 'ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ ಅಣ್ಣಾ',
      transliteration: 'Svalpa kadime maadi anna',
      meaning: 'Please reduce the price a little, brother',
      detail: 'Pronunciation Accuracy: 98% • Natural Intonation',
    },
  },
  {
    id: 'experience',
    badge: 'Pillar 03',
    kannadaTitle: 'ಕನ್ನಡ ಅನುಭವಿಸಿ',
    title: 'EXPERIENCE KANNADA',
    tagline: 'Immersive simulations for real life in Karnataka',
    description:
      'Step directly into genuine cultural and practical scenarios: hailing an auto on MG Road, ordering crispy dosas at CTR Malleshwaram, bargaining at KR Market, and interacting with workplace teams.',
    icon: Compass,
    features: [
      'Bangalore Auto-rickshaw negotiation simulations',
      'Darshini restaurant ordering: filter coffee, benne dose & idlis',
      'Hospital, pharmacy and medical emergency communication',
      'Office watercooler banter and polite social etiquette',
    ],
    mockup: {
      label: 'Real Scenario: Bengaluru Auto',
      phrase: 'ಇಂದಿರಾನಗರ 100 ಫೀಟ್ ರೋಡ್‌ಗೆ ಹೋಗ್ತೀರಾ?',
      transliteration: 'Indiranagara 100 feet road-ge hogteera?',
      meaning: 'Will you go to Indiranagar 100ft road?',
      detail: 'Driver: "Hogona banni saar" (Let\'s go, hop in sir!)',
    },
  },
];

export default function LearningPillars() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="features" className="py-28 bg-[#0A1222] text-[#F8F5EE] relative overflow-hidden">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#D5A64A_1px,transparent_1px)] [background-size:32px_32px] opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#101D36] border border-[#D5A64A]/30 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#D5A64A]" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#EDE5D6]">
              Our Learning Methodology
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F5EE] mb-6">
            Three Pillars of Fluency
          </h2>

          <p className="text-base sm:text-lg text-[#EDE5D6]/80 leading-relaxed">
            A comprehensive, three-dimensional pedagogy engineered specifically for non-native speakers living,
            working and travelling in Karnataka.
          </p>
        </div>

        {/* Desktop Tabs / Pill Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#101D36]/80 border border-[#D5A64A]/25 backdrop-blur-md">
            {PILLARS.map((pillar, idx) => (
              <button
                key={pillar.id}
                onClick={() => setActiveTab(idx)}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 flex items-center gap-2.5 ${
                  activeTab === idx
                    ? 'bg-[#D5A64A] text-[#101D36] shadow-lg font-bold'
                    : 'text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5'
                }`}
              >
                <span>{pillar.title}</span>
                <span className={`text-[11px] font-kannada hidden sm:inline ${activeTab === idx ? 'text-[#101D36]' : 'text-[#D5A64A]'}`}>
                  {pillar.kannadaTitle}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Pillar Detailed Showcase */}
        {PILLARS.map((pillar, idx) => {
          if (idx !== activeTab) return null;
          const Icon = pillar.icon;

          return (
            <div
              key={pillar.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#101D36]/60 border border-[#D5A64A]/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl animate-fadeIn"
            >
              {/* Left Column: Description & Features */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D5A64A] bg-[#D5A64A]/10 px-3 py-1 rounded-full border border-[#D5A64A]/30">
                    {pillar.badge}
                  </span>
                  <span className="text-sm font-kannada text-[#EDE5D6]/70">
                    {pillar.kannadaTitle}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-4xl font-bold text-[#F8F5EE]">
                  {pillar.title}
                </h3>

                <p className="text-lg text-[#D5A64A] font-medium font-sans">
                  {pillar.tagline}
                </p>

                <p className="text-[#EDE5D6]/85 leading-relaxed text-sm sm:text-base font-normal">
                  {pillar.description}
                </p>

                <div className="space-y-3 pt-2">
                  {pillar.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#D5A64A]/15 border border-[#D5A64A]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#D5A64A]" />
                      </div>
                      <span className="text-sm text-[#EDE5D6]/90">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#101D36] bg-[#D5A64A] hover:bg-[#E8C77F] transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span>Try This Pillar Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Interactive Micro-Simulator Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-[#0A1222]/90 border border-[#D5A64A]/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
                  {/* Subtle card glow */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#D5A64A]/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-[#D5A64A]/20 pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#EDE5D6]">
                        {pillar.mockup.label}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#1A2E56] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#D5A64A]" />
                    </div>
                  </div>

                  {/* Kannada Phrase Showcase */}
                  <div className="bg-[#101D36] rounded-xl p-5 border border-[#D5A64A]/25 mb-4 text-center">
                    <span className="block text-xs uppercase tracking-widest text-[#D5A64A]/80 mb-2 font-mono">
                      Spoken Kannada
                    </span>
                    <h4 className="font-kannada text-2xl sm:text-3xl font-bold text-[#F8F5EE] mb-2 leading-relaxed">
                      {pillar.mockup.phrase}
                    </h4>
                    <p className="text-sm font-mono text-[#D5A64A] mb-1">
                      &quot;{pillar.mockup.transliteration}&quot;
                    </p>
                    <p className="text-xs text-[#EDE5D6]/80 italic">
                      {pillar.mockup.meaning}
                    </p>
                  </div>

                  {/* Breakdown pill */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3.5 text-xs text-[#EDE5D6]/85 flex items-center justify-between">
                    <span>{pillar.mockup.detail}</span>
                    <Volume2 className="w-4 h-4 text-[#D5A64A] shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
