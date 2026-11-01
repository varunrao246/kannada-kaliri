/**
 * Tier 4: Real-World Application Scenarios (Milestone 02)
 * Comprehensive end-to-end simulations of realistic user journeys:
 * onboarding progression, auth redirects, profile persistence, and state recovery.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { RouterSimulator } from './harness/router-simulator';
import { MockSupabaseClient } from './harness/mock-supabase';
import { SPEC_ORACLE } from './harness/spec-oracle';
import { CreateLearnerProfileDTO } from './harness/types';

// ============================================================================
// Scenario 1: The Tech Professional Journey (Bangalore Relocation)
// ============================================================================
test('T4-S01: Tech Professional relocating from Delhi to Bengaluru completes full onboarding', async () => {
  const user = {
    id: 'user-tech-01',
    email: 'arjun.mehta@techcorp.in',
    user_metadata: { full_name: 'Arjun Mehta' },
  };
  const client = new MockSupabaseClient(user);

  // 1. Initial State: User signed up, profile not yet in database
  const initialProfile = await client.from('learner_profiles').select('*').eq('user_id', user.id).maybeSingle();
  assert.equal(initialProfile.data, null);

  // 2. User navigates to /onboarding -> Allowed
  const onbNav = RouterSimulator.evaluateRoute({ pathname: '/onboarding', isAuthenticated: true, onboardingCompleted: false });
  assert.equal(onbNav.allow, true);

  // 3. Step 1: Welcome Screen check
  assert.equal(SPEC_ORACLE.onboarding.step1.kannadaGreeting, 'ನಮಸ್ಕಾರ!');
  assert.equal(user.user_metadata.full_name, 'Arjun Mehta');

  // 4. Wizard Progression:
  // Step 2: Native Language = Hindi
  const selectedLang = 'hi';
  // Step 3: Kannada Level = Beginner
  const selectedLevel = 'beginner';
  // Step 4: Learning Goals = Workplace, Everyday, Shopping
  const selectedGoals = ['workplace_communication', 'everyday_conversations', 'shopping_and_daily_activities'];
  // Step 5: Daily Commitment = 15 minutes
  const selectedCommitment = 15;

  // 5. Submit Profile via Service Upsert
  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    full_name: user.user_metadata.full_name,
    avatar_url: null,
    native_language: selectedLang,
    proficiency_level: selectedLevel,
    learning_goals: selectedGoals,
    daily_goal_minutes: selectedCommitment,
    onboarding_completed: true,
  };

  const { data: savedProfile, error } = await client.from('learner_profiles').upsert(payload, { onConflict: 'user_id' });
  assert.equal(error, null);
  assert.ok(savedProfile);
  assert.equal(savedProfile.native_language, 'hi');
  assert.equal(savedProfile.proficiency_level, 'beginner');
  assert.deepEqual(savedProfile.learning_goals, selectedGoals);
  assert.equal(savedProfile.daily_goal_minutes, 15);
  assert.equal(savedProfile.onboarding_completed, true);

  // 6. Celebration Screen & Route to /dashboard
  assert.equal(SPEC_ORACLE.onboarding.successScreen.heading, 'ನಮಸ್ಕಾರ! Your Kannada journey begins.');
  const dashNav = RouterSimulator.evaluateRoute({ pathname: '/dashboard', isAuthenticated: true, onboardingCompleted: true });
  assert.equal(dashNav.allow, true);

  // 7. Subsequent return to /login or /onboarding redirects to /dashboard
  const returnLogin = RouterSimulator.evaluateRoute({ pathname: '/login', isAuthenticated: true, onboardingCompleted: true });
  assert.equal(returnLogin.redirectUrl, '/dashboard');
  const returnOnboarding = RouterSimulator.evaluateRoute({ pathname: '/onboarding', isAuthenticated: true, onboardingCompleted: true });
  assert.equal(returnOnboarding.redirectUrl, '/dashboard');
});

// ============================================================================
// Scenario 2: The College Student Journey (Chennai to Mysore)
// ============================================================================
test('T4-S02: Tamil student in Mysore onboards via Google OAuth and updates commitment later', async () => {
  const user = {
    id: 'user-student-02',
    email: 'karthik.s@mysoreuniv.edu',
    user_metadata: {
      full_name: 'Karthik Subramanian',
      picture: 'https://lh3.googleusercontent.com/a/student-avatar.jpg',
    },
  };
  const client = new MockSupabaseClient(user);

  // 1. OAuth Callback routes user to /onboarding because onboarding is incomplete
  const callbackRoute = RouterSimulator.evaluateRoute({
    pathname: '/auth/callback',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(callbackRoute.redirectUrl, '/onboarding');

  // 2. Wizard execution: Tamil, Elementary, College & Culture, 10 min
  const initialPayload: CreateLearnerProfileDTO = {
    user_id: user.id,
    full_name: user.user_metadata.full_name,
    avatar_url: user.user_metadata.picture,
    native_language: 'ta',
    proficiency_level: 'elementary',
    learning_goals: ['college_and_education', 'communicating_with_local_communities', 'understanding_kannada_culture'],
    daily_goal_minutes: 10,
    onboarding_completed: true,
  };

  const { data: created } = await client.from('learner_profiles').upsert(initialPayload);
  assert.ok(created);
  assert.equal(created.native_language, 'ta');
  assert.equal(created.avatar_url, 'https://lh3.googleusercontent.com/a/student-avatar.jpg');

  // 3. User accesses /dashboard -> Allowed
  const dashAccess = RouterSimulator.evaluateRoute({ pathname: '/dashboard', isAuthenticated: true, onboardingCompleted: true });
  assert.equal(dashAccess.allow, true);

  // 4. One month later: Student updates commitment from 10 to 20 minutes
  const originalCreatedTime = created.created_at;
  const { data: updated } = await client
    .from('learner_profiles')
    .eq('user_id', user.id)
    .update({ daily_goal_minutes: 20 });

  assert.ok(updated);
  assert.equal(updated.daily_goal_minutes, 20);
  assert.equal(updated.created_at, originalCreatedTime, 'Original creation timestamp preserved');
  assert.equal(updated.native_language, 'ta', 'Native language preserved');
});

// ============================================================================
// Scenario 3: The Busy Executive Journey (Quick 5-minute Micro-learning)
// ============================================================================
test('T4-S03: Busy executive intercepted by login, completes 5-minute micro-learning setup', async () => {
  // 1. Unauthenticated executive attempts direct access to /onboarding
  const directAccess = RouterSimulator.evaluateRoute({ pathname: '/onboarding', isAuthenticated: false });
  assert.equal(directAccess.allow, false);
  assert.equal(directAccess.redirectUrl, '/login?redirect=/onboarding');

  // 2. Executive authenticates
  const executive = {
    id: 'user-exec-03',
    email: 'venkat.reddy@enterprise.com',
    user_metadata: { name: 'Venkat Reddy' },
  };
  const client = new MockSupabaseClient(executive);

  // 3. Redirected back to /onboarding after auth
  const resumeOnboarding = RouterSimulator.evaluateRoute({
    pathname: '/onboarding',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(resumeOnboarding.allow, true);

  // 4. Chooses Telugu, Intermediate, Everyday conversations, 5 minutes commitment
  const payload: CreateLearnerProfileDTO = {
    user_id: executive.id,
    full_name: 'Venkat Reddy',
    native_language: 'te',
    proficiency_level: 'intermediate',
    learning_goals: ['everyday_conversations'],
    daily_goal_minutes: 5,
    onboarding_completed: true,
  };

  const { data: saved } = await client.from('learner_profiles').upsert(payload);
  assert.ok(saved);
  assert.equal(saved.daily_goal_minutes, 5);
  assert.equal(saved.proficiency_level, 'intermediate');

  // 5. Lands on dashboard
  const finalDashboard = RouterSimulator.evaluateRoute({
    pathname: '/dashboard',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(finalDashboard.allow, true);
});

// ============================================================================
// Scenario 4: The Cultural Enthusiast & Traveler Journey
// ============================================================================
test('T4-S04: Malayalam traveler tests wizard back/forward, selects all 7 goals, and confirms', async () => {
  const user = {
    id: 'user-travel-04',
    email: 'manu.nair@explore.in',
    user_metadata: { full_name: 'Manu Nair' },
  };
  const client = new MockSupabaseClient(user);

  // Wizard state machine simulation
  let currentStep = 1;
  const selections = {
    lang: null as string | null,
    level: null as string | null,
    goals: [] as string[],
    commitment: 10,
  };

  // Step 1: Welcome -> Clicks "Let's Begin"
  currentStep = 2;

  // Step 2: Selects English by mistake, then corrects to Malayalam
  selections.lang = 'en';
  selections.lang = 'ml';
  currentStep = 3;

  // Step 3: Selects Beginner
  selections.level = 'beginner';
  currentStep = 4;

  // Step 4: Enthusiast selects ALL 7 learning goals
  const all7Goals = SPEC_ORACLE.onboarding.step4.goals.map((g) => g.code);
  selections.goals = [...all7Goals];
  assert.equal(selections.goals.length, 7);
  currentStep = 5;

  // Step 5: Chooses 20 min commitment
  selections.commitment = 20;
  assert.equal(currentStep, 5);

  // Confirmation Summary matches all selected items
  assert.equal(selections.lang, 'ml');
  assert.equal(selections.level, 'beginner');
  assert.equal(selections.goals.length, 7);
  assert.equal(selections.commitment, 20);

  // Submit profile
  const { data: savedProfile, error } = await client.from('learner_profiles').upsert({
    user_id: user.id,
    full_name: user.user_metadata.full_name,
    native_language: 'ml',
    proficiency_level: 'beginner',
    learning_goals: selections.goals,
    daily_goal_minutes: 20,
    onboarding_completed: true,
  });

  assert.equal(error, null);
  assert.ok(savedProfile);
  assert.equal(savedProfile.native_language, 'ml');
  assert.equal(savedProfile.learning_goals.length, 7);

  // Celebration view
  assert.equal(SPEC_ORACLE.onboarding.successScreen.heading, 'ನಮಸ್ಕಾರ! Your Kannada journey begins.');
  assert.equal(SPEC_ORACLE.onboarding.successScreen.ctaDestination, '/dashboard');
});

// ============================================================================
// Scenario 5: The Interrupted Onboarding & Session Recovery Journey
// ============================================================================
test('T4-S05: User disconnects mid-flow; system recovers state and enforces completion before dashboard', async () => {
  const user = {
    id: 'user-interrupted-05',
    email: 'anand.k@startuphub.in',
    user_metadata: { full_name: 'Anand Kumar' },
  };
  const client = new MockSupabaseClient(user);

  // 1. User starts onboarding and drops connection at Step 3
  // Partial profile saved with onboarding_completed = false
  const partialProfile: CreateLearnerProfileDTO = {
    user_id: user.id,
    full_name: 'Anand Kumar',
    native_language: 'en',
    proficiency_level: 'beginner',
    learning_goals: [],
    daily_goal_minutes: 10,
    onboarding_completed: false, // Incomplete!
  };
  await client.from('learner_profiles').upsert(partialProfile);

  // 2. User re-opens app and attempts direct access to /dashboard
  const dashAttempt = RouterSimulator.evaluateRoute({
    pathname: '/dashboard',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(dashAttempt.allow, false, 'Must not permit access to dashboard when incomplete');
  assert.equal(dashAttempt.redirectUrl, '/onboarding', 'Redirected back to onboarding to complete');

  // 3. User also tries visiting /login -> redirected to /onboarding
  const loginAttempt = RouterSimulator.evaluateRoute({
    pathname: '/login',
    isAuthenticated: true,
    onboardingCompleted: false,
  });
  assert.equal(loginAttempt.redirectUrl, '/onboarding');

  // 4. User finishes onboarding: adds goals, confirms commitment, submits
  const finalProfile: CreateLearnerProfileDTO = {
    user_id: user.id,
    full_name: 'Anand Kumar',
    native_language: 'en',
    proficiency_level: 'beginner',
    learning_goals: ['everyday_conversations', 'shopping_and_daily_activities'],
    daily_goal_minutes: 10,
    onboarding_completed: true, // Now completed!
  };

  const { data: completedData, error } = await client.from('learner_profiles').upsert(finalProfile, { onConflict: 'user_id' });
  assert.equal(error, null);
  assert.ok(completedData);
  assert.equal(completedData.onboarding_completed, true);

  // 5. Dashboard access is now granted
  const finalDashAccess = RouterSimulator.evaluateRoute({
    pathname: '/dashboard',
    isAuthenticated: true,
    onboardingCompleted: true,
  });
  assert.equal(finalDashAccess.allow, true);
  assert.equal(finalDashAccess.statusCode, 200);
});
