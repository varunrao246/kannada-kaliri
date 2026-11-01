'use client';

/**
 * Admin Learner Management Page
 * Kannada Kaliri — Milestone 10
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { LearnerAdminSummary } from '@/lib/admin/types';

export default function AdminLearnersPage() {
  const [learners, setLearners] = useState<LearnerAdminSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [nativeLang, setNativeLang] = useState<string>('all');
  const [proficiency, setProficiency] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadLearners() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: '15',
          ...(search ? { search } : {}),
          ...(nativeLang !== 'all' ? { nativeLang } : {}),
          ...(proficiency !== 'all' ? { proficiency } : {}),
        });

        const res = await fetch(`/api/admin/learners?${query.toString()}`);
        const data = await res.json();

        if (!isCancelled && data.success) {
          setLearners(data.learners || []);
          setTotalCount(data.totalCount || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load learners:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadLearners();

    return () => {
      isCancelled = true;
    };
  }, [page, search, nativeLang, proficiency]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#D5A64A] font-semibold">
            ಕಲಿಯುವವರ ಪಟ್ಟಿ • Learner Directory
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
            Learner Management
          </h1>
          <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
            Monitor progress, assessment performance, and active learning streaks ({totalCount} total)
          </p>
        </div>

        <div>
          <a
            href="/api/admin/reports/export?type=learners"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[rgba(213,166,74,0.15)] hover:bg-[rgba(213,166,74,0.25)] border border-[rgba(213,166,74,0.3)] text-[#D5A64A] transition-all flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Export Learners CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-[rgba(213,166,74,0.2)] flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by learner name or user ID..."
            className="w-full px-3.5 py-2 rounded-xl bg-[rgba(248,245,238,0.05)] border border-[rgba(213,166,74,0.2)] text-xs text-[#F8F5EE] placeholder-[#EDE5D6]/40 focus:outline-none focus:border-[#D5A64A]"
          />
        </div>

        {/* Native Language Filter */}
        <div className="w-40">
          <select
            value={nativeLang}
            onChange={(e) => {
              setNativeLang(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0A1222] border border-[rgba(213,166,74,0.2)] text-xs text-[#F8F5EE] focus:outline-none focus:border-[#D5A64A]"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="ml">Malayalam (മലയാളം)</option>
          </select>
        </div>

        {/* Proficiency Filter */}
        <div className="w-40">
          <select
            value={proficiency}
            onChange={(e) => {
              setProficiency(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0A1222] border border-[rgba(213,166,74,0.2)] text-xs text-[#F8F5EE] focus:outline-none focus:border-[#D5A64A]"
          >
            <option value="all">All Proficiency</option>
            <option value="beginner">Beginner (A1)</option>
            <option value="elementary">Elementary (A2)</option>
            <option value="intermediate">Intermediate (B1)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-[rgba(213,166,74,0.2)] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#EDE5D6]/50 animate-pulse">
            ಕಲಿಯುವವರ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ... Loading learners...
          </div>
        ) : learners.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#EDE5D6]/50">
            ಯಾವುದೇ ಕಲಿಯುವವರು ಕಂಡುಬಂದಿಲ್ಲ • No learners match the selected filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(213,166,74,0.15)] bg-[rgba(16,29,54,0.6)] text-[#EDE5D6]/60 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">ಕಲಿಯುವವರು • Learner</th>
                  <th className="py-3 px-4">ಭಾಷೆ • Language</th>
                  <th className="py-3 px-4">ಹಂತ • Level</th>
                  <th className="py-3 px-4 text-center">ಪಾಠಗಳು • Lessons</th>
                  <th className="py-3 px-4 text-center">ಪರೀಕ್ಷಾ ಅಂಕ • Avg Score</th>
                  <th className="py-3 px-4 text-center">ಸತತ ಕಲಿಕೆ • Streak</th>
                  <th className="py-3 px-4 text-right">ಗಳಿಸಿದ XP</th>
                  <th className="py-3 px-4 text-right">ವಿವರಗಳು • Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(213,166,74,0.08)]">
                {learners.map((learner) => {
                  return (
                    <tr
                      key={learner.userId}
                      className="hover:bg-[rgba(248,245,238,0.03)] transition-colors"
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#F8F5EE]">
                          {learner.fullName}
                        </div>
                        <div className="text-[10px] text-[#EDE5D6]/40 font-mono">
                          ID: {learner.userId.slice(0, 8)}...
                        </div>
                      </td>

                      {/* Native Language */}
                      <td className="py-3.5 px-4 text-[#EDE5D6]/80 uppercase font-mono text-[11px]">
                        {learner.nativeLanguage}
                      </td>

                      {/* Proficiency */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(213,166,74,0.15)] text-[#D5A64A]">
                          {learner.proficiencyLevel}
                        </span>
                      </td>

                      {/* Completed Lessons */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-serif font-bold text-[#F8F5EE]">
                          {learner.completedLessonsCount}
                        </span>
                        <span className="text-[10px] text-[#EDE5D6]/50"> / 15</span>
                      </td>

                      {/* Average Assessment Score */}
                      <td className="py-3.5 px-4 text-center">
                        {learner.averageScore !== null ? (
                          <span
                            className={`font-bold ${
                              learner.averageScore >= 80
                                ? 'text-emerald-400'
                                : learner.averageScore >= 60
                                ? 'text-[#D5A64A]'
                                : 'text-rose-400'
                            }`}
                          >
                            {learner.averageScore}%
                          </span>
                        ) : (
                          <span className="text-[#EDE5D6]/40">—</span>
                        )}
                      </td>

                      {/* Streak */}
                      <td className="py-3.5 px-4 text-center">
                        {learner.currentStreak > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-bold text-[11px]">
                            <span>🔥</span>
                            <span>{learner.currentStreak}d</span>
                          </span>
                        ) : (
                          <span className="text-[#EDE5D6]/40 text-[11px]">0d</span>
                        )}
                      </td>

                      {/* Total XP */}
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-[#D5A64A]">
                        {learner.totalXP.toLocaleString()} XP
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/learners/${learner.userId}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[rgba(248,245,238,0.06)] hover:bg-[rgba(213,166,74,0.2)] text-[#D5A64A] transition-colors"
                        >
                          View Analytics →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[rgba(213,166,74,0.15)] flex items-center justify-between text-xs">
            <span className="text-[#EDE5D6]/60">
              Page {page} of {totalPages} ({totalCount} total learners)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg bg-[rgba(248,245,238,0.06)] disabled:opacity-30 hover:bg-[rgba(248,245,238,0.12)] text-[#F8F5EE]"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-lg bg-[rgba(248,245,238,0.06)] disabled:opacity-30 hover:bg-[rgba(248,245,238,0.12)] text-[#F8F5EE]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

