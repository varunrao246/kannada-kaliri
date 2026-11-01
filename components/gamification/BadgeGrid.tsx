'use client';

/**
 * Badge Grid Component
 * Kannada Kaliri — Milestone 09
 */

import React, { useState, useMemo } from 'react';
import type { AchievementBadge } from '@/lib/gamification/types';

interface BadgeGridProps {
  badges: AchievementBadge[];
  className?: string;
}

type CategoryFilter = 'all' | 'milestones' | 'consistency' | 'speaking' | 'mastery';

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string; kannadaLabel: string }> = [
  { id: 'all', label: 'All', kannadaLabel: 'ಎಲ್ಲಾ' },
  { id: 'milestones', label: 'Milestones', kannadaLabel: 'ಮೈಲಿಗಲ್ಲು' },
  { id: 'consistency', label: 'Consistency', kannadaLabel: 'ಸ್ಥಿರತೆ' },
  { id: 'speaking', label: 'Speaking', kannadaLabel: 'ಸಂಭಾಷಣೆ' },
  { id: 'mastery', label: 'Mastery', kannadaLabel: 'ಪಾಂಡಿತ್ಯ' },
];

export function BadgeGrid({ badges, className = '' }: BadgeGridProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredBadges = useMemo(() => {
    if (activeCategory === 'all') return badges;
    return badges.filter((b) => b.category === activeCategory);
  }, [badges, activeCategory]);

  const unlockedCount = useMemo(() => badges.filter((b) => b.unlocked).length, [badges]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category selector and unlocked tally */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-md shadow-[rgba(213,166,74,0.3)]'
                    : 'bg-[rgba(248,245,238,0.06)] text-[#EDE5D6]/70 hover:text-[#F8F5EE] hover:bg-[rgba(248,245,238,0.12)] border border-[rgba(213,166,74,0.15)]'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1 text-[11px] opacity-75 font-kannada">({tab.kannadaLabel})</span>
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div className="text-xs font-medium text-[#EDE5D6]/80 flex items-center gap-1.5">
          <span className="text-[#D5A64A] font-bold text-sm">{unlockedCount}</span>
          <span>/</span>
          <span>{badges.length}</span>
          <span className="text-[#EDE5D6]/60">ಸಾಧನೆಗಳು ಅನ್‌ಲಾಕ್ • Badges Earned</span>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isUnlocked = badge.unlocked;

          // Rarity styling
          const rarityStyles = {
            common: 'border-[rgba(213,166,74,0.2)] bg-[rgba(248,245,238,0.04)]',
            rare: 'border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.06)]',
            epic: 'border-[rgba(168,85,247,0.35)] bg-[rgba(168,85,247,0.08)]',
            legendary: 'border-[rgba(213,166,74,0.5)] bg-[rgba(213,166,74,0.12)] shadow-md shadow-[rgba(213,166,74,0.15)]',
          }[badge.rarity];

          const rarityTag = {
            common: 'text-[#EDE5D6]/60 bg-[rgba(248,245,238,0.08)]',
            rare: 'text-blue-300 bg-blue-500/20',
            epic: 'text-purple-300 bg-purple-500/20',
            legendary: 'text-[#D5A64A] bg-[rgba(213,166,74,0.25)] font-bold',
          }[badge.rarity];

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border transition-all duration-300 relative ${
                isUnlocked
                  ? `${rarityStyles} hover:-translate-y-1 hover:border-[#D5A64A]/60`
                  : 'border-[rgba(248,245,238,0.08)] bg-[rgba(16,29,54,0.4)] opacity-60 grayscale'
              }`}
            >
              {/* Top Row: Icon & Rarity */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-[#1A2E56] to-[#0A1222] border border-[rgba(213,166,74,0.3)] shadow-inner'
                      : 'bg-black/30 border border-white/10'
                  }`}
                >
                  {isUnlocked ? badge.icon : '🔒'}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${rarityTag}`}>
                    {badge.rarity}
                  </span>
                  {isUnlocked && (
                    <span className="text-emerald-400 text-xs" title="Unlocked">
                      ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-sm text-[#F8F5EE] leading-tight">
                  {badge.title}
                </h4>
                <div className="text-xs font-kannada text-[#D5A64A] font-medium">
                  {badge.kannadaTitle}
                </div>
                <p className="text-xs text-[#EDE5D6]/70 leading-relaxed pt-1">
                  {badge.description}
                </p>
              </div>

              {/* Unlock Date / Lock Footer */}
              <div className="mt-3 pt-2.5 border-t border-[rgba(213,166,74,0.1)] flex items-center justify-between text-[11px]">
                {isUnlocked ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span>🏆</span> ಅನ್‌ಲಾಕ್ ಮಾಡಲಾಗಿದೆ
                    {badge.unlockedAt && (
                      <span className="text-[#EDE5D6]/50 ml-1">
                        ({new Date(badge.unlockedAt).toLocaleDateString()})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[#EDE5D6]/40 flex items-center gap-1 font-medium">
                    <span>🔒</span> ಅನ್‌ಲಾಕ್ ಆಗಿಲ್ಲ • Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

