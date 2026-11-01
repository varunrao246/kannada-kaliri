/**
 * Empirical Adversarial Test Harness: Milestone M02
 * Target: Onboarding Wizard UI & Learner Profile Persistence Engine
 *
 * Verifies:
 * 1. Step transition integrity: Forward and backward navigation retains selected values across all steps.
 * 2. Validation boundaries: Advancing prevented on Step 2 (language), Step 3 (level), Step 4 (goals >= 1).
 * 3. Submission & persistence payload: Step 5 constructs valid CreateLearnerProfileDTO with onboarding_completed = true.
 * 4. User metadata resolution, error recovery, and React component contract rendering.
 */

import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  resolveDisplayName,
  resolveAvatarUrl,
  type WizardFormData,
} from '@/components/onboarding/OnboardingWizard';
import { StepNativeLanguage } from '@/components/onboarding/StepNativeLanguage';
import { StepKannadaLevel } from '@/components/onboarding/StepKannadaLevel';
import {
  StepLearningGoals,
  LEARNING_GOAL_OPTIONS,
} from '@/components/onboarding/StepLearningGoals';
import { StepCommitmentSummary } from '@/components/onboarding/StepCommitmentSummary';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { OnboardingSuccess } from '@/components/onboarding/OnboardingSuccess';
import StepIndicator from '@/components/onboarding/StepIndicator';
import {
  createLearnerProfile,
  isOnboardingCompleted,
  type ProfileSupabaseClient,
} from '@/lib/services/profile';
import {
  type CreateLearnerProfileDTO,
  type LearnerProfile,
  type NativeLanguage,
  type ProficiencyLevel,
  type DailyGoalMinutes,
} from '@/types/profile';
import type { Database } from '@/types/database';

// ============================================================================
// State Machine Simulator for OnboardingWizard
// Replicates the state transitions, validation checks, and event handlers
// of components/onboarding/OnboardingWizard.tsx
// ============================================================================

export class WizardStateMachineSimulator {
  step: number = 1;
  direction: number = 0;
  isSubmitting: boolean = false;
  isCompleted: boolean = false;
  error: string | null = null;
  routerRefreshed: boolean = false;
  navigatedToDashboard: boolean = false;

  formData: WizardFormData = {
    native_language: null,
    proficiency_level: null,
    learning_goals: [],
    daily_goal_minutes: 10,
  };

  user: SupabaseUser;
  client: ProfileSupabaseClient;

  constructor(user: SupabaseUser, client: ProfileSupabaseClient) {
    this.user = user;
    this.client = client;
  }

  get displayName(): string {
    return resolveDisplayName(
      this.user.user_metadata as { full_name?: string | null; name?: string | null } | undefined,
      this.user.email
    );
  }

  get avatarUrl(): string | null {
    return resolveAvatarUrl(
      this.user.user_metadata as { avatar_url?: string | null; picture?: string | null } | undefined
    );
  }

  canAdvance(): boolean {
    switch (this.step) {
      case 1:
        return true;
      case 2:
        return this.formData.native_language !== null;
      case 3:
        return this.formData.proficiency_level !== null;
      case 4:
        return this.formData.learning_goals.length >= 1;
      case 5:
        return this.formData.daily_goal_minutes !== null;
      default:
        return false;
    }
  }

  handleStart(): void {
    this.direction = 1;
    this.step = 2;
  }

  handleNext(): boolean {
    if (!this.canAdvance()) return false;
    this.error = null;
    if (this.step < 5) {
      this.direction = 1;
      this.step += 1;
      return true;
    }
    return false;
  }

  handleBack(): boolean {
    if (this.step > 1 && !this.isSubmitting) {
      this.error = null;
      this.direction = -1;
      this.step -= 1;
      return true;
    }
    return false;
  }

  handleEditStep(targetStep: number): boolean {
    if (targetStep >= 1 && targetStep <= 5 && !this.isSubmitting) {
      this.error = null;
      this.direction = targetStep < this.step ? -1 : 1;
      this.step = targetStep;
      return true;
    }
    return false;
  }

  setNativeLanguage(code: NativeLanguage): void {
    this.formData.native_language = code;
  }

  setProficiencyLevel(level: ProficiencyLevel): void {
    this.formData.proficiency_level = level;
  }

  toggleLearningGoal(goalCode: string): void {
    const exists = this.formData.learning_goals.includes(goalCode);
    if (exists) {
      this.formData.learning_goals = this.formData.learning_goals.filter((g) => g !== goalCode);
    } else {
      this.formData.learning_goals = [...new Set([...this.formData.learning_goals, goalCode])];
    }
  }

  setCommitment(minutes: DailyGoalMinutes): void {
    this.formData.daily_goal_minutes = minutes;
  }

