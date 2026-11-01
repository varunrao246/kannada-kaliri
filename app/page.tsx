import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/landing/Hero';
import WhyKannada from '@/components/landing/WhyKannada';
import LearningPillars from '@/components/landing/LearningPillars';
import CulturalHeritage from '@/components/landing/CulturalHeritage';
import HowItWorks from '@/components/landing/HowItWorks';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Kannada for Everyone | Learn the Language. Experience the Culture.',
  description:
    'An AI-powered multilingual Kannada learning platform for non-speakers. Discover Mysore palace heritage, master spoken phrases, and practice with real-time AI speech feedback.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#101D36] text-[#F8F5EE] selection:bg-[#D5A64A]/30 selection:text-[#F8F5EE] overflow-x-hidden">
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Section A: Why Learn Kannada */}
      <WhyKannada />

      {/* Section B: Three Learning Pillars */}
      <LearningPillars />

      {/* Section C: Cultural Heritage */}
      <CulturalHeritage />

      {/* Section D: How It Works */}
      <HowItWorks />

      {/* Section E: Final Call to Action */}
      <FinalCTA />

      {/* Section F: Footer */}
      <Footer />
    </main>
  );
}
