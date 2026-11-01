/**
 * Milestone 04: Interactive Learning & Assessment Engine — Automated Verification Suite
 * Kannada Kaliri
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Import exercise registry & validators
import {
  getLessonExercises,
  getExerciseById,
  getTotalExerciseCount,
  getLessonsWithExercises,
} from '../../lib/exercises/index.ts';

import {
  validateExerciseAnswer,
} from '../../lib/services/exercise-validator.ts';

import {
  calculateAssessmentScore,
  getAdaptiveRecommendation,
} from '../../lib/services/assessment.ts';

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
console.log('  KANNADA KALIRI — MILESTONE 04 VERIFICATION SUITE  ');
console.log('====================================================\n');

// ─── Suite 1: Exercise Data Architecture & Registration ────────────────────────
console.log('--- Suite 1: Exercise Architecture & Seeding ---');

const totalExercises = getTotalExerciseCount();
assert(totalExercises >= 25, 'Exercises seeded across curriculum', `Total count: ${totalExercises}`);

const lessonsWithEx = getLessonsWithExercises();
assert(lessonsWithEx.length >= 10, 'Lessons have interactive exercises attached', `Count: ${lessonsWithEx.length}`);

// Check specific lesson exercises
const l1Exercises = getLessonExercises('a1-m01-l01');
assert(l1Exercises.length >= 4, 'Lesson 1.1 has required exercises', `Count: ${l1Exercises.length}`);

// Verify all 6 exercise types exist
const allTypes = new Set();
for (const lessonId of lessonsWithEx) {
  for (const ex of getLessonExercises(lessonId)) {
    allTypes.add(ex.type);
  }
}

assert(allTypes.has('multiple_choice'), 'Exercise type multiple_choice present');
assert(allTypes.has('word_matching'), 'Exercise type word_matching present');
assert(allTypes.has('sentence_construction'), 'Exercise type sentence_construction present');
assert(allTypes.has('fill_in_the_blank'), 'Exercise type fill_in_the_blank present');
assert(allTypes.has('listening_comprehension'), 'Exercise type listening_comprehension present');
assert(allTypes.has('vocabulary_recall'), 'Exercise type vocabulary_recall present');
assert(allTypes.size === 6, 'All 6 required exercise types present and active', `Found: ${[...allTypes].join(', ')}`);

// ─── Suite 2: Multiple Choice Validation ──────────────────────────────────────
console.log('\n--- Suite 2: Multiple Choice Validation ---');

const mcExercise = getExerciseById('ex-m01-l03-mc1');
assert(mcExercise !== null, 'Multiple choice exercise exists', mcExercise?.id);

if (mcExercise && mcExercise.type === 'multiple_choice') {
  const correctResult = validateExerciseAnswer(mcExercise, {
    type: 'multiple_choice',
    selectedOption: mcExercise.correctAnswer,
  });
  assert(correctResult.isCorrect === true, 'Correct answer scores true');
  assert(correctResult.pointsAwarded === mcExercise.points, 'Correct answer awards full configured points', `${correctResult.pointsAwarded} pts`);

  const wrongResult = validateExerciseAnswer(mcExercise, {
    type: 'multiple_choice',
    selectedOption: 'Wrong Answer',
  });
  assert(wrongResult.isCorrect === false, 'Wrong answer scores false');
  assert(wrongResult.pointsAwarded === 0, 'Wrong answer awards 0 points');
  assert(wrongResult.explanation.length > 0, 'Explanation is provided for wrong answer');
}

// ─── Suite 3: Word Matching Validation ────────────────────────────────────────
console.log('\n--- Suite 3: Word Matching Validation ---');

const matchExercise = getExerciseById('ex-m02-l01-match1');
assert(matchExercise !== null, 'Word matching exercise exists', matchExercise?.id);

if (matchExercise && matchExercise.type === 'word_matching') {
  // Build perfect match map
  const perfectMatches = {};
  for (const pair of matchExercise.pairs) {
    perfectMatches[pair.id] = pair.meaning;
  }

  const perfectResult = validateExerciseAnswer(matchExercise, {
    type: 'word_matching',
    matches: perfectMatches,
  });
  assert(perfectResult.isCorrect === true, 'All matching pairs correct awards full accuracy');
  assert(perfectResult.pointsAwarded === matchExercise.points, 'Full points awarded for perfect match');

  // Build partial match map (2 of 4)
  const partialMatches = { ...perfectMatches };
  const keys = Object.keys(partialMatches);
  if (keys.length >= 2) {
    partialMatches[keys[0]] = 'Wrong Meaning';
  }

  const partialResult = validateExerciseAnswer(matchExercise, {
    type: 'word_matching',
    matches: partialMatches,
  });
  assert(partialResult.isCorrect === false, 'Partial match marked isCorrect=false');
  assert(partialResult.pointsAwarded > 0 && partialResult.pointsAwarded < matchExercise.points, 'Partial credit awarded proportionally', `${partialResult.pointsAwarded} / ${matchExercise.points} pts`);
}

// ─── Suite 4: Sentence Construction Validation ─────────────────────────────────
console.log('\n--- Suite 4: Sentence Construction Validation ---');

const sentenceExercise = getExerciseById('ex-m03-l01-sentence1');
assert(sentenceExercise !== null, 'Sentence construction exercise exists', sentenceExercise?.id);

if (sentenceExercise && sentenceExercise.type === 'sentence_construction') {
  const correctResult = validateExerciseAnswer(sentenceExercise, {
    type: 'sentence_construction',
    constructedSentence: sentenceExercise.correctSentence,
  });
  assert(correctResult.isCorrect === true, 'Exact sentence matches accepted answer');
  assert(correctResult.pointsAwarded === sentenceExercise.points, 'Full points awarded for correct sentence');

  // Whitespace and punctuation tolerant
  const trimmedResult = validateExerciseAnswer(sentenceExercise, {
    type: 'sentence_construction',
    constructedSentence: `   ${sentenceExercise.correctSentence} .  `,
  });
  assert(trimmedResult.isCorrect === true, 'Normalised sentence ignores extra whitespace and periods');

  // Scrambled / wrong sentence
  const wrongSentence = sentenceExercise.correctSentence.split(' ').reverse().join(' ');
  const wrongResult = validateExerciseAnswer(sentenceExercise, {
    type: 'sentence_construction',
    constructedSentence: wrongSentence,
  });
  assert(wrongResult.isCorrect === false, 'Scrambled wrong ordering fails validation');
}

// ─── Suite 5: Fill in the Blank Validation ────────────────────────────────────
console.log('\n--- Suite 5: Fill in the Blank Validation ---');

const fillExercise = getExerciseById('ex-m01-l01-fill1');
assert(fillExercise !== null, 'Fill in the blank exercise exists', fillExercise?.id);

if (fillExercise && fillExercise.type === 'fill_in_the_blank') {
  const correctResult = validateExerciseAnswer(fillExercise, {
    type: 'fill_in_the_blank',
    answer: fillExercise.acceptedAnswers[0],
  });
  assert(correctResult.isCorrect === true, 'Accepted answer matches correctly');

  // Transliteration match (if in accepted answers)
  if (fillExercise.acceptedAnswers.length > 1) {
    const translitResult = validateExerciseAnswer(fillExercise, {
      type: 'fill_in_the_blank',
      answer: fillExercise.acceptedAnswers[1],
    });
    assert(translitResult.isCorrect === true, 'Accepted transliteration variant matches correctly', fillExercise.acceptedAnswers[1]);
  }

  const wrongResult = validateExerciseAnswer(fillExercise, {
    type: 'fill_in_the_blank',
    answer: 'completely_wrong_answer',
  });
  assert(wrongResult.isCorrect === false, 'Unaccepted fill-in-the-blank string fails');
}

// ─── Suite 6: Listening Comprehension Validation ──────────────────────────────
console.log('\n--- Suite 6: Listening Comprehension Validation ---');

const listenExercise = getExerciseById('ex-m01-l03-listen1');
assert(listenExercise !== null, 'Listening comprehension exercise exists', listenExercise?.id);

if (listenExercise && listenExercise.type === 'listening_comprehension') {
  assert(listenExercise.audioText.length > 0, 'Audio text prompt defined for TTS');
  assert(listenExercise.audioTextTransliteration.length > 0, 'Audio text transliteration fallback present');

  const correctResult = validateExerciseAnswer(listenExercise, {
    type: 'listening_comprehension',
    selectedOption: listenExercise.correctAnswer,
  });
  assert(correctResult.isCorrect === true, 'Listening correct answer validates');

  const wrongResult = validateExerciseAnswer(listenExercise, {
    type: 'listening_comprehension',
    selectedOption: 'Invalid option',
  });
  assert(wrongResult.isCorrect === false, 'Listening incorrect answer rejected');
}

// ─── Suite 7: Vocabulary Recall Validation ────────────────────────────────────
console.log('\n--- Suite 7: Vocabulary Recall Validation ---');

const recallExercise = getExerciseById('ex-m01-l01-recall1');
assert(recallExercise !== null, 'Vocabulary recall exercise exists', recallExercise?.id);

if (recallExercise && recallExercise.type === 'vocabulary_recall') {
  const knownResult = validateExerciseAnswer(recallExercise, {
    type: 'vocabulary_recall',
    selfAssessment: 'known',
  });
  assert(knownResult.isCorrect === true, 'Self-assessed "known" awards points');
  assert(knownResult.pointsAwarded === recallExercise.points, 'Points awarded for known word');

  const practiceResult = validateExerciseAnswer(recallExercise, {
    type: 'vocabulary_recall',
    selfAssessment: 'needs_practice',
  });
  assert(practiceResult.isCorrect === false, '"needs_practice" marked for revision');
  assert(practiceResult.pointsAwarded === 0, '0 points awarded for revision words');
}

// ─── Suite 8: Assessment Scoring & Deterministic Recommendations ──────────────
console.log('\n--- Suite 8: Assessment Scoring & Adaptive Recommendations ---');

const mockAttempts = new Map();
const exercises = getLessonExercises('a1-m01-l01');

for (const ex of exercises) {
  const isCorrect = ex.order !== 2; // Make one incorrect
  mockAttempts.set(ex.id, {
    exerciseId: ex.id,
    exerciseType: ex.type,
    answer: { type: ex.type, selectedOption: isCorrect ? 'correct' : 'wrong' },
    validation: {
      exerciseId: ex.id,
      isCorrect,
      pointsAwarded: isCorrect ? ex.points : 0,
      correctAnswer: 'correct',
      feedback: isCorrect ? 'Good' : 'Wrong',
      explanation: 'Explanation',
    },
    attemptedAt: new Date().toISOString(),
  });
}

const score = calculateAssessmentScore('a1-m01-l01', mockAttempts, new Date(Date.now() - 65000).toISOString());
assert(score.totalQuestions === exercises.length, 'Score computes total questions correctly', `${score.totalQuestions}`);
assert(score.correctAnswers === exercises.length - 1, 'Correct answers counted accurately', `${score.correctAnswers}`);
assert(score.scorePercentage === Math.round(((exercises.length - 1) / exercises.length) * 100), 'Score percentage calculated accurately', `${score.scorePercentage}%`);
assert(score.timeTakenSeconds >= 60, 'Time taken tracked in seconds', `${score.timeTakenSeconds}s`);
assert(score.incorrectExercises.length === 1, 'Incorrect exercises isolated for review', `${score.incorrectExercises.length}`);

// Test adaptive recommendation
const recommendation = getAdaptiveRecommendation(score);
assert(['vocabulary_revision', 'sentence_practice', 'listening_exercises', 'all_good'].includes(recommendation.type), 'Adaptive recommendation generated', `${recommendation.type}: ${recommendation.reason}`);

// ─── Suite 9: Database Migration 004 Schema Check ─────────────────────────────
console.log('\n--- Suite 9: Database Migration 004 Schema Check ---');

const migrationPath = resolve(process.cwd(), 'supabase/migrations/004_create_assessment_engine.sql');
const migrationSql = readFileSync(migrationPath, 'utf8');

assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.assessment_results'), 'Migration creates assessment_results table');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.exercise_attempts'), 'Migration creates exercise_attempts table');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.vocabulary_progress'), 'Migration creates vocabulary_progress table');
assert(migrationSql.includes('ENABLE ROW LEVEL SECURITY'), 'RLS enabled on assessment tables');
assert(migrationSql.includes('(select auth.uid()) = user_id'), 'RLS strictly enforces auth.uid() isolation');
assert(migrationSql.includes('handle_updated_at'), 'Updated_at triggers attached');
assert(migrationSql.includes('idx_assessment_results_user_id'), 'Indexes created on assessment foreign keys');

console.log('\n====================================================');
console.log(`TOTAL PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}