  async handleSubmit(): Promise<LearnerProfile | null> {
    if (
      !this.formData.native_language ||
      !this.formData.proficiency_level ||
      this.formData.learning_goals.length === 0
    ) {
      this.error = 'Please complete all required selections before submitting.';
      return null;
    }

    this.isSubmitting = true;
    this.error = null;

    try {
      const payload: CreateLearnerProfileDTO = {
        user_id: this.user.id,
        full_name: this.displayName,
        avatar_url: this.avatarUrl,
        native_language: this.formData.native_language,
        target_language: 'kn',
        proficiency_level: this.formData.proficiency_level,
        learning_goals: this.formData.learning_goals,
        daily_goal_minutes: this.formData.daily_goal_minutes,
        onboarding_completed: true,
      };

      const result = await createLearnerProfile(payload, this.client);
      this.routerRefreshed = true;
      this.isCompleted = true;
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save your profile. Please try again.';
      this.error = message;
      return null;
    } finally {
      this.isSubmitting = false;
    }
  }
}

// ============================================================================
// High-Fidelity Mock Supabase Database Implementation
// ============================================================================

function createMockSupabaseClient(sessionUser: SupabaseUser | null = null): {
  client: ProfileSupabaseClient;
  table: Map<string, LearnerProfile>;
  setSimulateFailure: (fail: boolean) => void;
} {
  const table = new Map<string, LearnerProfile>();
  let simulateFailure = false;

  const mock = {
    auth: {
      async getUser() {
        if (simulateFailure) {
          return { data: { user: null }, error: { message: 'Database disconnected', code: '500' } };
        }
        return { data: { user: sessionUser }, error: null };
      },
    },
    from(tableName: string) {
      if (tableName !== 'learner_profiles') {
        throw new Error(`Table ${tableName} not mocked`);
      }
      return {
        select(columns = '*') {
          let filterUserId: string | null = null;
          const query = {
            eq(col: string, val: unknown) {
              if (col === 'user_id') filterUserId = String(val);
              return query;
            },
            async maybeSingle() {
              if (simulateFailure) {
                return { data: null, error: { message: 'Connection error', code: 'PGRST500' } };
              }
              if (!filterUserId) return { data: null, error: null };
              const row = table.get(filterUserId);
              if (!row) return { data: null, error: null };
              if (columns === 'onboarding_completed') {
                return { data: { onboarding_completed: row.onboarding_completed }, error: null };
              }
              return { data: { ...row }, error: null };
            },
            async single() {
              const res = await query.maybeSingle();
              if (!res.data) {
                return { data: null, error: { message: 'No row found', code: 'PGRST116' } };
              }
              return res;
            },
          };
          return query;
        },
        upsert(
          data: Database['public']['Tables']['learner_profiles']['Insert']
        ) {
          return {
            select() {
              return {
                async single() {
                  if (simulateFailure) {
                    return { data: null, error: { message: 'Simulated persistence failure', code: '500' } };
                  }
                  const now = new Date().toISOString();
                  const existing = table.get(data.user_id);
                  const saved: LearnerProfile = {
                    id: existing ? existing.id : `lp-${Math.random().toString(36).slice(2, 9)}`,
                    user_id: data.user_id,
                    full_name: data.full_name ?? null,
                    avatar_url: data.avatar_url ?? null,
                    native_language: data.native_language as NativeLanguage,
                    target_language: 'kn',
                    proficiency_level: data.proficiency_level as ProficiencyLevel,
                    learning_goals: data.learning_goals ?? [],
                    daily_goal_minutes: (data.daily_goal_minutes ?? 10) as DailyGoalMinutes,
                    onboarding_completed: Boolean(data.onboarding_completed),
                    created_at: existing ? existing.created_at : now,
                    updated_at: now,
                  };
                  table.set(data.user_id, saved);
                  return { data: saved, error: null };
                },
              };
            },
          };
        },
      };
    },
  };

  return {
    client: mock as unknown as ProfileSupabaseClient,
    table,
    setSimulateFailure: (fail: boolean) => {
      simulateFailure = fail;
    },
  };
}

