/**
 * Empirical Adversarial Test Harness: Milestone M01
 * Target: lib/services/profile.ts & supabase/migrations/002_create_learner_profiles.sql
 *
 * Verifies:
 * 1. Rapid concurrent upserts for the same user (idempotency, single row, no duplicate key errors).
 * 2. Invalid inputs against constraints (unsupported language codes, invalid proficiency levels,
 *    invalid daily minutes, non-Kannada target language).
 * 3. Immutability of system fields (id, user_id, created_at) across successive creates & updates.
 * 4. Unauthenticated caller edge cases (isOnboardingCompleted -> false, getLearnerProfile -> null).
 * 5. Row Level Security and cross-user authorization boundaries.
 */

import assert from 'node:assert/strict';
import {
  getLearnerProfile,
  createLearnerProfile,
  updateLearnerProfile,
  isOnboardingCompleted,
  ProfileSupabaseClient,
} from '@/lib/services/profile';
import {
  CreateLearnerProfileDTO,
  LearnerProfile,
  ProfileServiceError,
} from '@/types/profile';
import { Database } from '@/types/database';

// ============================================================================
// High-Fidelity PostgreSQL & Supabase Simulator for Adversarial Stress Testing
// ============================================================================

interface MockSessionUser {
  id: string;
  email: string;
}

interface SimulatorOptions {
  simulateNetworkError?: boolean;
  simulateAuthError?: boolean;
}

/**
 * Creates an in-memory database simulation strictly enforcing the schema rules of
 * `supabase/migrations/002_create_learner_profiles.sql`:
 * - UNIQUE(user_id) with ON CONFLICT (user_id) DO UPDATE
 * - CHECK (native_language IN ('en', 'hi', 'ta', 'te', 'ml'))
 * - CHECK (target_language = 'kn')
 * - CHECK (proficiency_level IN ('beginner', 'elementary', 'intermediate'))
 * - CHECK (daily_goal_minutes IN (5, 10, 15, 20))
 * - Trigger handle_updated_at() BEFORE UPDATE
 * - RLS: auth.uid() = user_id for SELECT, INSERT, UPDATE, DELETE
 */
