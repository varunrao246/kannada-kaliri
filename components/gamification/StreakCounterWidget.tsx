'use client';

/**
 * Streak Counter Widget Component
 * Kannada Kaliri — Milestone 09
 */

import React from 'react';
import type { StreakStats } from '@/lib/gamification/types';

interface StreakCounterWidgetProps {
  streak: StreakStats;
  className?: string;
  compact?: boolean;
}

export function StreakCounterWidget({
  streak,
  className = '',
  compact = false,
}: StreakCounterWidgetProps) {
  return (
    <div
      className={`glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.25)] relative overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Streak Main Indicator */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0 ${
              streak.currentStreak > 0
                ? 'bg-gradient-to-br from-[#E25822] via-[#F38B2B] to-[#D5A64A] shadow-[rgba(226,88,34,0.3)]'
                : 'bg-[rgba(248,245,238,0.1)] border border-[rgba(213,166,74,0.2)]'
            }`}
          >
            {streak.currentStreak > 0 ? '🔥' : '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold text-[#F8F5EE] tracking-tight">
                {streak.currentStreak}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D5A64A]">
                {streak.currentStreak === 1 ? 'ದಿನ • Day' : 'ದಿನಗಳು • Days'}
              </span>
            </div>
            <div className="text-xs text-[#EDE5D6]/70 font-medium">
              ಪ್ರಸ್ತುತ ಸತತ ಕಲಿಕೆ • Current Streak
            </div>
          </div>
        </div>

        {/* Longest streak pill */}
        <div className="text-right">
          <div className="text-[11px] text-[#EDE5D6]/60 uppercase tracking-wider font-semibold">
            ಗರಿಷ್ಠ ದಾಖಲೆ • Best
          </div>
          <div className="text-sm font-bold text-[#F8F5EE] mt-0.5">
            🏆 {streak.longestStreak} {streak.longestStreak === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* 7-Day Rolling Activity Strip */}
      {!compact && (
        <div className="mt-4 pt-3.5 border-t border-[rgba(213,166,74,0.15)]">
          <div className="flex justify-between items-center text-center">
            {streak.last7Days.map((day) => {
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-[#EDE5D6]/60 font-kannada">
                    {day.dayLabelKannada}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      day.isActive
                        ? 'bg-gradient-to-tr from-[#D5A64A] to-[#E8C77F] text-[#101D36] shadow-sm shadow-[rgba(213,166,74,0.4)] ring-2 ring-[rgba(213,166,74,0.3)]'
                        : day.isToday
                        ? 'border-2 border-dashed border-[#D5A64A] text-[#EDE5D6]/50 bg-[rgba(213,166,74,0.05)]'
                        : 'bg-[rgba(248,245,238,0.06)] text-[#EDE5D6]/30'
                    }`}
                    title={`${day.date}: ${day.isActive ? 'Active' : 'No activity'}`}
                  >
                    {day.isActive ? '✓' : day.isToday ? '•' : ''}
                  </div>
                  <span className="text-[9px] text-[#EDE5D6]/50 font-medium">
                    {day.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Today's Streak Status Banner */}
          <div className="mt-3 text-center text-xs font-medium">
            {streak.isActiveToday ? (
              <span className="text-emerald-400 flex items-center justify-center gap-1">
                <span>✓</span> ಇಂದಿನ ಕಲಿಕೆ ಪೂರ್ಣಗೊಂಡಿದೆ! ಸತತ ಕಲಿಕೆ ರಕ್ಷಿತವಾಗಿದೆ.
              </span>
            ) : (
              <span className="text-[#D5A64A] flex items-center justify-center gap-1">
                <span>⏳</span> ಇಂದಿನ ಸತತ ಕಲಿಕೆ ಮುಂದುವರಿಸಲು ಒಂದು ಪಾಠ ಪೂರ್ಣಗೊಳಿಸಿ!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

