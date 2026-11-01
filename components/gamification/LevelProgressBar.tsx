'use client';

/**
 * Level Progress Bar Component
 * Kannada Kaliri — Milestone 09
 */

import React from 'react';
import type { LearnerLevelInfo } from '@/lib/gamification/types';

interface LevelProgressBarProps {
  totalXP: number;
  levelInfo: LearnerLevelInfo;
  className?: string;
  compact?: boolean;
}

export function LevelProgressBar({
  totalXP,
  levelInfo,
  className = '',
  compact = false,
}: LevelProgressBarProps) {
  const isMaxLevel = levelInfo.level >= 7;

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.25)] relative overflow-hidden ${className}`}
    >
      {/* Background ambient gold glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[rgba(213,166,74,0.08)] rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-3">
        {/* Tier Emblem and Level Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D5A64A] to-[#B5862B] text-[#101D36] flex items-center justify-center font-serif font-bold text-xl shadow-lg shadow-[rgba(213,166,74,0.25)] flex-shrink-0">
            {levelInfo.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[#D5A64A] font-medium">
                ಹಂತ {levelInfo.level} • Level {levelInfo.level}
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#F8F5EE] leading-tight">
              {levelInfo.title}
              <span className="block text-xs font-kannada text-[#EDE5D6]/70 font-normal">
                {levelInfo.kannadaTitle}
              </span>
            </h3>
          </div>
        </div>

        {/* Total XP pill */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(213,166,74,0.15)] border border-[rgba(213,166,74,0.3)] text-[#D5A64A] font-bold text-sm">
            <svg
              className="w-4 h-4 text-[#D5A64A]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{totalXP} XP</span>
          </div>
          {!compact && (
            <div className="text-[11px] text-[#EDE5D6]/60 mt-1">
              {isMaxLevel
                ? 'ಗರಿಷ್ಠ ಹಂತ • Max Tier'
                : `${levelInfo.xpToNextLevel} XP ಮುಂದಿನ ಹಂತಕ್ಕೆ`}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-2">
        <div className="w-full bg-[rgba(248,245,238,0.08)] rounded-full h-3 overflow-hidden p-0.5 border border-[rgba(213,166,74,0.2)]">
          <div
            className="bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A] h-full rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${Math.max(5, Math.min(100, levelInfo.progressPercentage))}%` }}
          />
        </div>
        {!compact && (
          <div className="flex justify-between items-center text-[11px] text-[#EDE5D6]/70 mt-1.5 font-medium">
            <span>{levelInfo.currentLevelMinXP} XP</span>
            <span className="text-[#D5A64A] font-semibold">
              {levelInfo.progressPercentage}%
            </span>
            <span>
              {isMaxLevel ? `${totalXP} XP` : `${levelInfo.nextLevelXP} XP`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

