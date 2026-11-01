'use client';

/**
 * Admin Sidebar Navigation Component
 * Kannada Kaliri — Milestone 10
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AdminRole } from '@/lib/admin/types';

interface AdminSidebarProps {
  role?: AdminRole | null;
  adminEmail?: string;
  className?: string;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', kannadaLabel: 'ಸ್ಥೂಲನೋಟ', icon: '📊', exact: true },
  { href: '/admin/learners', label: 'Learners', kannadaLabel: 'ಕಲಿಯುವವರು', icon: '👥' },
  { href: '/admin/curriculum', label: 'Curriculum', kannadaLabel: 'ಪಠ್ಯಕ್ರಮ', icon: '📚' },
  { href: '/admin/learning-outcomes', label: 'Outcomes', kannadaLabel: 'ಕಲಿಕಾ ಫಲಿತಾಂಶ', icon: '🎯' },
  { href: '/admin/engagement', label: 'Engagement', kannadaLabel: 'ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆ', icon: '⚡' },
  { href: '/admin/services', label: 'AI & Voice Services', kannadaLabel: 'AI ಸೇವೆಗಳು', icon: '🤖' },
  { href: '/admin/reports', label: 'Reports & Export', kannadaLabel: 'ವರದಿಗಳು', icon: '📥' },
];

export function AdminSidebar({
  role = 'admin',
  adminEmail,
  className = '',
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`w-64 bg-[#0A1222] border-r border-[rgba(213,166,74,0.2)] flex flex-col justify-between min-h-screen ${className}`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[rgba(213,166,74,0.15)]">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D5A64A] to-[#B5862B] text-[#101D36] flex items-center justify-center font-serif font-bold text-lg shadow-md shadow-[rgba(213,166,74,0.2)]">
              ಕ
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-[#F8F5EE] leading-tight">
                ಕನ್ನಡ ಕಲಿರಿ
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#D5A64A] font-semibold">
                Admin Console
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1" aria-label="Admin Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#D5A64A] text-[#101D36] shadow-md shadow-[rgba(213,166,74,0.25)] font-bold'
                    : 'text-[#EDE5D6]/70 hover:text-[#F8F5EE] hover:bg-[rgba(248,245,238,0.05)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <div>
                    <div>{item.label}</div>
                    <div
                      className={`text-[10px] font-kannada font-normal ${
                        isActive ? 'text-[#101D36]/80' : 'text-[#EDE5D6]/40'
                      }`}
                    >
                      {item.kannadaLabel}
                    </div>
                  </div>
                </div>
                {isActive && <span className="text-xs">→</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Badge & Switch to Learner App */}
      <div className="p-4 border-t border-[rgba(213,166,74,0.15)] space-y-3 bg-[rgba(16,29,54,0.4)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[rgba(213,166,74,0.2)] border border-[rgba(213,166,74,0.4)] flex items-center justify-center text-xs font-bold text-[#D5A64A]">
            🛡️
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-[#F8F5EE] truncate">
              {adminEmail || 'Administrator'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#D5A64A]/20 text-[#D5A64A] font-bold border border-[#D5A64A]/30">
                {role || 'admin'}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">● Verified</span>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#EDE5D6]/80 hover:text-[#D5A64A] bg-[rgba(248,245,238,0.04)] hover:bg-[rgba(248,245,238,0.08)] border border-[rgba(213,166,74,0.15)] transition-all"
        >
          <span>← Back to Learner Portal</span>
        </Link>
      </div>
    </aside>
  );
}

