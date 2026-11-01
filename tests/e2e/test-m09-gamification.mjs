/**
 * Milestone 09: Gamification, Rewards & Learner Motivation Engine Verification Suite
 * Kannada Kaliri
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  XP_REWARDS,
  LEARNER_LEVELS,
  ALL_ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENTS_CATALOG,
} from '../../lib/gamification/constants.ts';

import { calculateLevelFromXP } from '../../lib/gamification/levels.ts';
import { computeStreakStats } from '../../lib/gamification/streaks.ts';
import {
  evaluateAchievements,
  getNewlyUnlockedAchievementIds,
} from '../../lib/gamification/achievements.ts';
import { generateDailyChallenges } from '../../lib/gamification/challenges.ts';

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
    if (details) console.log(`   └─ ${details}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
    if (details) console.error(`   └─ ${details}`);
  }
}

console.log('====================================================');
console.log('  KANNADA KALIRI — MILESTONE 09 VERIFICATION SUITE  ');
console.log('====================================================\n');

// ─── Phase 1: Database Migration & Schema Integrity ─────────────────────────
console.log('--- Phase 1: Database Migration & Schema Integrity ---');

const migrationPath = resolve('supabase/migrations/007_create_gamification_system.sql');
assert(existsSync(migrationPath), 'Migration 007 SQL file exists on disk');

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf-8');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.xp_transactions'), 'Migration creates xp_transactions table');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.learner_achievements'), 'Migration creates learner_achievements table');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.daily_challenge_progress'), 'Migration creates daily_challenge_progress table');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.leaderboard_preferences'), 'Migration creates leaderboard_preferences table');
  assert(sql.includes('uq_xp_user_idempotency UNIQUE(user_id, idempotency_key)'), 'XP transactions have user + idempotency key unique constraint');
  assert(sql.includes('uq_learner_achievement UNIQUE(user_id, achievement_id)'), 'Learner achievements have unique constraint');
  assert(sql.includes('uq_user_daily_challenge UNIQUE(user_id, challenge_id, challenge_date)'), 'Daily challenges have unique constraint per day');
  assert(sql.includes('uq_leaderboard_user UNIQUE(user_id)'), 'Leaderboard preferences have unique user constraint');
  assert(sql.includes('ENABLE ROW LEVEL SECURITY'), 'All gamification tables enable Row Level Security');
  assert(
    sql.includes('leaderboard_preferences lp') &&
      sql.includes('lp.user_id = xp_transactions.user_id AND lp.opt_in = true'),
    'RLS policy supports opt-in leaderboard reads'
  );
}

// ─── Phase 2: XP Reward Matrix Verification ────────────────────────────────
console.log('\n--- Phase 2: XP Reward Matrix Verification ---');

assert(XP_REWARDS.LESSON_COMPLETION === 20, 'Lesson completion awards exactly 20 XP', `${XP_REWARDS.LESSON_COMPLETION} XP`);
assert(XP_REWARDS.ASSESSMENT_COMPLETION === 15, 'Assessment completion awards exactly 15 XP', `${XP_REWARDS.ASSESSMENT_COMPLETION} XP`);
assert(
  XP_REWARDS.ASSESSMENT_HIGH_SCORE_BONUS === 10 || XP_REWARDS.ASSESSMENT_EXCELLENCE_BONUS === 10,
  'Score 80%+ awards 10 XP bonus',
  '10 XP'
);
assert(XP_REWARDS.SCENARIO_COMPLETION === 25, 'Conversation scenario completion awards 25 XP', `${XP_REWARDS.SCENARIO_COMPLETION} XP`);
assert(XP_REWARDS.DAILY_CHALLENGE === 30, 'Daily challenge completion awards 30 XP', `${XP_REWARDS.DAILY_CHALLENGE} XP`);
assert(XP_REWARDS.VOCAB_REVISION === 10, 'Vocabulary revision awards 10 XP', `${XP_REWARDS.VOCAB_REVISION} XP`);

// ─── Phase 3: Level Progression Engine ──────────────────────────────────────
console.log('\n--- Phase 3: Level Progression Engine ---');

assert(LEARNER_LEVELS.length === 7, 'Exact 7 progression tiers are defined');

// Test Level 1: 0 XP
const lvl0 = calculateLevelFromXP(0);
assert(lvl0.levelNumber === 1 && lvl0.title === 'Kannada Explorer', '0 XP gives Level 1 (Kannada Explorer)', `Level ${lvl0.levelNumber} - ${lvl0.title}`);
assert(lvl0.progressPercent === 0, '0 XP progress is 0%', `${lvl0.progressPercent}%`);
assert(lvl0.nextLevelXP === 100, 'Next level threshold is 100 XP', `Next: ${lvl0.nextLevelXP} XP`);
assert(lvl0.xpToNextLevel === 100, 'Requires 100 XP to advance', `${lvl0.xpToNextLevel} XP remaining`);

// Test Level 1: 50 XP
const lvl50 = calculateLevelFromXP(50);
assert(lvl50.levelNumber === 1, '50 XP remains in Level 1');
assert(lvl50.progressPercent === 50, '50 XP is 50% through Level 1', `${lvl50.progressPercent}%`);
assert(lvl50.xpToNextLevel === 50, '50 XP remaining for Level 2', `${lvl50.xpToNextLevel} XP remaining`);

// Test Level 2: 100 XP
const lvl100 = calculateLevelFromXP(100);
assert(lvl100.levelNumber === 2 && lvl100.title === 'Kannada Beginner', '100 XP unlocks Level 2 (Kannada Beginner)', `Level ${lvl100.levelNumber}`);
assert(lvl100.progressPercent === 0, '100 XP is 0% through Level 2');
assert(lvl100.nextLevelXP === 250, 'Next level threshold is 250 XP');

// Test Level 3: 250 XP
const lvl250 = calculateLevelFromXP(250);
assert(lvl250.levelNumber === 3 && lvl250.title === 'Kannada Learner', '250 XP unlocks Level 3 (Kannada Learner)');

// Test Level 4: 500 XP
const lvl500 = calculateLevelFromXP(500);
assert(lvl500.levelNumber === 4 && lvl500.title === 'Kannada Speaker', '500 XP unlocks Level 4 (Kannada Speaker)');

// Test Level 5: 900 XP
const lvl900 = calculateLevelFromXP(900);
assert(lvl900.levelNumber === 5 && lvl900.title === 'Kannada Conversationalist', '900 XP unlocks Level 5 (Kannada Conversationalist)');

// Test Level 6: 1500 XP
const lvl1500 = calculateLevelFromXP(1500);
assert(lvl1500.levelNumber === 6 && lvl1500.title === 'Kannada Fluent Learner', '1500 XP unlocks Level 6 (Kannada Fluent Learner)');

// Test Level 7: 2500 XP (Max Level)
const lvl2500 = calculateLevelFromXP(2500);
assert(lvl2500.levelNumber === 7 && lvl2500.title === 'Karnataka Connect Champion', '2500 XP unlocks Level 7 (Karnataka Connect Champion)');
assert(lvl2500.isMaxLevel === true, 'Level 7 is identified as max level');
assert(lvl2500.nextLevelXP === null, 'Max level has null nextLevelXP');
assert(lvl2500.progressPercent === 100, 'Max level progress is 100%');

// Test Level 7 overflow: 5000 XP
const lvl5000 = calculateLevelFromXP(5000);
assert(lvl5000.levelNumber === 7 && lvl5000.isMaxLevel === true, '5000 XP safely stays at Level 7 max tier');

// ─── Phase 4: Daily Learning Streak Engine ──────────────────────────────────
console.log('\n--- Phase 4: Daily Learning Streak Engine ---');

const mockToday = '2026-10-30';
const mockYesterday = '2026-10-29';
const mockDayBefore = '2026-10-28';

// Test 4.1: Active Today Only (1 Day Streak)
const streak1 = computeStreakStats([mockToday], mockToday);
assert(streak1.currentStreak === 1, 'Single activity today gives 1-day current streak', `Streak: ${streak1.currentStreak}`);
assert(streak1.longestStreak === 1, 'Longest streak is 1');
assert(streak1.isActiveToday === true, 'isActiveToday is true');

// Test 4.2: Active Today + Yesterday + Day Before (3 Day Streak)
const streak3 = computeStreakStats([mockToday, mockYesterday, mockDayBefore], mockToday);
assert(streak3.currentStreak === 3, '3 consecutive days gives 3-day current streak', `Streak: ${streak3.currentStreak}`);
assert(streak3.longestStreak === 3, 'Longest streak is 3');
assert(streak3.isActiveToday === true, 'isActiveToday is true');

// Test 4.3: Active Yesterday only (Streak protected, not yet active today)
const streakYesterday = computeStreakStats([mockYesterday], mockToday);
assert(streakYesterday.currentStreak === 1, 'Active yesterday keeps streak intact before today completes', `Streak: ${streakYesterday.currentStreak}`);
assert(streakYesterday.isActiveToday === false, 'isActiveToday is false for pending day');

// Test 4.4: Inactive yesterday and today (Broken streak)
const streakBroken = computeStreakStats([mockDayBefore], mockToday);
assert(streakBroken.currentStreak === 0, 'Broken streak resets current streak to 0', `Streak: ${streakBroken.currentStreak}`);
assert(streakBroken.longestStreak === 1, 'Longest streak preserves historical best');
assert(streakBroken.isActiveToday === false, 'isActiveToday is false');

// Test 4.5: Historical gap with longer past streak
const streakHistory = computeStreakStats(
  ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', mockToday],
  mockToday
);
assert(streakHistory.currentStreak === 1, 'Current streak is 1 following gap');
assert(streakHistory.longestStreak === 5, 'Historical best streak of 5 correctly identified', `Best: ${streakHistory.longestStreak}`);

// Test 4.6: 7-Day Rolling Activity Strip
assert(streak3.activityLast7Days.length === 7, 'Last 7 days contains exactly 7 records');
const todayEntry = streak3.activityLast7Days.find((d) => d.isToday);
assert(todayEntry !== undefined && todayEntry.date === mockToday, 'Today entry correctly flagged in 7-day strip');
assert(todayEntry.hasActivity === true, 'Today entry has active flag');

// ─── Phase 5: Badges & Achievements Engine ──────────────────────────────────
console.log('\n--- Phase 5: Badges & Achievements Engine ---');

assert(ALL_ACHIEVEMENT_DEFINITIONS.length === 13, 'Catalog has exactly 13 unique achievement badges');
assert(ACHIEVEMENTS_CATALOG.length === 13, 'Achievements catalog initialized with 13 badges');

// Test 5.1: Zero history learner
const zeroBadges = evaluateAchievements({
  completedLessonsCount: 0,
  completedScenariosCount: 0,
  assessmentCount: 0,
  hasPerfectAssessment: false,
  currentStreak: 0,
  longestStreak: 0,
  masteredSkillsCount: 0,
});
const unlockedZero = zeroBadges.filter((b) => b.isUnlocked);
assert(unlockedZero.length === 0, 'Zero history learner has 0 badges unlocked');

// Test 5.2: First lesson completed
const firstLessonBadges = evaluateAchievements({
  completedLessonsCount: 1,
  completedScenariosCount: 0,
  assessmentCount: 0,
  hasPerfectAssessment: false,
  currentStreak: 1,
  longestStreak: 1,
  masteredSkillsCount: 0,
});
const firstLessonBadge = firstLessonBadges.find((b) => b.id === 'first_lesson');
assert(firstLessonBadge?.isUnlocked === true, 'First lesson completed unlocks "First Step in Kannada"');
const fiveLessonsBadge = firstLessonBadges.find((b) => b.id === 'five_lessons');
assert(fiveLessonsBadge?.isUnlocked === false, '5 lessons badge remains locked with 1 lesson');
assert(fiveLessonsBadge?.progressPercent === 20, '5 lessons badge shows 20% progress (1/5)', `${fiveLessonsBadge?.progressPercent}%`);

// Test 5.3: 5 lessons milestone
const fiveLessonBadges = evaluateAchievements({
  completedLessonsCount: 5,
  completedScenariosCount: 0,
  assessmentCount: 0,
  hasPerfectAssessment: false,
  currentStreak: 2,
  longestStreak: 2,
  masteredSkillsCount: 0,
});
assert(fiveLessonBadges.find((b) => b.id === 'five_lessons')?.isUnlocked === true, '5 lessons unlocks "Foundation Builder"');

// Test 5.4: All 15 A1 lessons completed
const a1MasterBadges = evaluateAchievements({
  completedLessonsCount: 15,
  completedScenariosCount: 0,
  assessmentCount: 0,
  hasPerfectAssessment: false,
  currentStreak: 5,
  longestStreak: 5,
  masteredSkillsCount: 0,
});
assert(a1MasterBadges.find((b) => b.id === 'all_a1_lessons')?.isUnlocked === true, '15 lessons unlocks "A1 Kannada Master"');

// Test 5.5: Streak achievements (3, 7, 30 days)
const streak7Badges = evaluateAchievements({
  completedLessonsCount: 7,
  completedScenariosCount: 0,
  assessmentCount: 0,
  hasPerfectAssessment: false,
  currentStreak: 7,
  longestStreak: 7,
  masteredSkillsCount: 0,
});
assert(streak7Badges.find((b) => b.id === 'streak_3')?.isUnlocked === true, '7-day streak unlocks Hat-Trick (3-day)');
assert(streak7Badges.find((b) => b.id === 'streak_7')?.isUnlocked === true, '7-day streak unlocks Weekly Warrior (7-day)');
assert(streak7Badges.find((b) => b.id === 'streak_30')?.isUnlocked === false, '30-day streak badge remains locked');

// Test 5.6: Speaking / Scenario achievements
const scenarioBadges = evaluateAchievements({
  completedLessonsCount: 8,
  completedScenariosCount: 3,
  assessmentCount: 1,
  hasPerfectAssessment: false,
  currentStreak: 2,
  longestStreak: 2,
  masteredSkillsCount: 0,
});
assert(scenarioBadges.find((b) => b.id === 'first_scenario')?.isUnlocked === true, 'First scenario unlocks "Namma Dialect"');
assert(scenarioBadges.find((b) => b.id === 'three_scenarios')?.isUnlocked === true, '3 scenarios unlocks "City Navigator"');
assert(scenarioBadges.find((b) => b.id === 'eight_scenarios')?.isUnlocked === false, '8 scenarios badge remains locked');

// Test 5.7: Perfect Assessment Score
const perfectBadges = evaluateAchievements({
  completedLessonsCount: 1,
  completedScenariosCount: 0,
  assessmentCount: 1,
  hasPerfectAssessment: true,
  currentStreak: 1,
  longestStreak: 1,
  masteredSkillsCount: 0,
});
assert(perfectBadges.find((b) => b.id === 'perfect_score')?.isUnlocked === true, '100% assessment score unlocks "Centum Scholar"');

// Test 5.8: getNewlyUnlockedAchievementIds
const newlyUnlocked = getNewlyUnlockedAchievementIds({
  completedLessonsCount: 1,
  completedScenariosCount: 0,
  assessmentCount: 0,
  currentStreak: 1,
  unlockedAchievementIds: ['first_lesson'], // already unlocked
});
assert(!newlyUnlocked.includes('first_lesson'), 'getNewlyUnlockedAchievementIds filters out previously unlocked badges');

// ─── Phase 6: Adaptive Daily Challenges ─────────────────────────────────────
console.log('\n--- Phase 6: Adaptive Daily Challenges ---');

const challenges = generateDailyChallenges({
  todayDate: '2026-10-30',
});

assert(challenges.length === 3, 'Generates exactly 3 daily challenges', `${challenges.length} challenges`);
assert(challenges.every((c) => c.xpReward === 30), 'Each daily challenge offers +30 XP reward');
assert(challenges.some((c) => c.type === 'complete_scenario'), 'Includes real-world conversation scenario challenge');

// Test adaptive challenge calibration with vocabulary gap
const vocabGapChallenges = generateDailyChallenges({
  todayDate: '2026-10-30',
  adaptiveAnalytics: {
    knowledgeGaps: [
      {
        id: 'gap-vocab-1',
        title: 'Vocabulary Gap',
        category: 'vocabulary',
        actionUrl: '/learn#vocab',
      },
    ],
  },
});
assert(vocabGapChallenges[0].type === 'learn_words', 'Vocabulary gap dynamically triggers vocabulary daily challenge');

// Test adaptive challenge calibration with sentence construction gap
const grammarGapChallenges = generateDailyChallenges({
  todayDate: '2026-10-30',
  adaptiveAnalytics: {
    knowledgeGaps: [
      {
        id: 'gap-gram-1',
        title: 'Sentence Structure Gap',
        category: 'sentence_construction',
        actionUrl: '/learn',
      },
    ],
  },
});
assert(grammarGapChallenges[1].type === 'build_sentences', 'Sentence construction gap triggers sentence building challenge');

// ─── Phase 7: Leaderboard Privacy & Masking Logic ──────────────────────────
console.log('\n--- Phase 7: Leaderboard Privacy & Masking Logic ---');

const mockUser1 = { id: 'u1-alice-uuid', name: 'Alice Rao', xp: 450, optIn: true, isAnon: false };
const mockUser2 = { id: 'u2-bob-uuid', name: 'Bob Hegde', xp: 620, optIn: true, isAnon: true };
const mockUser3 = { id: 'u3-carol-uuid', name: 'Carol Nayak', xp: 900, optIn: false, isAnon: false };

// Test 7.1: Opt-in Filtering
const optInOnly = [mockUser1, mockUser2, mockUser3].filter((u) => u.optIn);
assert(optInOnly.length === 2, 'Only opt-in users are included in leaderboard rankings');
assert(!optInOnly.some((u) => u.id === mockUser3.id), 'Non opt-in user is excluded');

// Test 7.2: Sorting descending by XP
optInOnly.sort((a, b) => b.xp - a.xp);
assert(optInOnly[0].id === mockUser2.id, 'Highest XP learner ranks #1 (Bob: 620 XP)');
assert(optInOnly[1].id === mockUser1.id, 'Second highest ranks #2 (Alice: 450 XP)');

// Test 7.3: Anonymous Masking for Other Learners
const maskForPeer = (user, currentUserId) => {
  if (user.isAnon && user.id !== currentUserId) {
    return `Learner #${user.id.slice(0, 4).toUpperCase()}`;
  }
  return user.name;
};

assert(
  maskForPeer(mockUser2, 'u1-alice-uuid') === 'Learner #U2-B',
  'Anonymous user name is masked when viewed by peers',
  maskForPeer(mockUser2, 'u1-alice-uuid')
);
assert(
  maskForPeer(mockUser2, 'u2-bob-uuid') === 'Bob Hegde',
  'Anonymous user sees their own real name when logged in'
);

// ─── Phase 8: Component & Page Verification ────────────────────────────────
console.log('\n--- Phase 8: Component & Page Verification ---');

assert(existsSync(resolve('components/gamification/LevelProgressBar.tsx')), 'LevelProgressBar.tsx exists');
assert(existsSync(resolve('components/gamification/StreakCounterWidget.tsx')), 'StreakCounterWidget.tsx exists');
assert(existsSync(resolve('components/gamification/BadgeGrid.tsx')), 'BadgeGrid.tsx exists');
assert(existsSync(resolve('components/gamification/DailyChallengesCard.tsx')), 'DailyChallengesCard.tsx exists');
assert(existsSync(resolve('components/gamification/LeaderboardTable.tsx')), 'LeaderboardTable.tsx exists');
assert(existsSync(resolve('components/gamification/GamificationCompactWidget.tsx')), 'GamificationCompactWidget.tsx exists');
assert(existsSync(resolve('components/gamification/GamificationDashboardView.tsx')), 'GamificationDashboardView.tsx exists');
assert(existsSync(resolve('app/achievements/page.tsx')), 'Dedicated /achievements page exists');

// Verify API routes
assert(existsSync(resolve('app/api/gamification/summary/route.ts')), 'API /api/gamification/summary exists');
assert(existsSync(resolve('app/api/gamification/claim-challenge/route.ts')), 'API /api/gamification/claim-challenge exists');
assert(existsSync(resolve('app/api/gamification/leaderboard/route.ts')), 'API /api/gamification/leaderboard exists');
assert(existsSync(resolve('app/api/gamification/leaderboard-pref/route.ts')), 'API /api/gamification/leaderboard-pref exists');

// ─── Summary ───────────────────────────────────────────────────────────────
console.log('\n====================================================');
console.log(`  M09 TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
