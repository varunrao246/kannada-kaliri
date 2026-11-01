/**
 * Gamification Service
 * Kannada Kaliri — Milestone 09
 *
 * Implements server-side XP rewards, idempotent transactions,
 * level calculations, daily streak evaluations, badge unlocking,
 * daily challenges, and opt-in leaderboards.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type {
  GamificationSummary,
  XPTransaction,
  AchievementBadge,
  DailyChallenge,
  LeaderboardEntry,
  StreakStats,
  LearnerLevelInfo,
  LeaderboardPreference,
} from '@/lib/gamification/types';
import {
  XP_REWARDS,
  ACHIEVEMENTS_CATALOG,
  getAchievementById,
} from '@/lib/gamification/constants';
import { calculateLevelFromXP } from '@/lib/gamification/levels';
import { computeStreakStats } from '@/lib/gamification/streaks';
import { getNewlyUnlockedAchievementIds } from '@/lib/gamification/achievements';
import { generateDailyChallenges } from '@/lib/gamification/challenges';

export type GamificationSupabaseClient = SupabaseClient<Database>;

function getClient(client?: GamificationSupabaseClient): GamificationSupabaseClient | null {
  if (client) return client;
  return createBrowserClient() as GamificationSupabaseClient | null;
}

/**
 * Award XP to a learner idempotently.
 * Returns whether XP was awarded or if it was a duplicate request.
 */
export async function awardXP(
  userId: string,
  activityType: XPTransaction['activityType'],
  idempotencyKey: string,
  description: string,
  xpAmount: number,
  metadata?: Record<string, unknown>,
  client?: GamificationSupabaseClient
): Promise<{ success: boolean; duplicate: boolean; awarded: number; transaction?: XPTransaction }> {
  const supabase = getClient(client);
  if (!supabase || !userId || !idempotencyKey || xpAmount <= 0) {
    return { success: false, duplicate: false, awarded: 0 };
  }

  try {
    // 1. Check idempotency key to prevent repeat awards
    const { data: existing } = await supabase
      .from('xp_transactions')
      .select('id, user_id, activity_type, idempotency_key, xp_amount, description, metadata, created_at')
      .eq('user_id', userId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      return {
        success: true,
        duplicate: true,
        awarded: 0,
        transaction: {
          id: existing.id,
          userId: existing.user_id,
          activityType: existing.activity_type as XPTransaction['activityType'],
          idempotencyKey: existing.idempotency_key,
          xpAmount: existing.xp_amount,
          description: existing.description,
          metadata: (existing.metadata as Record<string, unknown>) || undefined,
          createdAt: existing.created_at,
        },
      };
    }

    // 2. Insert new transaction
    const { data: inserted, error } = await supabase
      .from('xp_transactions')
      .insert({
        user_id: userId,
        activity_type: activityType,
        idempotency_key: idempotencyKey,
        xp_amount: xpAmount,
        description,
        metadata: (metadata as unknown as Json) || null,
      })
      .select()
      .single();

    if (error || !inserted) {
      console.warn('[GamificationService] Failed to insert XP transaction:', error?.message);
      return { success: false, duplicate: false, awarded: 0 };
    }

    // 3. Trigger achievement unlock check in background
    checkAndUnlockAchievements(userId, supabase).catch((err) =>
      console.warn('[GamificationService] Background badge check error:', err)
    );

    return {
      success: true,
      duplicate: false,
      awarded: xpAmount,
      transaction: {
        id: inserted.id,
        userId: inserted.user_id,
        activityType: inserted.activity_type as XPTransaction['activityType'],
        idempotencyKey: inserted.idempotency_key,
        xpAmount: inserted.xp_amount,
        description: inserted.description,
        metadata: (inserted.metadata as Record<string, unknown>) || undefined,
        createdAt: inserted.created_at,
      },
    };
  } catch (err) {
    console.error('[GamificationService] Error awarding XP:', err);
    return { success: false, duplicate: false, awarded: 0 };
  }
}

/**
 * Get total XP and level details for a user
 */
export async function getUserXP(
  userId: string,
  client?: GamificationSupabaseClient
): Promise<{ totalXP: number; levelInfo: LearnerLevelInfo }> {
  const supabase = getClient(client);
  if (!supabase || !userId) {
    return { totalXP: 0, levelInfo: calculateLevelFromXP(0) };
  }

  try {
    const { data } = await supabase
      .from('xp_transactions')
      .select('xp_amount')
      .eq('user_id', userId);

    const totalXP = (data || []).reduce((acc, row) => acc + (row.xp_amount || 0), 0);
    return {
      totalXP,
      levelInfo: calculateLevelFromXP(totalXP),
    };
  } catch (err) {
    console.error('[GamificationService] Error getting user XP:', err);
    return { totalXP: 0, levelInfo: calculateLevelFromXP(0) };
  }
}

