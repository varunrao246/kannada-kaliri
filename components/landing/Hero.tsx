'use client';

import { useReducedMotion, motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronDown, Compass, Sparkles, BookOpen, Volume2 } from 'lucide-react';

// Decorative floating Kannada characters
const FLOATING_LETTERS = [
  { char: 'ಅ', top: '18%', left: '12%', size: 'text-3xl', delay: 0 },
  { char: 'ಕ', top: '28%', right: '14%', size: 'text-4xl', delay: 1.2 },
  { char: 'ಸ್ವಾಗತ', top: '72%', left: '10%', size: 'text-2xl', delay: 2.1 },
  { char: 'ಳ', top: '65%', right: '12%', size: 'text-3xl', delay: 0.8 },
  { char: 'ನಮಸ್ಕಾರ', top: '22%', right: '35%', size: 'text-xl', delay: 1.8 },
  { char: 'ಜ್ಞ', top: '80%', right: '28%', size: 'text-2xl', delay: 2.7 },
  { char: 'ಆ', top: '48%', left: '6%', size: 'text-4xl', delay: 1.5 },
];

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A1222]">
      {/* Background Image Container with Cinematic Zoom */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={shouldReduceMotion ? {} : { scale: 1.05 }}
        animate={shouldReduceMotion ? {} : { scale: 1.15 }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      >
        <Image
          src="/images/mysore-palace.jpg"
          alt="Illuminated Mysore Palace at night representing Karnataka's royal heritage"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.72] contrast-[1.08]"
        />

        {/* Cinematic multi-layered gradient overlays for readability and luxury mood */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101D36] via-[#101D36]/75 to-[#0A1222]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(213,166,74,0.08)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1222]/85 via-transparent to-[#0A1222]/85" />
      </motion.div>

      {/* Floating Golden Particles */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden" aria-hidden="true">
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[#D5A64A]"
              style={{
                width: i % 3 === 0 ? '4px' : '2px',
                height: i % 3 === 0 ? '4px' : '2px',
                top: `${(i * 19) % 100}%`,
                left: `${(i * 29) % 100}%`,
                opacity: 0.25 + ((i % 5) * 0.1),
                boxShadow: '0 0 8px #D5A64A',
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, (i % 2 === 0 ? 15 : -15), 0],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 6 + (i % 5) * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </div>
      )}

      {/* Decorative Floating Kannada Glyphs */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 pointer-events-none z-10 select-none hidden lg:block" aria-hidden="true">
          {FLOATING_LETTERS.map((item, index) => (
            <motion.span
              key={index}
              className={`absolute font-kannada font-bold text-[#D5A64A]/15 hover:text-[#D5A64A]/30 transition-colors ${item.size}`}
              style={{
                top: item.top,
                left: item.left,
                right: item.right,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: [0.12, 0.25, 0.12],
                y: [0, -12, 0],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: item.delay,
              }}
            >
              {item.char}
            </motion.span>
          ))}
        </div>
      )}

      {/* Hero Content Container */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center flex flex-col items-center">
        {/* Eyebrow Pill */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#101D36]/80 border border-[#D5A64A]/40 backdrop-blur-md shadow-lg mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#D5A64A] animate-pulse" />
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#EDE5D6]">
            Discover Kannada • Discover Karnataka
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#F8F5EE] leading-[1.12] mb-6 max-w-4xl"
        >
          Kannada is more than a language.{' '}
          <span className="gold-gradient-text block sm:inline">
            It&apos;s a connection.
          </span>
        </motion.h1>

        {/* Supporting Description */}
        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="text-base sm:text-xl text-[#EDE5D6]/90 max-w-2xl leading-relaxed mb-10 font-normal"
        >
          Whether you&apos;re a student, professional, traveller or someone starting a new life in Karnataka,
          learn Kannada through personalized AI lessons, real-world conversations and immersive cultural experiences.
        </motion.p>

        {/* Call to Action Buttons */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {/* Primary CTA */}
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-[#101D36] bg-[#D5A64A] hover:bg-[#E8C77F] transition-all duration-300 shadow-xl shadow-[#D5A64A]/25 hover:shadow-2xl hover:shadow-[#D5A64A]/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#D5A64A]"
          >
            <span>Start Learning Kannada</span>
            <ArrowRight className="w-4 h-4 text-[#101D36]" />
          </Link>

          {/* Secondary CTA */}
          <a
            href="#features"
            onClick={scrollToFeatures}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-sm font-semibold text-[#F8F5EE] bg-[#101D36]/80 hover:bg-[#1A2E56] border border-[#D5A64A]/30 hover:border-[#D5A64A]/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 focus:outline-none"
          >
            <Compass className="w-4 h-4 text-[#D5A64A]" />
            <span>Explore the Experience</span>
          </a>
        </motion.div>

        {/* Key Highlights Micro-Badges */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-14 pt-8 border-t border-[#D5A64A]/20 grid grid-cols-2 md:grid-cols-3 gap-6 text-left max-w-3xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D5A64A]/10 border border-[#D5A64A]/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#D5A64A]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F8F5EE]">AI Spoken Tutor</p>
              <p className="text-[11px] text-[#EDE5D6]/70">Voice-first conversation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D5A64A]/10 border border-[#D5A64A]/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#D5A64A]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F8F5EE]">Multilingual Onboarding</p>
              <p className="text-[11px] text-[#EDE5D6]/70">Learn via Hindi, English & more</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D5A64A]/10 border border-[#D5A64A]/30 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-[#D5A64A]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F8F5EE]">Real Bangalore Context</p>
              <p className="text-[11px] text-[#EDE5D6]/70">Autos, cafes, tech workplace</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle Scroll Down Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#D5A64A]/80 font-medium mb-1">
          Scroll Down
        </span>
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-4 h-4 text-[#D5A64A]" />
        </motion.div>
      </div>
    </section>
  );
}

