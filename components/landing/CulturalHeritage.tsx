'use client';

import Image from 'next/image';
import { Landmark, Scroll, Sparkles } from 'lucide-react';

const HERITAGE_ITEMS = [
  {
    title: 'Mysore Palace (Amba Vilas)',
    kannadaTitle: 'ಮೈಸೂರು ಅರಮನೆ',
    period: 'Commissioned 1897 • Completed 1912',
    location: 'Mysuru, Karnataka',
    description:
      'The seat of the historic Wadiyar dynasty and the epicenter of the famous Mysuru Dasara festival. Its Indo-Saracenic grandeur illuminates with nearly 100,000 incandescent bulbs, epitomizing Karnataka’s royal devotion to the fine arts, literature and music.',
    significance: 'Royal patron of Kannada classical arts and modern education.',
    image: '/images/mysore-palace.jpg',
    tag: 'Royal Heritage',
  },
  {
    title: 'Hampi & The Vijayanagara Empire',
    kannadaTitle: 'ಹಂಪಿ • ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯ',
    period: '14th – 16th Century CE',
    location: 'Vijayanagara District, Karnataka',
    description:
      'A UNESCO World Heritage site situated along the rugged banks of the Tungabhadra River. As the capital of one of the greatest empires in Indian history, Hampi stands as a testament to Dravidian stone sculpture, the iconic Stone Chariot, and monumental temple architecture.',
    significance: 'UNESCO World Heritage monument of civilizational splendor.',
    tag: 'Architectural Wonder',
  },
  {
    title: 'Classical Kannada Linguistic Heritage',
    kannadaTitle: 'ಕನ್ನಡ ಶಾಸ್ತ್ರೀಯ ಭಾಷೆ',
    period: 'Epigraphy from 450 CE (Halmidi) to Present',
    location: 'Statewide & Global Diaspora',
    description:
      'Officially recognized as a Classical Language of India in 2008. From ancient Kadamba rock edicts to the 12th-century socio-spiritual revolution of Vachana literature by Basaveshwara and Akka Mahadevi, Kannada literature has always championed human equality and poetic depth.',
    significance: '8 Jnanpith Awards — second highest in Indian literature.',
    tag: 'Literary Legacy',
  },
];

export default function CulturalHeritage() {
  return (
    <section id="heritage" className="py-28 bg-[#101D36] text-[#F8F5EE] relative overflow-hidden">
      {/* Background illumination */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#D5A64A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0A1222]/80 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1A2E56] border border-[#D5A64A]/30 mb-4">
            <Landmark className="w-3.5 h-3.5 text-[#D5A64A]" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#EDE5D6]">
              Cultural Heritage
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F5EE] mb-6">
            Language rooted in timeless history.
          </h2>

          <p className="text-base sm:text-lg text-[#EDE5D6]/80 leading-relaxed font-sans">
            To speak Kannada is to tap into an unbroken stream of sovereign dynasties, egalitarian philosophers,
            and profound artistic traditions that shaped Southern India for millennia.
          </p>
        </div>

        {/* Feature 1: Mysore Palace Spotlight (Large Editorial Layout) */}
        <div className="mb-16 rounded-3xl bg-[#0A1222]/80 border border-[#D5A64A]/30 overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[440px]">
            <Image
              src="/images/mysore-palace.jpg"
              alt="Mysore Palace illuminated at night"
              fill
              className="object-cover object-center filter brightness-[0.88] hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1222] via-transparent to-transparent lg:hidden" />
          </div>

          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D5A64A] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{HERITAGE_ITEMS[0].tag}</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE] mb-1">
              {HERITAGE_ITEMS[0].title}
            </h3>
            <span className="text-sm font-kannada text-[#D5A64A] mb-4 block">
              {HERITAGE_ITEMS[0].kannadaTitle}
            </span>

            <div className="flex items-center gap-4 text-xs text-[#EDE5D6]/70 mb-5 pb-4 border-b border-white/10">
              <span>{HERITAGE_ITEMS[0].period}</span>
              <span>•</span>
              <span>{HERITAGE_ITEMS[0].location}</span>
            </div>

            <p className="text-sm text-[#EDE5D6]/85 leading-relaxed mb-6 font-normal">
              {HERITAGE_ITEMS[0].description}
            </p>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-[#D5A64A]/25 text-xs text-[#EDE5D6]">
              <strong className="text-[#D5A64A]">Cultural Significance: </strong>
              {HERITAGE_ITEMS[0].significance}
            </div>
          </div>
        </div>

        {/* Features 2 & 3: Editorial Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {HERITAGE_ITEMS.slice(1).map((item, idx) => (
            <div
              key={idx}
              className="p-8 sm:p-10 rounded-2xl bg-[#0A1222]/70 border border-[#D5A64A]/20 hover:border-[#D5A64A]/50 transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D5A64A] bg-[#D5A64A]/10 px-3 py-1 rounded-full border border-[#D5A64A]/25">
                    {item.tag}
                  </span>
                  <Scroll className="w-5 h-5 text-[#D5A64A]/60" />
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#F8F5EE] mb-1">
                  {item.title}
                </h3>
                <span className="text-xs font-kannada text-[#D5A64A] mb-4 block">
                  {item.kannadaTitle}
                </span>

                <div className="flex items-center gap-3 text-xs text-[#EDE5D6]/60 mb-5 pb-3 border-b border-white/10">
                  <span>{item.period}</span>
                  <span>•</span>
                  <span>{item.location}</span>
                </div>

                <p className="text-sm text-[#EDE5D6]/85 leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-[#D5A64A]/20 text-xs text-[#EDE5D6]">
                <strong className="text-[#D5A64A]">Significance: </strong>
                {item.significance}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