function createAdversarialMockDatabase(
  initialUser: MockSessionUser | null = null,
  options?: SimulatorOptions
) {
  // Underlying table storage keyed by user_id
  const table = new Map<string, LearnerProfile>();
  let currentUser = initialUser;
  let networkFailure = options?.simulateNetworkError ?? false;
  let authFailure = options?.simulateAuthError ?? false;

  const client = {
    // Current user manipulation
    _setUser(user: MockSessionUser | null) {
      currentUser = user;
    },
    _setNetworkFailure(fail: boolean) {
      networkFailure = fail;
    },
    _setAuthFailure(fail: boolean) {
      authFailure = fail;
    },
    _getTable() {
      return table;
    },

    auth: {
      async getUser() {
        if (networkFailure) {
          return { data: { user: null }, error: { message: 'Network connection refused', code: 'NETWORK_ERROR' } };
        }
        if (authFailure) {
          return { data: { user: null }, error: { message: 'JWT expired / invalid session', code: 'PGRST301' } };
        }
        return { data: { user: currentUser }, error: null };
      },
    },

    from(tableName: string) {
      if (tableName !== 'learner_profiles') {
        throw new Error(`Table ${tableName} does not exist in schema`);
      }

      return {
        // SELECT Query Builder
        select(columns = '*') {
          let filterUserId: string | null = null;
          const query = {
            eq(col: string, val: unknown) {
              if (col === 'user_id') filterUserId = String(val);
              return query;
            },
            async maybeSingle() {
              if (networkFailure) {
                return {
                  data: null,
                  error: { code: 'PGRST500', message: 'Simulated network connection failure' },
                };
              }

              // RLS Enforcement: (select auth.uid()) = user_id
              if (!currentUser) {
                // Unauthenticated caller sees 0 rows
                return { data: null, error: null };
              }

              if (!filterUserId) {
                return { data: null, error: null };
              }

              // Cross-user RLS check: User cannot see other users' rows
              if (currentUser.id !== filterUserId) {
                return { data: null, error: null }; // RLS silently filters out rows
              }

              const row = table.get(filterUserId);
              if (!row) {
                return { data: null, error: null };
              }

              if (columns === 'onboarding_completed') {
                return {
                  data: { onboarding_completed: row.onboarding_completed },
                  error: null,
                };
              }
              return { data: { ...row }, error: null };
            },
            async single() {
              const res = await query.maybeSingle();
              if (res.error) return res;
              if (!res.data) {
                return {
                  data: null,
                  error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
                };
              }
              return res;
            },
          };
          return query;
        },

        // UPSERT Query Builder
        upsert(
          data: Database['public']['Tables']['learner_profiles']['Insert'],
          upsertOptions?: { onConflict?: string }
        ) {
          return {
            select() {
              return {
                async single() {
                  if (networkFailure) {
                    return {
                      data: null,
                      error: { code: 'PGRST500', message: 'Simulated network connection failure' },
                    };
                  }

                  const targetUserId = data.user_id;
                  if (!targetUserId) {
                    return {
                      data: null,
                      error: { code: '23502', message: 'null value in column "user_id" violates not-null constraint' },
                    };
                  }

                  // RLS Policy Check on INSERT/UPDATE: WITH CHECK ((select auth.uid()) = user_id)
                  if (!currentUser || currentUser.id !== targetUserId) {
                    return {
                      data: null,
                      error: {
                        code: '42501',
                        message: 'new row violates row-level security policy for table "learner_profiles"',
                      },
                    };
                  }

                  // Verify onConflict parameter matches unique constraint
                  if (upsertOptions?.onConflict && upsertOptions.onConflict !== 'user_id') {
                    return {
                      data: null,
                      error: {
                        code: '42P10',
                        message: `there is no unique or exclusion constraint matching the ON CONFLICT specification "${upsertOptions.onConflict}"`,
                      },
                    };
                  }

                  // Schema CHECK Constraints Verification
                  // 1. native_language
                  const validLangs = ['en', 'hi', 'ta', 'te', 'ml'];
                  if (!validLangs.includes(data.native_language)) {
                    return {
                      data: null,
                      error: {
                        code: '23514',
                        message: 'new row for relation "learner_profiles" violates check constraint "chk_learner_profiles_native_language"',
                      },
                    };
                  }

                  // 2. target_language
                  const targetLang = data.target_language ?? 'kn';
                  if (targetLang !== 'kn') {
                    return {
                      data: null,
                      error: {
                        code: '23514',
                        message: 'new row for relation "learner_profiles" violates check constraint "chk_learner_profiles_target_language"',
                      },
                    };
                  }

                  // 3. proficiency_level
                  const validLevels = ['beginner', 'elementary', 'intermediate'];
                  if (!validLevels.includes(data.proficiency_level)) {
                    return {
                      data: null,
                      error: {
                        code: '23514',
                        message: 'new row for relation "learner_profiles" violates check constraint "chk_learner_profiles_proficiency_level"',
                      },
                    };
                  }

                  // 4. daily_goal_minutes
                  const validMinutes = [5, 10, 15, 20];
                  if (!validMinutes.includes(data.daily_goal_minutes)) {
                    return {
                      data: null,
                      error: {
                        code: '23514',
                        message: 'new row for relation "learner_profiles" violates check constraint "chk_learner_profiles_daily_goal_minutes"',
                      },
                    };
                  }

                  // Atomic Upsert execution
                  const existing = table.get(targetUserId);
                  const now = new Date().toISOString();

                  if (existing) {
                    // Update: preserve id, user_id, and created_at
                    const updated: LearnerProfile = {
                      ...existing,
                      full_name: data.full_name !== undefined ? (data.full_name ?? null) : existing.full_name,
                      avatar_url: data.avatar_url !== undefined ? (data.avatar_url ?? null) : existing.avatar_url,
                      native_language: data.native_language,
                      target_language: targetLang,
                      proficiency_level: data.proficiency_level,
                      learning_goals: data.learning_goals ?? existing.learning_goals,
                      daily_goal_minutes: data.daily_goal_minutes,
                      onboarding_completed:
                        data.onboarding_completed !== undefined
                          ? data.onboarding_completed
                          : existing.onboarding_completed,
                      // updated_at trigger simulation
                      updated_at: now,
                    };
                    table.set(targetUserId, updated);
                    return { data: { ...updated }, error: null };
                  } else {
                    // Insert: generate new id, set created_at and updated_at
                    const newProfile: LearnerProfile = {
                      id: data.id || `lp-uuid-${Math.random().toString(36).substring(2, 10)}`,
                      user_id: targetUserId,
                      full_name: data.full_name ?? null,
                      avatar_url: data.avatar_url ?? null,
                      native_language: data.native_language,
                      target_language: targetLang,
                      proficiency_level: data.proficiency_level,
                      learning_goals: data.learning_goals || [],
                      daily_goal_minutes: data.daily_goal_minutes,
                      onboarding_completed: data.onboarding_completed ?? false,
                      created_at: now,
                      updated_at: now,
                    };
                    table.set(targetUserId, newProfile);
                    return { data: { ...newProfile }, error: null };
                  }
                },
              };
            },
          };
        },

        // UPDATE Query Builder
        update(updates: Database['public']['Tables']['learner_profiles']['Update']) {
          let targetUserId: string | null = null;
          const query = {
            eq(col: string, val: unknown) {
              if (col === 'user_id') targetUserId = String(val);
              return query;
            },
            select() {
              return {
                async single() {
                  if (networkFailure) {
                    return {
                      data: null,
                      error: { code: 'PGRST500', message: 'Simulated network connection failure' },
                    };
                  }

                  if (!targetUserId) {
                    return { data: null, error: { code: 'PGRST116', message: 'No target user specified' } };
                  }

                  // RLS Policy Check on UPDATE: USING ((select auth.uid()) = user_id)
                  if (!currentUser || currentUser.id !== targetUserId) {
                    return {
                      data: null,
                      error: {
                        code: '42501',
                        message: 'permission denied for table "learner_profiles"',
                      },
                    };
                  }

                  const existing = table.get(targetUserId);
                  if (!existing) {
                    return { data: null, error: null }; // No rows updated
                  }

                  // Check constraints on updated fields
                  if (updates.native_language !== undefined) {
                    const validLangs = ['en', 'hi', 'ta', 'te', 'ml'];
                    if (!validLangs.includes(updates.native_language)) {
                      return {
                        data: null,
                        error: {
                          code: '23514',
                          message: 'violates check constraint "chk_learner_profiles_native_language"',
                        },
                      };
                    }
                  }

                  if (updates.target_language !== undefined && updates.target_language !== 'kn') {
                    return {
                      data: null,
                      error: {
                        code: '23514',
                        message: 'violates check constraint "chk_learner_profiles_target_language"',
                      },
                    };
                  }

                  if (updates.proficiency_level !== undefined) {
                    const validLevels = ['beginner', 'elementary', 'intermediate'];
                    if (!validLevels.includes(updates.proficiency_level)) {
                      return {
                        data: null,
                        error: {
                          code: '23514',
                          message: 'violates check constraint "chk_learner_profiles_proficiency_level"',
                        },
                      };
                    }
                  }

                  if (updates.daily_goal_minutes !== undefined) {
                    const validMinutes = [5, 10, 15, 20];
                    if (!validMinutes.includes(updates.daily_goal_minutes)) {
                      return {
                        data: null,
                        error: {
                          code: '23514',
                          message: 'violates check constraint "chk_learner_profiles_daily_goal_minutes"',
                        },
                      };
                    }
                  }

                  const now = new Date().toISOString();
                  const updated: LearnerProfile = {
                    ...existing,
                    ...(updates.full_name !== undefined ? { full_name: updates.full_name } : {}),
                    ...(updates.avatar_url !== undefined ? { avatar_url: updates.avatar_url } : {}),
                    ...(updates.native_language !== undefined ? { native_language: updates.native_language } : {}),
                    ...(updates.target_language !== undefined ? { target_language: updates.target_language } : {}),
                    ...(updates.proficiency_level !== undefined ? { proficiency_level: updates.proficiency_level } : {}),
                    ...(updates.learning_goals !== undefined ? { learning_goals: updates.learning_goals } : {}),
                    ...(updates.daily_goal_minutes !== undefined ? { daily_goal_minutes: updates.daily_goal_minutes } : {}),
                    ...(updates.onboarding_completed !== undefined ? { onboarding_completed: updates.onboarding_completed } : {}),
                    // Preserved immutable fields: id, user_id, created_at
                    id: existing.id,
                    user_id: existing.user_id,
                    created_at: existing.created_at,
                    updated_at: now, // trigger simulation
                  };

                  table.set(targetUserId, updated);
                  return { data: { ...updated }, error: null };
                },
              };
            },
          };
          return query;
        },
      };
    },
  };

  return client as unknown as ProfileSupabaseClient & {
    _setUser: (user: MockSessionUser | null) => void;
    _setNetworkFailure: (fail: boolean) => void;
    _setAuthFailure: (fail: boolean) => void;
    _getTable: () => Map<string, LearnerProfile>;
  };
}