/**
 * Get streak details for a user
 */
export async function getUserStreak(
  userId: string,
  client?: GamificationSupabaseClient,
  userLocalDate?: string
): Promise<StreakStats> {
  const supabase = getClient(client);
  const todayStr = userLocalDate || new Date().toISOString().split('T')[0];

  if (!supabase || !userId) {
    return computeStreakStats([], todayStr);
  }

  try {
    // Collect active dates from daily_activity and xp_transactions
    const [actRes, xpRes] = await Promise.all([
      supabase.from('daily_activity').select('activity_date').eq('user_id', userId),
      supabase.from('xp_transactions').select('created_at').eq('user_id', userId),
    ]);

    const dateSet = new Set<string>();
    (actRes.data || []).forEach((row) => {
      if (row.activity_date) dateSet.add(row.activity_date);
    });
    (xpRes.data || []).forEach((row) => {
      if (row.created_at) {
        const d = row.created_at.split('T')[0];
        dateSet.add(d);
      }
    });

    return computeStreakStats(Array.from(dateSet), todayStr);
  } catch (err) {
    console.error('[GamificationService] Error computing user streak:', err);
    return computeStreakStats([], todayStr);
  }
}

/**
 * Get all badges for a user with unlock statuses
 */
export async function getUserAchievements(
  userId: string,
  client?: GamificationSupabaseClient
): Promise<AchievementBadge[]> {
  const supabase = getClient(client);
  if (!supabase || !userId) {
    return ACHIEVEMENTS_CATALOG.map((b) => ({ ...b, isUnlocked: false, unlocked: false }));
  }

  try {
    const { data: unlockedRows } = await supabase
      .from('learner_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);

    const unlockedMap = new Map<string, string>();
    (unlockedRows || []).forEach((r) => unlockedMap.set(r.achievement_id, r.unlocked_at));

    return ACHIEVEMENTS_CATALOG.map((badge) => {
      const unlockedAt = unlockedMap.get(badge.id) || null;
      const isUnlocked = Boolean(unlockedAt);
      return {
        ...badge,
        isUnlocked,
        unlocked: isUnlocked,
        unlockedAt,
        progressPercent: isUnlocked ? 100 : badge.progressPercent,
      };
    });
  } catch (err) {
    console.error('[GamificationService] Error loading achievements:', err);
    return ACHIEVEMENTS_CATALOG.map((b) => ({ ...b, isUnlocked: false, unlocked: false }));
  }
}

/**
 * Check metrics and unlock any earned achievements
 */
export async function checkAndUnlockAchievements(
  userId: string,
  client?: GamificationSupabaseClient
): Promise<AchievementBadge[]> {
  const supabase = getClient(client);
  if (!supabase || !userId) return [];

  try {
    // 1. Gather all learner evidence concurrently
    const [
      progressRes,
      assessmentRes,
      exerciseRes,
      scenarioRes,
      guruRes,
      xpRes,
      unlockedRes,
      streak,
    ] = await Promise.all([
      supabase.from('learning_progress').select('lesson_id, status').eq('user_id', userId),
      supabase.from('assessment_results').select('score_percentage').eq('user_id', userId),
      supabase.from('exercise_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('scenario_attempts').select('id, status').eq('user_id', userId),
      supabase.from('guru_messages').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'user'),
      supabase.from('xp_transactions').select('xp_amount').eq('user_id', userId),
      supabase.from('learner_achievements').select('achievement_id').eq('user_id', userId),
      getUserStreak(userId, supabase),
    ]);

    const completedLessonsCount = (progressRes.data || []).filter((r) => r.status === 'completed').length;
    const completedScenariosCount = (scenarioRes.data || []).filter((r) => r.status === 'completed').length;
    const assessmentResults = (assessmentRes.data || []).map((r) => ({
      scorePercentage: r.score_percentage || 0,
    }));
    const totalExercises = exerciseRes.count || 0;
    const guruConversationsCount = guruRes.count || 0;
    const totalXP = (xpRes.data || []).reduce((acc, r) => acc + (r.xp_amount || 0), 0);
    const existingUnlockedIds = (unlockedRes.data || []).map((r) => r.achievement_id);

    // 2. Evaluate against catalog criteria
    const newlyUnlockedIds = getNewlyUnlockedAchievementIds({
      completedLessonsCount,
      completedScenariosCount,
      assessmentResults,
      totalExercisesAttempted: totalExercises,
      guruConversationsCount,
      currentStreak: streak.currentStreak,
      totalXP,
      unlockedAchievementIds: existingUnlockedIds,
    });

    if (newlyUnlockedIds.length === 0) return [];

    // 3. Insert newly unlocked badges into database
    const now = new Date().toISOString();
    const rowsToInsert = newlyUnlockedIds.map((id) => ({
      user_id: userId,
      achievement_id: id,
      unlocked_at: now,
    }));

    await supabase.from('learner_achievements').upsert(rowsToInsert, {
      onConflict: 'user_id,achievement_id',
    });

    return newlyUnlockedIds
      .map((id) => getAchievementById(id))
      .filter((b): b is AchievementBadge => b !== undefined)
      .map((b) => ({ ...b, isUnlocked: true, unlocked: true, unlockedAt: now, progressPercent: 100 }));
  } catch (err) {
    console.error('[GamificationService] Error checking achievements:', err);
    return [];
  }
}

/**
 * Get or initialize today's daily challenges with live progress
 */
export async function getUserDailyChallenges(
  userId: string,
  client?: GamificationSupabaseClient,
  dateStr?: string
): Promise<DailyChallenge[]> {
  const supabase = getClient(client);
  const today = dateStr || new Date().toISOString().split('T')[0];

  if (!supabase || !userId) {
    return generateDailyChallenges({ userId, dateString: today });
  }

  try {
    // 1. Fetch today's challenge rows from daily_challenge_progress
    const { data: storedRows } = await supabase
      .from('daily_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_date', today);

    // 2. Count today's completed activities
    const startOfToday = `${today}T00:00:00.000Z`;
    const endOfToday = `${today}T23:59:59.999Z`;

    const [lessonsTodayRes, assessmentsTodayRes, scenariosTodayRes] = await Promise.all([
      supabase
        .from('learning_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startOfToday)
        .lte('completed_at', endOfToday),
      supabase
        .from('assessment_results')
        .select('id')
        .eq('user_id', userId)
        .gte('completed_at', startOfToday)
        .lte('completed_at', endOfToday),
      supabase
        .from('scenario_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startOfToday)
        .lte('completed_at', endOfToday),
    ]);

    const lessonsCompletedToday = lessonsTodayRes.data?.length || 0;
    const assessmentsCompletedToday = assessmentsTodayRes.data?.length || 0;
    const scenariosCompletedToday = scenariosTodayRes.data?.length || 0;

    // Baseline definitions for today
    const definitions = generateDailyChallenges({ userId, dateString: today });

    // Map through definitions and compute current count and completion
    const challenges: DailyChallenge[] = [];

    for (const def of definitions) {
      const stored = storedRows?.find((r) => r.challenge_id === def.id);

      let currentCount = stored?.current_count || 0;

      // Determine real live count based on challenge type
      if (def.type === 'complete_lesson' || def.type === 'lesson_completion') {
        currentCount = Math.max(currentCount, lessonsCompletedToday);
      } else if (def.type === 'learn_words' || def.type === 'assessment_mastery') {
        currentCount = Math.max(currentCount, assessmentsCompletedToday);
      } else if (def.type === 'complete_scenario' || def.type === 'scenario_practice') {
        currentCount = Math.max(currentCount, scenariosCompletedToday);
      } else if (def.type === 'build_sentences' || def.type === 'revise_weak_topic' || def.type === 'vocabulary_review') {
        currentCount = Math.max(currentCount, lessonsCompletedToday > 0 ? 1 : 0);
      }

      const isCompleted = currentCount >= def.targetCount;
      const isClaimed = stored?.is_claimed || false;
      const claimedAt = stored?.claimed_at || undefined;

      // Upsert latest progress into database
      await supabase.from('daily_challenge_progress').upsert(
        {
          user_id: userId,
          challenge_id: def.id,
          challenge_date: today,
          target_count: def.targetCount,
          current_count: Math.min(currentCount, def.targetCount),
          is_completed: isCompleted,
          is_claimed: isClaimed,
          claimed_at: claimedAt || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,challenge_id,challenge_date' }
      );

      challenges.push({
        ...def,
        currentCount: Math.min(currentCount, def.targetCount),
        isCompleted,
        isClaimed,
        claimedAt,
      });
    }

    return challenges;
  } catch (err) {
    console.error('[GamificationService] Error getting daily challenges:', err);
    return generateDailyChallenges({ userId, dateString: today });
  }
}

/**
 * Claim the XP reward for a completed daily challenge
 */
export async function claimDailyChallengeReward(
  userId: string,
  challengeId: string,
  dateStr?: string,
  client?: GamificationSupabaseClient
): Promise<{ success: boolean; error?: string; awardedXP?: number }> {
  const supabase = getClient(client);
  const today = dateStr || new Date().toISOString().split('T')[0];

  if (!supabase || !userId || !challengeId) {
    return { success: false, error: 'Invalid claim request parameters' };
  }

  try {
    // 1. Fetch challenge progress
    const { data: record, error } = await supabase
      .from('daily_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('challenge_date', today)
      .maybeSingle();

    if (error || !record) {
      return { success: false, error: 'Challenge progress not found for today' };
    }

    if (!record.is_completed) {
      return { success: false, error: 'Challenge has not been completed yet' };
    }

    if (record.is_claimed) {
      return { success: false, error: 'Reward already claimed for this challenge' };
    }

    // 2. Award XP with idempotent key
    const idempotencyKey = `challenge:${userId}:${challengeId}:${today}`;
    const xpResult = await awardXP(
      userId,
      'daily_challenge',
      idempotencyKey,
      `Daily Challenge completed: ${challengeId}`,
      XP_REWARDS.DAILY_CHALLENGE,
      { challengeId, date: today },
      supabase
    );

    if (!xpResult.success && !xpResult.duplicate) {
      return { success: false, error: 'Failed to record XP reward' };
    }

    // 3. Mark challenge as claimed
    const now = new Date().toISOString();
    await supabase
      .from('daily_challenge_progress')
      .update({
        is_claimed: true,
        claimed_at: now,
        updated_at: now,
      })
      .eq('id', record.id);

    return {
      success: true,
      awardedXP: XP_REWARDS.DAILY_CHALLENGE,
    };
  } catch (err) {
    console.error('[GamificationService] Error claiming challenge reward:', err);
    return { success: false, error: 'Unexpected error claiming challenge' };
  }
}

/**
 * Fetch leaderboard preferences for a user
 */
export async function getLeaderboardPreferences(
  userId: string,
  client?: GamificationSupabaseClient
): Promise<LeaderboardPreference> {
  const supabase = getClient(client);
  if (!supabase || !userId) {
    return { userId, optIn: true, isAnonymous: false };
  }

  try {
    const { data } = await supabase
      .from('leaderboard_preferences')
      .select('opt_in, is_anonymous')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) {
      return { userId, optIn: true, isAnonymous: false };
    }

    return {
      userId,
      optIn: data.opt_in,
      isAnonymous: data.is_anonymous,
    };
  } catch (err) {
    console.error('[GamificationService] Error fetching leaderboard preferences:', err);
    return { userId, optIn: true, isAnonymous: false };
  }
}

/**
 * Update leaderboard opt-in & anonymous preferences
 */
export async function updateLeaderboardPreferences(
  userId: string,
  preferences: { optIn?: boolean; isAnonymous?: boolean },
  client?: GamificationSupabaseClient
): Promise<LeaderboardPreference> {
  const supabase = getClient(client);
  const current = await getLeaderboardPreferences(userId, supabase || undefined);

  const updated: LeaderboardPreference = {
    userId,
    optIn: preferences.optIn !== undefined ? preferences.optIn : current.optIn,
    isAnonymous: preferences.isAnonymous !== undefined ? preferences.isAnonymous : current.isAnonymous,
  };

  if (!supabase) return updated;

  try {
    await supabase.from('leaderboard_preferences').upsert(
      {
        user_id: userId,
        opt_in: updated.optIn,
        is_anonymous: updated.isAnonymous,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    console.error('[GamificationService] Error updating leaderboard preferences:', err);
  }

  return updated;
}

/**
 * Fetch privacy-conscious leaderboard rankings
 */
export async function getLeaderboard(
  timeframe: 'weekly' | 'monthly' | 'all_time' = 'weekly',
  limit: number = 25,
  currentUserId?: string,
  client?: GamificationSupabaseClient
): Promise<{ entries: LeaderboardEntry[]; currentUserRank?: number; optInCount: number }> {
  const supabase = getClient(client);
  if (!supabase) {
    return { entries: [], optInCount: 0 };
  }

  try {
    // 1. Fetch all opt-in learners
    const { data: optInPrefs } = await supabase
      .from('leaderboard_preferences')
      .select('user_id, is_anonymous')
      .eq('opt_in', true);

    const optInMap = new Map<string, boolean>();
    (optInPrefs || []).forEach((p) => optInMap.set(p.user_id, p.is_anonymous));

    // If current user is not in preferences table yet, default them to opt-in
    if (currentUserId && !optInMap.has(currentUserId)) {
      optInMap.set(currentUserId, false);
    }

    const optInUserIds = Array.from(optInMap.keys());
    if (optInUserIds.length === 0) {
      return { entries: [], optInCount: 0 };
    }

    // 2. Determine timeframe boundary
    const now = new Date();
    let startDateString: string | null = null;
    if (timeframe === 'weekly') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDateString = d.toISOString();
    } else if (timeframe === 'monthly') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      startDateString = d.toISOString();
    }

    // 3. Query XP transactions for opt-in users
    let query = supabase
      .from('xp_transactions')
      .select('user_id, xp_amount, created_at')
      .in('user_id', optInUserIds);

    if (startDateString) {
      query = query.gte('created_at', startDateString);
    }

    const { data: transactions } = await query;

    // 4. Also fetch learner profiles for display names & avatars (no email)
    const { data: profiles } = await supabase
      .from('learner_profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', optInUserIds);

    const profileMap = new Map<string, { fullName: string | null; avatarUrl: string | null }>();
    (profiles || []).forEach((p) => {
      profileMap.set(p.user_id, { fullName: p.full_name, avatarUrl: p.avatar_url });
    });

    // 5. Aggregate XP per user
    const xpTotals = new Map<string, number>();
    optInUserIds.forEach((uid) => xpTotals.set(uid, 0));
    (transactions || []).forEach((t) => {
      const current = xpTotals.get(t.user_id) || 0;
      xpTotals.set(t.user_id, current + (t.xp_amount || 0));
    });

    // 6. Build entry list and sort
    const rawEntries = optInUserIds.map((uid) => {
      const xp = xpTotals.get(uid) || 0;
      const isAnon = optInMap.get(uid) || false;
      const profile = profileMap.get(uid);
      const levelInfo = calculateLevelFromXP(xp);

      let displayName = 'Kannada Learner';
      if (isAnon && uid !== currentUserId) {
        displayName = `Learner #${uid.slice(0, 4).toUpperCase()}`;
      } else if (profile?.fullName) {
        displayName = profile.fullName;
      }

      return {
        userId: uid,
        displayName,
        avatarUrl: isAnon && uid !== currentUserId ? undefined : profile?.avatarUrl || undefined,
        totalXP: xp,
        xp,
        level: levelInfo.level,
        levelNumber: levelInfo.levelNumber,
        levelTitle: levelInfo.title,
        isCurrentUser: uid === currentUserId,
        isAnonymous: isAnon,
      };
    });

    // Sort descending by XP
    rawEntries.sort((a, b) => b.totalXP - a.totalXP);

    // Assign 1-based ranks
    let currentUserRank: number | undefined;
    const rankedEntries: LeaderboardEntry[] = rawEntries.map((e, idx) => {
      const rank = idx + 1;
      if (e.isCurrentUser) {
        currentUserRank = rank;
      }
      return {
        ...e,
        rank,
      };
    });

    return {
      entries: rankedEntries.slice(0, limit),
      currentUserRank,
      optInCount: optInUserIds.length,
    };
  } catch (err) {
    console.error('[GamificationService] Error generating leaderboard:', err);
    return { entries: [], optInCount: 0 };
  }
}

/**
 * Single aggregated gamification summary for dashboard and achievements views
 */
export async function getUserGamificationSummary(
  userId: string,
  client?: GamificationSupabaseClient,
  userLocalDate?: string
): Promise<GamificationSummary> {
  const supabase = getClient(client);

  const [xpResult, streak, badges, challenges, leaderboardPrefs] = await Promise.all([
    getUserXP(userId, supabase || undefined),
    getUserStreak(userId, supabase || undefined, userLocalDate),
    getUserAchievements(userId, supabase || undefined),
    getUserDailyChallenges(userId, supabase || undefined, userLocalDate),
    getLeaderboardPreferences(userId, supabase || undefined),
  ]);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return {
    userId,
    totalXP: xpResult.totalXP,
    level: xpResult.levelInfo,
    levelInfo: xpResult.levelInfo,
    streak,
    achievements: badges,
    badges,
    unlockedAchievementsCount: unlockedCount,
    dailyChallenges: challenges,
    recentTransactions: [],
    leaderboardOptIn: leaderboardPrefs.optIn,
    isAnonymous: leaderboardPrefs.isAnonymous,
    leaderboardPreference: leaderboardPrefs,
  };
}
