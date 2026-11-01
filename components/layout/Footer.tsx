'use client';

import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="bg-[#0A1222] text-[#EDE5D6] border-t border-[#D5A64A]/25 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D5A64A] via-[#B5862B] to-[#101D36] p-[1.5px]">
                <div className="w-full h-full bg-[#101D36] rounded-[7px] flex items-center justify-center">
                  <span className="font-serif font-bold text-base text-[#D5A64A]">ಕ</span>
                </div>
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-wide text-[#F8F5EE] block">
                  KANNADA FOR EVERYONE
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#D5A64A] block">
                  ಕನ್ನಡ ಕಲಿರಿ • EdTech Platform
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#EDE5D6]/70 leading-relaxed max-w-sm">
              An AI-powered multilingual platform designed to help non-Kannada speakers speak with warmth,
              confidence and cultural appreciation in Karnataka.
            </p>

            <div className="pt-2 text-xs text-[#EDE5D6]/60 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#D5A64A]" />
              <span>Crafted with pride in Mysuru, Karnataka</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#D5A64A]">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#EDE5D6]/80">
              <li>
                <Link href="/" className="hover:text-[#D5A64A] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#why-kannada" className="hover:text-[#D5A64A] transition-colors">
                  Why Learn Kannada
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#D5A64A] transition-colors">
                  Three Learning Pillars
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#D5A64A] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#heritage" className="hover:text-[#D5A64A] transition-colors">
                  Cultural Heritage
                </Link>
              </li>
            </ul>
          </div>

          {/* Pedagogy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#D5A64A]">
              Pedagogy
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#EDE5D6]/80">
              <li>
                <span className="hover:text-[#D5A64A] transition-colors cursor-pointer">
                  AI Spoken Tutor
                </span>
              </li>
              <li>
                <span className="hover:text-[#D5A64A] transition-colors cursor-pointer">
                  Bengaluru Real Situations
                </span>
              </li>
              <li>
                <span className="hover:text-[#D5A64A] transition-colors cursor-pointer">
                  Grammar & Pronunciation
                </span>
              </li>
              <li>
                <span className="hover:text-[#D5A64A] transition-colors cursor-pointer">
                  Multilingual Voice Engine
                </span>
              </li>
            </ul>
          </div>

          {/* Legal & Account */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#D5A64A]">
              Platform & Legal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#EDE5D6]/80">
              <li>
                <Link href="/login" className="hover:text-[#D5A64A] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[#D5A64A] transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <span className="hover:text-[#D5A64A] transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-[#D5A64A] transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-[#D5A64A] transition-colors cursor-pointer flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#D5A64A]" />
                  <span>contact@kannadakaliri.app</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#EDE5D6]/60">
          <p>© {currentYear} Kannada for Everyone. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>&quot;Learn the language. Experience the culture.&quot;</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
