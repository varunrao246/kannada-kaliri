'use client';

import { Users, Navigation, HeartHandshake, Landmark, Sparkles, CheckCircle2 } from 'lucide-react';

const REASONS = [
  {
    icon: Users,
    title: 'Communicate with Local Communities',
    kannadaText: 'ಜನರೊಂದಿಗೆ ಸಂಭಾಷಣೆ',
    description:
      'From greeting your neighborhood vegetable vendor to chatting with auto drivers and apartment staff, a few words in Kannada bridge instantly warm social bonds.',
    highlight: 'Instant warmth and respect everywhere you step.',
  },
  {
    icon: Navigation,
    title: 'Navigate Everyday Life',
    kannadaText: 'ದೈನಂದಿನ ಜೀವನ ಸುಲಭ',
    description:
      'Read signboards, understand BMTC bus routes, decipher local menus, and handle daily errands with self-reliance rather than relying on translation apps.',
    highlight: 'Navigate Bangalore, Mysuru and Mangaluru with ease.',
  },
  {
    icon: HeartHandshake,
    title: 'Build Meaningful Friendships',
    kannadaText: 'ಆತ್ಮೀಯ ಸ್ನೇಹ',
    description:
      'Break out of expat and tech bubbles. Speak the language of your colleagues, neighbors, and college peers, discovering stories you never knew existed.',
    highlight: 'Turn everyday acquaintances into lifelong friendships.',
  },
  {
    icon: Landmark,
    title: "Connect with Karnataka's Heritage",
    kannadaText: 'ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆ',
    description:
      "Understand timeless Vachanas, Carnatic compositions, Yakshagana theatre, and Mysore Dasara traditions through their original mother tongue.",
    highlight: 'Experience 2,000+ years of classical richness.',
  },
];

const STATS = [
  { value: '2,000+', label: 'Years of Recorded Classical Heritage', sub: 'Halmidi Inscription (450 CE)' },
  { value: '50M+', label: 'Speakers Worldwide', sub: 'The beating heart of South India' },
  { value: '8', label: 'Jnanpith Literary Laureates', sub: 'Highest literary honors in India' },
  { value: '100%', label: 'Culturally Grounded Pedagogy', sub: 'Real situations, not robotic drills' },
];

export default function WhyKannada() {
  return (
    <section id="why-kannada" className="relative py-28 bg-[#101D36] text-[#F8F5EE] overflow-hidden">
      {/* Subtle background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D5A64A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1A2E56]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1A2E56] border border-[#D5A64A]/30 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#D5A64A]" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#EDE5D6]">
              Why Learn Kannada
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F5EE] mb-6">
            Belong wherever you go.
          </h2>

          <p className="text-lg text-[#EDE5D6]/80 leading-relaxed font-sans">
            Learning Kannada is not about rote memorization of grammar rules. It is your key to feeling at home,
            gaining respect from locals, and experiencing the legendary warmth of Karnataka culture.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {REASONS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative p-8 rounded-2xl bg-[#0A1222]/60 border border-[#D5A64A]/20 hover:border-[#D5A64A]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#D5A64A]/10 group"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D5A64A]/20 to-[#101D36] border border-[#D5A64A]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <Icon className="w-6 h-6 text-[#D5A64A]" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-serif text-xl font-bold text-[#F8F5EE] group-hover:text-[#D5A64A] transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <span className="block text-xs font-kannada text-[#D5A64A]/80 mb-3 tracking-wide">
                      {item.kannadaText}
                    </span>

                    <p className="text-sm text-[#EDE5D6]/80 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[#D5A64A] bg-[#D5A64A]/10 px-3 py-1.5 rounded-lg border border-[#D5A64A]/25">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D5A64A]" />
                      <span>{item.highlight}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Heritage Stats Strip */}
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#0A1222]/90 via-[#101D36] to-[#0A1222]/90 border border-[#D5A64A]/30 shadow-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#D5A64A]/20">
            {STATS.map((stat, idx) => (
              <div key={idx} className={`text-center ${idx > 0 ? 'pt-6 lg:pt-0 lg:pl-6' : ''}`}>
                <div className="font-serif text-3xl sm:text-4xl font-extrabold text-[#D5A64A] mb-1 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-[#F8F5EE] mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-[#EDE5D6]/70">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
