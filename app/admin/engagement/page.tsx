'use client';

/**
 * Admin Learner Engagement Analytics Page
 * Kannada Kaliri — Milestone 10
 */

import React, { useState, useEffect } from 'react';
import type { EngagementMetrics } from '@/lib/admin/types';

export default function AdminEngagementPage() {
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadEngagement() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/engagement');
        const data = await res.json();
        if (!isCancelled && data.success) {
          setEngagement(data.engagement);
        }
      } catch (err) {
        console.error('Failed to load engagement analytics:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadEngagement();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[#D5A64A] font-semibold">
          ಕಲಿಯುವವರ ನಿರಂತರತೆ • Learner Engagement
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
          Engagement & Retention Analytics
        </h1>
        <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
          Measure habit formation, streak retention curves, and activity distribution
        </p>
      </div>

      {loading || !engagement ? (
        <div className="py-20 text-center text-xs text-[#EDE5D6]/50 animate-pulse">
          ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆಯ ವಿವರಗಳನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ... Loading engagement analytics...
        </div>
      ) : (
        <>
          {/* Key Stickiness Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="text-xs font-semibold text-[#EDE5D6]/70 uppercase">
                DAU / WAU Stickiness
              </div>
              <div className="text-[11px] font-kannada text-[#D5A64A]">ದೈನಂದಿನ ನಿಷ್ಠೆಯ ಸೂಚ್ಯಂಕ</div>
              <div className="font-serif text-3xl font-bold text-[#F8F5EE] mt-2">
                {engagement.dauWauRatio}%
              </div>
              <div className="text-[11px] text-[#EDE5D6]/60 mt-1">
                Ratio of daily active users to weekly active users
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="text-xs font-semibold text-[#EDE5D6]/70 uppercase">
                Returning Learner Rate
              </div>
              <div className="text-[11px] font-kannada text-[#D5A64A]">ಮತ್ತೆ ಹಿಂದಿರುಗಿದ ಕಲಿಯುವವರು</div>
              <div className="font-serif text-3xl font-bold text-emerald-400 mt-2">
                {engagement.returningLearnerRate}%
              </div>
              <div className="text-[11px] text-[#EDE5D6]/60 mt-1">
                Learners sustaining &ge; 3 active learning days
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="text-xs font-semibold text-[#EDE5D6]/70 uppercase">
                DAU / MAU Ratio
              </div>
              <div className="text-[11px] font-kannada text-[#D5A64A]">ಮಾಸಿಕ ನಿಷ್ಠೆ</div>
              <div className="font-serif text-3xl font-bold text-[#D5A64A] mt-2">
                {engagement.dauMauRatio}%
              </div>
              <div className="text-[11px] text-[#EDE5D6]/60 mt-1">
                Monthly user engagement frequency
              </div>
            </div>
          </div>

          {/* Activity Distribution */}
          <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-[rgba(213,166,74,0.2)] space-y-4">
            <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
              ಚಟುವಟಿಕೆಗಳ ಹಂಚಿಕೆ • Learning Activity Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)]">
                <div className="text-2xl mb-1">📖</div>
                <div className="font-serif text-2xl font-bold text-[#F8F5EE]">
                  {engagement.activityDistribution.lessons}
                </div>
                <div className="text-[11px] text-[#EDE5D6]/60">Lessons Completed</div>
              </div>
              <div className="p-4 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)]">
                <div className="text-2xl mb-1">📝</div>
                <div className="font-serif text-2xl font-bold text-[#F8F5EE]">
                  {engagement.activityDistribution.assessments}
                </div>
                <div className="text-[11px] text-[#EDE5D6]/60">Assessments Submitted</div>
              </div>
              <div className="p-4 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)]">
                <div className="text-2xl mb-1">🗣️</div>
                <div className="font-serif text-2xl font-bold text-[#F8F5EE]">
                  {engagement.activityDistribution.scenarios}
                </div>
                <div className="text-[11px] text-[#EDE5D6]/60">Scenarios Completed</div>
              </div>
              <div className="p-4 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)]">
                <div className="text-2xl mb-1">🎯</div>
                <div className="font-serif text-2xl font-bold text-[#F8F5EE]">
                  {engagement.activityDistribution.dailyChallenges}
                </div>
                <div className="text-[11px] text-[#EDE5D6]/60">Challenges Finished</div>
              </div>
            </div>
          </section>

          {/* Grid: Streak Retention & Level Tier Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Streak Retention */}
            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)] space-y-4">
              <div>
                <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
                  ಸತತ ಕಲಿಕೆ ರಕ್ಷಣೆ • Streak Retention Funnel
                </h3>
                <p className="text-xs text-[#EDE5D6]/60">
                  How many learners form consistent daily learning habits over time
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <span className="font-medium text-[#F8F5EE]">3+ Day Continuous Streak</span>
                  </div>
                  <span className="font-bold text-[#D5A64A]">
                    {engagement.streakRetention.threeDayPlus} learners
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <span className="font-medium text-[#F8F5EE]">7+ Day Continuous Streak</span>
                  </div>
                  <span className="font-bold text-[#D5A64A]">
                    {engagement.streakRetention.sevenDayPlus} learners
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏆</span>
                    <span className="font-medium text-[#F8F5EE]">30+ Day Habit of Mysore</span>
                  </div>
                  <span className="font-bold text-emerald-400">
                    {engagement.streakRetention.thirtyDayPlus} learners
                  </span>
                </div>
              </div>
            </div>

            {/* Level Distribution */}
            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)] space-y-4">
              <div>
                <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
                  ಹಂತಗಳ ಹಂಚಿಕೆ • Level Tier Distribution
                </h3>
                <p className="text-xs text-[#EDE5D6]/60">
                  Distribution of learners across the 7 progression levels
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {engagement.levelDistribution.map((lvl) => (
                  <div
                    key={lvl.level}
                    className="p-2.5 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.08)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#D5A64A]">Level {lvl.level}:</span>{' '}
                      <span className="text-[#F8F5EE] font-medium">{lvl.title}</span>
                      <span className="text-[10px] font-kannada text-[#EDE5D6]/60 ml-1">
                        ({lvl.kannadaTitle})
                      </span>
                    </div>
                    <span className="font-serif font-bold text-[#F8F5EE]">
                      {lvl.learnerCount} learners
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

