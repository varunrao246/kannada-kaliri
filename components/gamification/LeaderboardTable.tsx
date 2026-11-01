'use client';

/**
 * Leaderboard Table Component
 * Kannada Kaliri — Milestone 09
 */

import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry, LeaderboardPreference } from '@/lib/gamification/types';

interface LeaderboardTableProps {
  initialPreference?: LeaderboardPreference;
  className?: string;
}

type Timeframe = 'weekly' | 'monthly' | 'all_time';

export function LeaderboardTable({
  initialPreference,
  className = '',
}: LeaderboardTableProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  // Privacy preferences
  const [optIn, setOptIn] = useState<boolean>(initialPreference?.optIn ?? true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(initialPreference?.isAnonymous ?? false);
  const [savingPref, setSavingPref] = useState<boolean>(false);

  // Fetch leaderboard data when timeframe changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/gamification/leaderboard?timeframe=${timeframe}&limit=25`);
        const data = await res.json();
        if (!isCancelled && data.success) {
          setEntries(data.entries || []);
          setCurrentUserRank(data.currentUserRank);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchLeaderboard();

    return () => {
      isCancelled = true;
    };
  }, [timeframe]);

  // Update privacy preferences
  const handleTogglePref = async (newOptIn: boolean, newIsAnon: boolean) => {
    setOptIn(newOptIn);
    setIsAnonymous(newIsAnon);
    setSavingPref(true);

    try {
      await fetch('/api/gamification/leaderboard-pref', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optIn: newOptIn, isAnonymous: newIsAnon }),
      });
      // Refresh rankings
      const res = await fetch(`/api/gamification/leaderboard?timeframe=${timeframe}&limit=25`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
        setCurrentUserRank(data.currentUserRank);
      }
    } catch (err) {
      console.error('Error saving leaderboard preference:', err);
    } finally {
      setSavingPref(false);
    }
  };

  return (
    <div
      className={`glass-panel p-5 sm:p-6 rounded-2xl border border-[rgba(213,166,74,0.25)] relative ${className}`}
    >
      {/* Header & Timeframe Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h3 className="font-serif text-lg font-bold text-[#F8F5EE]">
              ಶ್ರೇಯಾಂಕಗಳು • Leaderboard
            </h3>
          </div>
          <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
            ಕಲಿಯುವವರ ಸಕ್ರಿಯ ಕಲಿಕೆ ಹಾಗೂ XP ಆಧಾರಿತ ಪಟ್ಟಿ
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[rgba(248,245,238,0.06)] border border-[rgba(213,166,74,0.15)] self-start sm:self-auto">
          {(
            [
              { id: 'weekly', label: 'ಈ ವಾರ', sub: 'Weekly' },
              { id: 'monthly', label: 'ಈ ತಿಂಗಳು', sub: 'Monthly' },
              { id: 'all_time', label: 'ಸಾರ್ವಕಾಲಿಕ', sub: 'All-Time' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeframe === t.id
                  ? 'bg-[#D5A64A] text-[#101D36] shadow-sm shadow-[rgba(213,166,74,0.3)]'
                  : 'text-[#EDE5D6]/70 hover:text-[#F8F5EE]'
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Control Bar */}
      <div className="mb-5 p-3 rounded-xl bg-[rgba(16,29,54,0.6)] border border-[rgba(213,166,74,0.15)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-[#EDE5D6]/80 hover:text-[#F8F5EE]">
            <input
              type="checkbox"
              checked={optIn}
              disabled={savingPref}
              onChange={(e) => handleTogglePref(e.target.checked, isAnonymous)}
              className="rounded border-[rgba(213,166,74,0.4)] text-[#D5A64A] focus:ring-[#D5A64A] bg-[rgba(248,245,238,0.05)]"
            />
            <span>ಲೀಡರ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಭಾಗವಹಿಸಿ (Opt-In)</span>
          </label>

          {optIn && (
            <label className="flex items-center gap-2 cursor-pointer text-[#EDE5D6]/80 hover:text-[#F8F5EE]">
              <input
                type="checkbox"
                checked={isAnonymous}
                disabled={savingPref}
                onChange={(e) => handleTogglePref(optIn, e.target.checked)}
                className="rounded border-[rgba(213,166,74,0.4)] text-[#D5A64A] focus:ring-[#D5A64A] bg-[rgba(248,245,238,0.05)]"
              />
              <span>ಅನಾಮಧೇಯವಾಗಿ ತೋರಿಸಿ (Anonymous)</span>
            </label>
          )}
        </div>

        {currentUserRank && (
          <div className="text-[#D5A64A] font-semibold flex items-center gap-1">
            <span>ನಿಮ್ಮ ಶ್ರೇಣಿ:</span>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(213,166,74,0.2)]">
              #{currentUserRank}
            </span>
          </div>
        )}
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="py-12 text-center text-[#EDE5D6]/50 text-sm animate-pulse">
          ಶ್ರೇಯಾಂಕಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...
        </div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-[#EDE5D6]/60 text-sm">
          ಯಾವುದೇ ಸಕ್ರಿಯ ಶ್ರೇಯಾಂಕಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ನೀವೇ ಮೊದಲಿಗೆ ಪಾಠ ಪೂರ್ಣಗೊಳಿಸಿ!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(213,166,74,0.15)] text-[#EDE5D6]/60 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3 w-16">ಶ್ರೇಣಿ • Rank</th>
                <th className="py-2.5 px-3">ಕಲಿಯುವವರು • Learner</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">ಹಂತ • Level</th>
                <th className="py-2.5 px-3 text-right">ಗಳಿಸಿದ XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(213,166,74,0.08)]">
              {entries.map((entry) => {
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-[rgba(213,166,74,0.12)] font-semibold'
                        : 'hover:bg-[rgba(248,245,238,0.03)]'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-serif text-sm">
                        {isTop1 ? (
                          <span className="text-base" title="1st Place">🥇</span>
                        ) : isTop2 ? (
                          <span className="text-base" title="2nd Place">🥈</span>
                        ) : isTop3 ? (
                          <span className="text-base" title="3rd Place">🥉</span>
                        ) : (
                          <span className="text-[#EDE5D6]/60 ml-1">#{entry.rank}</span>
                        )}
                      </div>
                    </td>

                    {/* Learner Name & Avatar */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[rgba(213,166,74,0.2)] border border-[rgba(213,166,74,0.3)] flex items-center justify-center text-xs font-bold text-[#D5A64A] flex-shrink-0">
                          {entry.displayName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#F8F5EE] font-medium">
                              {entry.displayName}
                            </span>
                            {entry.isCurrentUser && (
                              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#D5A64A] text-[#101D36] font-bold">
                                You
                              </span>
                            )}
                          </div>
                          {entry.isAnonymous && (
                            <span className="text-[10px] text-[#EDE5D6]/40">
                              (ಅನಾಮಧೇಯ)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="py-3 px-3 hidden sm:table-cell text-[#EDE5D6]/80">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[rgba(248,245,238,0.06)] border border-[rgba(213,166,74,0.15)] text-[11px]">
                        ಹಂತ {entry.level} • {entry.levelTitle}
                      </span>
                    </td>

                    {/* XP */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-serif font-bold text-[#D5A64A] text-sm">
                        {entry.totalXP.toLocaleString()} XP
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

