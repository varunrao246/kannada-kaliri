'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Volume2,
  Dumbbell,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Flame,
  Clock,
  ArrowRight,
  Menu,
  X,
  Target,
  Compass,
  Award,
  Zap,
  Shield,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { LearnerProfile } from '@/types/profile';
import type {
  LessonWithProgress,
  DailyGoalStats,
  LearningStreakStats,
  SkillsOverview,
  DailyRecommendation,
} from '@/types/curriculum';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import type { LearnerAnalyticsSnapshot } from '@/lib/adaptive/types';
import type { GamificationSummary } from '@/lib/gamification/types';

const AdaptiveIntelligenceWidget = dynamic(
  () => import('./AdaptiveIntelligenceWidget').then((mod) => mod.AdaptiveIntelligenceWidget),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-[#0A1222]/60 border border-[rgba(213,166,74,0.15)] animate-pulse" />
    ),
  }
);

const GamificationCompactWidget = dynamic(
  () => import('@/components/gamification/GamificationCompactWidget').then((mod) => mod.GamificationCompactWidget),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-[#0A1222]/60 border border-[rgba(213,166,74,0.15)] animate-pulse" />
    ),
  }
);

export interface DashboardAssessmentStats {
  recentScore: number | null;
  totalExercisesCompleted: number;
  totalVocabPractised: number;
  hasHistory: boolean;
}

export interface DashboardScenarioStats {
  completedCount: number;
  recentAttempts: Array<{
    scenarioId: string;
    confidenceScore: number | null;
    completedAt: string | null;
  }>;
}

interface DashboardViewProps {
  user: SupabaseUser;
  profile: LearnerProfile | null;
  nextLesson: LessonWithProgress;
  dailyGoalStats: DailyGoalStats;
  streakStats: LearningStreakStats;
  skillsOverview: SkillsOverview;
  recommendation: DailyRecommendation;
  assessmentStats?: DashboardAssessmentStats;
  scenarioStats?: DashboardScenarioStats;
  adaptiveAnalytics?: LearnerAnalyticsSnapshot;
  gamificationSummary?: GamificationSummary;
}

const NATIVE_LANGUAGE_NAMES: Record<string, { label: string; script: string }> = {
  en: { label: 'English', script: 'English' },
  hi: { label: 'Hindi', script: 'हिन्दी' },
  ta: { label: 'Tamil', script: 'தமிழ்' },
  te: { label: 'Telugu', script: 'తెలుగు' },
  ml: { label: 'Malayalam', script: 'മലയാളം' },
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner (A1)',
  elementary: 'Elementary (A2)',
  intermediate: 'Intermediate (B1)',
};

