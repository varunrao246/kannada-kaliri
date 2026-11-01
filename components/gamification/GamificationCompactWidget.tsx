'use client';

/**
 * Compact Gamification Widget for Learner Dashboard
 * Kannada Kaliri — Milestone 09
 */

import React from 'react';
import Link from 'next/link';
import type { GamificationSummary } from '@/lib/gamification/types';

interface GamificationCompactWidgetProps {
  summary: GamificationSummary;
  className?: string;
}

export function GamificationCompactWidget({
  summary,
  className = '',
}: GamificationCompactWidgetProps) {
  const { totalXP, levelInfo, streak, badges, dailyChallenges } = summary;
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;
  const completedChallengesCount = dailyChallenges.filter((c) => c.isCompleted).length;

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.25)] relative overflow-hidden ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(213,166,74,0.06)] rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D5A64A] to-[#B5862B] text-[#101D36] flex items-center justify-center font-serif font-bold text-base shadow-sm">
            {levelInfo.level}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#D5A64A] font-semibold">
              ಹಂತ {levelInfo.level}
            </div>
            <h4 className="font-serif font-bold text-sm text-[#F8F5EE] leading-tight">
              {levelInfo.title}
            </h4>
          </div>
        </div>

        {/* View All Achievements Link */}
        <Link
          href="/achievements"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#D5A64A] hover:text-[#E8C77F] transition-colors"
        >
          <span>ಸಾಧನೆಗಳು</span>
          <span className="text-[10px]">→</span>
        </Link>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-[#EDE5D6]/80 mb-1.5">
          <span className="font-medium">{totalXP} XP ಗಳಿಸಲಾಗಿದೆ</span>
          <span className="text-[#D5A64A] font-semibold">{levelInfo.progressPercentage}%</span>
        </div>
        <div className="w-full bg-[rgba(248,245,238,0.08)] rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#D5A64A] to-[#E8C77F] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, Math.min(100, levelInfo.progressPercentage))}%` }}
          />
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[rgba(213,166,74,0.15)] text-center">
        {/* Streak */}
        <div className="p-2 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)]">
          <div className="text-base mb-0.5">🔥</div>
          <div className="font-serif font-bold text-sm text-[#F8F5EE]">
            {streak.currentStreak}
          </div>
          <div className="text-[10px] text-[#EDE5D6]/60">ದಿನ ಸತತ</div>
        </div>

        {/* Badges Earned */}
        <div className="p-2 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)]">
          <div className="text-base mb-0.5">🏅</div>
          <div className="font-serif font-bold text-sm text-[#F8F5EE]">
            {unlockedBadgesCount} / {badges.length}
          </div>
          <div className="text-[10px] text-[#EDE5D6]/60">ಸಾಧನೆಗಳು</div>
        </div>

        {/* Daily Challenges */}
        <div className="p-2 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)]">
          <div className="text-base mb-0.5">🎯</div>
          <div className="font-serif font-bold text-sm text-[#F8F5EE]">
            {completedChallengesCount} / {dailyChallenges.length}
          </div>
          <div className="text-[10px] text-[#EDE5D6]/60">ಇಂದಿನ ಸವಾಲು</div>
        </div>
      </div>
    </div>
  );
}

