'use client';

/**
 * Individual Learner Detail & Analytics View
 * Kannada Kaliri — Milestone 10
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface LearnerDetailState {
  profile: {
    id: string;
    user_id: string;
    full_name: string | null;
    native_language: string;
    proficiency_level: string;
    learning_goals: string[];
    daily_goal_minutes: number;
    created_at: string;
  } | null;
  completedLessons: Array<{ lessonId: string; completedAt: string | null }>;
  assessmentHistory: Array<{
    id: string;
    lessonId: string;
    scorePercentage: number;
    completedAt: string;
  }>;
  scenariosHistory: Array<{
    scenarioId: string;
    confidenceScore: number | null;
    status: string;
    completedAt: string | null;
  }>;
  totalXP: number;
  unlockedBadges: Array<{ achievementId: string; unlockedAt: string }>;
}

export default function IndividualLearnerPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [data, setData] = useState<LearnerDetailState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadLearner() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/learners/${userId}`);
        const result = await res.json();
        if (!isCancelled) {
          if (res.ok && result.success) {
            setData(result.learner);
          } else {
            setError(result.error || 'Failed to fetch learner details');
          }
        }
      } catch {
        if (!isCancelled) setError('Network error loading learner details');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    if (userId) {
      loadLearner();
    }

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#EDE5D6]/50 animate-pulse">
        ಕಲಿಯುವವರ ದಾಖಲೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ... Loading individual learner analytics...
      </div>
    );
  }

  if (error || !data || !data.profile) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/learners"
          className="text-xs text-[#D5A64A] hover:underline flex items-center gap-1"
        >
          ← Back to Learners Directory
        </Link>
        <div className="p-6 rounded-2xl glass-panel border border-rose-500/30 text-rose-300 text-sm">
          {error || 'Learner record not found.'}
        </div>
      </div>
    );
  }

  const { profile, completedLessons, assessmentHistory, scenariosHistory, totalXP, unlockedBadges } =
    data;

  const avgScore =
    assessmentHistory.length > 0
      ? Math.round(
          assessmentHistory.reduce((a, b) => a + b.scorePercentage, 0) / assessmentHistory.length
        )
      : null;

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/admin/learners"
        className="inline-flex items-center gap-1 text-xs text-[#D5A64A] hover:text-[#E8C77F] transition-colors"
      >
        <span>← Back to Learners Directory</span>
      </Link>

      {/* Header Profile Card */}
      <div className="glass-panel p-6 rounded-2xl border border-[rgba(213,166,74,0.3)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[rgba(213,166,74,0.06)] rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D5A64A] to-[#B5862B] text-[#101D36] flex items-center justify-center font-serif font-bold text-2xl shadow-md">
              {(profile.full_name || 'K')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#D5A64A] font-semibold">
                ಕಲಿಯುವವರ ಪ್ರೊಫೈಲ್ • Learner Profile
              </div>
              <h1 className="font-serif text-2xl font-bold text-[#F8F5EE]">
                {profile.full_name || 'Kannada Learner'}
              </h1>
              <div className="text-xs text-[#EDE5D6]/60 font-mono mt-0.5">
                User ID: {profile.user_id}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-[rgba(213,166,74,0.15)] border border-[rgba(213,166,74,0.3)] text-[#D5A64A] font-bold text-sm">
              ⭐ {totalXP.toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* Profile Attributes Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[rgba(213,166,74,0.15)] text-xs">
          <div>
            <div className="text-[10px] text-[#EDE5D6]/50 uppercase font-semibold">Native Language</div>
            <div className="text-[#F8F5EE] font-bold mt-0.5 uppercase">{profile.native_language}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#EDE5D6]/50 uppercase font-semibold">Proficiency</div>
            <div className="text-[#D5A64A] font-bold mt-0.5 capitalize">{profile.proficiency_level}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#EDE5D6]/50 uppercase font-semibold">Daily Goal</div>
            <div className="text-[#F8F5EE] font-bold mt-0.5">{profile.daily_goal_minutes} min/day</div>
          </div>
          <div>
            <div className="text-[10px] text-[#EDE5D6]/50 uppercase font-semibold">Registered At</div>
            <div className="text-[#F8F5EE] font-bold mt-0.5">{new Date(profile.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Row: Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-[rgba(213,166,74,0.2)]">
          <div className="text-[10px] uppercase tracking-wider text-[#EDE5D6]/60 font-semibold">Completed Lessons</div>
          <div className="font-serif text-2xl font-bold text-[#F8F5EE] mt-1">
            {completedLessons.length} <span className="text-xs text-[#EDE5D6]/50">/ 15</span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-[rgba(213,166,74,0.2)]">
          <div className="text-[10px] uppercase tracking-wider text-[#EDE5D6]/60 font-semibold">Assessments Taken</div>
          <div className="font-serif text-2xl font-bold text-[#F8F5EE] mt-1">{assessmentHistory.length}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-[rgba(213,166,74,0.2)]">
          <div className="text-[10px] uppercase tracking-wider text-[#EDE5D6]/60 font-semibold">Average Assessment Score</div>
          <div className="font-serif text-2xl font-bold text-emerald-400 mt-1">
            {avgScore !== null ? `${avgScore}%` : '—'}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-[rgba(213,166,74,0.2)]">
          <div className="text-[10px] uppercase tracking-wider text-[#EDE5D6]/60 font-semibold">Badges Unlocked</div>
          <div className="font-serif text-2xl font-bold text-[#D5A64A] mt-1">{unlockedBadges.length}</div>
        </div>
      </div>

      {/* Grid: Assessment History & Completed Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment History */}
        <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
              ಪರೀಕ್ಷಾ ಇತಿಹಾಸ • Assessment History
            </h3>
            <span className="text-xs text-[#EDE5D6]/60">{assessmentHistory.length} attempts</span>
          </div>

          {assessmentHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#EDE5D6]/40">
              ಯಾವುದೇ ಪರೀಕ್ಷೆ ತೆಗೆದುಕೊಂಡಿಲ್ಲ • No assessments submitted yet
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {assessmentHistory.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#F8F5EE]">Lesson: {a.lessonId}</div>
                    <div className="text-[10px] text-[#EDE5D6]/50">
                      {new Date(a.completedAt).toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${
                      a.scorePercentage >= 80
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : a.scorePercentage >= 60
                        ? 'bg-[#D5A64A]/15 text-[#D5A64A]'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {a.scorePercentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Lessons */}
        <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
              ಪೂರ್ಣಗೊಂಡ ಪಾಠಗಳು • Completed Lessons
            </h3>
            <span className="text-xs text-[#EDE5D6]/60">{completedLessons.length} / 15</span>
          </div>

          {completedLessons.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#EDE5D6]/40">
              ಯಾವುದೇ ಪಾಠ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ • No lessons completed yet
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {completedLessons.map((l) => (
                <div
                  key={l.lessonId}
                  className="p-3 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)] flex items-center justify-between text-xs"
                >
                  <div className="font-semibold text-[#F8F5EE]">{l.lessonId}</div>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {l.completedAt ? new Date(l.completedAt).toLocaleDateString() : 'Completed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scenarios History */}
      <div className="glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
            ಸಂಭಾಷಣಾ ಸಿಮ್ಯುಲೇಟರ್ ಪಾತ್ರವಹಿಸುವಿಕೆ • Scenario Roleplay Attempts
          </h3>
          <span className="text-xs text-[#EDE5D6]/60">{scenariosHistory.length} total</span>
        </div>

        {scenariosHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#EDE5D6]/40">
            ಯಾವುದೇ ಸಂಭಾಷಣೆ ಪ್ರಯತ್ನಿಸಿಲ್ಲ • No real-world scenarios attempted yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenariosHistory.map((s, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)] text-xs space-y-1"
              >
                <div className="font-semibold text-[#F8F5EE]">{s.scenarioId}</div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="capitalize text-[#EDE5D6]/60">{s.status}</span>
                  {s.confidenceScore !== null && (
                    <span className="text-[#D5A64A] font-bold">
                      Confidence: {s.confidenceScore}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
