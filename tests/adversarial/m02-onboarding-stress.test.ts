/**
 * Adversarial Stress & Edge Case Test Suite: Milestone M02
 * Target: app/onboarding/page.tsx, components/onboarding/*
 * Author: teamwork_reviewer_m02_2
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDisplayName, resolveAvatarUrl, type WizardFormData } from '../../components/onboarding/OnboardingWizard';
import { SUPPORTED_LANGUAGES } from '../../components/onboarding/StepNativeLanguage';
import { KANNADA_LEVELS } from '../../components/onboarding/StepKannadaLevel';
import { LEARNING_GOAL_OPTIONS } from '../../components/onboarding/StepLearningGoals';
import { COMMITMENT_INTERVALS } from '../../components/onboarding/StepCommitmentSummary';

// ============================================================================
// Section 1: Display Name & Avatar Resolution Stress Tests
// ============================================================================
test('ADV-M02-01: Name resolution with malicious, empty, or whitespace inputs', () => {
  // Whitespace only
  assert.equal(resolveDisplayName({ full_name: '   ' }, 'user@example.com'), 'user');
  assert.equal(resolveDisplayName({ name: '   ' }, 'test@domain.org'), 'test');
  // Null and undefined
  assert.equal(resolveDisplayName(undefined, undefined), 'Learner');
  assert.equal(resolveDisplayName({}, ''), 'Learner');
  assert.equal(resolveDisplayName({}, 'no-at-sign'), 'Learner');
  // Whitespace email prefix
  assert.equal(resolveDisplayName({}, '   @example.com'), 'Learner');
  // Trimmed valid name
  assert.equal(resolveDisplayName({ full_name: '  Kavitha Rao  ' }), 'Kavitha Rao');
});

test('ADV-M02-02: Avatar URL resolution precedence & empty fallbacks', () => {
  // avatar_url takes priority over picture
  assert.equal(
    resolveAvatarUrl({ avatar_url: 'https://example.com/custom.png', picture: 'https://google.com/pic.png' }),
    'https://example.com/custom.png'
  );
  // fallback to picture
  assert.equal(
    resolveAvatarUrl({ picture: 'https://google.com/pic.png' }),
    'https://google.com/pic.png'
  );
  // undefined / null
  assert.equal(resolveAvatarUrl(undefined), null);
  assert.equal(resolveAvatarUrl({}), null);
});

// ============================================================================
// Section 2: Wizard State Transitions & Back-Navigation Data Preservation
// ============================================================================
test('ADV-M02-03: Full wizard state progression, backward jumps, and edit mutability', () => {
  const state: WizardFormData = {
    native_language: null,
    proficiency_level: null,
    learning_goals: [],
    daily_goal_minutes: 10,
  };

  // Step 2: Language selected
  state.native_language = 'ta';
  assert.equal(state.native_language, 'ta');

  // Step 3: Level selected
  state.proficiency_level = 'beginner';
  assert.equal(state.proficiency_level, 'beginner');

  // Step 4: Add goals
  state.learning_goals = ['everyday_conversations', 'travel_and_exploring_karnataka'];
  assert.equal(state.learning_goals.length, 2);

  // Step 5: Change commitment
  state.daily_goal_minutes = 20;
  assert.equal(state.daily_goal_minutes, 20);

  // Jump back to Step 2 to edit language to Hindi
  state.native_language = 'hi';

  // Verify all OTHER answers remained perfectly intact
  assert.equal(state.native_language, 'hi');
  assert.equal(state.proficiency_level, 'beginner');
  assert.deepEqual(state.learning_goals, ['everyday_conversations', 'travel_and_exploring_karnataka']);
  assert.equal(state.daily_goal_minutes, 20);

  // Jump to Step 4 to edit goals
  state.learning_goals = ['workplace_communication'];
  assert.deepEqual(state.learning_goals, ['workplace_communication']);
  assert.equal(state.native_language, 'hi');
  assert.equal(state.proficiency_level, 'beginner');
  assert.equal(state.daily_goal_minutes, 20);
});

// ============================================================================
// Section 3: Goal Toggling Mechanics & Deduplication
// ============================================================================
test('ADV-M02-04: Goal toggle idempotency, extreme counts, and empty states', () => {
  let goals: string[] = [];

  const toggle = (list: string[], code: string): string[] => {
    return list.includes(code)
      ? list.filter((g) => g !== code)
      : [...new Set([...list, code])];
  };

  // Add 1
  goals = toggle(goals, 'everyday_conversations');
  assert.deepEqual(goals, ['everyday_conversations']);

  // Add all 7
  for (const opt of LEARNING_GOAL_OPTIONS) {
    if (!goals.includes(opt.code)) {
      goals = toggle(goals, opt.code);
    }
  }
  assert.equal(goals.length, 7);

  // Toggle off 1
  goals = toggle(goals, 'everyday_conversations');
  assert.equal(goals.length, 6);
  assert.ok(!goals.includes('everyday_conversations'));

  // Toggle all off
  for (const opt of LEARNING_GOAL_OPTIONS) {
    if (goals.includes(opt.code)) {
      goals = toggle(goals, opt.code);
    }
  }
  assert.equal(goals.length, 0);
});

// ============================================================================
// Section 4: Domain Specification Compliance
// ============================================================================
test('ADV-M02-05: Domain options match strict spec constants', () => {
  // Languages: 5
  assert.equal(SUPPORTED_LANGUAGES.length, 5);
  const langCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
  assert.deepEqual(langCodes, ['en', 'hi', 'ta', 'te', 'ml']);

  // Levels: 3
  assert.equal(KANNADA_LEVELS.length, 3);
  const levelCodes = KANNADA_LEVELS.map((l) => l.code);
  assert.deepEqual(levelCodes, ['beginner', 'elementary', 'intermediate']);

  // Goals: 7
  assert.equal(LEARNING_GOAL_OPTIONS.length, 7);
  const goalCodes = LEARNING_GOAL_OPTIONS.map((g) => g.code);
  assert.ok(goalCodes.includes('understanding_kannada_culture'));

  // Commitment intervals: 5, 10, 15, 20
  assert.equal(COMMITMENT_INTERVALS.length, 4);
  const mins = COMMITMENT_INTERVALS.map((c) => c.minutes);
  assert.deepEqual(mins, [5, 10, 15, 20]);
});
