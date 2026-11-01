'use client';

/**
 * Admin Curriculum Analytics Page
 * Kannada Kaliri — Milestone 10
 */

import React, { useState, useEffect } from 'react';
import type { CurriculumLessonStat, ExerciseFailureStat } from '@/lib/admin/types';

export default function AdminCurriculumPage() {
  const [lessonStats, setLessonStats] = useState<CurriculumLessonStat[]>([]);
  const [exerciseFailures, setExerciseFailures] = useState<ExerciseFailureStat[]>([]);
  const [dropoffs, setDropoffs] = useState<CurriculumLessonStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadCurriculum() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/curriculum');
        const data = await res.json();
        if (!isCancelled && data.success) {
          setLessonStats(data.lessonStats || []);
          setExerciseFailures(data.frequentlyFailedExercises || []);
          setDropoffs(data.dropoffPoints || []);
        }
      } catch (err) {
        console.error('Failed to load curriculum analytics:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadCurriculum();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#D5A64A] font-semibold">
            ಪಠ್ಯಕ್ರಮ ವಿಶ್ಲೇಷಣೆ • Pedagogical Analysis
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
            Curriculum Analytics
          </h1>
          <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
            Evaluate lesson completion velocity, difficult exercises, and learner drop-off points
          </p>
        </div>

        <div>
          <a
            href="/api/admin/reports/export?type=curriculum"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[rgba(213,166,74,0.15)] hover:bg-[rgba(213,166,74,0.25)] border border-[rgba(213,166,74,0.3)] text-[#D5A64A] transition-all flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Export Curriculum CSV</span>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#EDE5D6]/50 animate-pulse">
          ಪಠ್ಯಕ್ರಮ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ... Loading curriculum analytics...
        </div>
      ) : (
        <>
          {/* Drop-off Point Alert Banner */}
          {dropoffs.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <span>⚠️</span> ಕಲಿಕಾ ಸ್ಥಗಿತ ಕೇಂದ್ರಗಳು • Detected Learner Drop-Off Points
              </div>
              <p className="text-amber-200/80">
                Significant learner drop-off was detected at:{' '}
                {dropoffs.map((d) => `${d.title} (${d.lessonId})`).join(', ')}.
                Consider reviewing exercise difficulty and introducing vocabulary scaffolding.
              </p>
            </div>
          )}

          {/* Lesson Completion and Assessment Scores Table */}
          <section className="glass-panel rounded-2xl border border-[rgba(213,166,74,0.2)] overflow-hidden space-y-3">
            <div className="p-4 sm:p-5 border-b border-[rgba(213,166,74,0.15)] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
                  A1 Curriculum Lessons (15 Lessons across 5 Modules)
                </h3>
                <p className="text-xs text-[#EDE5D6]/60">
                  Track completion percentages and assessment test scores with statistical sample sizes
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[rgba(213,166,74,0.15)] bg-[rgba(16,29,54,0.6)] text-[#EDE5D6]/60 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">ಪಾಠ • Lesson</th>
                    <th className="py-3 px-4">ವಿಭಾಗ • Module</th>
                    <th className="py-3 px-4 text-center">ಪೂರ್ಣಗೊಳಿಸಿದವರು • Completed</th>
                    <th className="py-3 px-4 text-center">ದರ • Completion Rate</th>
                    <th className="py-3 px-4 text-center">ಸರಾಸರಿ ಅಂಕ • Avg Score</th>
                    <th className="py-3 px-4 text-center">ಮಾದರಿ ಗಾತ್ರ • Sample Size</th>
                    <th className="py-3 px-4 text-center">ಸ್ಥಿತಿ • Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(213,166,74,0.08)]">
                  {lessonStats.map((l) => (
                    <tr
                      key={l.lessonId}
                      className="hover:bg-[rgba(248,245,238,0.03)] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#F8F5EE]">{l.title}</div>
                        <div className="text-[11px] font-kannada text-[#D5A64A]">
                          {l.kannadaTitle}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#EDE5D6]/80">Module {l.moduleNumber}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#F8F5EE]">
                        {l.completionCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-[rgba(248,245,238,0.1)] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#D5A64A] h-full rounded-full"
                              style={{ width: `${Math.min(100, l.completionRate)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold">{l.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {l.avgAssessmentScore !== null ? (
                          <span
                            className={
                              l.avgAssessmentScore >= 80
                                ? 'text-emerald-400'
                                : l.avgAssessmentScore >= 60
                                ? 'text-[#D5A64A]'
                                : 'text-rose-400'
                            }
                          >
                            {l.avgAssessmentScore}%
                          </span>
                        ) : (
                          <span className="text-[#EDE5D6]/30">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#EDE5D6]/60">
                        {l.sampleSize > 0 ? `n = ${l.sampleSize}` : 'n = 0'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {l.isDropoffPoint ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Drop-Off
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Frequently Failed Exercises */}
          <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-[rgba(213,166,74,0.2)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
                  ಹೆಚ್ಚು ತಪ್ಪಾಗುವ ಅಭ್ಯಾಸಗಳು • Frequently Failed Exercises
                </h3>
                <p className="text-xs text-[#EDE5D6]/60">
                  Exercises with the highest failure rates based on actual submission records
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300">
                Top {exerciseFailures.length} Difficult Exercises
              </span>
            </div>

            {exerciseFailures.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#EDE5D6]/40">
                ಯಾವುದೇ ತಪ್ಪಾದ ಅಭ್ಯಾಸಗಳಿಲ್ಲ • No repeated exercise failures recorded
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exerciseFailures.map((ex) => (
                  <div
                    key={ex.exerciseId}
                    className="p-4 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.15)] text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-[#F8F5EE] leading-tight">
                        {ex.prompt}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 whitespace-nowrap">
                        {ex.failureRate}% Fail Rate
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#EDE5D6]/60 pt-1 border-t border-white/5">
                      <span>Lesson: {ex.lessonId}</span>
                      <span>
                        {ex.failureCount} fails / {ex.totalAttempts} attempts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

