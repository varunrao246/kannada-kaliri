'use client';

/**
 * Daily Challenges Card Component
 * Kannada Kaliri — Milestone 09
 */

import React, { useState } from 'react';
import type { DailyChallenge } from '@/lib/gamification/types';

interface DailyChallengesCardProps {
  challenges: DailyChallenge[];
  onClaimReward?: (challengeId: string) => void;
  className?: string;
}

export function DailyChallengesCard({
  challenges: initialChallenges,
  onClaimReward,
  className = '',
}: DailyChallengesCardProps) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>(initialChallenges);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedAlert, setClaimedAlert] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleClaim = async (challenge: DailyChallenge) => {
    if (claimingId || challenge.isClaimed || !challenge.isCompleted) return;

    setClaimingId(challenge.id);
    setClaimError(null);
    setClaimedAlert(null);

    try {
      const res = await fetch('/api/gamification/claim-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setClaimError(data.error || 'Failed to claim reward');
        return;
      }

      // Update challenge to claimed
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challenge.id
            ? { ...c, isClaimed: true, claimedAt: new Date().toISOString() }
            : c
        )
      );

      setClaimedAlert(`+${data.awardedXP || 30} XP ಕ್ಲೈಮ್ ಮಾಡಲಾಗಿದೆ! ಯಶಸ್ವಿ!`);

      if (onClaimReward) {
        onClaimReward(challenge.id);
      }
    } catch (err) {
      console.error('Error claiming challenge:', err);
      setClaimError('Network error while claiming challenge');
    } finally {
      setClaimingId(null);
    }
  };

  const completedCount = challenges.filter((c) => c.isCompleted).length;

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.25)] relative overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h3 className="font-serif text-lg font-bold text-[#F8F5EE]">
              ದೈನಂದಿನ ಸವಾಲುಗಳು • Daily Challenges
            </h3>
          </div>
          <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
            ಇಂದಿನ 3 ಸವಾಲುಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ ಹೆಚ್ಚುವರಿ XP ಗಳಿಸಿ!
          </p>
        </div>

        {/* Completed count pill */}
        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(213,166,74,0.15)] border border-[rgba(213,166,74,0.3)] text-[#D5A64A] text-xs font-bold">
            {completedCount} / {challenges.length}
          </span>
        </div>
      </div>

      {/* Alert Banners */}
      {claimedAlert && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <span className="font-medium">✨ {claimedAlert}</span>
          <button
            onClick={() => setClaimedAlert(null)}
            className="text-emerald-300/70 hover:text-emerald-100 text-sm ml-2"
          >
            ×
          </button>
        </div>
      )}

      {claimError && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <span className="font-medium">⚠️ {claimError}</span>
          <button
            onClick={() => setClaimError(null)}
            className="text-rose-300/70 hover:text-rose-100 text-sm ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Challenge List */}
      <div className="space-y-3">
        {challenges.map((challenge) => {
          const progressPercent = Math.min(
            100,
            Math.round((challenge.currentCount / challenge.targetCount) * 100)
          );

          return (
            <div
              key={challenge.id}
              className={`p-3.5 rounded-xl border transition-all ${
                challenge.isClaimed
                  ? 'border-emerald-500/30 bg-emerald-950/10 opacity-80'
                  : challenge.isCompleted
                  ? 'border-[rgba(213,166,74,0.4)] bg-[rgba(213,166,74,0.08)] shadow-md'
                  : 'border-[rgba(248,245,238,0.08)] bg-[rgba(248,245,238,0.03)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-[#F8F5EE] leading-tight">
                    {challenge.title}
                  </h4>
                  <div className="text-xs font-kannada text-[#D5A64A]">
                    {challenge.kannadaTitle}
                  </div>
                  <p className="text-[11px] text-[#EDE5D6]/70">
                    {challenge.description}
                  </p>
                </div>

                {/* Reward XP tag */}
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[rgba(213,166,74,0.2)] text-[#D5A64A] text-xs font-bold whitespace-nowrap flex-shrink-0">
                  +{challenge.xpReward} XP
                </span>
              </div>

              {/* Progress Bar & Action */}
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center text-[10px] text-[#EDE5D6]/60 mb-1">
                    <span>ಪ್ರಗತಿ • Progress</span>
                    <span className="font-semibold text-[#F8F5EE]">
                      {challenge.currentCount} / {challenge.targetCount}
                    </span>
                  </div>
                  <div className="w-full bg-[rgba(248,245,238,0.1)] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        challenge.isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-r from-[#D5A64A] to-[#E8C77F]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Claim Button / Status */}
                <div className="flex-shrink-0">
                  {challenge.isClaimed ? (
                    <span className="text-xs font-semibold text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                      <span>✓</span> ಕ್ಲೈಮ್ ಮಾಡಲಾಗಿದೆ
                    </span>
                  ) : challenge.isCompleted ? (
                    <button
                      onClick={() => handleClaim(challenge)}
                      disabled={claimingId === challenge.id}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-[#D5A64A] to-[#B5862B] text-[#101D36] hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[rgba(213,166,74,0.3)] disabled:opacity-50"
                    >
                      {claimingId === challenge.id ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಕ್ಲೈಮ್ ಮಾಡಿ (+30 XP)'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#EDE5D6]/40 font-medium px-2 py-1">
                      ಪ್ರಗತಿಯಲ್ಲಿದೆ
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

