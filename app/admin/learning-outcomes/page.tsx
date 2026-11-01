'use client';

/**
 * Admin Learning Outcomes Analytics Page
 * Kannada Kaliri — Milestone 10
 */

import React, { useState, useEffect } from 'react';
import type { LearningOutcomeMetrics } from '@/lib/admin/types';

export default function AdminLearningOutcomesPage() {
  const [outcomes, setOutcomes] = useState<LearningOutcomeMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadOutcomes() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/learning-outcomes');
        const data = await res.json();
        if (!isCancelled && data.success) {
          setOutcomes(data.outcomes);
        }
      } catch (err) {
        console.error('Failed to load learning outcomes:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadOutcomes();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[#D5A64A] font-semibold">
          ಕಲಿಕಾ ಫಲಿತಾಂಶಗಳು • Educational Outcomes
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
          Learning Outcome Analytics
        </h1>
        <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
          Measure genuine vocabulary retention, grammar structure accuracy, and conversation confidence
        </p>
      </div>

      {loading || !outcomes ? (
        <div className="py-20 text-center text-xs text-[#EDE5D6]/50 animate-pulse">
          ಕಲಿಕಾ ಫಲಿತಾಂಶಗಳನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ... Calculating learning outcome metrics...
        </div>
      ) : (
        <>
          {/* Outcome Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="text-xs font-semibold text-[#EDE5D6]/70 uppercase">Vocabulary Retention</div>
              <div className="text-[11px] font-kannada text-[#D5A64A]">ಪದ ಸಂಪತ್ತು ಧಾರಣ ಸಾಮರ್ಥ್ಯ</div>
              <div className="font-serif text-3xl font-bold text-emerald-400 mt-2">
                {outcomes.vocabularyRetentionRate}%
              </div>
              <div className="text-[11px] text-[#EDE5D6]/60 mt-1">
                {outcomes.totalVocabPractised} total vocabulary items tracked
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="text-xs font-semibold text-[#EDE5D6]/70 uppercase">Grammar & SOV Accuracy</div>
              <div className="text-[11px] font-kannada text-[#D5A64A]">ವ್ಯಾಕರಣ ಮತ್ತು ವಾಕ್ಯ ರಚನೆ</div>
              <div className="font-serif text-3xl font-bold text-[#F8F5EE] mt-2">
                {outcomes.grammarAccuracy}%
              </div>
              <div className="text-[11px] text-[#EDE5D6]/60 mt-1">
                Based on interactive sentence builders
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="text-xs font-semibold text-[#EDE5D6]/70 uppercase">Scenario Confidence Avg</div>
              <div className="text-[11px] font-kannada text-[#D5A64A]">ಸಂಭಾಷಣಾ ಆತ್ಮವಿಶ್ವಾಸ</div>
              <div className="font-serif text-3xl font-bold text-[#D5A64A] mt-2">
                {outcomes.scenarioConfidenceAvg !== null ? `${outcomes.scenarioConfidenceAvg}%` : '—'}
              </div>
              <div className="text-[11px] text-[#EDE5D6]/60 mt-1">
                From real-world AI roleplay feedback
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)]">
              <div className="text-xs font-semibold text-[#EDE5D6]/70 uppercase">Score Progression</div>
              <div className="text-[11px] font-kannada text-[#D5A64A]">ಕಲಿಕಾ ಪ್ರಗತಿಯ ವೇಗ</div>
              <div className="font-serif text-3xl font-bold text-[#F8F5EE] mt-2">
                {outcomes.overallImprovementRate !== null
                  ? `${outcomes.overallImprovementRate > 0 ? '+' : ''}${outcomes.overallImprovementRate}%`
                  : 'Baseline'}
              </div>
              <div className="text-[11px] text-[#EDE5D6]/60 mt-1">
                First-half vs second-half assessments
              </div>
            </div>
          </div>

          {/* Metric Classification & Transparency Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Measured Metrics */}
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="font-serif font-bold text-sm text-[#F8F5EE]">
                  ಅಳೆಯಲಾದ ಫಲಿತಾಂಶಗಳು • Measured Metrics
                </h3>
              </div>
              <p className="text-[11px] text-[#EDE5D6]/70">
                Directly measured from actual database records without estimation:
              </p>
              <ul className="space-y-1.5 text-xs text-[#EDE5D6]/80 list-disc list-inside">
                {outcomes.measuredMetrics.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>

            {/* Derived Metrics */}
            <div className="glass-panel p-5 rounded-2xl border border-[#D5A64A]/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D5A64A]" />
                <h3 className="font-serif font-bold text-sm text-[#F8F5EE]">
                  ವ್ಯುತ್ಪನ್ನ ಸೂಚಕಗಳು • Derived Metrics
                </h3>
              </div>
              <p className="text-[11px] text-[#EDE5D6]/70">
                Calculated deterministically using statistical and pedagogical formulas:
              </p>
              <ul className="space-y-1.5 text-xs text-[#EDE5D6]/80 list-disc list-inside">
                {outcomes.derivedMetrics.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>

            {/* Unavailable Metrics */}
            <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <h3 className="font-serif font-bold text-sm text-[#F8F5EE]">
                  ಲಭ್ಯವಿಲ್ಲದ ಮಾಪನಗಳು • Unavailable Metrics
                </h3>
              </div>
              <p className="text-[11px] text-[#EDE5D6]/70">
                Transparently disclosed as unmeasured to avoid fabricated pedagogical claims:
              </p>
              <ul className="space-y-1.5 text-xs text-[#EDE5D6]/80 list-disc list-inside">
                {outcomes.unavailableMetrics.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

