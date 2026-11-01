'use client';

/**
 * Admin Executive Overview Dashboard
 * Kannada Kaliri — Milestone 10
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PlatformKPIs, TrendDataPoint, DateRangePreset } from '@/lib/admin/types';
import { KPICard } from '@/components/admin/KPICard';
import { DateRangeSelector } from '@/components/admin/DateRangeSelector';

export default function AdminOverviewPage() {
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [regTrends, setRegTrends] = useState<TrendDataPoint[]>([]);
  const [lessonTrends, setLessonTrends] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadOverview() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/overview?preset=${preset}`);
        const data = await res.json();
        if (!isCancelled && data.success) {
          setKpis(data.kpis);
          setRegTrends(data.registrationTrends || []);
          setLessonTrends(data.lessonCompletionTrends || []);
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadOverview();

    return () => {
      isCancelled = true;
    };
  }, [preset]);

  return (
    <div className="space-y-8">
      {/* Top Bar: Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#D5A64A] font-semibold">
            ಆಡಳಿತ ಮಂಡಳಿ • Executive Analytics
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
            Platform Overview
          </h1>
          <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
            Real-time learner outcomes, curriculum performance, and engagement metrics
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <DateRangeSelector
            currentPreset={preset}
            onSelectPreset={setPreset}
          />
          <a
            href="/api/admin/reports/export?type=overview"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[rgba(213,166,74,0.15)] hover:bg-[rgba(213,166,74,0.25)] border border-[rgba(213,166,74,0.3)] text-[#D5A64A] transition-all flex items-center gap-1.5"
            title="Download CSV"
          >
            <span>📥</span>
            <span className="hidden sm:inline">Export CSV</span>
          </a>
        </div>
      </div>

      {loading || !kpis ? (
        <div className="py-20 text-center text-[#EDE5D6]/50 text-sm animate-pulse">
          ವೇದಿಕೆಯ ಅಂಕಿ-ಅಂಶಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ... Loading platform KPIs...
        </div>
      ) : (
        <>
          {/* Section 1: Core Platform KPIs (Grid) */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDE5D6]/60">
              ಕಲಿಕೆಯ ಪ್ರಮುಖ ಸೂಚ್ಯಂಕಗಳು • Key Performance Indicators
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Registered Learners"
                kannadaTitle="ಒಟ್ಟು ನೋಂದಾಯಿತ ಕಲಿಯುವವರು"
                comparison={kpis.totalLearners}
                icon="👥"
              />
              <KPICard
                title="New Registrations"
                kannadaTitle="ಹೊಸ ನೋಂದಣಿಗಳು"
                comparison={kpis.newRegistrations}
                icon="✨"
              />
              <KPICard
                title="Daily Active Learners"
                kannadaTitle="ದೈನಂದಿನ ಸಕ್ರಿಯ ಕಲಿಯುವವರು"
                comparison={kpis.dailyActiveLearners}
                icon="⚡"
              />
              <KPICard
                title="Weekly Active Learners"
                kannadaTitle="ವಾರದ ಸಕ್ರಿಯ ಕಲಿಯುವವರು"
                comparison={kpis.weeklyActiveLearners}
                icon="📈"
              />
              <KPICard
                title="Completed Lessons"
                kannadaTitle="ಪೂರ್ಣಗೊಂಡ ಪಾಠಗಳು"
                comparison={kpis.completedLessons}
                icon="📖"
              />
              <KPICard
                title="Assessment Attempts"
                kannadaTitle="ಪರೀಕ್ಷಾ ಪ್ರಯತ್ನಗಳು"
                comparison={kpis.assessmentAttempts}
                icon="📝"
              />
              <KPICard
                title="Completed Scenarios"
                kannadaTitle="ಪೂರ್ಣಗೊಂಡ ಸಂಭಾಷಣೆಗಳು"
                comparison={kpis.completedScenarios}
                icon="🗣️"
              />
              <KPICard
                title="Total XP Awarded"
                kannadaTitle="ಗಳಿಸಿದ ಒಟ್ಟು XP"
                comparison={kpis.totalXPAwarded}
                icon="⭐"
              />
              <KPICard
                title="Average Mastery Score"
                kannadaTitle="ಸರಾಸರಿ ಪಾಂಡಿತ್ಯ ಅಂಕ"
                comparison={kpis.averageMasteryScore}
                suffix="%"
                icon="🎯"
              />
              <KPICard
                title="Active Streak Average"
                kannadaTitle="ಸರಾಸರಿ ಸತತ ದಿನಗಳು"
                comparison={kpis.activeStreakAverage}
                suffix="days"
                icon="🔥"
              />
              <KPICard
                title="Platform Streak Record"
                kannadaTitle="ಗರಿಷ್ಠ ಸತತ ದಾಖಲೆ"
                comparison={{ current: kpis.longestStreakRecord, previous: kpis.longestStreakRecord, percentageChange: null }}
                suffix="days"
                icon="🏆"
              />
              <KPICard
                title="Monthly Active Learners"
                kannadaTitle="ಮಾಸಿಕ ಸಕ್ರಿಯ ಕಲಿಯುವವರು"
                comparison={kpis.monthlyActiveLearners}
                icon="🌐"
              />
            </div>
          </section>

          {/* Section 2: Visual Trends */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Registration Trends Chart */}
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
                    Learner Registrations
                  </h3>
                  <p className="text-[11px] text-[#EDE5D6]/60">
                    ನೋಂದಣಿ ಪ್ರವೃತ್ತಿ • User acquisition over selected period
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[rgba(213,166,74,0.15)] text-[#D5A64A]">
                  {regTrends.reduce((a, b) => a + b.count, 0)} Total
                </span>
              </div>

              {regTrends.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#EDE5D6]/40">
                  ಯಾವುದೇ ನೋಂದಣಿ ಡೇಟಾ ಇಲ್ಲ • No registrations recorded in this period
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div className="flex items-end gap-1.5 h-36 pt-4 border-b border-[rgba(213,166,74,0.15)]">
                    {regTrends.slice(-14).map((pt) => {
                      const maxVal = Math.max(...regTrends.map((p) => p.count), 1);
                      const heightPercent = Math.max(8, Math.round((pt.count / maxVal) * 100));

                      return (
                        <div
                          key={pt.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative"
                        >
                          <div
                            className="w-full bg-gradient-to-t from-[#D5A64A] to-[#E8C77F] rounded-t transition-all group-hover:brightness-125"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[9px] text-[#EDE5D6]/50 mt-1 truncate max-w-full">
                            {pt.label.slice(3)}
                          </span>

                          {/* Tooltip */}
                          <div className="absolute -top-7 bg-[#0A1222] border border-[#D5A64A]/40 text-[#D5A64A] px-1.5 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {pt.count} regs
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Completion Trends Chart */}
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
                    Lesson Completions
                  </h3>
                  <p className="text-[11px] text-[#EDE5D6]/60">
                    ಪಾಠ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆಯ ವೇಗ • Lessons finished over period
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                  {lessonTrends.reduce((a, b) => a + b.count, 0)} Total
                </span>
              </div>

              {lessonTrends.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#EDE5D6]/40">
                  ಯಾವುದೇ ಪಾಠ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ • No lesson completions in this period
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div className="flex items-end gap-1.5 h-36 pt-4 border-b border-[rgba(213,166,74,0.15)]">
                    {lessonTrends.slice(-14).map((pt) => {
                      const maxVal = Math.max(...lessonTrends.map((p) => p.count), 1);
                      const heightPercent = Math.max(8, Math.round((pt.count / maxVal) * 100));

                      return (
                        <div
                          key={pt.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative"
                        >
                          <div
                            className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all group-hover:brightness-125"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[9px] text-[#EDE5D6]/50 mt-1 truncate max-w-full">
                            {pt.label.slice(3)}
                          </span>

                          {/* Tooltip */}
                          <div className="absolute -top-7 bg-[#0A1222] border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {pt.count} lessons
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Navigation Quick Links */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <Link
              href="/admin/learners"
              className="p-4 rounded-xl glass-panel border border-[rgba(213,166,74,0.2)] hover:border-[#D5A64A]/50 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-serif font-bold text-sm text-[#F8F5EE] group-hover:text-[#D5A64A] transition-colors">
                  ಕಲಿಯುವವರ ನಿರ್ವಹಣೆ • Manage Learners
                </div>
                <div className="text-xs text-[#EDE5D6]/60">
                  Search, filter, and review progress records
                </div>
              </div>
              <span className="text-lg">→</span>
            </Link>

            <Link
              href="/admin/curriculum"
              className="p-4 rounded-xl glass-panel border border-[rgba(213,166,74,0.2)] hover:border-[#D5A64A]/50 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-serif font-bold text-sm text-[#F8F5EE] group-hover:text-[#D5A64A] transition-colors">
                  ಪಠ್ಯಕ್ರಮ ವಿಶ್ಲೇಷಣೆ • Curriculum Analytics
                </div>
                <div className="text-xs text-[#EDE5D6]/60">
                  Identify drop-off points & difficult exercises
                </div>
              </div>
              <span className="text-lg">→</span>
            </Link>

            <Link
              href="/admin/services"
              className="p-4 rounded-xl glass-panel border border-[rgba(213,166,74,0.2)] hover:border-[#D5A64A]/50 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-serif font-bold text-sm text-[#F8F5EE] group-hover:text-[#D5A64A] transition-colors">
                  AI ಸೇವೆಗಳ ಸ್ಥಿತಿ • Service Health
                </div>
                <div className="text-xs text-[#EDE5D6]/60">
                  Monitor AI Guru and Gnani STT/TTS status
                </div>
              </div>
              <span className="text-lg">→</span>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}

