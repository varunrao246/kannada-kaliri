'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, HeartHandshake, Zap } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative py-28 bg-[#101D36] text-[#F8F5EE] overflow-hidden">
      {/* Background illumination & decorative gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(213,166,74,0.15)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#D5A64A]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Subtle decorative eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A2E56] border border-[#D5A64A]/40 mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#D5A64A]" />
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#EDE5D6]">
            Start Speaking Today
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#F8F5EE] mb-6 max-w-3xl mx-auto leading-[1.15]">
          Your first Kannada conversation{' '}
          <span className="gold-gradient-text block sm:inline">
            starts here.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-[#EDE5D6]/90 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Join thousands of professionals, students, and new residents making Karnataka truly feel like home.
          Learn at your own pace with compassionate AI guidance.
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-[#101D36] bg-[#D5A64A] hover:bg-[#E8C77F] transition-all duration-300 shadow-2xl shadow-[#D5A64A]/30 hover:shadow-[#D5A64A]/50 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#D5A64A]"
          >
            <span>Begin Your Journey</span>
            <ArrowRight className="w-4 h-4 text-[#101D36]" />
          </Link>
        </div>

        {/* Trust & Guarantee Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#EDE5D6]/70 pt-6 border-t border-[#D5A64A]/20 max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D5A64A]" />
            <span>5 minutes a day</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D5A64A]" />
            <span>Zero prior knowledge needed</span>
          </div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-[#D5A64A]" />
            <span>Karnataka-authentic phrases</span>
          </div>
        </div>
      </div>
    </section>
  );
}

