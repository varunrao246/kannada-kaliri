'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Sparkles, User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
  { label: 'About Kannada', href: '/#heritage' },
];

export default function Navbar() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
      router.refresh();
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#101D36]/90 backdrop-blur-md border-b border-[#D5A64A]/25 py-3 shadow-lg'
          : 'bg-gradient-to-b from-[#0A1222]/80 via-[#101D36]/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#D5A64A] rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D5A64A] via-[#B5862B] to-[#101D36] p-[1.5px] shadow-md group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#101D36] rounded-[7px] flex items-center justify-center border border-[#D5A64A]/30">
                <span className="font-serif font-bold text-lg text-[#D5A64A] tracking-wider">
                  ಕ
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-semibold tracking-wide text-[#F8F5EE] group-hover:text-[#D5A64A] transition-colors">
                KANNADA FOR EVERYONE
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#D5A64A]/90 font-medium font-sans">
                ಕನ್ನಡ ಕಲಿರಿ • EdTech Platform
              </span>
            </div>
          </Link>

          {/* Center Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#EDE5D6]/80 hover:text-[#D5A64A] transition-colors tracking-wide relative py-1 focus:outline-none focus:text-[#D5A64A]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#1A2E56] text-[#F8F5EE] border border-[#D5A64A]/30 hover:border-[#D5A64A] transition-all"
                >
                  <User className="w-3.5 h-3.5 text-[#D5A64A]" />
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-lg text-[#EDE5D6]/70 hover:text-[#D5A64A] hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#EDE5D6] hover:text-[#D5A64A] px-4 py-2 transition-colors focus:outline-none"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="relative group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[#101D36] bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A] bg-size-200 hover:bg-right transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-[#D5A64A]/25 focus:outline-none focus:ring-2 focus:ring-[#D5A64A]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#101D36]" />
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden p-2 rounded-lg text-[#EDE5D6] hover:text-[#D5A64A] hover:bg-white/5 focus:outline-none"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A1222]/98 backdrop-blur-xl border-b border-[#D5A64A]/30 px-6 py-6 transition-all duration-200 animate-fadeIn">
          <div className="flex flex-col space-y-4">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#EDE5D6] hover:text-[#D5A64A] py-1 border-b border-white/5"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-[#F8F5EE] bg-[#1A2E56] border border-[#D5A64A]/40"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-center py-2 text-sm text-[#D5A64A] hover:underline"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-[#EDE5D6] hover:text-[#D5A64A] border border-[#D5A64A]/30"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider text-[#101D36] bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A]"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
