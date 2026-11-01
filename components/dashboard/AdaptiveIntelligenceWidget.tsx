'use client';

import React from 'react';
import Link from 'next/link';
import type { LearnerAnalyticsSnapshot } from '@/lib/adaptive/types';

interface AdaptiveIntelligenceWidgetProps {
  analytics?: LearnerAnalyticsSnapshot | null;
}

const STATE_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  mastered: { label: 'Mastered', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  proficient: { label: 'Proficient', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  developing: { label: 'Developing', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  needs_attention: { label: 'Needs Practice', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

const DIFFICULTY_BADGES: Record<string, string> = {
  easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  hard: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
};

export function AdaptiveIntelligenceWidget({ analytics }: AdaptiveIntelligenceWidgetProps) {
  if (!analytics) return null;

  const stateBadge = STATE_BADGES[analytics.masteryState] || STATE_BADGES.developing;
  const topGap = analytics.knowledgeGaps[0];
  const primaryRec = analytics.recommendations[0];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0B1426] via-[#101D36] to-[#0A1222] border border-[#D5A64A]/30 p-6 sm:p-8 shadow-2xl space-y-6 text-[#F8F5EE]">
      {/* ─── Top Header: Adaptive Engine ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D5A64A]/15 border border-[#D5A64A]/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🧠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-[#F8F5EE]">
                Adaptive Learning Intelligence
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D5A64A]/20 text-[#D5A64A] px-2 py-0.5 rounded border border-[#D5A64A]/30">
                Deterministic Engine
              </span>
            </div>
            <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
              Continuous performance tracking across exercises, vocabulary, and conversations.
            </p>
          </div>
        </div>

        {/* Overall Mastery Pill */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 self-start md:self-auto">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#EDE5D6]/60 font-semibold">
              Overall Mastery
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {analytics.hasSufficientData ? `${analytics.overallMastery}%` : 'Calibrating'}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${stateBadge.bg} ${stateBadge.text} ${stateBadge.border}`}>
                {analytics.hasSufficientData ? stateBadge.label : 'New Learner'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Insufficient Data Notice (Empty State) ──────────────────── */}
      {!analytics.hasSufficientData && (
        <div className="bg-[#D5A64A]/10 border border-[#D5A64A]/25 rounded-2xl p-4 text-xs text-[#EDE5D6]/80 flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="font-semibold text-[#D5A64A]">Mastery Model Calibrating</p>
            <p className="text-[11px] text-[#EDE5D6]/70 mt-0.5">
              Complete your first lesson assessment or conversation scenario to unlock granular skill scores and personal knowledge-gap detection.
            </p>
          </div>
        </div>
      )}

      {/* ─── 5 Core Skill Masteries Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {analytics.skillMasteries.map((skill) => (
          <div
            key={skill.skillId}
            className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2 hover:border-[#D5A64A]/40 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#EDE5D6] truncate text-[11px]">{skill.name}</span>
              <span className="font-bold text-[#D5A64A]">
                {skill.isMeasurable ? `${skill.score}%` : '—'}
              </span>
            </div>

            {/* Meter Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  skill.score >= 80
                    ? 'bg-emerald-400'
                    : skill.score >= 60
                    ? 'bg-[#D5A64A]'
                    : skill.score >= 40
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
                style={{ width: `${skill.isMeasurable ? skill.score : 0}%` }}
              />
            </div>

            <p className="text-[10px] text-[#EDE5D6]/50 line-clamp-2 leading-tight">
              {skill.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Intelligence Insights: Gaps & Next Recommendation ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* Knowledge Gap Card */}
        <div className="bg-[#15233E]/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D5A64A] flex items-center gap-1.5">
              <span>🎯</span>
              <span>Detected Knowledge Gap</span>
            </span>
            {topGap && (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Priority: {topGap.priority}
              </span>
            )}
          </div>

          {topGap ? (
            <div className="space-y-2">
              <h4 className="font-serif text-base font-bold text-white">
                {topGap.topic}
              </h4>
              <p className="text-xs text-[#EDE5D6]/80 leading-relaxed">
                {topGap.evidence}
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#EDE5D6]/60">
                  Current Mastery: <strong className="text-white">{topGap.currentMastery}%</strong>
                </span>
                <Link
                  href={topGap.actionUrl}
                  className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Reinforce Gap →
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-1">
              <p className="text-xs font-semibold text-emerald-400">
                ✓ No Critical Knowledge Gaps Detected
              </p>
              <p className="text-[11px] text-[#EDE5D6]/60">
                Your performance across grammar, vocabulary, and sentence ordering is well balanced.
              </p>
            </div>
          )}
        </div>

        {/* Adaptive Dynamic Recommendation */}
        <div className="bg-gradient-to-br from-[#1A2E56] to-[#101D36] border border-[#D5A64A]/30 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D5A64A] flex items-center gap-1.5">
                <span>⚡</span>
                <span>Adaptive Recommendation</span>
              </span>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#D5A64A]/20 text-[#D5A64A] border border-[#D5A64A]/30">
                {primaryRec ? primaryRec.type.replace('_', ' ') : 'Ready'}
              </span>
            </div>

            {primaryRec ? (
              <>
                <h4 className="font-serif text-base font-bold text-white">
                  {primaryRec.title}
                </h4>
                <p className="text-xs text-[#EDE5D6]/80 leading-relaxed">
                  {primaryRec.reason}
                </p>
              </>
            ) : (
              <p className="text-xs text-[#EDE5D6]/80">
                Continue through the structured A1 curriculum lessons.
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#EDE5D6]/60 font-medium">
              ⏱ ~{primaryRec?.estimatedMinutes || 8} mins
            </span>
            <Link
              href={primaryRec?.actionUrl || '/learn'}
              className="px-4 py-2 bg-[#D5A64A] hover:bg-[#E8C77F] text-[#101D36] font-bold rounded-xl transition-all shadow-md hover:shadow-lg shadow-[#D5A64A]/20"
            >
              {primaryRec?.ctaText || 'Get Started →'}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Bottom Status: Difficulty & Consistency ────────────────── */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#EDE5D6]/70">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#EDE5D6]">Calibrated Exercise Difficulty:</span>
          <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] border ${DIFFICULTY_BADGES[analytics.difficulty.currentLevel]}`}>
            {analytics.difficulty.currentLevel}
          </span>
          <span className="text-[11px] text-[#EDE5D6]/50 hidden md:inline">
            ({analytics.difficulty.explanation})
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>Learning Consistency: <strong className="text-white">{analytics.consistency.consistencyScore}%</strong></span>
          <span>·</span>
          <span>
            Trend:{' '}
            <strong className="text-emerald-400 capitalize">
              {analytics.consistency.trend.replace('_', ' ')}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

