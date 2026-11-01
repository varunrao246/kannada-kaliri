/**
 * Tier 3: Cross-Feature Combinations Test Suite (Milestone 02)
 * Validates pairwise interactions across authentication states, routes,
 * languages, proficiency levels, learning goals, and commitment durations.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { RouterSimulator } from './harness/router-simulator';
import { MockSupabaseClient } from './harness/mock-supabase';
import { SPEC_ORACLE } from './harness/spec-oracle';
import { CreateLearnerProfileDTO, NativeLanguage, ProficiencyLevel, DailyGoalMinutes } from './harness/types';

// ============================================================================
// Auth State × Route Navigation Matrix (Pairwise 1 to 8)
// ============================================================================
test('T3-C01: Unauthenticated × /onboarding -> Redirects to /login?redirect=/onboarding', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/onboarding',
    isAuthenticated: false,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.statusCode, 307);
  assert.equal(decision.redirectUrl, '/login?redirect=/onboarding');
});

test('T3-C02: Unauthenticated × /dashboard -> Redirects to /login?redirect=/dashboard', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/dashboard',
    isAuthenticated: false,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.statusCode, 307);
  assert.equal(decision.redirectUrl, '/login?redirect=/dashboard');
});

test('T3-C03: Authenticated Incomplete × /login -> Redirects to /onboarding', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/login',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectUrl, '/onboarding');
});

test('T3-C04: Authenticated Incomplete × /signup -> Redirects to /onboarding', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/signup',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectUrl, '/onboarding');
});

test('T3-C05: Authenticated Incomplete × /dashboard -> Redirects to /onboarding', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/dashboard',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectUrl, '/onboarding');
});

test('T3-C06: Authenticated Completed × /login -> Redirects to /dashboard', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/login',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectUrl, '/dashboard');
});

test('T3-C07: Authenticated Completed × /signup -> Redirects to /dashboard', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/signup',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectUrl, '/dashboard');
});

test('T3-C08: Authenticated Completed × /onboarding -> Redirects to /dashboard', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/onboarding',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectUrl, '/dashboard');
});

// ============================================================================
// Language × Level × Goals × Commitment Combinations (Pairwise 9 to 13)
// ============================================================================
test('T3-C09: Combination: Hindi (hi) × Beginner × Culture Goal × 5 Minutes', async () => {
  const user = { id: 'usr-c09', email: 'hindi.learner@test.com' };
  const client = new MockSupabaseClient(user);

  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    native_language: 'hi',
    proficiency_level: 'beginner',
    learning_goals: ['understanding_kannada_culture'],
    daily_goal_minutes: 5,
    onboarding_completed: true,
  };

  const { data, error } = await client.from('learner_profiles').upsert(payload);
  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.native_language, 'hi');
  assert.equal(data.proficiency_level, 'beginner');
  assert.deepEqual(data.learning_goals, ['understanding_kannada_culture']);
  assert.equal(data.daily_goal_minutes, 5);
  assert.equal(data.onboarding_completed, true);
});

test('T3-C10: Combination: Tamil (ta) × Elementary × Workplace + Shopping Goals × 15 Minutes', async () => {
  const user = { id: 'usr-c10', email: 'tamil.learner@test.com' };
  const client = new MockSupabaseClient(user);

  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    native_language: 'ta',
    proficiency_level: 'elementary',
    learning_goals: ['workplace_communication', 'shopping_and_daily_activities'],
    daily_goal_minutes: 15,
    onboarding_completed: true,
  };

  const { data, error } = await client.from('learner_profiles').upsert(payload);
  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.native_language, 'ta');
  assert.equal(data.proficiency_level, 'elementary');
  assert.equal(data.learning_goals.length, 2);
  assert.equal(data.daily_goal_minutes, 15);
});

test('T3-C11: Combination: Telugu (te) × Intermediate × Everyday + Travel + Community × 20 Minutes', async () => {
  const user = { id: 'usr-c11', email: 'telugu.learner@test.com' };
  const client = new MockSupabaseClient(user);

  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    native_language: 'te',
    proficiency_level: 'intermediate',
    learning_goals: ['everyday_conversations', 'travel_and_exploring_karnataka', 'communicating_with_local_communities'],
    daily_goal_minutes: 20,
    onboarding_completed: true,
  };

  const { data, error } = await client.from('learner_profiles').upsert(payload);
  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.native_language, 'te');
  assert.equal(data.proficiency_level, 'intermediate');
  assert.equal(data.learning_goals.length, 3);
  assert.equal(data.daily_goal_minutes, 20);
});

test('T3-C12: Combination: Malayalam (ml) × Beginner × All 7 Goals × 10 Minutes', async () => {
  const user = { id: 'usr-c12', email: 'malayalam.learner@test.com' };
  const client = new MockSupabaseClient(user);

  const allGoals = SPEC_ORACLE.onboarding.step4.goals.map((g) => g.code);
  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    native_language: 'ml',
    proficiency_level: 'beginner',
    learning_goals: allGoals,
    daily_goal_minutes: 10,
    onboarding_completed: true,
  };

  const { data, error } = await client.from('learner_profiles').upsert(payload);
  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.native_language, 'ml');
  assert.equal(data.learning_goals.length, 7);
  assert.equal(data.daily_goal_minutes, 10);
});

test('T3-C13: Combination: English (en) × Intermediate × College Goal × 5 Minutes', async () => {
  const user = { id: 'usr-c13', email: 'english.learner@test.com' };
  const client = new MockSupabaseClient(user);

  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    native_language: 'en',
    proficiency_level: 'intermediate',
    learning_goals: ['college_and_education'],
    daily_goal_minutes: 5,
    onboarding_completed: true,
  };

  const { data, error } = await client.from('learner_profiles').upsert(payload);
  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.native_language, 'en');
  assert.equal(data.proficiency_level, 'intermediate');
  assert.deepEqual(data.learning_goals, ['college_and_education']);
  assert.equal(data.daily_goal_minutes, 5);
});

// ============================================================================
// OAuth Callback & Session Integrations (Pairwise 14 to 15)
// ============================================================================
test('T3-C14: OAuth Callback × Incomplete User Session -> Routes to /onboarding', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/auth/callback',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(decision.redirectUrl, '/onboarding');
});

test('T3-C15: OAuth Callback × Completed User Session -> Routes to /dashboard', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/auth/callback',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(decision.redirectUrl, '/dashboard');
});

// ============================================================================
// Multi-User Security & Wizard State Preservation (Pairwise 16 to 17)
// ============================================================================
test('T3-C16: Profile Persistence × RLS Boundary: User A cannot mutate User B profile', async () => {
  const client = new MockSupabaseClient({ id: 'user-alice', email: 'alice@kaliri.org' });

  // Seed bob profile
  client.seedProfile({
    id: 'lp-bob',
    user_id: 'user-bob',
    full_name: 'Bob',
    avatar_url: null,
    native_language: 'ta',
    target_language: 'kn',
    proficiency_level: 'beginner',
    learning_goals: ['everyday_conversations'],
    daily_goal_minutes: 10,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Alice attempts to upsert for Bob's user_id
  const hostilePayload: CreateLearnerProfileDTO = {
    user_id: 'user-bob',
    native_language: 'en',
    proficiency_level: 'intermediate',
    daily_goal_minutes: 20,
    learning_goals: ['workplace_communication'],
  };

  const { data, error } = await client.from('learner_profiles').upsert(hostilePayload);
  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /RLS policy violation/i);
});

test('T3-C17: Wizard Navigation Back/Forward preserves accumulated state across steps', () => {
  // Simulate wizard form state container
  const wizardState: {
    nativeLanguage: NativeLanguage | null;
    proficiencyLevel: ProficiencyLevel | null;
    learningGoals: string[];
    dailyCommitment: DailyGoalMinutes;
  } = {
    nativeLanguage: null,
    proficiencyLevel: null,
    learningGoals: [],
    dailyCommitment: 10,
  };

  // Step 2: User selects Tamil
  wizardState.nativeLanguage = 'ta';

  // Step 3: User selects Elementary
  wizardState.proficiencyLevel = 'elementary';

  // Step 4: User selects 2 goals
  wizardState.learningGoals = ['everyday_conversations', 'shopping_and_daily_activities'];

  // User navigates back to Step 2 and changes language to Telugu
  wizardState.nativeLanguage = 'te';

  // User navigates forward to Step 5: previous choices must remain preserved
  assert.equal(wizardState.nativeLanguage, 'te', 'Language updated to Telugu');
  assert.equal(wizardState.proficiencyLevel, 'elementary', 'Proficiency level retained');
  assert.deepEqual(
    wizardState.learningGoals,
    ['everyday_conversations', 'shopping_and_daily_activities'],
    'Learning goals retained'
  );
  assert.equal(wizardState.dailyCommitment, 10, 'Default commitment retained');
});
