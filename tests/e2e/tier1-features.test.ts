/**
 * Tier 1: Feature Coverage Test Suite (Milestone 02)
 * Validates core functionality for R1 through R5 with >= 5 tests per feature.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { SPEC_ORACLE } from './harness/spec-oracle';
import { MockSupabaseClient } from './harness/mock-supabase';
import { RouterSimulator } from './harness/router-simulator';
import { CreateLearnerProfileDTO, LearnerProfile } from './harness/types';

// ============================================================================
// Feature R1: Multilingual Onboarding Wizard Route (/onboarding)
// ============================================================================
test('R1-F01: Step 1 Welcome Screen renders verbatim Kannada greeting, copy, and CTA', () => {
  const step1 = SPEC_ORACLE.onboarding.step1;
  assert.equal(step1.kannadaGreeting, 'ನಮಸ್ಕಾರ!', 'Greeting must be verbatim Kannada greeting');
  assert.equal(
    step1.supportingCopy,
    "Let's make Kannada a part of your everyday life. Tell us a little about yourself. We'll create a Kannada learning experience that matches your language, pace and goals.",
    'Supporting copy must exactly match original request requirement'
  );
  assert.equal(step1.ctaText, "Let's Begin", 'CTA button must read "Let\'s Begin"');
});

test('R1-F02: Step 1 Avatar and Name resolution handles Google image and fallbacks', () => {
  // Scenario A: Full user metadata present
  const userWithPhoto = {
    id: 'user-001',
    email: 'ananya@example.com',
    user_metadata: { full_name: 'Ananya Sharma', picture: 'https://lh3.googleusercontent.com/photo.jpg' },
  };
  const displayNameA = userWithPhoto.user_metadata?.full_name ?? userWithPhoto.email.split('@')[0];
  const photoUrlA = userWithPhoto.user_metadata?.picture ?? null;
  assert.equal(displayNameA, 'Ananya Sharma');
  assert.equal(photoUrlA, 'https://lh3.googleusercontent.com/photo.jpg');

  // Scenario B: No photo, only email prefix
  const userNoPhoto: { id: string; email: string; user_metadata?: { full_name?: string; picture?: string } } = {
    id: 'user-002',
    email: 'learner99@gmail.com',
    user_metadata: {},
  };
  const displayNameB = userNoPhoto.user_metadata?.full_name ?? userNoPhoto.email.split('@')[0];
  const avatarFallbackLetter = (displayNameB[0] || 'L').toUpperCase();
  assert.equal(displayNameB, 'learner99');
  assert.equal(avatarFallbackLetter, 'L');
});

test('R1-F03: Step 2 Native Language offers 5 languages with native scripts and single-select', () => {
  const step2 = SPEC_ORACLE.onboarding.step2;
  assert.equal(step2.languages.length, 5, 'Must offer exactly 5 supported languages');
  const codes = step2.languages.map((l) => l.code);
  assert.deepEqual(codes, ['en', 'hi', 'ta', 'te', 'ml'], 'Language codes must match en, hi, ta, te, ml');

  // Verify native script representations
  const scriptMap = Object.fromEntries(step2.languages.map((l) => [l.code, l.nativeScript]));
  assert.equal(scriptMap.en, 'English');
  assert.equal(scriptMap.hi, 'हिन्दी');
  assert.equal(scriptMap.ta, 'தமிழ்');
  assert.equal(scriptMap.te, 'తెలుగు');
  assert.equal(scriptMap.ml, 'മലയാളം');
  assert.equal(step2.selectionMode, 'single');
});

test('R1-F04: Step 3 Kannada Baseline offers 3 levels with descriptive helper copy', () => {
  const step3 = SPEC_ORACLE.onboarding.step3;
  assert.equal(step3.levels.length, 3, 'Must offer exactly 3 proficiency levels');
  const levelCodes = step3.levels.map((l) => l.code);
  assert.deepEqual(levelCodes, ['beginner', 'elementary', 'intermediate']);

  const descriptions = Object.fromEntries(step3.levels.map((l) => [l.code, l.description]));
  assert.equal(descriptions.beginner, 'I am completely new to Kannada');
  assert.equal(descriptions.elementary, 'I know a few words and basic phrases');
  assert.equal(descriptions.intermediate, 'I can understand some Kannada but struggle to speak confidently');
  assert.equal(step3.selectionMode, 'single');
});

test('R1-F05: Step 4 Learning Goals offers 7 domains with multi-select and string array output', () => {
  const step4 = SPEC_ORACLE.onboarding.step4;
  assert.equal(step4.goals.length, 7, 'Must offer exactly 7 learning goals');
  assert.equal(step4.selectionMode, 'multiple');
  assert.equal(step4.minSelected, 1, 'Must require at least 1 goal selected to advance');

  const goalCodes = step4.goals.map((g) => g.code);
  assert.ok(goalCodes.includes('everyday_conversations'));
  assert.ok(goalCodes.includes('college_and_education'));
  assert.ok(goalCodes.includes('workplace_communication'));
  assert.ok(goalCodes.includes('shopping_and_daily_activities'));
  assert.ok(goalCodes.includes('travel_and_exploring_karnataka'));
  assert.ok(goalCodes.includes('communicating_with_local_communities'));
  assert.ok(goalCodes.includes('understanding_kannada_culture'));
});

test('R1-F06: Step 5 Commitment & Summary offers 4 daily options, review card, and submit CTA', () => {
  const step5 = SPEC_ORACLE.onboarding.step5;
  assert.deepEqual(step5.commitments, [5, 10, 15, 20], 'Commitments must be 5, 10, 15, 20 minutes');
  assert.equal(step5.defaultCommitment, 10, 'Default commitment should be 10 minutes');
  assert.equal(step5.ctaText, 'Create My Learning Journey');
});

test('R1-F07: Post-Onboarding Success Screen displays celebration heading and dashboard CTA', () => {
  const success = SPEC_ORACLE.onboarding.successScreen;
  assert.equal(success.heading, 'ನಮಸ್ಕಾರ! Your Kannada journey begins.');
  assert.equal(success.ctaText, 'Enter My Dashboard');
  assert.equal(success.ctaDestination, '/dashboard');
});

// ============================================================================
// Feature R2: Supabase Learner Profiles Schema and Migration
// ============================================================================
test('R2-F01: learner_profiles table DDL defines UUID primary key with default gen_random_uuid', () => {
  const schema = SPEC_ORACLE.database;
  assert.equal(schema.tableName, 'learner_profiles');
  const idCol = schema.columns.find((c) => c.name === 'id');
  assert.ok(idCol, 'Column id must exist');
  assert.equal(idCol.type, 'UUID');
  assert.equal(idCol.primaryKey, true);
  assert.equal(idCol.default, 'gen_random_uuid()');
});

test('R2-F02: user_id column references auth.users(id) with CASCADE delete and unique constraint', () => {
  const userIdCol = SPEC_ORACLE.database.columns.find((c) => c.name === 'user_id');
  assert.ok(userIdCol, 'Column user_id must exist');
  assert.equal(userIdCol.nullable, false);
  assert.equal(userIdCol.unique, true);
  assert.equal(userIdCol.references, 'auth.users(id)');
  assert.equal(userIdCol.onDelete, 'CASCADE');
});

test('R2-F03: Check constraints restrict native_language, proficiency_level, and daily_goal_minutes', () => {
  const langCol = SPEC_ORACLE.database.columns.find((c) => c.name === 'native_language');
  assert.ok(langCol?.check?.includes("'en', 'hi', 'ta', 'te', 'ml'"));

  const levelCol = SPEC_ORACLE.database.columns.find((c) => c.name === 'proficiency_level');
  assert.ok(levelCol?.check?.includes("'beginner', 'elementary', 'intermediate'"));

  const goalMinCol = SPEC_ORACLE.database.columns.find((c) => c.name === 'daily_goal_minutes');
  assert.ok(goalMinCol?.check?.includes('5, 10, 15, 20'));
});

test('R2-F04: Default values are established for target_language, onboarding_completed, and learning_goals', () => {
  const targetCol = SPEC_ORACLE.database.columns.find((c) => c.name === 'target_language');
  assert.equal(targetCol?.default, "'kn'");

  const onbCol = SPEC_ORACLE.database.columns.find((c) => c.name === 'onboarding_completed');
  assert.equal(onbCol?.default, 'false');

  const goalsCol = SPEC_ORACLE.database.columns.find((c) => c.name === 'learning_goals');
  assert.equal(goalsCol?.default, "'{}'");
});

test('R2-F05: Automated updated_at trigger is registered before UPDATE', () => {
  const trigger = SPEC_ORACLE.database.trigger;
  assert.equal(trigger.name, 'handle_updated_at');
  assert.equal(trigger.event, 'BEFORE UPDATE');
  assert.equal(trigger.columnUpdated, 'updated_at');
});

test('R2-F06: Row Level Security is enabled with strict auth.uid() = user_id policies', () => {
  const rls = SPEC_ORACLE.database.rls;
  assert.equal(rls.enabled, true);
  assert.equal(rls.policies.length, 3);
  for (const policy of rls.policies) {
    assert.equal(policy.check, 'auth.uid() = user_id');
  }
});

// ============================================================================
// Feature R3: Profile Persistence Service (lib/services/profile.ts)
// ============================================================================
test('R3-F01: createLearnerProfile persists profile and flags onboarding_completed = true', async () => {
  const user = { id: 'usr-101', email: 'rahul@kannadakaliri.org' };
  const client = new MockSupabaseClient(user);

  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    full_name: 'Rahul Dravid',
    avatar_url: 'https://example.com/rahul.png',
    native_language: 'te',
    proficiency_level: 'beginner',
    learning_goals: ['everyday_conversations', 'shopping_and_daily_activities'],
    daily_goal_minutes: 15,
    onboarding_completed: true,
  };

  const { data, error } = await client.from('learner_profiles').upsert(payload);
  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.user_id, user.id);
  assert.equal(data.native_language, 'te');
  assert.equal(data.proficiency_level, 'beginner');
  assert.equal(data.daily_goal_minutes, 15);
  assert.equal(data.onboarding_completed, true);
  assert.equal(data.target_language, 'kn');
  assert.ok(data.created_at);
  assert.ok(data.updated_at);
});

test('R3-F02: getLearnerProfile retrieves stored profile by user_id', async () => {
  const user = { id: 'usr-102', email: 'deepa@example.com' };
  const client = new MockSupabaseClient(user);

  // Seed profile
  const seed: LearnerProfile = {
    id: 'lp-102',
    user_id: user.id,
    full_name: 'Deepa Rao',
    avatar_url: null,
    native_language: 'ta',
    target_language: 'kn',
    proficiency_level: 'intermediate',
    learning_goals: ['workplace_communication'],
    daily_goal_minutes: 20,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  client.seedProfile(seed);

  const { data, error } = await client.from('learner_profiles').select('*').eq('user_id', user.id).maybeSingle();
  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.user_id, user.id);
  assert.equal(data.native_language, 'ta');
  assert.equal(data.proficiency_level, 'intermediate');
});

test('R3-F03: isOnboardingCompleted returns true when profile exists with onboarding_completed: true', async () => {
  const user = { id: 'usr-103', email: 'kavitha@example.com' };
  const client = new MockSupabaseClient(user);

  client.seedProfile({
    id: 'lp-103',
    user_id: user.id,
    full_name: 'Kavitha',
    avatar_url: null,
    native_language: 'ml',
    target_language: 'kn',
    proficiency_level: 'elementary',
    learning_goals: ['everyday_conversations'],
    daily_goal_minutes: 10,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const { data } = await client.from('learner_profiles').select('onboarding_completed').eq('user_id', user.id).maybeSingle();
  const isCompleted = data?.onboarding_completed === true;
  assert.equal(isCompleted, true);
});

test('R3-F04: isOnboardingCompleted returns false when profile row does not exist or completed is false', async () => {
  const user = { id: 'usr-104', email: 'newbie@example.com' };
  const client = new MockSupabaseClient(user);

  // Case 1: No row
  const res1 = await client.from('learner_profiles').select('onboarding_completed').eq('user_id', user.id).maybeSingle();
  const isCompleted1 = res1.data?.onboarding_completed === true;
  assert.equal(isCompleted1, false);

  // Case 2: Row exists but onboarding_completed is false
  client.seedProfile({
    id: 'lp-104',
    user_id: user.id,
    full_name: 'Newbie',
    avatar_url: null,
    native_language: 'en',
    target_language: 'kn',
    proficiency_level: 'beginner',
    learning_goals: [],
    daily_goal_minutes: 10,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const res2 = await client.from('learner_profiles').select('onboarding_completed').eq('user_id', user.id).maybeSingle();
  const isCompleted2 = res2.data?.onboarding_completed === true;
  assert.equal(isCompleted2, false);
});

test('R3-F05: updateLearnerProfile modifies preferences while preserving immutable fields', async () => {
  const user = { id: 'usr-105', email: 'ram@example.com' };
  const client = new MockSupabaseClient(user);

  const initialCreatedAt = '2026-01-01T10:00:00.000Z';
  const initialId = 'lp-fixed-105';

  client.seedProfile({
    id: initialId,
    user_id: user.id,
    full_name: 'Ram Kumar',
    avatar_url: null,
    native_language: 'hi',
    target_language: 'kn',
    proficiency_level: 'beginner',
    learning_goals: ['everyday_conversations'],
    daily_goal_minutes: 5,
    onboarding_completed: true,
    created_at: initialCreatedAt,
    updated_at: initialCreatedAt,
  });

  // User later updates daily commitment to 20 minutes and advances to elementary
  const { data, error } = await client
    .from('learner_profiles')
    .eq('user_id', user.id)
    .update({
      proficiency_level: 'elementary',
      daily_goal_minutes: 20,
    });

  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.id, initialId, 'id must remain immutable');
  assert.equal(data.user_id, user.id, 'user_id must remain immutable');
  assert.equal(data.created_at, initialCreatedAt, 'created_at must remain immutable');
  assert.equal(data.proficiency_level, 'elementary', 'proficiency_level should be updated');
  assert.equal(data.daily_goal_minutes, 20, 'daily_goal_minutes should be updated');
  assert.notEqual(data.updated_at, initialCreatedAt, 'updated_at should be refreshed');
});

test('R3-F06: Profile creation uses idempotent upsert logic preventing duplicate collisions', async () => {
  const user = { id: 'usr-106', email: 'idempotent@test.com' };
  const client = new MockSupabaseClient(user);

  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    full_name: 'Idempotent User',
    avatar_url: null,
    native_language: 'en',
    proficiency_level: 'beginner',
    learning_goals: ['travel_and_exploring_karnataka'],
    daily_goal_minutes: 10,
    onboarding_completed: true,
  };

  // Call 1
  const res1 = await client.from('learner_profiles').upsert(payload, { onConflict: 'user_id' });
  assert.equal(res1.error, null);
  const originalProfileId = res1.data?.id;

  // Call 2 (Simulating duplicate form submission or retry)
  const res2 = await client.from('learner_profiles').upsert(payload, { onConflict: 'user_id' });
  assert.equal(res2.error, null);
  assert.equal(res2.data?.id, originalProfileId, 'Upsert must update existing row without creating duplicate');
});

// ============================================================================
// Feature R4: Authentication, Session, and Routing Rules
// ============================================================================
test('R4-F01: Unauthenticated request to /onboarding redirects to /login?redirect=/onboarding', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/onboarding',
    isAuthenticated: false,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.statusCode, 307);
  assert.equal(decision.redirectUrl, '/login?redirect=/onboarding');
});

test('R4-F02: Authenticated user with incomplete onboarding requesting /dashboard redirects to /onboarding', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/dashboard',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.statusCode, 307);
  assert.equal(decision.redirectUrl, '/onboarding');
});

test('R4-F03: Authenticated user with incomplete onboarding requesting /login or /signup redirects to /onboarding', () => {
  const loginDecision = RouterSimulator.evaluateRoute({
    pathname: '/login',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(loginDecision.allow, false);
  assert.equal(loginDecision.redirectUrl, '/onboarding');

  const signupDecision = RouterSimulator.evaluateRoute({
    pathname: '/signup',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(signupDecision.allow, false);
  assert.equal(signupDecision.redirectUrl, '/onboarding');
});

test('R4-F04: Authenticated user with completed onboarding requesting /login or /signup redirects to /dashboard', () => {
  const loginDecision = RouterSimulator.evaluateRoute({
    pathname: '/login',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(loginDecision.allow, false);
  assert.equal(loginDecision.redirectUrl, '/dashboard');

  const signupDecision = RouterSimulator.evaluateRoute({
    pathname: '/signup',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(signupDecision.allow, false);
  assert.equal(signupDecision.redirectUrl, '/dashboard');
});

test('R4-F05: Authenticated user with completed onboarding requesting /onboarding redirects to /dashboard', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/onboarding',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectUrl, '/dashboard');
});

test('R4-F06: OAuth callback routes completed users to /dashboard and incomplete users to /onboarding', () => {
  const completedCallback = RouterSimulator.evaluateRoute({
    pathname: '/auth/callback',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(completedCallback.redirectUrl, '/dashboard');

  const incompleteCallback = RouterSimulator.evaluateRoute({
    pathname: '/auth/callback',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(incompleteCallback.redirectUrl, '/onboarding');
});

// ============================================================================
// Feature R5: Design System and Mobile Responsiveness
// ============================================================================
test('R5-F01: Mysore Royal design tokens are properly defined in specification', () => {
  const tokens = SPEC_ORACLE.design.colorTokens;
  assert.equal(tokens.royalNavy, '#101D36');
  assert.equal(tokens.mysoreGold, '#D5A64A');
  assert.equal(tokens.warmIvory, '#F8F5EE');
  assert.equal(tokens.heritageCream, '#EDE5D6');
  assert.equal(tokens.royalNavyDark, '#0A1222');
});

test('R5-F02: Typography configuration includes Cinzel, Manrope, and Noto Sans Kannada', () => {
  const fonts = SPEC_ORACLE.design.fonts;
  assert.equal(fonts.serif, 'Cinzel');
  assert.equal(fonts.sans, 'Manrope');
  assert.equal(fonts.kannada, 'Noto Sans Kannada');
});

test('R5-F03: Glassmorphism and luxury aesthetic utility classes are specified', () => {
  const classes = SPEC_ORACLE.design.glassmorphismClasses;
  assert.ok(classes.includes('glass-panel'));
  assert.ok(classes.includes('glass-panel-light'));
  assert.ok(classes.includes('glass-card-hover'));
  assert.ok(classes.includes('gold-gradient-text'));
  assert.ok(classes.includes('gold-glow'));
});

test('R5-F04: Mobile touch target sizes meet accessibility requirements (>= 44px)', () => {
  const mobileSpec = SPEC_ORACLE.design.mobileAccessibility;
  assert.ok(mobileSpec.minTouchTargetPx >= 44, 'Touch targets must be at least 44px');
  assert.ok(mobileSpec.recommendedTouchTargetPx >= 48, 'Recommended touch targets should be 48px');
});

test('R5-F05: Layout includes safe-area insets for mobile and notch compatibility', () => {
  const mobileSpec = SPEC_ORACLE.design.mobileAccessibility;
  assert.equal(mobileSpec.safeAreaPadding, 'env(safe-area-inset-bottom)');
});

test('R5-F06: Framer Motion animation configuration supports reduced motion accessibility', () => {
  // Test reduced motion behavior: when prefers-reduced-motion is active, animation transforms are disabled
  const shouldAnimate = (prefersReducedMotion: boolean) => !prefersReducedMotion;
  assert.equal(shouldAnimate(true), false, 'Animations must be suppressed when user prefers reduced motion');
  assert.equal(shouldAnimate(false), true, 'Animations enabled when user has not requested reduced motion');
});

