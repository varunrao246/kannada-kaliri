'use client';

import { Languages, GraduationCap, Bot, MessageCircleHeart, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    number: '01',
    icon: Languages,
    title: 'Choose Your Native Language',
    kannadaTag: 'ನಿಮ್ಮ ಮಾತೃಭಾಷೆ',
    description:
      'Begin from your natural point of comfort. Choose English, Hindi, Tamil, Telugu, Malayalam or Marathi to understand grammar nuances and cultural parallels instinctively.',
    highlight: 'Multilingual bridging from Day 1',
  },
  {
    number: '02',
    icon: GraduationCap,
    title: 'Learn at Your Personalized Level',
    kannadaTag: 'ನಿಮ್ಮ ಹಂತದ ಕಲಿಕೆ',
    description:
      'Whether starting with zero Kannada knowledge or brushing up on conversational phrases for meetings, our adaptive curriculum tunes lessons to your daily schedule.',
    highlight: 'Foundation, Spoken or Professional paths',
  },
  {
    number: '03',
    icon: Bot,
    title: 'Practice with Your AI Tutor',
    kannadaTag: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಗುರು',
    description:
      'Engage in interactive voice dialogues without fear or self-consciousness. Your AI Kannada Guru listens, detects pronunciation nuances, and gives encouraging feedback.',
    highlight: 'Real-time conversational voice synthesis',
  },
  {
    number: '04',
    icon: MessageCircleHeart,
    title: 'Communicate Confidently in Real Life',
    kannadaTag: 'ಆತ್ಮವಿಶ್ವಾಸದ ಮಾತುಕತೆ',
    description:
      'Step out into Bengaluru, Mysuru, or Hubballi with pride. Order with fluency, chat warmly with your auto driver, greet neighbors, and feel deeply at home.',
    highlight: 'True belonging and everyday confidence',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-[#0A1222] text-[#F8F5EE] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#D5A64A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#101D36] border border-[#D5A64A]/30 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#D5A64A]" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#EDE5D6]">
              Simple & Engaging
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F5EE] mb-6">
            How Kannada for Everyone Works
          </h2>

          <p className="text-base sm:text-lg text-[#EDE5D6]/80 leading-relaxed font-sans">
            A frictionless, research-backed learning pathway from zero familiarity to fluid, respectful daily conversations.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl bg-[#101D36]/70 border border-[#D5A64A]/25 p-7 flex flex-col justify-between hover:border-[#D5A64A]/60 transition-all duration-300 shadow-xl group hover:-translate-y-1"
              >
                {/* Step Number Accent */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-3xl font-extrabold text-[#D5A64A]/40 group-hover:text-[#D5A64A] transition-colors">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#0A1222] border border-[#D5A64A]/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#D5A64A]" />
                    </div>
                  </div>

                  <span className="text-[11px] font-kannada text-[#D5A64A] block mb-2 font-medium">
                    {step.kannadaTag}
                  </span>

                  <h3 className="font-serif text-lg font-bold text-[#F8F5EE] mb-3 leading-snug">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#EDE5D6]/80 leading-relaxed mb-6 font-normal">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <span className="inline-block text-[11px] font-medium text-[#D5A64A] bg-[#D5A64A]/10 px-2.5 py-1 rounded-md">
                    {step.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Quick Action */}
        <div className="text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-[#101D36] bg-[#D5A64A] hover:bg-[#E8C77F] transition-all duration-300 shadow-xl shadow-[#D5A64A]/20 hover:shadow-2xl hover:shadow-[#D5A64A]/30 hover:-translate-y-0.5"
          >
            <span>Start Step 1 Now</span>
            <ArrowRight className="w-4 h-4 text-[#101D36]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

