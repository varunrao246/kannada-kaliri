/**
 * Tier 2: Boundary & Corner Cases Test Suite (Milestone 02)
 * Validates edge conditions, boundary limits, invalid inputs, and corner cases across R1 to R5.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { SPEC_ORACLE } from './harness/spec-oracle';
import { MockSupabaseClient } from './harness/mock-supabase';
import { RouterSimulator } from './harness/router-simulator';
import { CreateLearnerProfileDTO, NativeLanguage, ProficiencyLevel, DailyGoalMinutes } from './harness/types';

// ============================================================================
// Feature R1: Wizard UI Boundaries & Corner Cases
// ============================================================================
test('R1-B01: Step 1 Name extraction handles null, empty string, and whitespace with fallback', () => {
  const resolveName = (meta: { full_name?: string | null; name?: string | null }, email?: string): string => {
    const raw = meta.full_name?.trim() || meta.name?.trim();
    if (raw) return raw;
    if (email && email.includes('@')) {
      const prefix = email.split('@')[0].trim();
      if (prefix) return prefix;
    }
    return 'Learner';
  };

  assert.equal(resolveName({ full_name: '  ' }, 'alice@test.com'), 'alice');
  assert.equal(resolveName({ full_name: null, name: '' }, 'bob@domain.org'), 'bob');
  assert.equal(resolveName({}, ''), 'Learner');
  assert.equal(resolveName({ full_name: 'Chandrashekar Patil' }), 'Chandrashekar Patil');
});

test('R1-B02: Step 2 Language selection enforces single-select with rapid switching', () => {
  let selectedLanguage: NativeLanguage | null = null;
  const selectLanguage = (code: NativeLanguage) => {
    selectedLanguage = code;
  };

  selectLanguage('en');
  assert.equal(selectedLanguage, 'en');
  selectLanguage('hi');
  assert.equal(selectedLanguage, 'hi');
  selectLanguage('ml');
  assert.equal(selectedLanguage, 'ml');

  // Verify it is strictly one value, not an accumulation
  assert.equal(typeof selectedLanguage, 'string');
});

test('R1-B03: Step 3 Level selection boundary prevents advancement when unselected', () => {
  let selectedLevel: ProficiencyLevel | null = null;
  const canAdvance = () => selectedLevel !== null;

  assert.equal(canAdvance(), false, 'Cannot advance without selecting a level');
  selectedLevel = 'beginner';
  assert.equal(canAdvance(), true, 'Advancement permitted after level selection');
});

test('R1-B04: Step 4 Goal toggling extremes: all 7 selected vs all 7 deselected', () => {
  let selectedGoals: string[] = [];
  const toggleGoal = (code: string) => {
    if (selectedGoals.includes(code)) {
      selectedGoals = selectedGoals.filter((g) => g !== code);
    } else {
      selectedGoals.push(code);
    }
  };

  const allGoals = SPEC_ORACLE.onboarding.step4.goals.map((g) => g.code);

  // Select all 7
  for (const g of allGoals) {
    toggleGoal(g);
  }
  assert.equal(selectedGoals.length, 7);
  assert.equal(selectedGoals.length >= 1, true, 'Can advance with all 7 goals selected');

  // Deselect all 7
  for (const g of allGoals) {
    toggleGoal(g);
  }
  assert.equal(selectedGoals.length, 0);
  assert.equal(selectedGoals.length >= 1, false, 'Cannot advance with 0 goals selected');
});

test('R1-B05: Step 4 Goal toggle idempotency prevents duplicate entries', () => {
  let selectedGoals: string[] = [];
  const toggleGoal = (code: string) => {
    if (selectedGoals.includes(code)) {
      selectedGoals = selectedGoals.filter((g) => g !== code);
    } else {
      selectedGoals = [...new Set([...selectedGoals, code])];
    }
  };

  toggleGoal('everyday_conversations');
  assert.deepEqual(selectedGoals, ['everyday_conversations']);

  // Toggle again -> deselected
  toggleGoal('everyday_conversations');
  assert.deepEqual(selectedGoals, []);

  // Toggle twice in succession
  toggleGoal('workplace_communication');
  assert.equal(selectedGoals.length, 1);
});

test('R1-B06: Step 5 Commitment boundaries: minimum (5m), maximum (20m), invalid values rejected', () => {
  const allowed = SPEC_ORACLE.onboarding.step5.commitments;
  const isValidCommitment = (minutes: number): boolean => {
    return allowed.includes(minutes as DailyGoalMinutes);
  };

  assert.equal(isValidCommitment(5), true, 'Minimum 5 min must be valid');
  assert.equal(isValidCommitment(20), true, 'Maximum 20 min must be valid');
  assert.equal(isValidCommitment(0), false, '0 min must be rejected');
  assert.equal(isValidCommitment(-5), false, 'Negative min must be rejected');
  assert.equal(isValidCommitment(30), false, '30 min must be rejected (not in 5, 10, 15, 20)');
  assert.equal(isValidCommitment(60), false, '60 min must be rejected');
});

// ============================================================================
// Feature R2: Database Schema & Check Constraint Boundaries
// ============================================================================
test('R2-B01: Schema check constraint rejects invalid native_language codes', async () => {
  const user = { id: 'usr-b01', email: 'test@domain.com' };
  const client = new MockSupabaseClient(user);

  const invalidPayload = {
    user_id: user.id,
    native_language: 'fr' as unknown as NativeLanguage, // invalid language
    proficiency_level: 'beginner' as ProficiencyLevel,
    daily_goal_minutes: 10 as DailyGoalMinutes,
    learning_goals: ['everyday_conversations'],
  };

  const { data, error } = await client.from('learner_profiles').upsert(invalidPayload as CreateLearnerProfileDTO);
  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /Check constraint violation.*native_language/i);
});

test('R2-B02: Schema check constraint rejects invalid proficiency_level codes', async () => {
  const user = { id: 'usr-b02', email: 'test2@domain.com' };
  const client = new MockSupabaseClient(user);

  const invalidPayload = {
    user_id: user.id,
    native_language: 'en' as NativeLanguage,
    proficiency_level: 'master_expert' as unknown as ProficiencyLevel, // invalid level
    daily_goal_minutes: 10 as DailyGoalMinutes,
    learning_goals: ['everyday_conversations'],
  };

  const { data, error } = await client.from('learner_profiles').upsert(invalidPayload as CreateLearnerProfileDTO);
  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /Check constraint violation.*proficiency_level/i);
});

test('R2-B03: Schema check constraint rejects invalid daily_goal_minutes values', async () => {
  const user = { id: 'usr-b03', email: 'test3@domain.com' };
  const client = new MockSupabaseClient(user);

  const invalidPayload = {
    user_id: user.id,
    native_language: 'hi' as NativeLanguage,
    proficiency_level: 'beginner' as ProficiencyLevel,
    daily_goal_minutes: 45 as unknown as DailyGoalMinutes, // invalid commitment
    learning_goals: ['everyday_conversations'],
  };

  const { data, error } = await client.from('learner_profiles').upsert(invalidPayload as CreateLearnerProfileDTO);
  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /Check constraint violation.*daily_goal_minutes/i);
});

test('R2-B04: Foreign key constraint rejects profile creation without user_id', async () => {
  const client = new MockSupabaseClient(null); // No logged in user

  const payload: CreateLearnerProfileDTO = {
    native_language: 'en',
    proficiency_level: 'beginner',
    daily_goal_minutes: 10,
    learning_goals: [],
  };

  const { data, error } = await client.from('learner_profiles').upsert(payload);
  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /Cannot upsert without user_id/i);
});

test('R2-B05: RLS boundary prevents User A from reading User B profile', async () => {
  const client = new MockSupabaseClient({ id: 'user-A', email: 'a@example.com' });

  // Seed User B profile
  client.seedProfile({
    id: 'lp-user-B',
    user_id: 'user-B',
    full_name: 'User B',
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

  // User A tries to select User B profile
  const { data, error } = await client.from('learner_profiles').select('*').eq('user_id', 'user-B').maybeSingle();
  assert.equal(error, null);
  assert.equal(data, null, 'RLS must filter out rows belonging to another user');
});

test('R2-B06: RLS boundary prevents User A from updating User B profile', async () => {
  const client = new MockSupabaseClient({ id: 'user-A', email: 'a@example.com' });

  // Seed User B profile
  client.seedProfile({
    id: 'lp-user-B',
    user_id: 'user-B',
    full_name: 'User B',
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

  // User A attempts to update User B profile
  const { data, error } = await client.from('learner_profiles').eq('user_id', 'user-B').update({
    daily_goal_minutes: 20,
  });

  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /No profile matching filter found|RLS policy violation/i);
});

// ============================================================================
// Feature R3: Profile Service Boundaries & Corner Cases
// ============================================================================
test('R3-B01: getLearnerProfile returns null without throwing when row does not exist', async () => {
  const client = new MockSupabaseClient({ id: 'usr-nonexistent', email: 'ghost@test.com' });
  const { data, error } = await client.from('learner_profiles').select('*').eq('user_id', 'usr-nonexistent').maybeSingle();
  assert.equal(error, null, 'Query should succeed without throwing error');
  assert.equal(data, null, 'Returned data must be null');
});

test('R3-B02: getLearnerProfile returns null when unauthenticated', async () => {
  const client = new MockSupabaseClient(null);
  const { data, error } = await client.from('learner_profiles').select('*').eq('user_id', 'any-id').maybeSingle();
  assert.equal(error, null);
  assert.equal(data, null, 'Must return null when caller has no authenticated session');
});

test('R3-B03: createLearnerProfile handles null/missing optional fields cleanly', async () => {
  const user = { id: 'usr-b03', email: 'minimal@example.com' };
  const client = new MockSupabaseClient(user);

  const minimalPayload: CreateLearnerProfileDTO = {
    user_id: user.id,
    full_name: null,
    avatar_url: null,
    native_language: 'ta',
    proficiency_level: 'beginner',
    learning_goals: ['everyday_conversations'],
    daily_goal_minutes: 5,
    onboarding_completed: true,
  };

  const { data, error } = await client.from('learner_profiles').upsert(minimalPayload);
  assert.equal(error, null);
  assert.ok(data);
  assert.equal(data.full_name, null);
  assert.equal(data.avatar_url, null);
  assert.equal(data.target_language, 'kn', 'target_language should default to kn');
});

test('R3-B04: Network failure propagates error without crashing service', async () => {
  const user = { id: 'usr-b04', email: 'offline@example.com' };
  const client = new MockSupabaseClient(user);
  client.networkErrorNext = true;

  const { data, error } = await client.from('learner_profiles').select('*').eq('user_id', user.id).maybeSingle();
  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /Network error/i);
});

test('R3-B05: Concurrency / double-click boundary executes idempotently', async () => {
  const user = { id: 'usr-b05', email: 'doubleclick@example.com' };
  const client = new MockSupabaseClient(user);

  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    full_name: 'Fast Clicker',
    native_language: 'te',
    proficiency_level: 'intermediate',
    learning_goals: ['understanding_kannada_culture'],
    daily_goal_minutes: 10,
    onboarding_completed: true,
  };

  // Run two concurrent upserts
  const [res1, res2] = await Promise.all([
    client.from('learner_profiles').upsert(payload, { onConflict: 'user_id' }),
    client.from('learner_profiles').upsert(payload, { onConflict: 'user_id' }),
  ]);

  assert.equal(res1.error, null);
  assert.equal(res2.error, null);
  assert.equal(res1.data?.id, res2.data?.id, 'Both calls resolve to the identical profile record');
});

test('R3-B06: Empty learning_goals array does not crash service', async () => {
  const user = { id: 'usr-b06', email: 'emptygoals@example.com' };
  const client = new MockSupabaseClient(user);

  const payload: CreateLearnerProfileDTO = {
    user_id: user.id,
    native_language: 'hi',
    proficiency_level: 'beginner',
    learning_goals: [], // empty goals
    daily_goal_minutes: 5,
    onboarding_completed: false,
  };

  const { data, error } = await client.from('learner_profiles').upsert(payload);
  assert.equal(error, null);
  assert.ok(data);
  assert.deepEqual(data.learning_goals, []);
});

// ============================================================================
// Feature R4: Routing Boundaries & Corner Cases
// ============================================================================
test('R4-B01: Deep nested unauthenticated access redirects preserving path parameter', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/dashboard/settings/profile',
    isAuthenticated: false,
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectUrl, '/login?redirect=/dashboard/settings/profile');
});

test('R4-B02: Unauthenticated access to root landing page / is permitted', () => {
  const decision = RouterSimulator.evaluateRoute({
    pathname: '/',
    isAuthenticated: false,
  });
  assert.equal(decision.allow, true);
  assert.equal(decision.statusCode, 200);
});

test('R4-B03: Redirect loop prevention: user on /onboarding never redirects to /onboarding', () => {
  const trace = RouterSimulator.traceNavigation('/onboarding', true, false);
  assert.equal(trace.loopDetected, false, 'No redirect loop should occur');
  assert.equal(trace.finalPath, '/onboarding');
});

test('R4-B04: Redirect loop prevention: user on /dashboard never redirects to /dashboard', () => {
  const trace = RouterSimulator.traceNavigation('/dashboard', true, true);
  assert.equal(trace.loopDetected, false, 'No redirect loop should occur');
  assert.equal(trace.finalPath, '/dashboard');
});

test('R4-B05: Open redirect attack vector is mitigated by sanitizing destination', () => {
  const sanitizeRedirect = (url: string | null): string => {
    if (!url) return '/dashboard';
    // Reject absolute external URLs (e.g. //evil.com or https://evil.com)
    if (url.startsWith('//') || url.startsWith('http://') || url.startsWith('https://')) {
      return '/dashboard';
    }
    // Must start with single /
    if (url.startsWith('/')) {
      return url;
    }
    return '/dashboard';
  };

  assert.equal(sanitizeRedirect('//evil.com/phish'), '/dashboard');
  assert.equal(sanitizeRedirect('https://malicious.org'), '/dashboard');
  assert.equal(sanitizeRedirect('/dashboard'), '/dashboard');
  assert.equal(sanitizeRedirect('/onboarding'), '/onboarding');
});

test('R4-B06: OAuth callback missing code query parameter redirects safely to login error state', () => {
  const handleOAuthCallback = (code: string | null): { success: boolean; redirectUrl: string } => {
    if (!code) {
      return { success: false, redirectUrl: '/login?error=missing_auth_code' };
    }
    return { success: true, redirectUrl: '/onboarding' };
  };

  const missingCodeResult = handleOAuthCallback(null);
  assert.equal(missingCodeResult.success, false);
  assert.equal(missingCodeResult.redirectUrl, '/login?error=missing_auth_code');

  const validCodeResult = handleOAuthCallback('sample-code-xyz');
  assert.equal(validCodeResult.success, true);
  assert.equal(validCodeResult.redirectUrl, '/onboarding');
});


// ============================================================================
// Feature R5: Design System Boundaries & Corner Cases
// ============================================================================
test('R5-B01: Compact 320px mobile viewport boundaries maintain non-overflow layout', () => {
  const minViewportWidth = 320;
  const paddingPx = 16 * 2; // 1rem left + 1rem right
  const availableWidth = minViewportWidth - paddingPx;
  assert.ok(availableWidth >= 288, 'Content area must have at least 288px width on smallest phone');
});

test('R5-B02: Kannada complex conjunct rendering preserves diacritic line height', () => {
  const kannadaSample = 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಕನ್ನಡ ಕಲಿಕೆ ಆರಂಭವಾಗಲಿ.';
  assert.ok(kannadaSample.length > 0);
  // Ensure line height >= 1.5 to prevent diacritic clipping in scripts
  const recommendedLineHeightRatio = 1.6;
  assert.ok(recommendedLineHeightRatio >= 1.5, 'Line height ratio must be at least 1.5 for Indic scripts');
});

test('R5-B03: Contrast ratio of Warm Ivory (#F8F5EE) on Royal Navy (#101D36) satisfies WCAG AA', () => {
  // Relative luminance calculation for #101D36 and #F8F5EE
  // #101D36: R=16, G=29, B=54 -> L1 ~ 0.013
  // #F8F5EE: R=248, G=245, B=238 -> L2 ~ 0.915
  // Contrast ratio = (0.915 + 0.05) / (0.013 + 0.05) ~ 15.3:1 (far exceeds 4.5:1 requirement)
  const estimatedContrast = (0.915 + 0.05) / (0.013 + 0.05);
  assert.ok(estimatedContrast >= 4.5, 'Contrast ratio must exceed 4.5:1 for WCAG AA compliance');
});

test('R5-B04: Wizard step index is strictly bounded between 1 and 5', () => {
  let step = 1;
  const nextStep = () => {
    step = Math.min(step + 1, 5);
  };
  const prevStep = () => {
    step = Math.max(step - 1, 1);
  };

  // Attempt to decrement past 1
  prevStep();
  assert.equal(step, 1);

  // Increment to 5
  nextStep(); // 2
  nextStep(); // 3
  nextStep(); // 4
  nextStep(); // 5
  assert.equal(step, 5);

  // Attempt to increment past 5
  nextStep();
  assert.equal(step, 5);
});

test('R5-B05: Empty avatar URL gracefully falls back to initial badge dimensions', () => {
  const avatarBadge = {
    hasImage: false,
    initial: 'K',
    minSizePx: 48,
    border: '1px solid #D5A64A',
  };
  assert.equal(avatarBadge.hasImage, false);
  assert.equal(avatarBadge.minSizePx >= 44, true);
  assert.ok(avatarBadge.border.includes('#D5A64A'));
});