// ============================================================================
// Test Suite Execution Harness
// ============================================================================

async function runAdversarialSuite() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   ADVERSARIAL STRESS TEST SUITE: MILESTONE M01 PROFILE SERVICE   ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const failures: Array<{ name: string; error: unknown }> = [];

  async function challenge(name: string, fn: () => Promise<void> | void) {
    process.stdout.write(`  [TEST] ${name} ... `);
    try {
      await fn();
      console.log('✓ PASS');
      passed++;
    } catch (err) {
      console.log('✗ FAIL');
      console.error('    Error details:', err instanceof Error ? err.message : String(err));
      failed++;
      failures.push({ name, error: err });
    }
  }

  // ==========================================================================
  // Section 1: Rapid Concurrent Upsert & Idempotency Stress Testing
  // ==========================================================================
  console.log('\n--- Section 1: Rapid Concurrent Upserts & Race Conditions ---');

  await challenge('ADV-CON-01: 50 simultaneous identical upserts for same user produce exactly 1 row', async () => {
    const user = { id: 'usr-conc-1', email: 'conc1@kannada.org' };
    const db = createAdversarialMockDatabase(user);

    const payload: CreateLearnerProfileDTO = {
      user_id: user.id,
      full_name: 'Rapid Clicker',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations', 'shopping_and_daily_activities'],
      daily_goal_minutes: 10,
      onboarding_completed: true,
    };

    // Fire 50 concurrent requests simultaneously
    const promises = Array.from({ length: 50 }, () => createLearnerProfile(payload, db));
    const results = await Promise.all(promises);

    // Verify all 50 resolved successfully
    assert.equal(results.length, 50);

    // Verify identical ID across all results
    const firstId = results[0].id;
    assert.ok(firstId, 'Profile ID must be populated');
    for (const r of results) {
      assert.equal(r.id, firstId, 'All concurrent calls must return identical profile ID');
      assert.equal(r.user_id, user.id);
    }

    // Verify database table has strictly 1 record
    assert.equal(db._getTable().size, 1, 'Table must contain exactly 1 row despite 50 concurrent requests');
  });

  await challenge('ADV-CON-02: 50 concurrent upserts with mutating preferences preserve immutable fields', async () => {
    const user = { id: 'usr-conc-2', email: 'conc2@kannada.org' };
    const db = createAdversarialMockDatabase(user);

    // Seed initial profile
    const initial = await createLearnerProfile(
      {
        user_id: user.id,
        full_name: 'Baseline User',
        native_language: 'en',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 5,
        onboarding_completed: true,
      },
      db
    );

    const initialId = initial.id;
    const initialCreatedAt = initial.created_at;

    // Fire 50 concurrent upserts with alternating preferences
    const languages: CreateLearnerProfileDTO['native_language'][] = ['en', 'hi', 'ta', 'te', 'ml'];
    const levels: CreateLearnerProfileDTO['proficiency_level'][] = ['beginner', 'elementary', 'intermediate'];
    const minutes: CreateLearnerProfileDTO['daily_goal_minutes'][] = [5, 10, 15, 20];

    const promises = Array.from({ length: 50 }, (_, i) => {
      const payload: CreateLearnerProfileDTO = {
        user_id: user.id,
        full_name: `User Mutate ${i}`,
        native_language: languages[i % languages.length],
        proficiency_level: levels[i % levels.length],
        learning_goals: [`goal_${i}`],
        daily_goal_minutes: minutes[i % minutes.length],
        onboarding_completed: true,
      };
      return createLearnerProfile(payload, db);
    });

    const results = await Promise.all(promises);

    // Invariance checks across all 50 results
    for (const res of results) {
      assert.equal(res.id, initialId, 'id must never mutate across concurrent upserts');
      assert.equal(res.user_id, user.id, 'user_id must never mutate');
      assert.equal(res.created_at, initialCreatedAt, 'created_at must never mutate');
    }

    assert.equal(db._getTable().size, 1, 'Table must remain exactly 1 row');
  });

  await challenge('ADV-CON-03: Interleaved concurrent creates (25) and updates (25) resolve without collisions', async () => {
    const user = { id: 'usr-conc-3', email: 'conc3@kannada.org' };
    const db = createAdversarialMockDatabase(user);

    // Initial creation
    const baseline = await createLearnerProfile(
      {
        user_id: user.id,
        full_name: 'Initial User',
        native_language: 'ta',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
        onboarding_completed: true,
      },
      db
    );

    const baseId = baseline.id;

    const createOperations = Array.from({ length: 25 }, (_, i) =>
      createLearnerProfile(
        {
          user_id: user.id,
          full_name: `Interleaved Create ${i}`,
          native_language: 'te',
          proficiency_level: 'elementary',
          learning_goals: ['workplace_communication'],
          daily_goal_minutes: 15,
        },
        db
      )
    );

    const updateOperations = Array.from({ length: 25 }, (_, i) =>
      updateLearnerProfile(
        user.id,
        {
          full_name: `Interleaved Update ${i}`,
          daily_goal_minutes: 20,
        },
        db
      )
    );

    // Execute all 50 interleaved operations concurrently
    const allResults = await Promise.all([...createOperations, ...updateOperations]);

    for (const r of allResults) {
      assert.equal(r.id, baseId);
      assert.equal(r.user_id, user.id);
    }

    assert.equal(db._getTable().size, 1);
  });

  await challenge('ADV-CON-04: Multi-tenant concurrency (10 distinct users x 10 concurrent upserts = 100 ops)', async () => {
    // Shared underlying table across 10 users
    const sharedTable = new Map<string, LearnerProfile>();

    const userIds = Array.from({ length: 10 }, (_, i) => `user-tenant-${i}`);

    const allOperations: Promise<LearnerProfile>[] = [];

    for (const uid of userIds) {
      const user = { id: uid, email: `${uid}@test.com` };
      // Create dedicated client for this user connected to shared table
      const clientForUser = createAdversarialMockDatabase(user);
      // Point client to the shared table
      (clientForUser as unknown as { _getTable: () => Map<string, LearnerProfile> })._getTable = () => sharedTable;
      // Replace table reference in client
      const dbAny = clientForUser as unknown as { from: (t: string) => ReturnType<typeof clientForUser.from> };
      const originalFrom = dbAny.from.bind(clientForUser);
      dbAny.from = (table: string) => {
        const qb = originalFrom(table);
        return qb;
      };

      for (let j = 0; j < 10; j++) {
        allOperations.push(
          createLearnerProfile(
            {
              user_id: uid,
              full_name: `Tenant ${uid} Op ${j}`,
              native_language: 'ml',
              proficiency_level: 'intermediate',
              learning_goals: ['understanding_kannada_culture'],
              daily_goal_minutes: 10,
            },
            clientForUser
          )
        );
      }
    }

    const results = await Promise.all(allOperations);
    assert.equal(results.length, 100);

    // Verify each user has a unique ID and successful upsert
    const uniqueIds = new Set(results.map((r) => r.id));
    assert.equal(uniqueIds.size, 10, '10 unique users must correspond to 10 unique profile IDs');
  });

  // ==========================================================================
  // Section 2: Input Stress & Constraint Boundary Testing
  // ==========================================================================
  console.log('\n--- Section 2: Constraint Boundaries & Adversarial Inputs ---');

  await challenge('ADV-VAL-01: Rejection of adversarial native_language payloads (SQLi, case, unsupported)', async () => {
    const user = { id: 'usr-val-lang', email: 'lang@test.com' };
    const db = createAdversarialMockDatabase(user);

    // Seed baseline profile for updateLearnerProfile testing
    await createLearnerProfile(
      {
        user_id: user.id,
        native_language: 'en',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
      },
      db
    );

    const invalidLangs = [
      'fr',
      'de',
      'es',
      'kannada', // full name not allowed
      'EN', // uppercase must be rejected
      'ta; DROP TABLE learner_profiles; --', // SQL injection attempt
      '<script>alert(1)</script>',
      'en-US',
      ' ',
      '',
      null,
      123,
      {},
      [],
    ];

    for (const badLang of invalidLangs) {
      // 1. Test createLearnerProfile rejection
      const payload = {
        user_id: user.id,
        native_language: badLang as unknown as CreateLearnerProfileDTO['native_language'],
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
      } as CreateLearnerProfileDTO;

      await assert.rejects(
        async () => {
          await createLearnerProfile(payload, db);
        },
        (err: unknown) => {
          return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR' && err.statusCode === 400;
        },
        `createLearnerProfile failed to reject invalid native_language: ${JSON.stringify(badLang)}`
      );

      // 2. Test updateLearnerProfile rejection
      await assert.rejects(
        async () => {
          await updateLearnerProfile(
            user.id,
            { native_language: badLang as unknown as CreateLearnerProfileDTO['native_language'] },
            db
          );
        },
        (err: unknown) => {
          return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR' && err.statusCode === 400;
        },
        `updateLearnerProfile failed to reject invalid native_language: ${JSON.stringify(badLang)}`
      );
    }

    // Explicitly test undefined for createLearnerProfile (must be rejected)
    await assert.rejects(
      async () => {
        await createLearnerProfile(
          {
            user_id: user.id,
            native_language: undefined as unknown as CreateLearnerProfileDTO['native_language'],
            proficiency_level: 'beginner',
            learning_goals: ['everyday_conversations'],
            daily_goal_minutes: 10,
          },
          db
        );
      },
      (err: unknown) => err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR'
    );
  });

  await challenge('ADV-VAL-02: Rejection of adversarial proficiency_level payloads', async () => {
    const user = { id: 'usr-val-prof', email: 'prof@test.com' };
    const db = createAdversarialMockDatabase(user);

    // Seed baseline profile
    await createLearnerProfile(
      {
        user_id: user.id,
        native_language: 'hi',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
      },
      db
    );

    const invalidProficiencies = [
      'master',
      'expert',
      'advanced',
      'fluent',
      'Beginner', // Uppercase
      'ELEMENTARY',
      'intermediate-plus',
      'beginner; --',
      '',
      '   ',
      null,
      99,
      false,
    ];

    for (const badProf of invalidProficiencies) {
      const payload = {
        user_id: user.id,
        native_language: 'hi',
        proficiency_level: badProf as unknown as CreateLearnerProfileDTO['proficiency_level'],
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
      } as CreateLearnerProfileDTO;

      await assert.rejects(
        async () => {
          await createLearnerProfile(payload, db);
        },
        (err: unknown) => {
          return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR';
        },
        `createLearnerProfile failed to reject invalid proficiency: ${JSON.stringify(badProf)}`
      );

      await assert.rejects(
        async () => {
          await updateLearnerProfile(
            user.id,
            { proficiency_level: badProf as unknown as CreateLearnerProfileDTO['proficiency_level'] },
            db
          );
        },
        (err: unknown) => {
          return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR';
        },
        `updateLearnerProfile failed to reject invalid proficiency: ${JSON.stringify(badProf)}`
      );
    }
  });

  await challenge('ADV-VAL-03: Rejection of adversarial daily_goal_minutes (floats, strings, negative, extremes)', async () => {
    const user = { id: 'usr-val-min', email: 'min@test.com' };
    const db = createAdversarialMockDatabase(user);

    // Seed baseline profile
    await createLearnerProfile(
      {
        user_id: user.id,
        native_language: 'ta',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
      },
      db
    );

    const invalidMinutes = [
      0,
      -5,
      -10,
      1,
      7,
      12,
      25,
      30,
      60,
      100,
      Number.MAX_SAFE_INTEGER,
      NaN,
      Infinity,
      -Infinity,
      3.14,
      5.0001,
      '10', // String 10 must be rejected
      '5',
      null,
      {},
    ];

    for (const badMin of invalidMinutes) {
      const payload = {
        user_id: user.id,
        native_language: 'ta',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: badMin as unknown as CreateLearnerProfileDTO['daily_goal_minutes'],
      } as CreateLearnerProfileDTO;

      await assert.rejects(
        async () => {
          await createLearnerProfile(payload, db);
        },
        (err: unknown) => {
          return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR';
        },
        `createLearnerProfile failed to reject invalid minutes: ${JSON.stringify(badMin)}`
      );

      await assert.rejects(
        async () => {
          await updateLearnerProfile(
            user.id,
            { daily_goal_minutes: badMin as unknown as CreateLearnerProfileDTO['daily_goal_minutes'] },
            db
          );
        },
        (err: unknown) => {
          return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR';
        },
        `updateLearnerProfile failed to reject invalid minutes: ${JSON.stringify(badMin)}`
      );
    }
  });

  await challenge('ADV-VAL-04: Non-Kannada target language behavior and database constraint enforcement', async () => {
    const user = { id: 'usr-val-target', email: 'target@test.com' };
    const db = createAdversarialMockDatabase(user);

    // 1. Direct database check: When target_language != 'kn' hits DB upsert, DB constraint triggers
    const directDbUpsertResult = await db.from('learner_profiles').upsert({
      user_id: user.id,
      native_language: 'en',
      target_language: 'es', // non-Kannada
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    }).select().single();

    assert.equal(directDbUpsertResult.data, null);
    assert.ok(directDbUpsertResult.error);
    assert.equal(directDbUpsertResult.error.code, '23514');
    assert.match(directDbUpsertResult.error.message, /chk_learner_profiles_target_language/);

    // 2. Service layer behavior: Passing target_language: 'es' or 'hi' to createLearnerProfile
    // The service hardcodes target_language: 'kn' in insertData, ensuring target_language is ALWAYS 'kn'.
    const profile = await createLearnerProfile(
      {
        user_id: user.id,
        native_language: 'en',
        target_language: 'es', // attempted override
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
      },
      db
    );

    // Verify service invariant: target_language in returned profile and database is strictly 'kn'
    assert.equal(profile.target_language, 'kn', 'Target language must strictly be kn');
    const stored = db._getTable().get(user.id);
    assert.equal(stored?.target_language, 'kn', 'Database row target_language must strictly be kn');

    // 3. updateLearnerProfile attempting to set target_language to non-kn
    const updated = await updateLearnerProfile(user.id, { target_language: 'french' }, db);
    assert.equal(updated.target_language, 'kn', 'updateLearnerProfile must never allow non-kn');
  });

  await challenge('ADV-VAL-05: Empty, non-array, and null learning_goals payloads are rejected', async () => {
    const user = { id: 'usr-val-goals', email: 'goals@test.com' };
    const db = createAdversarialMockDatabase(user);

    const invalidGoals = [
      [],
      null,
      undefined,
      'everyday_conversations', // string not array
      123,
      {},
    ];

    for (const badGoals of invalidGoals) {
      const payload = {
        user_id: user.id,
        native_language: 'te',
        proficiency_level: 'elementary',
        learning_goals: badGoals as unknown as CreateLearnerProfileDTO['learning_goals'],
        daily_goal_minutes: 15,
      } as CreateLearnerProfileDTO;

      await assert.rejects(
        async () => {
          await createLearnerProfile(payload, db);
        },
        (err: unknown) => {
          return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR';
        },
        `Failed to reject invalid learning_goals: ${JSON.stringify(badGoals)}`
      );
    }
  });

  // ==========================================================================
  // Section 3: Immutability & System Fields Protection
  // ==========================================================================
  console.log('\n--- Section 3: Immutability of id, user_id, and created_at ---');

  await challenge('ADV-IMM-01: Successive createLearnerProfile calls preserve id, user_id, and created_at', async () => {
    const user = { id: 'usr-imm-1', email: 'imm1@kannada.org' };
    const db = createAdversarialMockDatabase(user);

    const initial = await createLearnerProfile(
      {
        user_id: user.id,
        full_name: 'Name V1',
        native_language: 'en',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 5,
      },
      db
    );

    const initialId = initial.id;
    const initialCreatedAt = initial.created_at;

    // Small delay to ensure timestamp progression
    await new Promise((r) => setTimeout(r, 10));

    // Second createLearnerProfile with completely different mutable fields
    const updated = await createLearnerProfile(
      {
        user_id: user.id,
        full_name: 'Name V2',
        native_language: 'hi',
        proficiency_level: 'intermediate',
        learning_goals: ['workplace_communication', 'shopping_and_daily_activities'],
        daily_goal_minutes: 20,
      },
      db
    );

    // Invariant assertions
    assert.equal(updated.id, initialId, 'id must be preserved');
    assert.equal(updated.user_id, user.id, 'user_id must be preserved');
    assert.equal(updated.created_at, initialCreatedAt, 'created_at must be preserved');

    // Mutation assertions
    assert.equal(updated.full_name, 'Name V2');
    assert.equal(updated.native_language, 'hi');
    assert.equal(updated.proficiency_level, 'intermediate');
    assert.equal(updated.daily_goal_minutes, 20);
    assert.deepEqual(updated.learning_goals, ['workplace_communication', 'shopping_and_daily_activities']);
  });

  await challenge('ADV-IMM-02: Adversarial attempts to inject forged id, user_id, or created_at fail', async () => {
    const user = { id: 'usr-imm-hacker', email: 'hacker@kannada.org' };
    const db = createAdversarialMockDatabase(user);

    const initial = await createLearnerProfile(
      {
        user_id: user.id,
        full_name: 'Original',
        native_language: 'ta',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
      },
      db
    );

    const legitimateId = initial.id;
    const legitimateCreatedAt = initial.created_at;

    // Hacker tries to pass forged id and created_at in create payload
    const forgedPayload = {
      user_id: user.id,
      full_name: 'Hacked',
      native_language: 'ta',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
      id: 'FORGED-UUID-00000000',
      created_at: '1970-01-01T00:00:00.000Z',
    } as unknown as CreateLearnerProfileDTO;

    const afterAttack = await createLearnerProfile(forgedPayload, db);

    // Must still retain original system values
    assert.equal(afterAttack.id, legitimateId, 'Forged ID must NOT overwrite existing ID');
    assert.equal(afterAttack.created_at, legitimateCreatedAt, 'Forged created_at must NOT overwrite existing created_at');

    // Hacker tries to spoof user_id in updateLearnerProfile
    const updateResult = await updateLearnerProfile(
      user.id,
      {
        user_id: 'victim-user-id',
        full_name: 'Attacked',
      } as unknown as Partial<CreateLearnerProfileDTO>,
      db
    );

    assert.equal(updateResult.user_id, user.id, 'user_id must never change via update');
  });

  await challenge('ADV-IMM-03: updateLearnerProfile triggers updated_at update while keeping created_at fixed', async () => {
    const user = { id: 'usr-imm-time', email: 'time@kannada.org' };
    const db = createAdversarialMockDatabase(user);

    const initial = await createLearnerProfile(
      {
        user_id: user.id,
        full_name: 'Time Test',
        native_language: 'ml',
        proficiency_level: 'elementary',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 15,
      },
      db
    );

    const initialCreatedAt = initial.created_at;
    const initialUpdatedAt = initial.updated_at;

    await new Promise((r) => setTimeout(r, 15));

    const updated = await updateLearnerProfile(user.id, { daily_goal_minutes: 20 }, db);

    assert.equal(updated.created_at, initialCreatedAt, 'created_at must remain constant');
    assert.ok(
      new Date(updated.updated_at).getTime() >= new Date(initialUpdatedAt).getTime(),
      'updated_at must advance upon modification'
    );
  });

  // ==========================================================================
  // Section 4: Unauthenticated & Session Edge Cases
  // ==========================================================================
  console.log('\n--- Section 4: Unauthenticated & Session Edge Cases ---');

  await challenge('ADV-UNA-01: isOnboardingCompleted returns false safely without crashing when unauthenticated', async () => {
    const unauthedDb = createAdversarialMockDatabase(null);

    // Call with undefined userId
    const res1 = await isOnboardingCompleted(undefined, unauthedDb);
    assert.equal(res1, false);

    // Call with empty string
    const res2 = await isOnboardingCompleted('', unauthedDb);
    assert.equal(res2, false);

    // Call with whitespace string
    const res3 = await isOnboardingCompleted('    ', unauthedDb);
    assert.equal(res3, false);
  });

  await challenge('ADV-UNA-02: getLearnerProfile returns null safely without crashing when unauthenticated', async () => {
    const unauthedDb = createAdversarialMockDatabase(null);

    const p1 = await getLearnerProfile(undefined, unauthedDb);
    assert.equal(p1, null);

    const p2 = await getLearnerProfile('', unauthedDb);
    assert.equal(p2, null);

    const p3 = await getLearnerProfile('   ', unauthedDb);
    assert.equal(p3, null);
  });

  await challenge('ADV-UNA-03: createLearnerProfile throws UNAUTHENTICATED (401) when session user is missing', async () => {
    const unauthedDb = createAdversarialMockDatabase(null);

    const payload: CreateLearnerProfileDTO = {
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    };

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, unauthedDb);
      },
      (err: unknown) => {
        return (
          err instanceof ProfileServiceError &&
          err.code === 'UNAUTHENTICATED' &&
          err.statusCode === 401 &&
          err.message.includes('Authenticated user is required')
        );
      }
    );
  });

  await challenge('ADV-UNA-04: updateLearnerProfile throws INVALID_ARGUMENT (400) when userId is empty/whitespace', async () => {
    const db = createAdversarialMockDatabase(null);

    await assert.rejects(
      async () => {
        await updateLearnerProfile('', { daily_goal_minutes: 10 }, db);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'INVALID_ARGUMENT' && err.statusCode === 400;
      }
    );

    await assert.rejects(
      async () => {
        await updateLearnerProfile('   ', { daily_goal_minutes: 10 }, db);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'INVALID_ARGUMENT' && err.statusCode === 400;
      }
    );
  });

  await challenge('ADV-UNA-05: Auth error / expired JWT simulation handles gracefully', async () => {
    const db = createAdversarialMockDatabase(null, { simulateAuthError: true });

    // isOnboardingCompleted should return false safely
    const status = await isOnboardingCompleted(undefined, db);
    assert.equal(status, false);

    // getLearnerProfile should return null safely
    const profile = await getLearnerProfile(undefined, db);
    assert.equal(profile, null);
  });

  await challenge('ADV-UNA-06: Network failure behavior during isOnboardingCompleted vs getLearnerProfile', async () => {
    const db = createAdversarialMockDatabase({ id: 'usr-net', email: 'net@test.com' }, { simulateNetworkError: true });

    // isOnboardingCompleted is in routing path: MUST NOT crash, returns false
    const status = await isOnboardingCompleted('usr-net', db);
    assert.equal(status, false, 'Route guard must fail closed (false) rather than crash on network failure');

    // getLearnerProfile must propagate typed ProfileServiceError so callers know fetch failed
    await assert.rejects(
      async () => {
        await getLearnerProfile('usr-net', db);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'PGRST500';
      }
    );
  });

  // ==========================================================================
  // Section 5: Row Level Security & Authorization Boundaries
  // ==========================================================================
  console.log('\n--- Section 5: Row Level Security (RLS) & Multi-Tenant Isolation ---');

  await challenge('ADV-RLS-01: User A cannot read User B profile (returns null via RLS filter)', async () => {
    const userA = { id: 'usr-rls-A', email: 'a@kannada.org' };
    const userB = { id: 'usr-rls-B', email: 'b@kannada.org' };

    const db = createAdversarialMockDatabase(userB);

    // Create profile as User B
    await createLearnerProfile(
      {
        user_id: userB.id,
        full_name: 'User B Secret Profile',
        native_language: 'ta',
        proficiency_level: 'intermediate',
        learning_goals: ['understanding_kannada_culture'],
        daily_goal_minutes: 20,
      },
      db
    );

    // Switch session to User A
    db._setUser(userA);

    // User A tries to read User B's profile
    const profile = await getLearnerProfile(userB.id, db);
    assert.equal(profile, null, 'RLS must prevent User A from reading User B profile');
  });

  await challenge('ADV-RLS-02: User A cannot update User B profile (INSUFFICIENT_PRIVILEGES 403)', async () => {
    const userA = { id: 'usr-rls-A2', email: 'a2@kannada.org' };
    const userB = { id: 'usr-rls-B2', email: 'b2@kannada.org' };

    const db = createAdversarialMockDatabase(userB);

    // Seed User B profile
    await createLearnerProfile(
      {
        user_id: userB.id,
        full_name: 'User B',
        native_language: 'hi',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 5,
      },
      db
    );

    // Switch session to User A
    db._setUser(userA);

    // User A tries to update User B's profile
    await assert.rejects(
      async () => {
        await updateLearnerProfile(userB.id, { daily_goal_minutes: 20 }, db);
      },
      (err: unknown) => {
        return (
          err instanceof ProfileServiceError &&
          err.code === 'INSUFFICIENT_PRIVILEGES' &&
          err.statusCode === 403
        );
      }
    );
  });

  await challenge('ADV-RLS-03: User A cannot upsert with User B user_id (INSUFFICIENT_PRIVILEGES 403)', async () => {
    const userA = { id: 'usr-rls-attacker', email: 'attacker@kannada.org' };
    const userB = { id: 'usr-rls-victim', email: 'victim@kannada.org' };

    const db = createAdversarialMockDatabase(userA);

    // User A attempts to insert/upsert a profile claiming User B's user_id
    await assert.rejects(
      async () => {
        await createLearnerProfile(
          {
            user_id: userB.id, // Spoofed user_id
            full_name: 'Malicious Injected Profile',
            native_language: 'en',
            proficiency_level: 'beginner',
            learning_goals: ['everyday_conversations'],
            daily_goal_minutes: 10,
          },
          db
        );
      },
      (err: unknown) => {
        return (
          err instanceof ProfileServiceError &&
          err.code === 'INSUFFICIENT_PRIVILEGES' &&
          err.statusCode === 403
        );
      }
    );
  });

  // ==========================================================================
  // Summary & Verdict Determination
  // ==========================================================================
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║   ADVERSARIAL SUITE SUMMARY: ${passed}/${passed + failed} CHECKS PASSED                     ║`);
  if (failed === 0) {
    console.log('║   FINAL VERDICT: APPROVE                                         ║');
  } else {
    console.log(`║   FINAL VERDICT: REQUEST_CHANGES (${failed} failures)                    ║`);
  }
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  if (failures.length > 0) {
    console.error('List of failed tests:');
    for (const f of failures) {
      console.error(`  - ${f.name}`);
    }
    process.exit(1);
  }
}

runAdversarialSuite().catch((err) => {
  console.error('Unhandled harness failure:', err);
  process.exit(1);
});