export default function DashboardView({
  user,
  profile,
  nextLesson,
  dailyGoalStats,
  streakStats,
  skillsOverview,
  recommendation,
  assessmentStats,
  scenarioStats,
  adaptiveAnalytics,
  gamificationSummary,
}: DashboardViewProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'progress' | 'settings'>('dashboard');
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Learner';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const nativeLangCode = profile?.native_language || 'en';
  const nativeLangInfo = NATIVE_LANGUAGE_NAMES[nativeLangCode] || { label: 'English', script: 'English' };
  const levelLabel = LEVEL_LABELS[profile?.proficiency_level || 'beginner'] || 'Beginner (A1)';
  const isUserAdmin = Boolean(
    user.app_metadata?.role === 'admin' || user.app_metadata?.role === 'super_admin'
  );

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#101D36] text-[#F8F5EE] flex selection:bg-[#D5A64A]/30">
      {/* ========================================================================= */}
      {/* A. SIDEBAR NAVIGATION - DESKTOP                                           */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0A1222] border-r border-[#D5A64A]/20 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Wordmark */}
        <div className="p-6 border-b border-[#D5A64A]/20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D5A64A] via-[#B5862B] to-[#101D36] p-[1.5px] shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#101D36] rounded-[10px] flex items-center justify-center border border-[#D5A64A]/30">
                <span className="font-serif font-bold text-lg text-[#D5A64A]">ಕ</span>
              </div>
            </div>
            <div>
              <span className="font-serif text-base font-bold text-[#F8F5EE] block leading-tight">
                ಕನ್ನಡ ಕಲಿರಿ
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#D5A64A] block">
                Kannada Kaliri
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5" aria-label="Sidebar Navigation">
          {/* Active: Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#D5A64A] text-[#101D36] shadow-md shadow-[#D5A64A]/20 font-bold'
                : 'text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Learn Kannada */}
          <Link
            href="/learn"
            className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <BookOpen className="w-4 h-4 text-[#D5A64A]" />
              <span>Learn Kannada</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D5A64A] bg-[#D5A64A]/10 px-2 py-0.5 rounded">
              A1
            </span>
          </Link>

          {/* Vocabulary */}
          <Link
            href="/learn#vocab"
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5 transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>Vocabulary</span>
          </Link>

          {/* Practice */}
          <Link
            href="/learn#practice"
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5 transition-all"
          >
            <Dumbbell className="w-4 h-4" />
            <span>Practice</span>
          </Link>

          {/* Coming Soon Section */}
          <div className="pt-4 pb-2">
            <span className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5A64A]/60">
              AI & Intelligent Tools
            </span>
          </div>

          {/* AI Kannada Guru (Milestone 06 Live) */}
          <Link
            href="/guru"
            className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <Bot className="w-4 h-4 text-[#D5A64A] group-hover:scale-110 transition-transform" />
              <span>AI Kannada Guru</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#D5A64A]/20 text-[#D5A64A] px-2 py-0.5 rounded border border-[#D5A64A]/30">
              Live
            </span>
          </Link>

          {/* Conversation Simulator (Milestone 07 Live) */}
          <Link
            href="/scenarios"
            className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <MessageSquare className="w-4 h-4 text-[#D5A64A] group-hover:scale-110 transition-transform" />
              <span>Conversation Simulator</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#D5A64A]/20 text-[#D5A64A] px-2 py-0.5 rounded border border-[#D5A64A]/30">
              Live
            </span>
          </Link>

          {/* Achievements & Rewards (Milestone 09) */}
          <Link
            href="/achievements"
            className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <Award className="w-4 h-4 text-[#D5A64A] group-hover:scale-110 transition-transform" />
              <span>Achievements & XP</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#D5A64A]/20 text-[#D5A64A] px-2 py-0.5 rounded border border-[#D5A64A]/30">
              Live
            </span>
          </Link>

          {/* Admin Console (Milestone 10) */}
          {isUserAdmin && (
            <Link
              href="/admin"
              className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-[#D5A64A] bg-[#D5A64A]/10 border border-[#D5A64A]/25 hover:bg-[#D5A64A]/20 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <Shield className="w-4 h-4 text-[#D5A64A] group-hover:scale-110 transition-transform" />
                <span>Admin Console</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[#D5A64A] text-[#101D36] px-2 py-0.5 rounded font-bold">
                Admin
              </span>
            </Link>
          )}

          {/* Divider */}
          <div className="pt-4 pb-2">
            <span className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5A64A]/60">
              Account
            </span>
          </div>

          {/* My Progress */}
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-[#D5A64A] text-[#101D36] shadow-md font-bold'
                : 'text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>My Progress</span>
          </button>

          {/* Profile & Settings */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#D5A64A] text-[#101D36] shadow-md font-bold'
                : 'text-[#EDE5D6]/80 hover:text-[#D5A64A] hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Profile &amp; Settings</span>
          </button>
        </nav>

        {/* User Mini Profile & Sign Out Footer */}
        <div className="p-4 border-t border-[#D5A64A]/20 bg-black/20 space-y-3">
          <div className="flex items-center gap-3 px-2">
            {avatarUrl ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D5A64A] shrink-0">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#D5A64A] text-[#101D36] flex items-center justify-center font-bold text-sm shrink-0">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#F8F5EE] truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-[#EDE5D6]/60 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-[#EDE5D6]/70 hover:text-[#D5A64A] hover:bg-white/5 border border-transparent hover:border-[#D5A64A]/30 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[#0A1222] border-b border-[#D5A64A]/20 sticky top-0 z-30">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D5A64A] text-[#101D36] flex items-center justify-center font-bold text-sm">
              ಕ
            </div>
            <span className="font-serif text-sm font-bold text-[#F8F5EE]">
              ಕನ್ನಡ ಕಲಿರಿ
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#EDE5D6] hover:text-[#D5A64A]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0A1222] border-b border-[#D5A64A]/30 p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#D5A64A] text-[#101D36] flex items-center justify-center font-bold text-xs">
                {displayName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-[#F8F5EE]">{displayName}</p>
                <p className="text-[10px] text-[#EDE5D6]/60">{levelLabel}</p>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Link
                href="/learn"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-[#EDE5D6] hover:text-[#D5A64A]"
              >
                Learn Kannada (A1)
              </Link>
              <Link
                href="/guru"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-[#D5A64A] font-semibold flex items-center justify-between"
              >
                <span>AI Kannada Guru</span>
                <span className="text-[10px] bg-[#D5A64A]/20 px-2 py-0.5 rounded">Live</span>
              </Link>
              <Link
                href="/scenarios"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-[#D5A64A] font-semibold flex items-center justify-between"
              >
                <span>Conversation Simulator</span>
                <span className="text-[10px] bg-[#D5A64A]/20 px-2 py-0.5 rounded">Live</span>
              </Link>
              <Link
                href="/achievements"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-[#D5A64A] font-semibold flex items-center justify-between"
              >
                <span>Achievements & XP</span>
                <span className="text-[10px] bg-[#D5A64A]/20 px-2 py-0.5 rounded">Live</span>
              </Link>
              {isUserAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-sm text-[#D5A64A] font-bold flex items-center justify-between border-t border-white/5 pt-3"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Admin Console</span>
                  </span>
                  <span className="text-[10px] bg-[#D5A64A] text-[#101D36] px-2 py-0.5 rounded font-bold">
                    Admin
                  </span>
                </Link>
              )}
              <button
                onClick={() => {
                  setActiveTab('progress');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 text-sm text-[#EDE5D6] hover:text-[#D5A64A]"
              >
                My Progress
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 text-sm text-[#EDE5D6] hover:text-[#D5A64A]"
              >
                Profile &amp; Settings
              </button>
              <button
                onClick={handleSignOut}
                className="text-left py-2 text-sm text-red-400 hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Scrollable Body */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto space-y-8">
          {/* ===================================================================== */}
          {/* B. PERSONALIZED GREETING BANNER                                        */}
          {/* ===================================================================== */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#0A1222] via-[#101D36] to-[#0A1222] border border-[#D5A64A]/30 p-6 sm:p-8 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D5A64A]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D5A64A] bg-[#D5A64A]/10 px-3 py-1 rounded-full border border-[#D5A64A]/25">
                    ನಮಸ್ಕಾರ!
                  </span>
                  <span className="text-xs text-[#EDE5D6]/70">
                    Learning via {nativeLangInfo.script} ({nativeLangInfo.label})
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EE]">
                  ನಮಸ್ಕಾರ, {displayName}!
                </h1>

                <p className="text-sm sm:text-base text-[#EDE5D6]/85 font-normal">
                  Ready to make Kannada part of your everyday life?
                </p>
              </div>

              {/* Profile Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-[#D5A64A]/20 text-xs">
                  <span className="text-[#EDE5D6]/50 block text-[10px] uppercase">Current Level</span>
                  <span className="font-bold text-[#D5A64A]">{levelLabel}</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-[#D5A64A]/20 text-xs">
                  <span className="text-[#EDE5D6]/50 block text-[10px] uppercase">Daily Target</span>
                  <span className="font-bold text-[#F8F5EE]">{dailyGoalStats.goalMinutes} mins/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STATS STRIP: C. DAILY GOAL + D. LEARNING STREAK                       */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* C. DAILY LEARNING GOAL */}
            <div className="p-6 rounded-2xl bg-[#0A1222]/85 border border-[#D5A64A]/25 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#D5A64A]" />
                    <h3 className="font-serif text-base font-bold text-[#F8F5EE]">
                      Daily Learning Target
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#D5A64A]">
                    {dailyGoalStats.percentage}%
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="w-full bg-[#101D36] h-3 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-[#D5A64A] to-[#E8C77F] h-full rounded-full transition-all duration-500"
                      style={{ width: `${dailyGoalStats.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="text-[#EDE5D6]/50 block text-[10px]">Target</span>
                    <span className="font-bold text-[#F8F5EE]">{dailyGoalStats.goalMinutes} min</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="text-[#EDE5D6]/50 block text-[10px]">Completed</span>
                    <span className="font-bold text-emerald-400">{dailyGoalStats.completedMinutesToday} min</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="text-[#EDE5D6]/50 block text-[10px]">Remaining</span>
                    <span className="font-bold text-[#D5A64A]">{dailyGoalStats.remainingMinutes} min</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#EDE5D6]/60 italic mt-4 pt-3 border-t border-white/5">
                {dailyGoalStats.remainingMinutes === 0
                  ? '🎉 Daily goal accomplished! Keep exploring or take a well-deserved rest.'
                  : `Complete ${dailyGoalStats.remainingMinutes} more minutes today to meet your target.`}
              </p>
            </div>

            {/* D. LEARNING STREAK & WEEKLY CALENDAR */}
            <div className="p-6 rounded-2xl bg-[#0A1222]/85 border border-[#D5A64A]/25 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h3 className="font-serif text-base font-bold text-[#F8F5EE]">
                      Learning Streak
                    </h3>
                  </div>
                  <span className="text-xs text-[#EDE5D6]/60">
                    Best: <strong className="text-[#D5A64A]">{streakStats.bestStreak} days</strong>
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-serif text-4xl font-extrabold text-[#D5A64A]">
                    {streakStats.currentStreak}
                  </span>
                  <span className="text-xs text-[#EDE5D6]/80 font-medium">
                    {streakStats.currentStreak === 1 ? 'day active streak' : 'days active streak'}
                  </span>
                </div>

                {/* 7-Day Weekly Dot Calendar */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#EDE5D6]/50 font-semibold block">
                    Weekly Activity (Past 7 Days):
                  </span>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {streakStats.weeklyActivity.map((day, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                          day.hasActivity
                            ? 'bg-[#D5A64A]/15 border-[#D5A64A]/40 text-[#D5A64A]'
                            : day.isToday
                            ? 'bg-white/[0.04] border-white/20 text-[#EDE5D6]'
                            : 'bg-black/20 border-white/5 text-[#EDE5D6]/40'
                        }`}
                      >
                        <span className="text-[10px] font-semibold">{day.dayName}</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            day.hasActivity ? 'bg-[#D5A64A]' : 'bg-white/10'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#EDE5D6]/60 italic mt-4 pt-3 border-t border-white/5">
                Streaks increment automatically when you complete a qualifying lesson.
              </p>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* E0. ADAPTIVE LEARNING INTELLIGENCE (Milestone 08)                     */}
          {/* ===================================================================== */}
          <AdaptiveIntelligenceWidget analytics={adaptiveAnalytics} />

          {/* ===================================================================== */}
          {/* E0.1 GAMIFICATION & REWARDS MOTIVATION WIDGET (Milestone 09)           */}
          {/* ===================================================================== */}
          {gamificationSummary && (
            <GamificationCompactWidget summary={gamificationSummary} />
          )}

          {/* ===================================================================== */}
          {/* E. CONTINUE LEARNING + G. DAILY RECOMMENDATION                        */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* E. CONTINUE LEARNING CARD (8 Cols) */}
            <div className="lg:col-span-7 rounded-2xl bg-[#0A1222]/90 border border-[#D5A64A]/30 p-6 sm:p-7 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D5A64A] bg-[#D5A64A]/10 px-2.5 py-0.5 rounded">
                    Continue Learning
                  </span>
                  <span className="text-xs text-[#EDE5D6]/60 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D5A64A]" />
                    {nextLesson.estimatedMinutes} min
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <span className="text-[11px] text-[#EDE5D6]/60 font-mono">
                    {nextLesson.moduleTitle || 'Foundations'}
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#F8F5EE]">
                    {nextLesson.title}
                  </h3>
                  {nextLesson.kannadaTitle && (
                    <span className="text-sm font-kannada text-[#D5A64A] block">
                      {nextLesson.kannadaTitle}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#EDE5D6]/80 leading-relaxed mb-6">
                  {nextLesson.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <Link
                  href={`/learn/${nextLesson.id}`}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#D5A64A] hover:bg-[#E8C77F] text-[#101D36] font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg shadow-[#D5A64A]/20 cursor-pointer"
                >
                  <span>{nextLesson.status === 'in_progress' ? 'Resume Lesson' : 'Start Lesson'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/learn"
                  className="text-xs text-[#EDE5D6]/70 hover:text-[#D5A64A] transition-colors"
                >
                  View full syllabus →
                </Link>
              </div>
            </div>

            {/* G. DAILY RECOMMENDATION (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#101D36] to-[#0A1222] border border-[#D5A64A]/25 p-6 sm:p-7 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D5A64A] mb-3">
                  <Zap className="w-4 h-4 text-[#D5A64A]" />
                  <span>Personalized Recommendation</span>
                </div>

                <h4 className="font-serif text-lg font-bold text-[#F8F5EE] mb-2">
                  {recommendation.lesson.title}
                </h4>

                <p className="text-xs text-[#EDE5D6]/80 leading-relaxed mb-4">
                  {recommendation.reason}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <Link
                  href={`/learn/${recommendation.lesson.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1A2E56] hover:bg-white/10 border border-[#D5A64A]/30 text-xs font-semibold text-[#F8F5EE] hover:text-[#D5A64A] transition-all"
                >
                  <span>Explore Recommendation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* E2. AI KANNADA GURU TUTOR SPOTLIGHT (Milestone 06)                   */}
          {/* ===================================================================== */}
          <div className="rounded-2xl bg-gradient-to-r from-[#101D36] via-[#152544] to-[#101D36] border border-[#D5A64A]/40 p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D5A64A]/15 border border-[#D5A64A]/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🪔
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-[#F8F5EE]">
                    ಕನ್ನಡ ಗುರು — AI Kannada Guru
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D5A64A] bg-[#D5A64A]/10 px-2 py-0.5 rounded border border-[#D5A64A]/25">
                    Live 24/7 Tutor
                  </span>
                </div>
                <p className="text-xs text-[#EDE5D6]/80 max-w-2xl leading-relaxed">
                  Have questions about Kannada grammar, daily Bangalore conversations, or Mysore culture? Chat with your personalized AI Guru in {nativeLangInfo.label} with voice intelligence support.
                </p>
              </div>
            </div>

            <Link
              href="/guru"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D5A64A] hover:bg-[#E8C77F] text-[#101D36] font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg shadow-[#D5A64A]/20 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Consult Guru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ===================================================================== */}
          {/* E3. REAL-WORLD SCENARIO SIMULATOR (Milestone 07)                    */}
          {/* ===================================================================== */}
          <div className="rounded-2xl bg-gradient-to-r from-[#0C172B] via-[#101D36] to-[#0C172B] border border-[#D5A64A]/35 p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D5A64A]/15 border border-[#D5A64A]/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🎭
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-[#F8F5EE]">
                    ರಿಯಲ್-ವರ್ಲ್ಡ್ ಸಂಭಾಷಣೆ · Scenario Simulator
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/25">
                    {scenarioStats && scenarioStats.completedCount > 0
                      ? `${scenarioStats.completedCount} Completed`
                      : '8 Scenarios'}
                  </span>
                </div>
                <p className="text-xs text-[#EDE5D6]/80 max-w-2xl leading-relaxed">
                  Immerse yourself in 8 real-life Karnataka scenarios. Practise ordering food in a Darshini, shopping at a local Kirāṇi, hailing an auto, or chatting with neighbours.
                </p>
                {scenarioStats && scenarioStats.recentAttempts.length > 0 && (
                  <p className="text-[11px] text-[#D5A64A] font-semibold pt-0.5">
                    Recent: {scenarioStats.recentAttempts[0].scenarioId} · Score:{' '}
                    {scenarioStats.recentAttempts[0].confidenceScore
                      ? `${scenarioStats.recentAttempts[0].confidenceScore}%`
                      : 'Completed'}
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/scenarios"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A2E56] hover:bg-[#D5A64A] hover:text-[#101D36] border border-[#D5A64A]/40 text-[#F8F5EE] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#D5A64A]" />
              <span>Explore Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ===================================================================== */}
          {/* F. SKILL OVERVIEW                                                     */}
          {/* ===================================================================== */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0A1222]/85 border border-[#D5A64A]/25 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#F8F5EE] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#D5A64A]" />
                  <span>Kannada Skill Profile</span>
                </h3>
                <p className="text-xs text-[#EDE5D6]/70 mt-1">
                  Continuous mastery tracking across the 4 core language dimensions.
                </p>
              </div>

              {skillsOverview.hasStarted && (
                <span className="text-xs font-bold text-[#D5A64A] bg-[#D5A64A]/10 px-3 py-1 rounded-full border border-[#D5A64A]/20">
                  {skillsOverview.totalLessonsCompleted} Lessons Completed
                </span>
              )}
            </div>

            {!skillsOverview.hasStarted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#101D36] border border-[#D5A64A]/30 flex items-center justify-center mx-auto text-[#D5A64A]">
                  <Compass className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#EDE5D6]">
                  Start learning to build your skill profile.
                </p>
                <p className="text-xs text-[#EDE5D6]/60 max-w-sm mx-auto">
                  Complete your first module to begin tracking vocabulary, grammar, listening comprehension, and speaking cadence.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/learn/${nextLesson.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D5A64A] text-[#101D36] text-xs font-bold uppercase tracking-wider"
                  >
                    <span>Begin Lesson 1</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Vocabulary */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#EDE5D6]">Vocabulary</span>
                    <span className="text-[#D5A64A] font-bold">{skillsOverview.vocabulary.progress}%</span>
                  </div>
                  <div className="w-full bg-[#101D36] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D5A64A] h-full rounded-full"
                      style={{ width: `${skillsOverview.vocabulary.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#EDE5D6]/60 block">
                    Level: {skillsOverview.vocabulary.level}
                  </span>
                </div>

                {/* Grammar */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#EDE5D6]">Grammar &amp; Syntax</span>
                    <span className="text-[#D5A64A] font-bold">{skillsOverview.grammar.progress}%</span>
                  </div>
                  <div className="w-full bg-[#101D36] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D5A64A] h-full rounded-full"
                      style={{ width: `${skillsOverview.grammar.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#EDE5D6]/60 block">
                    Level: {skillsOverview.grammar.level}
                  </span>
                </div>

                {/* Listening */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#EDE5D6]">Listening Comprehension</span>
                    <span className="text-[#D5A64A] font-bold">{skillsOverview.listening.progress}%</span>
                  </div>
                  <div className="w-full bg-[#101D36] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D5A64A] h-full rounded-full"
                      style={{ width: `${skillsOverview.listening.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#EDE5D6]/60 block">
                    Level: {skillsOverview.listening.level}
                  </span>
                </div>

                {/* Speaking */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#EDE5D6]">Spoken Cadence</span>
                    <span className="text-[#D5A64A] font-bold">{skillsOverview.speaking.progress}%</span>
                  </div>
                  <div className="w-full bg-[#101D36] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D5A64A] h-full rounded-full"
                      style={{ width: `${skillsOverview.speaking.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#EDE5D6]/60 block">
                    Level: {skillsOverview.speaking.level}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* H. ASSESSMENT & PRACTICE PERFORMANCE (MILESTONE 04)                   */}
          {/* ===================================================================== */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0A1222]/85 border border-[#D5A64A]/25 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#F8F5EE] flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#D5A64A]" />
                  <span>Assessment &amp; Practice Engine</span>
                </h3>
                <p className="text-xs text-[#EDE5D6]/70 mt-1">
                  Interactive quizzes, word matching, sentence builders, and vocabulary recall results.
                </p>
              </div>

              {assessmentStats?.hasHistory && assessmentStats.recentScore !== null && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Latest Score: {assessmentStats.recentScore}%
                </span>
              )}
            </div>

            {!assessmentStats?.hasHistory ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#101D36] border border-[#D5A64A]/30 flex items-center justify-center mx-auto text-[#D5A64A]">
                  <Target className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#EDE5D6]">
                  No assessments completed yet
                </p>
                <p className="text-xs text-[#EDE5D6]/60 max-w-sm mx-auto">
                  Take an interactive practice session in any lesson to test your Kannada recognition, listening, sentence construction, and vocabulary recall.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/learn/${nextLesson.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D5A64A] text-[#101D36] text-xs font-bold uppercase tracking-wider"
                  >
                    <span>Practice in {nextLesson.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Latest Assessment Score */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#EDE5D6]/50 uppercase tracking-wider font-semibold block">
                      Latest Score
                    </span>
                    <span className="font-serif text-3xl font-extrabold text-[#D5A64A]">
                      {assessmentStats.recentScore !== null ? `${assessmentStats.recentScore}%` : '—'}
                    </span>
                    <span className="text-[11px] text-[#EDE5D6]/60 block">
                      {assessmentStats.recentScore !== null && assessmentStats.recentScore >= 80
                        ? 'Excellent mastery'
                        : 'Good progress'}
                    </span>
                  </div>

                  {/* Exercises Attempted */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#EDE5D6]/50 uppercase tracking-wider font-semibold block">
                      Exercises Solved
                    </span>
                    <span className="font-serif text-3xl font-extrabold text-emerald-400">
                      {assessmentStats.totalExercisesCompleted}
                    </span>
                    <span className="text-[11px] text-[#EDE5D6]/60 block">
                      Interactive attempts recorded
                    </span>
                  </div>

                  {/* Vocabulary Mastered */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#EDE5D6]/50 uppercase tracking-wider font-semibold block">
                      Vocabulary Practised
                    </span>
                    <span className="font-serif text-3xl font-extrabold text-[#D5A64A]">
                      {assessmentStats.totalVocabPractised}
                    </span>
                    <span className="text-[11px] text-[#EDE5D6]/60 block">
                      Words tested in recall
                    </span>
                  </div>
                </div>

                {/* Recommended Revision Activity */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#101D36] to-[#0A1222] border border-[#D5A64A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D5A64A] block">
                      Recommended Practice
                    </span>
                    <p className="text-sm font-semibold text-[#F8F5EE]">
                      Reinforce your skills with {nextLesson.title}
                    </p>
                    <p className="text-xs text-[#EDE5D6]/70">
                      Solve multiple choice, matching, sentence building, and listening exercises.
                    </p>
                  </div>
                  <Link
                    href={`/learn/${nextLesson.id}`}
                    className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D5A64A] text-[#101D36] text-xs font-bold uppercase tracking-wider hover:bg-[#E8C77F] transition-all"
                  >
                    <span>Start Practice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
