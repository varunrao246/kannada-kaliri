/**
 * Milestone 08: Adaptive Learning Intelligence Engine Verification Suite
 * Kannada Kaliri
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  computeDeterministicSkillMastery,
  computeOverallMastery,
  resolveMasteryState,
  MASTERY_THRESHOLDS,
} from '../../lib/adaptive/mastery.ts';

import { detectKnowledgeGaps } from '../../lib/adaptive/gaps.ts';
import { generateAdaptiveRecommendations } from '../../lib/adaptive/recommendations.ts';
import { calculateAdaptiveDifficulty } from '../../lib/adaptive/difficulty.ts';
import { generatePersonalizedLearningPath } from '../../lib/adaptive/path.ts';

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
console.log('  KANNADA KALIRI — MILESTONE 08 VERIFICATION SUITE  ');
console.log('====================================================\n');

// ─── Scenario 1: New Learner with No Learning History ────────────────────────
console.log('--- Scenario 1: New Learner (Zero History / Cold Start) ---');

const emptySkill = computeDeterministicSkillMastery({
  skillId: 'test-empty',
  name: 'Vocabulary Recall',
  category: 'vocabulary',
  correctCount: 0,
  totalAttempts: 0,
});

assert(emptySkill.isMeasurable === false, 'Skill is not measurable with 0 attempts');
assert(emptySkill.score === 0, 'Mastery score is 0 with 0 attempts');
assert(emptySkill.state === 'needs_attention', 'Mastery state is needs_attention');

const overallEmpty = computeOverallMastery([emptySkill]);
assert(overallEmpty.hasSufficientData === false, 'Overall mastery reports insufficient data for cold start');
assert(overallEmpty.overallScore === 0, 'Overall score is 0');

const emptyGaps = detectKnowledgeGaps({
  exerciseAttempts: [],
  vocabProgress: [],
  scenarioAttempts: [],
  skillMasteries: [emptySkill],
});
assert(emptyGaps.length === 0, 'Zero knowledge gaps fabricated for new learner with no mistakes');

const coldRecommendations = generateAdaptiveRecommendations({
  progressRows: [],
  assessmentResults: [],
  vocabProgress: [],
  scenarioAttempts: [],
  knowledgeGaps: [],
  daysSinceLastActivity: 0,
});
assert(coldRecommendations.length > 0, 'Generates initial recommendation for new learner');
assert(coldRecommendations[0].type === 'lesson_next', 'First recommendation is to begin Lesson 1');
assert(coldRecommendations[0].actionUrl.includes('m01-l01'), 'Recommends Lesson 1.1 link');
assert(coldRecommendations[0].priority === 'urgent', 'Onboarding lesson recommendation is marked urgent');

// ─── Scenario 2: Learner with Strong Performance ─────────────────────────────
console.log('\n--- Scenario 2: Strong Performance (High Accuracy & Mastery) ---');

const strongSkill = computeDeterministicSkillMastery({
  skillId: 'test-strong',
  name: 'Sentence Construction (SOV)',
  category: 'sentence_construction',
  correctCount: 9,
  totalAttempts: 10,
  lastAttemptDate: new Date().toISOString(),
  consecutiveMistakes: 0,
});

assert(strongSkill.isMeasurable === true, 'Skill is measurable');
assert(strongSkill.score >= 80, 'Score reflects strong performance (>=80)', `${strongSkill.score}%`);
assert(strongSkill.state === 'mastered', 'State is mastered', strongSkill.state);

// Exercise difficulty for strong learner
const strongAttempts = [
  { is_correct: true, attempted_at: new Date(Date.now() - 1000).toISOString() },
  { is_correct: true, attempted_at: new Date(Date.now() - 2000).toISOString() },
  { is_correct: true, attempted_at: new Date(Date.now() - 3000).toISOString() },
  { is_correct: true, attempted_at: new Date(Date.now() - 4000).toISOString() },
  { is_correct: true, attempted_at: new Date(Date.now() - 5000).toISOString() },
];
const difficultyStrong = calculateAdaptiveDifficulty(strongAttempts);
assert(difficultyStrong.currentLevel === 'hard', 'Promoted to Hard difficulty on high accuracy & streak');
assert(difficultyStrong.consecutiveCorrect === 5, 'Detected 5 consecutive correct');

// ─── Scenario 3: Learner with Repeated Mistakes & Knowledge Gaps ─────────────
console.log('\n--- Scenario 3: Repeated Mistakes & Knowledge Gap Detection ---');

const weakAttempts = [
  { exercise_id: 'ex-m03-sentence-1', lesson_id: 'm03-l01', is_correct: false, attempted_at: new Date().toISOString() },
  { exercise_id: 'ex-m03-sentence-2', lesson_id: 'm03-l01', is_correct: false, attempted_at: new Date().toISOString() },
  { exercise_id: 'ex-m03-sentence-3', lesson_id: 'm03-l01', is_correct: false, attempted_at: new Date().toISOString() },
  { exercise_id: 'ex-m03-sentence-4', lesson_id: 'm03-l01', is_correct: true, attempted_at: new Date().toISOString() },
];

const weakSentenceSkill = computeDeterministicSkillMastery({
  skillId: 'test-weak',
  name: 'Sentence Construction (SOV)',
  category: 'sentence_construction',
  correctCount: 1,
  totalAttempts: 4,
  consecutiveMistakes: 3,
});

assert(weakSentenceSkill.score <= 35, 'Mastery score penalized for consecutive mistakes', `${weakSentenceSkill.score}%`);
assert(weakSentenceSkill.state === 'needs_attention', 'State is needs_attention');

const detectedGaps = detectKnowledgeGaps({
  exerciseAttempts: weakAttempts,
  vocabProgress: [],
  scenarioAttempts: [],
  skillMasteries: [weakSentenceSkill],
});

assert(detectedGaps.length >= 1, 'Accurately detected knowledge gap from repeated errors');
assert(detectedGaps[0].topic.includes('SOV'), 'Detected gap is SOV Word Order');
assert(detectedGaps[0].evidence.includes('3 incorrect'), 'Provides real performance evidence');
assert(detectedGaps[0].actionUrl.includes('m03-l01'), 'Links directly to relevant lesson');

// Recommendations for learner with knowledge gaps
const gapRecommendations = generateAdaptiveRecommendations({
  progressRows: [{ lesson_id: 'm01-l01', status: 'completed' }],
  assessmentResults: [],
  vocabProgress: [],
  scenarioAttempts: [],
  knowledgeGaps: detectedGaps,
  daysSinceLastActivity: 1,
});

const targetedRec = gapRecommendations.find((r) => r.type === 'exercise_targeted');
assert(Boolean(targetedRec), 'Generates targeted practice recommendation for top knowledge gap');
assert(targetedRec?.title.includes('SOV'), 'Targeted practice focuses on SOV');

// Difficulty reduction
const failingDifficulty = calculateAdaptiveDifficulty([
  { is_correct: false, attempted_at: new Date().toISOString() },
  { is_correct: false, attempted_at: new Date().toISOString() },
]);
assert(failingDifficulty.currentLevel === 'easy', 'Calibrates down to Easy difficulty after 2 consecutive failures');
assert(failingDifficulty.explanation.includes('Easy difficulty'), 'Explains reason for difficulty calibration');

// ─── Scenario 4: Learner with Incomplete Lesson Session ──────────────────────
console.log('\n--- Scenario 4: Incomplete Lesson Session Continuity ---');

const inProgressRecs = generateAdaptiveRecommendations({
  progressRows: [
    { lesson_id: 'a1-m01-l01', status: 'completed' },
    { lesson_id: 'a1-m01-l02', status: 'in_progress', completion_percentage: 60 },
  ],
  assessmentResults: [],
  vocabProgress: [],
  scenarioAttempts: [],
  knowledgeGaps: [],
  daysSinceLastActivity: 1,
});

assert(inProgressRecs[0].type === 'lesson_resume', 'Resuming in-progress lesson is top priority');
assert(inProgressRecs[0].priority === 'urgent', 'Resume recommendation is urgent');
assert(inProgressRecs[0].actionUrl.includes('a1-m01-l02'), 'Points directly to in-progress lesson ID');

// ─── Scenario 5: Learner Inactivity Retention Decay ──────────────────────────
console.log('\n--- Scenario 5: Inactivity & Retention Refresh ---');

const inactiveRecs = generateAdaptiveRecommendations({
  progressRows: [{ lesson_id: 'a1-m01-l01', status: 'completed' }],
  assessmentResults: [{ lesson_id: 'a1-m01-l01', score_percentage: 90 }],
  vocabProgress: [],
  scenarioAttempts: [],
  knowledgeGaps: [],
  daysSinceLastActivity: 8,
});

const refreshRec = inactiveRecs.find((r) => r.type === 'review_mastered');
assert(Boolean(refreshRec), 'Generates refresher review after 8 days of inactivity');
assert(refreshRec?.reason.includes('8 days'), 'Explains inactivity duration in reason');

// Recency decay in mastery formula
const recentSkill = computeDeterministicSkillMastery({
  skillId: 's-recent',
  name: 'Test',
  category: 'grammar',
  correctCount: 5,
  totalAttempts: 5,
  lastAttemptDate: new Date().toISOString(),
});
const oldSkill = computeDeterministicSkillMastery({
  skillId: 's-old',
  name: 'Test',
  category: 'grammar',
  correctCount: 5,
  totalAttempts: 5,
  lastAttemptDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
});
assert(oldSkill.score < recentSkill.score, 'Old unreviewed skills experience recency retention decay', `Recent: ${recentSkill.score} vs Old: ${oldSkill.score}`);

// ─── Scenario 6: Confidence Damping (No High Mastery from 1 Lucky Answer) ─────
console.log('\n--- Scenario 6: Confidence Damping Verification ---');

const singleLuckyAnswer = computeDeterministicSkillMastery({
  skillId: 's-lucky',
  name: 'Single Answer',
  category: 'grammar',
  correctCount: 1,
  totalAttempts: 1,
  lastAttemptDate: new Date().toISOString(),
});
assert(singleLuckyAnswer.score < 60, '1 single correct answer is damped and cannot claim high mastery', `Score: ${singleLuckyAnswer.score}%`);
assert(singleLuckyAnswer.state === 'developing' || singleLuckyAnswer.state === 'needs_attention', 'State is developing/needs_attention, not mastered');

// ─── Scenario 7: Dynamic Learning Path ───────────────────────────────────────
console.log('\n--- Scenario 7: Dynamic Learning Path ---');

const path = generatePersonalizedLearningPath(
  [
    { lesson_id: 'a1-m01-l01', status: 'completed' },
    { lesson_id: 'a1-m01-l02', status: 'in_progress', completion_percentage: 45 },
  ],
  detectedGaps
);

assert(path.length >= 10, 'Generates full curriculum sequence path', `Steps: ${path.length}`);
assert(path[0].status === 'completed', 'Step 1 is marked completed');
assert(path[1].status === 'in_progress', 'Step 2 is marked in_progress');
assert(path[2].status === 'recommended', 'Step 3 is marked recommended');
assert(path[3].status === 'upcoming', 'Step 4 is marked upcoming (prerequisite locked)');

// ─── Scenario 8: Threshold Integrity ─────────────────────────────────────────
console.log('\n--- Scenario 8: Threshold Integrity ---');

assert(resolveMasteryState(35) === 'needs_attention', '35 is needs_attention');
assert(resolveMasteryState(55) === 'developing', '55 is developing');
assert(resolveMasteryState(75) === 'proficient', '75 is proficient');
assert(resolveMasteryState(95) === 'mastered', '95 is mastered');
assert(MASTERY_THRESHOLDS.MASTERED_MIN === 80, 'Configurable threshold MASTERED_MIN is 80');

// ─── Scenario 9: Architectural File Presence ─────────────────────────────────
console.log('\n--- Scenario 9: Architectural File Presence ---');

const requiredFiles = [
  'lib/adaptive/types.ts',
  'lib/adaptive/mastery.ts',
  'lib/adaptive/gaps.ts',
  'lib/adaptive/recommendations.ts',
  'lib/adaptive/difficulty.ts',
  'lib/adaptive/path.ts',
  'lib/adaptive/analytics.ts',
  'app/api/adaptive/route.ts',
  'components/dashboard/AdaptiveIntelligenceWidget.tsx',
];

for (const rel of requiredFiles) {
  const full = resolve(process.cwd(), rel);
  assert(existsSync(full), `Verified module exists: ${rel}`);
}

// ─── Final Summary ───────────────────────────────────────────────────────────
console.log('\n====================================================');
console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
