'use client';

/**
 * Main Achievements & Motivation Hub View
 * Kannada Kaliri — Milestone 09
 */

import React from 'react';
import Link from 'next/link';
import type { GamificationSummary } from '@/lib/gamification/types';
import { LevelProgressBar } from '@/components/gamification/LevelProgressBar';
import { StreakCounterWidget } from '@/components/gamification/StreakCounterWidget';
import { DailyChallengesCard } from '@/components/gamification/DailyChallengesCard';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { LeaderboardTable } from '@/components/gamification/LeaderboardTable';

interface GamificationDashboardViewProps {
  summary: GamificationSummary;
}

export function GamificationDashboardView({ summary }: GamificationDashboardViewProps) {
  return (
    <div className="min-h-screen bg-[#101D36] text-[#F8F5EE] pb-20">
      {/* Top Header & Navigation */}
      <header className="border-b border-[rgba(213,166,74,0.2)] bg-[rgba(16,29,54,0.9)] backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-[rgba(248,245,238,0.06)] hover:bg-[rgba(248,245,238,0.12)] border border-[rgba(213,166,74,0.2)] text-[#D5A64A] transition-colors"
              title="Return to Dashboard"
            >
              ←
            </Link>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#D5A64A] font-semibold">
                ಕನ್ನಡ ಕಲಿರಿ • Kannada Kaliri
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F8F5EE]">
                ಸಾಧನೆಗಳು & ಶ್ರೇಯಾಂಕಗಳು • Achievements & Rewards
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/curriculum"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#D5A64A] text-[#101D36] hover:brightness-110 transition-all shadow-md"
            >
              ಕಲಿಕೆ ಮುಂದುವರಿಸಿ • Learn
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Row 1: Level Progress & Daily Streak */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LevelProgressBar
            totalXP={summary.totalXP}
            levelInfo={summary.levelInfo}
          />
          <StreakCounterWidget streak={summary.streak} />
        </section>

        {/* Row 2: Daily Challenges */}
        <section>
          <DailyChallengesCard challenges={summary.dailyChallenges} />
        </section>

        {/* Row 3: Badges & Achievements */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏅</span>
              <h2 className="font-serif text-xl font-bold text-[#F8F5EE]">
                ಸಾಧನೆಯ ಪದಕಗಳು • Achievement Badges
              </h2>
            </div>
            <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
              ನಿಜವಾದ ಕಲಿಕಾ ಪ್ರಗತಿ ಹಾಗೂ ಅಭ್ಯಾಸದ ಮೂಲಕ ಗಳಿಸಬಹುದಾದ 13 ವಿಶೇಷ ಗೌರವಗಳು
            </p>
          </div>
          <BadgeGrid badges={summary.badges} />
        </section>

        {/* Row 4: Community Leaderboard */}
        <section className="space-y-4 pt-4">
          <LeaderboardTable
            initialPreference={summary.leaderboardPreference}
          />
        </section>
      </main>
    </div>
  );
}