// Helper mock user
function makeMockUser(overrides: Partial<SupabaseUser> = {}): SupabaseUser {
  return {
    id: 'user-emp-001',
    app_metadata: {},
    user_metadata: {
      full_name: 'Dr. Rajkumar',
      picture: 'https://example.com/rajkumar.jpg',
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'rajkumar@kannada.org',
    ...overrides,
  } as SupabaseUser;
}

// ============================================================================
// Empirical Test Runner
// ============================================================================

interface TestRecord {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

async function runTestSuite() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   EMPIRICAL CHALLENGE SUITE: MILESTONE M02 ONBOARDING WIZARD              ║');
  console.log('║   Step Transitions, Validation Boundaries, Persistence Payload & SSR      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  const tests: TestRecord[] = [];

  async function execute(id: string, name: string, fn: () => Promise<void> | void) {
    const start = Date.now();
    process.stdout.write(`  [TEST] ${id}: ${name} ... `);
    try {
      await fn();
      const durationMs = Date.now() - start;
      console.log(`✓ PASS (${durationMs}ms)`);
      tests.push({ id, name, passed: true, durationMs });
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const message = err instanceof Error ? err.stack || err.message : String(err);
      console.log(`✗ FAIL (${durationMs}ms)`);
      console.error(`      Error: ${message}`);
      tests.push({ id, name, passed: false, error: message, durationMs });
    }
  }

  // ==========================================================================
  // SECTION 1: Step Transition Integrity & Value Retention Across Steps
  // ==========================================================================
  console.log('--- SECTION 1: Step Transition Integrity & Value Retention ---');

  await execute(
    'CHAL-01-01',
    'Forward progression step 1 -> step 5 requires selections and preserves values sequentially',
    () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      assert.equal(wizard.step, 1);
      wizard.handleStart();
      assert.equal(wizard.step, 2, 'handleStart advances from step 1 to step 2');

      // Step 2: Language
      wizard.setNativeLanguage('te');
      assert.equal(wizard.handleNext(), true, 'Advancing to step 3 after language selection');
      assert.equal(wizard.step, 3);

      // Step 3: Kannada Level
      wizard.setProficiencyLevel('elementary');
      assert.equal(wizard.handleNext(), true, 'Advancing to step 4 after level selection');
      assert.equal(wizard.step, 4);

      // Step 4: Learning Goals
      wizard.toggleLearningGoal('workplace_communication');
      wizard.toggleLearningGoal('college_and_education');
      assert.equal(wizard.handleNext(), true, 'Advancing to step 5 after goals selection');
      assert.equal(wizard.step, 5);

      // Step 5: Daily Commitment defaults to 10
      assert.equal(wizard.formData.daily_goal_minutes, 10);
      wizard.setCommitment(20);
      assert.equal(wizard.formData.daily_goal_minutes, 20);

      // Verify all collected data is preserved intact
      assert.equal(wizard.formData.native_language, 'te');
      assert.equal(wizard.formData.proficiency_level, 'elementary');
      assert.deepEqual(wizard.formData.learning_goals, [
        'workplace_communication',
        'college_and_education',
      ]);
      assert.equal(wizard.formData.daily_goal_minutes, 20);
    }
  );

  await execute(
    'CHAL-01-02',
    'Backward navigation (5 -> 4 -> 3 -> 2 -> 1) retains all previously selected values',
    () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      // Populate full form and advance to step 5
      wizard.handleStart();
      wizard.setNativeLanguage('ta');
      wizard.handleNext();
      wizard.setProficiencyLevel('intermediate');
      wizard.handleNext();
      wizard.toggleLearningGoal('travel_and_exploring_karnataka');
      wizard.handleNext();
      wizard.setCommitment(15);
      assert.equal(wizard.step, 5);

      // Navigate backwards: 5 -> 4
      assert.equal(wizard.handleBack(), true);
      assert.equal(wizard.step, 4);
      assert.deepEqual(wizard.formData.learning_goals, ['travel_and_exploring_karnataka']);
      assert.equal(wizard.direction, -1, 'Back navigation sets direction to -1');

      // Navigate backwards: 4 -> 3
      assert.equal(wizard.handleBack(), true);
      assert.equal(wizard.step, 3);
      assert.equal(wizard.formData.proficiency_level, 'intermediate');

      // Navigate backwards: 3 -> 2
      assert.equal(wizard.handleBack(), true);
      assert.equal(wizard.step, 2);
      assert.equal(wizard.formData.native_language, 'ta');

      // Navigate backwards: 2 -> 1
      assert.equal(wizard.handleBack(), true);
      assert.equal(wizard.step, 1);

      // Cannot navigate back past step 1
      assert.equal(wizard.handleBack(), false);
      assert.equal(wizard.step, 1);

      // Navigate forward again: all state is still fully intact!
      wizard.handleStart();
      assert.equal(wizard.step, 2);
      assert.equal(wizard.formData.native_language, 'ta');
      wizard.handleNext();
      assert.equal(wizard.step, 3);
      assert.equal(wizard.formData.proficiency_level, 'intermediate');
      wizard.handleNext();
      assert.equal(wizard.step, 4);
      assert.deepEqual(wizard.formData.learning_goals, ['travel_and_exploring_karnataka']);
      wizard.handleNext();
      assert.equal(wizard.step, 5);
      assert.equal(wizard.formData.daily_goal_minutes, 15);
    }
  );

  await execute(
    'CHAL-01-03',
    'Direct step jump via handleEditStep preserves non-edited values across all steps',
    () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      // Initial choices: Hindi, Beginner, Shopping, 10 min
      wizard.handleStart();
      wizard.setNativeLanguage('hi');
      wizard.handleNext();
      wizard.setProficiencyLevel('beginner');
      wizard.handleNext();
      wizard.toggleLearningGoal('shopping_and_daily_activities');
      wizard.handleNext();
      assert.equal(wizard.step, 5);

      // Scenario A: Jump from Step 5 to Step 2, edit language to Malayalam
      assert.equal(wizard.handleEditStep(2), true);
      assert.equal(wizard.step, 2);
      assert.equal(wizard.direction, -1);
      wizard.setNativeLanguage('ml');

      // Jump back to Step 5: Malayalam updated, others preserved
      assert.equal(wizard.handleEditStep(5), true);
      assert.equal(wizard.step, 5);
      assert.equal(wizard.formData.native_language, 'ml');
      assert.equal(wizard.formData.proficiency_level, 'beginner');
      assert.deepEqual(wizard.formData.learning_goals, ['shopping_and_daily_activities']);
      assert.equal(wizard.formData.daily_goal_minutes, 10);

      // Scenario B: Jump from Step 5 to Step 3, edit level to Intermediate
      assert.equal(wizard.handleEditStep(3), true);
      assert.equal(wizard.step, 3);
      wizard.setProficiencyLevel('intermediate');

      // Return to Step 5
      assert.equal(wizard.handleEditStep(5), true);
      assert.equal(wizard.formData.proficiency_level, 'intermediate');
      assert.equal(wizard.formData.native_language, 'ml');

      // Scenario C: Jump from Step 5 to Step 4, add second goal
      assert.equal(wizard.handleEditStep(4), true);
      assert.equal(wizard.step, 4);
      wizard.toggleLearningGoal('understanding_kannada_culture');

      // Return to Step 5
      assert.equal(wizard.handleEditStep(5), true);
      assert.deepEqual(wizard.formData.learning_goals, [
        'shopping_and_daily_activities',
        'understanding_kannada_culture',
      ]);
      assert.equal(wizard.formData.native_language, 'ml');
      assert.equal(wizard.formData.proficiency_level, 'intermediate');
    }
  );

  await execute(
    'CHAL-01-04',
    'Rapid selection switching enforces single-select replace semantics without accumulating array',
    () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      // Step 2 rapid switching: en -> hi -> ta -> te -> ml -> en
      wizard.handleStart();
      const sequence: NativeLanguage[] = ['en', 'hi', 'ta', 'te', 'ml', 'en'];
      for (const lang of sequence) {
        wizard.setNativeLanguage(lang);
        assert.equal(typeof wizard.formData.native_language, 'string');
        assert.equal(wizard.formData.native_language, lang);
      }
      assert.equal(wizard.formData.native_language, 'en');

      // Step 3 rapid switching: beginner -> intermediate -> elementary -> beginner
      wizard.handleNext();
      const levelSequence: ProficiencyLevel[] = ['beginner', 'intermediate', 'elementary', 'beginner'];
      for (const lvl of levelSequence) {
        wizard.setProficiencyLevel(lvl);
        assert.equal(typeof wizard.formData.proficiency_level, 'string');
        assert.equal(wizard.formData.proficiency_level, lvl);
      }
      assert.equal(wizard.formData.proficiency_level, 'beginner');
    }
  );

  await execute(
    'CHAL-01-05',
    'Goal toggle idempotency and Set deduplication prevents duplicate elements',
    () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      // Step 4 goal toggling
      wizard.toggleLearningGoal('everyday_conversations');
      assert.deepEqual(wizard.formData.learning_goals, ['everyday_conversations']);

      // Toggle again -> removed
      wizard.toggleLearningGoal('everyday_conversations');
      assert.deepEqual(wizard.formData.learning_goals, []);

      // Toggle back on
      wizard.toggleLearningGoal('everyday_conversations');
      assert.deepEqual(wizard.formData.learning_goals, ['everyday_conversations']);

      // Toggle another goal
      wizard.toggleLearningGoal('college_and_education');
      assert.deepEqual(wizard.formData.learning_goals, [
        'everyday_conversations',
        'college_and_education',
      ]);

      // Verify no duplicates can exist
      const uniqueCount = new Set(wizard.formData.learning_goals).size;
      assert.equal(uniqueCount, wizard.formData.learning_goals.length);
    }
  );

  // ==========================================================================
  // SECTION 2: Validation Boundaries
  // ==========================================================================
  console.log('\n--- SECTION 2: Validation Boundaries ---');

  await execute(
    'CHAL-02-01',
    'Step 2 validation boundary: cannot advance without selecting native_language',
    () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      wizard.handleStart();
      assert.equal(wizard.step, 2);
      assert.equal(wizard.formData.native_language, null);
      assert.equal(wizard.canAdvance(), false, 'canAdvance is false when language is null');

      // Attempt to advance without selection
      const advanced = wizard.handleNext();
      assert.equal(advanced, false, 'handleNext() must return false and reject transition');
      assert.equal(wizard.step, 2, 'User must remain at Step 2');

      // Select language -> permitted
      wizard.setNativeLanguage('en');
      assert.equal(wizard.canAdvance(), true, 'canAdvance becomes true upon valid selection');
      assert.equal(wizard.handleNext(), true, 'handleNext() allows advance to Step 3');
      assert.equal(wizard.step, 3);
    }
  );

  await execute(
    'CHAL-02-02',
    'Step 2 UI component renders Continue button as disabled when selected is null',
    () => {
      // Test StepNativeLanguage disabled attribute on HTML
      const htmlDisabled = renderToStaticMarkup(
        React.createElement(StepNativeLanguage, {
          selected: null,
          canContinue: false,
        })
      );
      assert.match(
        htmlDisabled,
        /disabled=""/,
        'Continue button must have disabled attribute when unselected'
      );
      assert.match(
        htmlDisabled,
        /cursor-not-allowed/,
        'Continue button must have cursor-not-allowed CSS class'
      );

      // When selected is provided
      const htmlEnabled = renderToStaticMarkup(
        React.createElement(StepNativeLanguage, {
          selected: 'hi',
          canContinue: true,
        })
      );
      assert.doesNotMatch(
        htmlEnabled,
        /disabled=""/,
        'Continue button must not have disabled attribute when language is selected'
      );
      assert.match(
        htmlEnabled,
        /aria-checked="true"/,
        'Selected card must have aria-checked="true"'
      );
    }
  );

  await execute(
    'CHAL-02-03',
    'Step 3 validation boundary: cannot advance without selecting proficiency_level',
    () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      wizard.handleStart();
      wizard.setNativeLanguage('ml');
      wizard.handleNext();
      assert.equal(wizard.step, 3);

      assert.equal(wizard.formData.proficiency_level, null);
      assert.equal(wizard.canAdvance(), false, 'canAdvance is false when level is null');

      // Attempt to advance
      const advanced = wizard.handleNext();
      assert.equal(advanced, false, 'handleNext() rejected when level is null');
      assert.equal(wizard.step, 3, 'User remains at Step 3');

      // Select level
      wizard.setProficiencyLevel('beginner');
      assert.equal(wizard.canAdvance(), true);
      assert.equal(wizard.handleNext(), true);
      assert.equal(wizard.step, 4);
    }
  );

  await execute(
    'CHAL-02-04',
    'Step 3 UI component renders Continue button as disabled when selected is null',
    () => {
      const htmlDisabled = renderToStaticMarkup(
        React.createElement(StepKannadaLevel, {
          selected: null,
          canContinue: false,
        })
      );
      assert.match(htmlDisabled, /disabled=""/);

      const htmlEnabled = renderToStaticMarkup(
        React.createElement(StepKannadaLevel, {
          selected: 'intermediate',
          canContinue: true,
        })
      );
      assert.doesNotMatch(htmlEnabled, /disabled=""/);
      assert.match(htmlEnabled, /aria-checked="true"/);
    }
  );

  await execute(
    'CHAL-02-05',
    'Step 4 validation boundary: cannot advance without selecting at least 1 goal',
    () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      wizard.handleStart();
      wizard.setNativeLanguage('te');
      wizard.handleNext();
      wizard.setProficiencyLevel('elementary');
      wizard.handleNext();
      assert.equal(wizard.step, 4);

      // Boundary: 0 goals
      assert.equal(wizard.formData.learning_goals.length, 0);
      assert.equal(wizard.canAdvance(), false);
      assert.equal(wizard.handleNext(), false);
      assert.equal(wizard.step, 4);

      // Boundary: select 1 goal -> allowed
      wizard.toggleLearningGoal('everyday_conversations');
      assert.equal(wizard.formData.learning_goals.length, 1);
      assert.equal(wizard.canAdvance(), true);

      // Boundary: deselect that 1 goal -> forbidden again
      wizard.toggleLearningGoal('everyday_conversations');
      assert.equal(wizard.formData.learning_goals.length, 0);
      assert.equal(wizard.canAdvance(), false);
      assert.equal(wizard.handleNext(), false);
      assert.equal(wizard.step, 4);

      // Boundary: all 7 goals selected -> allowed
      for (const opt of LEARNING_GOAL_OPTIONS) {
        wizard.toggleLearningGoal(opt.code);
      }
      assert.equal(wizard.formData.learning_goals.length, 7);
      assert.equal(wizard.canAdvance(), true);
      assert.equal(wizard.handleNext(), true);
      assert.equal(wizard.step, 5);
    }
  );

  await execute(
    'CHAL-02-06',
    'Step 4 UI component renders Continue button as disabled when selectedGoals is empty',
    () => {
      const htmlDisabled = renderToStaticMarkup(
        React.createElement(StepLearningGoals, {
          selectedGoals: [],
          canContinue: false,
        })
      );
      assert.match(htmlDisabled, /disabled=""/);
      assert.match(htmlDisabled, /0 of 7 goals selected/);

      const htmlEnabled = renderToStaticMarkup(
        React.createElement(StepLearningGoals, {
          selectedGoals: ['everyday_conversations', 'shopping_and_daily_activities'],
          canContinue: true,
        })
      );
      assert.doesNotMatch(htmlEnabled, /disabled=""/);
      assert.match(htmlEnabled, /2 of 7 goals selected/);
    }
  );

  await execute(
    'CHAL-02-07',
    'Premature submission guard in Step 5 aborts if mandatory fields are missing',
    async () => {
      const { client } = createMockSupabaseClient(makeMockUser());
      const wizard = new WizardStateMachineSimulator(makeMockUser(), client);

      // Force state to step 5 without valid language
      wizard.step = 5;
      wizard.formData.native_language = null;
      wizard.formData.proficiency_level = 'beginner';
      wizard.formData.learning_goals = ['everyday_conversations'];

      const res = await wizard.handleSubmit();
      assert.equal(res, null, 'Submission must return null when incomplete');
      assert.match(
        wizard.error || '',
        /Please complete all required selections/,
        'Error banner message must be set'
      );
      assert.equal(wizard.isCompleted, false);

      // Missing level
      wizard.formData.native_language = 'en';
      wizard.formData.proficiency_level = null;
      const res2 = await wizard.handleSubmit();
      assert.equal(res2, null);
      assert.match(wizard.error || '', /Please complete all required selections/);

      // Empty goals
      wizard.formData.proficiency_level = 'beginner';
      wizard.formData.learning_goals = [];
      const res3 = await wizard.handleSubmit();
      assert.equal(res3, null);
      assert.match(wizard.error || '', /Please complete all required selections/);
    }
  );

  // ==========================================================================
  // SECTION 3: Submission & Persistence Payload Integrity
  // ==========================================================================
  console.log('\n--- SECTION 3: Submission & Persistence Payload Integrity ---');

  await execute(
    'CHAL-03-01',
    'Step 5 submission constructs valid CreateLearnerProfileDTO with onboarding_completed: true',
    async () => {
      const user = makeMockUser({
        id: 'user-emp-555',
        user_metadata: { full_name: 'Dr. Puneeth Rajkumar' },
      });
      const { client, table } = createMockSupabaseClient(user);
      const wizard = new WizardStateMachineSimulator(user, client);

      wizard.handleStart();
      wizard.setNativeLanguage('en');
      wizard.handleNext();
      wizard.setProficiencyLevel('intermediate');
      wizard.handleNext();
      wizard.toggleLearningGoal('everyday_conversations');
      wizard.toggleLearningGoal('understanding_kannada_culture');
      wizard.handleNext();
      wizard.setCommitment(15);
      assert.equal(wizard.step, 5);

      const saved = await wizard.handleSubmit();
      assert.ok(saved, 'handleSubmit returned saved profile');
      assert.equal(saved.user_id, 'user-emp-555');
      assert.equal(saved.full_name, 'Dr. Puneeth Rajkumar');
      assert.equal(saved.native_language, 'en');
      assert.equal(saved.target_language, 'kn');
      assert.equal(saved.proficiency_level, 'intermediate');
      assert.deepEqual(saved.learning_goals, [
        'everyday_conversations',
        'understanding_kannada_culture',
      ]);
      assert.equal(saved.daily_goal_minutes, 15);
      assert.equal(saved.onboarding_completed, true);
      assert.ok(saved.created_at);
      assert.ok(saved.updated_at);

      // Verify row persisted in database table
      const inDb = table.get('user-emp-555');
      assert.ok(inDb);
      assert.equal(inDb.onboarding_completed, true);
      assert.equal(wizard.isCompleted, true);
      assert.equal(wizard.routerRefreshed, true);
    }
  );

  await execute(
    'CHAL-03-02',
    'isOnboardingCompleted correctly reflects true after wizard submission',
    async () => {
      const user = makeMockUser({ id: 'user-status-01' });
      const { client } = createMockSupabaseClient(user);

      // Before submission
      const before = await isOnboardingCompleted(user.id, client);
      assert.equal(before, false, 'isOnboardingCompleted returns false before submission');

      // Submit profile
      const wizard = new WizardStateMachineSimulator(user, client);
      wizard.handleStart();
      wizard.setNativeLanguage('hi');
      wizard.handleNext();
      wizard.setProficiencyLevel('beginner');
      wizard.handleNext();
      wizard.toggleLearningGoal('shopping_and_daily_activities');
      wizard.handleNext();
      await wizard.handleSubmit();

      // After submission
      const after = await isOnboardingCompleted(user.id, client);
      assert.equal(after, true, 'isOnboardingCompleted returns true after submission');
    }
  );

  await execute(
    'CHAL-03-03',
    'Idempotent submission: re-submitting updates profile cleanly and preserves created_at and id',
    async () => {
      const user = makeMockUser({ id: 'user-idem-01' });
      const { client } = createMockSupabaseClient(user);
      const wizard = new WizardStateMachineSimulator(user, client);

      // 1st submission
      wizard.handleStart();
      wizard.setNativeLanguage('ta');
      wizard.handleNext();
      wizard.setProficiencyLevel('beginner');
      wizard.handleNext();
      wizard.toggleLearningGoal('everyday_conversations');
      wizard.handleNext();
      wizard.setCommitment(10);
      const firstSave = await wizard.handleSubmit();
      assert.ok(firstSave);

      // Simulate re-entering wizard to modify settings
      const wizard2 = new WizardStateMachineSimulator(user, client);
      wizard2.formData.native_language = 'te';
      wizard2.formData.proficiency_level = 'intermediate';
      wizard2.formData.learning_goals = ['workplace_communication'];
      wizard2.formData.daily_goal_minutes = 20;

      const secondSave = await wizard2.handleSubmit();
      assert.ok(secondSave);
      assert.equal(secondSave.id, firstSave.id, 'id must be preserved across updates');
      assert.equal(secondSave.user_id, firstSave.user_id, 'user_id preserved');
      assert.equal(secondSave.created_at, firstSave.created_at, 'created_at preserved');
      assert.equal(secondSave.native_language, 'te', 'native_language updated');
      assert.equal(secondSave.daily_goal_minutes, 20, 'daily_goal_minutes updated');
    }
  );

  await execute(
    'CHAL-03-04',
    'Display name resolution exhausts fallbacks: full_name -> name -> email prefix -> Learner',
    () => {
      // 1. full_name
      assert.equal(
        resolveDisplayName({ full_name: 'Chandrashekar Patil' }, 'patil@domain.in'),
        'Chandrashekar Patil'
      );
      // 2. Google OAuth name
      assert.equal(
        resolveDisplayName({ full_name: null, name: 'Ananya Rao' }, 'ananya@gmail.com'),
        'Ananya Rao'
      );
      // 3. Whitespace full_name with email fallback
      assert.equal(
        resolveDisplayName({ full_name: '   ', name: '' }, 'kavitha_b@example.org'),
        'kavitha_b'
      );
      // 4. Missing metadata and missing email -> 'Learner'
      assert.equal(resolveDisplayName({}, ''), 'Learner');
      // 5. Corrupt email format without @
      assert.equal(resolveDisplayName({}, 'no-at-sign-here'), 'Learner');
    }
  );

  await execute(
    'CHAL-03-05',
    'Avatar URL resolution checks avatar_url and Google OAuth picture fallback',
    () => {
      // avatar_url
      assert.equal(
        resolveAvatarUrl({ avatar_url: 'https://cdn.kaliri.org/avatar1.png' }),
        'https://cdn.kaliri.org/avatar1.png'
      );
      // Google picture fallback
      assert.equal(
        resolveAvatarUrl({ avatar_url: null, picture: 'https://lh3.google.com/pic.jpg' }),
        'https://lh3.google.com/pic.jpg'
      );
      // null fallback
      assert.equal(resolveAvatarUrl({}), null);
    }
  );

  await execute(
    'CHAL-03-06',
    'Submission error recovery: failure banner displayed, isSubmitting reset, retry supported',
    async () => {
      const user = makeMockUser();
      const { client, setSimulateFailure } = createMockSupabaseClient(user);
      const wizard = new WizardStateMachineSimulator(user, client);

      // Trigger failure in persistence layer
      setSimulateFailure(true);

      wizard.handleStart();
      wizard.setNativeLanguage('en');
      wizard.handleNext();
      wizard.setProficiencyLevel('beginner');
      wizard.handleNext();
      wizard.toggleLearningGoal('everyday_conversations');
      wizard.handleNext();

      const failedResult = await wizard.handleSubmit();
      assert.equal(failedResult, null);
      assert.equal(wizard.isSubmitting, false, 'isSubmitting reset to false on failure');
      assert.equal(wizard.isCompleted, false);
      assert.ok(wizard.error, 'Error message captured');
      assert.match(wizard.error, /Simulated persistence failure/);

      // Resolve failure and retry
      setSimulateFailure(false);
      const retryResult = await wizard.handleSubmit();
      assert.ok(retryResult, 'Retry succeeds');
      assert.equal(wizard.isCompleted, true);
      assert.equal(wizard.error, null);
    }
  );

  // ==========================================================================
  // SECTION 4: Component Rendering & UI Contract Verification
  // ==========================================================================
  console.log('\n--- SECTION 4: Component Rendering & UI Contract Verification ---');

  await execute(
    'CHAL-04-01',
    'StepWelcome renders verbatim Kannada greeting "ನಮಸ್ಕಾರ!", supporting copy, and CTA',
    () => {
      const html = renderToStaticMarkup(
        React.createElement(StepWelcome, {
          displayName: 'Ravi',
          avatarUrl: 'https://example.com/ravi.png',
        })
      );
      assert.match(html, /ನಮಸ್ಕಾರ!/, 'Must include verbatim Kannada greeting');
      assert.match(html, /Welcome, Ravi/, 'Must display welcome with user name');
      assert.match(
        html,
        /Let&#x27;s make Kannada a part of your everyday life/,
        'Must display verbatim supporting copy'
      );
      assert.match(html, /Let&#x27;s Begin/, 'CTA button must read "Let\'s Begin"');
    }
  );

  await execute(
    'CHAL-04-02',
    'StepNativeLanguage renders all 5 supported languages with native scripts',
    () => {
      const html = renderToStaticMarkup(
        React.createElement(StepNativeLanguage, {
          selected: 'hi',
          canContinue: true,
        })
      );
      assert.match(html, /English/);
      assert.match(html, /हिन्दी/);
      assert.match(html, /தமிழ்/);
      assert.match(html, /తెలుగు/);
      assert.match(html, /മലയാളം/);
      assert.match(html, /Step 2 of 5/);
    }
  );

  await execute(
    'CHAL-04-03',
    'StepKannadaLevel renders 3 proficiency tiers with Kannada titles and verbatim helper copy',
    () => {
      const html = renderToStaticMarkup(
        React.createElement(StepKannadaLevel, {
          selected: 'beginner',
          canContinue: true,
        })
      );
      assert.match(html, /Beginner/);
      assert.match(html, /ಪ್ರಾರಂಭಿಕ/);
      assert.match(html, /I am completely new to Kannada/);

      assert.match(html, /Elementary/);
      assert.match(html, /ಪ್ರಾಥಮಿಕ/);
      assert.match(html, /I know a few words and basic phrases/);

      assert.match(html, /Intermediate/);
      assert.match(html, /ಮಧ್ಯಂತರ/);
      assert.match(html, /I can understand some Kannada but struggle to speak confidently/);
    }
  );

  await execute(
    'CHAL-04-04',
    'StepLearningGoals renders all 7 domains with Kannada labels and selection counter',
    () => {
      const html = renderToStaticMarkup(
        React.createElement(StepLearningGoals, {
          selectedGoals: ['everyday_conversations', 'college_and_education'],
          canContinue: true,
        })
      );
      assert.match(html, /Everyday conversations/);
      assert.match(html, /ದಿನನಿತ್ಯದ ಸಂಭಾಷಣೆ/);
      assert.match(html, /College and education/);
      assert.match(html, /Workplace communication/);
      assert.match(html, /Shopping and daily activities/);
      assert.match(html, /Travel and exploring Karnataka/);
      assert.match(html, /Communicating with local communities/);
      assert.match(html, /Understanding Kannada culture/);
      assert.match(html, /2 of 7 goals selected/);
    }
  );

  await execute(
    'CHAL-04-05',
    'StepCommitmentSummary renders 4 intervals, review card, and verbatim submit CTA',
    () => {
      const html = renderToStaticMarkup(
        React.createElement(StepCommitmentSummary, {
          selectedCommitment: 10,
          onSelectCommitment: () => {},
          onEditStep: () => {},
          onSubmit: () => {},
          formData: {
            native_language: 'ta',
            proficiency_level: 'intermediate',
            learning_goals: ['workplace_communication'],
            daily_goal_minutes: 10,
          },
        })
      );
      assert.match(html, /5 min/);
      assert.match(html, /10 min/);
      assert.match(html, /15 min/);
      assert.match(html, /20 min/);
      assert.match(html, /Tamil \(தமிழ்\)/);
      assert.match(html, /Intermediate/);
      assert.match(html, /Workplace communication/);
      assert.match(html, /Create My Learning Journey/);
    }
  );

  await execute(
    'CHAL-04-06',
    'OnboardingSuccess renders verbatim Kannada celebration heading and dashboard CTA',
    () => {
      const mockRouter = {
        push: () => {},
        replace: () => {},
        refresh: () => {},
        back: () => {},
        forward: () => {},
        prefetch: () => {},
      };
      const html = renderToStaticMarkup(
        React.createElement(
          AppRouterContext.Provider,
          { value: mockRouter as unknown as AppRouterInstance },
          React.createElement(OnboardingSuccess, {
            userName: 'Anil',
            formData: {
              native_language: 'en',
              proficiency_level: 'beginner',
              learning_goals: ['everyday_conversations'],
              daily_goal_minutes: 10,
            },
          })
        )
      );
      assert.match(
        html,
        /ನಮಸ್ಕಾರ! Your Kannada journey begins\./,
        'Must display verbatim completion heading'
      );
      assert.match(html, /You are all set, Anil!/);
      assert.match(html, /Enter My Dashboard/);
    }
  );

  await execute(
    'CHAL-04-07',
    'StepIndicator renders progress percentage, step label, and accessible back control',
    () => {
      const html = renderToStaticMarkup(
        React.createElement(StepIndicator, {
          currentStep: 3,
          totalSteps: 5,
          onBack: () => {},
          canGoBack: true,
        })
      );
      assert.match(html, /Step 3 of 5/);
      assert.match(html, /aria-valuenow="60"/, '60% for Step 3 of 5');
      assert.match(html, /Go back to previous step/);
    }
  );

  // ==========================================================================
  // Summary & Empirical Assessment
  // ==========================================================================
  const total = tests.length;
  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.filter((t) => !t.passed).length;

  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log(`║   EMPIRICAL CHALLENGE SUITE SUMMARY: ${passed} / ${total} CHECKS PASSED                     ║`);
  if (failed === 0) {
    console.log('║   FINAL VERDICT: APPROVE                                                  ║');
  } else {
    console.log(`║   FINAL VERDICT: REQUEST_CHANGES (${failed} failures)                             ║`);
  }
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal challenge runner error:', err);
  process.exit(1);
});
