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
  isNativeLanguage,
  isProficiencyLevel,
  isDailyGoalMinutes,
  isLearningGoal,
  SUPPORTED_NATIVE_LANGUAGES,
  SUPPORTED_PROFICIENCY_LEVELS,
  SUPPORTED_DAILY_GOALS,
  SUPPORTED_LEARNING_GOALS,
} from '@/types/profile';

/**
 * In-Memory Mock Supabase Client Harness for Unit Testing
 */
function createMockSupabase(
  initialUser: { id: string; email: string } | null = null,
  options?: {
    simulateQueryError?: boolean;
    simulateConstraintError?: { code: string; message: string };
  }
) {
  const store = new Map<string, LearnerProfile>();

  const client = {
    auth: {
      async getUser() {
        return { data: { user: initialUser }, error: null };
      },
    },
    from(table: string) {
      if (table !== 'learner_profiles') {
        throw new Error(`Unexpected table: ${table}`);
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
              if (options?.simulateQueryError) {
                return {
                  data: null,
                  error: { code: 'PGRST500', message: 'Simulated database connection failure' },
                };
              }
              if (!filterUserId) return { data: null, error: null };
              const row = store.get(filterUserId) || null;
              if (!row) return { data: null, error: null };

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
        upsert(data: Partial<LearnerProfile>) {
          if (options?.simulateConstraintError) {
            return {
              select() {
                return {
                  async single() {
                    return { data: null, error: options.simulateConstraintError };
                  },
                };
              },
            };
          }

          const userId = data.user_id;
          if (!userId) {
            throw new Error('user_id required for upsert');
          }

          const existing = store.get(userId);
          const now = new Date().toISOString();

          // Upsert idempotency: preserve id, user_id, and created_at on conflict
          const record: LearnerProfile = {
            id: existing ? existing.id : 'uuid-' + Math.random().toString(36).substring(2, 9),
            user_id: userId,
            full_name: data.full_name !== undefined ? (data.full_name ?? null) : (existing?.full_name ?? null),
            avatar_url: data.avatar_url !== undefined ? (data.avatar_url ?? null) : (existing?.avatar_url ?? null),
            native_language: data.native_language ?? existing?.native_language ?? 'en',
            target_language: 'kn',
            proficiency_level: data.proficiency_level ?? existing?.proficiency_level ?? 'beginner',
            learning_goals: data.learning_goals ?? existing?.learning_goals ?? [],
            daily_goal_minutes: data.daily_goal_minutes ?? existing?.daily_goal_minutes ?? 10,
            onboarding_completed: data.onboarding_completed !== undefined ? data.onboarding_completed : (existing?.onboarding_completed ?? true),
            created_at: existing ? existing.created_at : now,
            updated_at: now,
          };

          store.set(userId, record);

          return {
            select() {
              return {
                async single() {
                  return { data: { ...record }, error: null };
                },
              };
            },
          };
        },
        update(updates: Partial<LearnerProfile>) {
          let targetUserId: string | null = null;
          const query = {
            eq(col: string, val: unknown) {
              if (col === 'user_id') targetUserId = String(val);
              return query;
            },
            select() {
              return {
                async single() {
                  if (options?.simulateConstraintError) {
                    return { data: null, error: options.simulateConstraintError };
                  }
                  if (!targetUserId) {
                    return { data: null, error: { code: 'PGRST116', message: 'No target user' } };
                  }
                  const existing = store.get(targetUserId);
                  if (!existing) {
                    return { data: null, error: null };
                  }

                  const now = new Date().toISOString();
                  const updated: LearnerProfile = {
                    ...existing,
                    ...updates,
                    id: existing.id,
                    user_id: existing.user_id,
                    created_at: existing.created_at,
                    updated_at: now,
                  };
                  store.set(targetUserId, updated);
                  return { data: { ...updated }, error: null };
                },
              };
            },
          };
          return query;
        },
      };
    },
    // Expose in-memory store for assertions
    _store: store,
  };

  return client as unknown as ProfileSupabaseClient & { _store: Map<string, LearnerProfile> };
}

async function runTests() {
  console.log('====================================================');
  console.log('Kannada Kaliri — Milestone 01 Profile Service Tests');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    totalCount++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      throw err;
    }
  }

  // Group 1: Type Guards & Constants
  console.log('--- Group 1: Type Guards & Domain Constants ---');

  await test('SUPPORTED constants contain expected values', () => {
    assert.deepEqual(Array.from(SUPPORTED_NATIVE_LANGUAGES), ['en', 'hi', 'ta', 'te', 'ml']);
    assert.deepEqual(Array.from(SUPPORTED_PROFICIENCY_LEVELS), ['beginner', 'elementary', 'intermediate']);
    assert.deepEqual(Array.from(SUPPORTED_DAILY_GOALS), [5, 10, 15, 20]);
    assert.equal(SUPPORTED_LEARNING_GOALS.length, 7);
  });

  await test('isNativeLanguage validates supported language codes', () => {
    assert.equal(isNativeLanguage('en'), true);
    assert.equal(isNativeLanguage('hi'), true);
    assert.equal(isNativeLanguage('ta'), true);
    assert.equal(isNativeLanguage('te'), true);
    assert.equal(isNativeLanguage('ml'), true);
    assert.equal(isNativeLanguage('fr'), false);
    assert.equal(isNativeLanguage(''), false);
    assert.equal(isNativeLanguage(123), false);
    assert.equal(isNativeLanguage(null), false);
  });

  await test('isProficiencyLevel validates proficiency tiers', () => {
    assert.equal(isProficiencyLevel('beginner'), true);
    assert.equal(isProficiencyLevel('elementary'), true);
    assert.equal(isProficiencyLevel('intermediate'), true);
    assert.equal(isProficiencyLevel('advanced'), false);
    assert.equal(isProficiencyLevel('expert'), false);
    assert.equal(isProficiencyLevel(null), false);
  });

  await test('isDailyGoalMinutes validates commitment intervals', () => {
    assert.equal(isDailyGoalMinutes(5), true);
    assert.equal(isDailyGoalMinutes(10), true);
    assert.equal(isDailyGoalMinutes(15), true);
    assert.equal(isDailyGoalMinutes(20), true);
    assert.equal(isDailyGoalMinutes(25), false);
    assert.equal(isDailyGoalMinutes(0), false);
    assert.equal(isDailyGoalMinutes('10'), false);
  });

  await test('isLearningGoal validates learning goal slugs', () => {
    assert.equal(isLearningGoal('everyday_conversations'), true);
    assert.equal(isLearningGoal('college_and_education'), true);
    assert.equal(isLearningGoal('workplace_communication'), true);
    assert.equal(isLearningGoal('shopping_and_daily_activities'), true);
    assert.equal(isLearningGoal('travel_and_exploring_karnataka'), true);
    assert.equal(isLearningGoal('communicating_with_local_communities'), true);
    assert.equal(isLearningGoal('understanding_kannada_culture'), true);
    assert.equal(isLearningGoal('random_slug'), false);
  });

  // Group 2: isOnboardingCompleted
  console.log('\n--- Group 2: isOnboardingCompleted ---');

  await test('TC-IOC-01: Returns false when no profile exists for user', async () => {
    const client = createMockSupabase();
    const result = await isOnboardingCompleted('user-no-profile', client);
    assert.equal(result, false);
  });

  await test('TC-IOC-02: Returns false when profile exists with onboarding_completed: false', async () => {
    const client = createMockSupabase();
    client._store.set('user-incomplete', {
      id: 'uuid-1',
      user_id: 'user-incomplete',
      full_name: 'Incomplete User',
      avatar_url: null,
      native_language: 'en',
      target_language: 'kn',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 5,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const result = await isOnboardingCompleted('user-incomplete', client);
    assert.equal(result, false);
  });

  await test('TC-IOC-03: Returns true when profile exists with onboarding_completed: true', async () => {
    const client = createMockSupabase();
    client._store.set('user-complete', {
      id: 'uuid-2',
      user_id: 'user-complete',
      full_name: 'Complete User',
      avatar_url: null,
      native_language: 'hi',
      target_language: 'kn',
      proficiency_level: 'elementary',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const result = await isOnboardingCompleted('user-complete', client);
    assert.equal(result, true);
  });

  await test('TC-IOC-04: Returns false when unauthenticated and no userId passed', async () => {
    const client = createMockSupabase(null);
    const result = await isOnboardingCompleted(undefined, client);
    assert.equal(result, false);
  });

  await test('TC-IOC-05: Resolves authenticated session user when userId is omitted', async () => {
    const user = { id: 'auth-user-99', email: 'learner@example.com' };
    const client = createMockSupabase(user);
    client._store.set(user.id, {
      id: 'uuid-3',
      user_id: user.id,
      full_name: 'Auth User',
      avatar_url: null,
      native_language: 'ta',
      target_language: 'kn',
      proficiency_level: 'intermediate',
      learning_goals: ['workplace_communication'],
      daily_goal_minutes: 15,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const result = await isOnboardingCompleted(undefined, client);
    assert.equal(result, true);
  });

  await test('TC-IOC-06: Gracefully returns false on database error without throwing', async () => {
    const client = createMockSupabase(null, { simulateQueryError: true });
    const result = await isOnboardingCompleted('any-user', client);
    assert.equal(result, false);
  });

  // Group 3: getLearnerProfile
  console.log('\n--- Group 3: getLearnerProfile ---');

  await test('TC-GLP-01: Returns null when unauthenticated and no userId passed', async () => {
    const client = createMockSupabase(null);
    const profile = await getLearnerProfile(undefined, client);
    assert.equal(profile, null);
  });

  await test('TC-GLP-02: Returns null when user has no profile row', async () => {
    const client = createMockSupabase({ id: 'user-empty', email: 'test@example.com' });
    const profile = await getLearnerProfile('user-empty', client);
    assert.equal(profile, null);
  });

  await test('TC-GLP-03: Returns profile when profile row exists', async () => {
    const client = createMockSupabase();
    const stored: LearnerProfile = {
      id: 'profile-uuid-1',
      user_id: 'user-101',
      full_name: 'Suresh Kumar',
      avatar_url: 'https://example.com/avatar.jpg',
      native_language: 'te',
      target_language: 'kn',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations', 'shopping_and_daily_activities'],
      daily_goal_minutes: 10,
      onboarding_completed: true,
      created_at: '2026-10-30T00:00:00.000Z',
      updated_at: '2026-10-30T00:00:00.000Z',
    };
    client._store.set('user-101', stored);

    const profile = await getLearnerProfile('user-101', client);
    assert.ok(profile);
    assert.equal(profile.id, 'profile-uuid-1');
    assert.equal(profile.user_id, 'user-101');
    assert.equal(profile.full_name, 'Suresh Kumar');
    assert.equal(profile.native_language, 'te');
    assert.deepEqual(profile.learning_goals, ['everyday_conversations', 'shopping_and_daily_activities']);
  });

  await test('TC-GLP-04: Throws ProfileServiceError on database error', async () => {
    const client = createMockSupabase(null, { simulateQueryError: true });
    await assert.rejects(
      async () => {
        await getLearnerProfile('user-err', client);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'PGRST500';
      }
    );
  });

  // Group 4: createLearnerProfile & Idempotent Upsert
  console.log('\n--- Group 4: createLearnerProfile & Idempotency ---');

  await test('TC-CLP-01: Creates profile for first-time user', async () => {
    const client = createMockSupabase({ id: 'usr-1', email: 'learner@kannadakaliri.org' });
    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-1',
      full_name: 'Ananya Sharma',
      avatar_url: 'https://lh3.googleusercontent.com/photo.jpg',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations', 'travel_and_exploring_karnataka'],
      daily_goal_minutes: 10,
      onboarding_completed: true,
    };

    const profile = await createLearnerProfile(payload, client);
    assert.ok(profile.id, 'Profile ID must be populated');
    assert.equal(profile.user_id, 'usr-1');
    assert.equal(profile.full_name, 'Ananya Sharma');
    assert.equal(profile.native_language, 'en');
    assert.equal(profile.target_language, 'kn');
    assert.equal(profile.proficiency_level, 'beginner');
    assert.equal(profile.daily_goal_minutes, 10);
    assert.equal(profile.onboarding_completed, true);
    assert.ok(profile.created_at);
    assert.ok(profile.updated_at);
  });

  await test('TC-CLP-02: Idempotent upsert preserves id, user_id, and created_at', async () => {
    const client = createMockSupabase({ id: 'usr-2', email: 'idempotent@kannadakaliri.org' });
    const initialPayload: CreateLearnerProfileDTO = {
      user_id: 'usr-2',
      full_name: 'Initial Name',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 5,
      onboarding_completed: true,
    };

    const initial = await createLearnerProfile(initialPayload, client);
    const initialId = initial.id;
    const initialCreatedAt = initial.created_at;

    // Second call with modified preferences
    const updatePayload: CreateLearnerProfileDTO = {
      user_id: 'usr-2',
      full_name: 'Updated Name',
      native_language: 'hi',
      proficiency_level: 'intermediate',
      learning_goals: ['workplace_communication', 'understanding_kannada_culture'],
      daily_goal_minutes: 20,
      onboarding_completed: true,
    };

    const updated = await createLearnerProfile(updatePayload, client);

    // Assert immutability of system fields
    assert.equal(updated.id, initialId, 'id MUST be preserved across upserts');
    assert.equal(updated.user_id, 'usr-2', 'user_id MUST be preserved across upserts');
    assert.equal(updated.created_at, initialCreatedAt, 'created_at MUST be preserved across upserts');

    // Assert update of mutable fields
    assert.equal(updated.full_name, 'Updated Name');
    assert.equal(updated.native_language, 'hi');
    assert.equal(updated.proficiency_level, 'intermediate');
    assert.equal(updated.daily_goal_minutes, 20);
    assert.deepEqual(updated.learning_goals, ['workplace_communication', 'understanding_kannada_culture']);

    // Assert total rows for user is strictly 1
    assert.equal(client._store.size, 1);
  });

  await test('TC-CLP-03: Concurrent submissions resolve safely without duplicate entries', async () => {
    const client = createMockSupabase({ id: 'usr-concurrent', email: 'concurrent@kannadakaliri.org' });
    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-concurrent',
      full_name: 'Concurrent User',
      native_language: 'ta',
      proficiency_level: 'elementary',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 15,
      onboarding_completed: true,
    };

    const [res1, res2] = await Promise.all([
      createLearnerProfile(payload, client),
      createLearnerProfile(payload, client),
    ]);

    assert.equal(res1.user_id, 'usr-concurrent');
    assert.equal(res2.user_id, 'usr-concurrent');
    assert.equal(client._store.size, 1, 'Store must contain exactly 1 row despite concurrent upserts');
  });

  await test('TC-CLP-04: Throws UNAUTHENTICATED when session has no user and user_id is omitted', async () => {
    const client = createMockSupabase(null);
    const payload = {
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    } as CreateLearnerProfileDTO;

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, client);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'UNAUTHENTICATED' && err.statusCode === 401;
      }
    );
  });

  // Group 5: Validation and Database Constraint Errors
  console.log('\n--- Group 5: Validation & Database Constraints ---');

  await test('TC-VAL-01: Rejects invalid native_language with VALIDATION_ERROR', async () => {
    const client = createMockSupabase({ id: 'usr-val-1', email: 'val1@example.com' });
    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-val-1',
      native_language: 'fr' as unknown as CreateLearnerProfileDTO['native_language'],
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    };

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, client);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR' && err.statusCode === 400;
      }
    );
  });

  await test('TC-VAL-02: Rejects invalid proficiency_level with VALIDATION_ERROR', async () => {
    const client = createMockSupabase({ id: 'usr-val-2', email: 'val2@example.com' });
    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-val-2',
      native_language: 'en',
      proficiency_level: 'advanced' as unknown as CreateLearnerProfileDTO['proficiency_level'],
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    };

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, client);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR' && err.statusCode === 400;
      }
    );
  });

  await test('TC-VAL-03: Rejects invalid daily_goal_minutes with VALIDATION_ERROR', async () => {
    const client = createMockSupabase({ id: 'usr-val-3', email: 'val3@example.com' });
    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-val-3',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 45 as unknown as CreateLearnerProfileDTO['daily_goal_minutes'],
    };

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, client);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR';
      }
    );
  });

  await test('TC-VAL-04: Rejects empty learning_goals array with VALIDATION_ERROR', async () => {
    const client = createMockSupabase({ id: 'usr-val-4', email: 'val4@example.com' });
    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-val-4',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: [],
      daily_goal_minutes: 10,
    };

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, client);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.message.includes('At least one learning goal');
      }
    );
  });

  await test('TC-ERR-01: Maps PostgreSQL 23514 check constraint errors to friendly message', async () => {
    const client = createMockSupabase(
      { id: 'usr-pg-err', email: 'err@example.com' },
      {
        simulateConstraintError: {
          code: '23514',
          message: 'new row for relation "learner_profiles" violates check constraint "chk_learner_profiles_native_language"',
        },
      }
    );

    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-pg-err',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    };

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, client);
      },
      (err: unknown) => {
        return (
          err instanceof ProfileServiceError &&
          err.code === 'CHECK_CONSTRAINT_VIOLATION' &&
          err.message.includes('Selected native language is not supported')
        );
      }
    );
  });

  await test('TC-ERR-02: Maps PostgreSQL 23503 foreign key violation to friendly message', async () => {
    const client = createMockSupabase(
      { id: 'usr-fk-err', email: 'fk@example.com' },
      {
        simulateConstraintError: {
          code: '23503',
          message: 'insert or update on table "learner_profiles" violates foreign key constraint',
        },
      }
    );

    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-fk-err',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    };

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, client);
      },
      (err: unknown) => {
        return (
          err instanceof ProfileServiceError &&
          err.code === 'FOREIGN_KEY_VIOLATION' &&
          err.message.includes('User account not recognized')
        );
      }
    );
  });

  await test('TC-ERR-03: Maps PostgreSQL 42501 insufficient privileges to 403 error', async () => {
    const client = createMockSupabase(
      { id: 'usr-rls-err', email: 'rls@example.com' },
      {
        simulateConstraintError: {
          code: '42501',
          message: 'permission denied for table learner_profiles',
        },
      }
    );

    const payload: CreateLearnerProfileDTO = {
      user_id: 'usr-rls-err',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    };

    await assert.rejects(
      async () => {
        await createLearnerProfile(payload, client);
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

  // Group 6: updateLearnerProfile
  console.log('\n--- Group 6: updateLearnerProfile ---');

  await test('TC-ULP-01: Rejects empty userId with INVALID_ARGUMENT', async () => {
    const client = createMockSupabase();
    await assert.rejects(
      async () => {
        await updateLearnerProfile('', { daily_goal_minutes: 15 }, client);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'INVALID_ARGUMENT';
      }
    );
  });

  await test('TC-ULP-02: Successfully updates partial fields and preserves unmodified fields', async () => {
    const client = createMockSupabase();
    const stored: LearnerProfile = {
      id: 'uuid-update-1',
      user_id: 'user-to-update',
      full_name: 'Original Name',
      avatar_url: 'https://example.com/original.jpg',
      native_language: 'en',
      target_language: 'kn',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
      onboarding_completed: true,
      created_at: '2026-10-30T00:00:00.000Z',
      updated_at: '2026-10-30T00:00:00.000Z',
    };
    client._store.set('user-to-update', stored);

    const updated = await updateLearnerProfile(
      'user-to-update',
      { daily_goal_minutes: 20, proficiency_level: 'elementary' },
      client
    );

    assert.equal(updated.id, 'uuid-update-1');
    assert.equal(updated.user_id, 'user-to-update');
    assert.equal(updated.full_name, 'Original Name', 'full_name should be preserved');
    assert.equal(updated.avatar_url, 'https://example.com/original.jpg', 'avatar_url should be preserved');
    assert.equal(updated.native_language, 'en', 'native_language should be preserved');
    assert.equal(updated.daily_goal_minutes, 20, 'daily_goal_minutes should be updated');
    assert.equal(updated.proficiency_level, 'elementary', 'proficiency_level should be updated');
  });

  await test('TC-ULP-03: Throws NOT_FOUND when updating non-existent profile', async () => {
    const client = createMockSupabase();
    await assert.rejects(
      async () => {
        await updateLearnerProfile('non-existent-user', { daily_goal_minutes: 15 }, client);
      },
      (err: unknown) => {
        return err instanceof ProfileServiceError && err.code === 'NOT_FOUND' && err.statusCode === 404;
      }
    );
  });

  console.log(`\n====================================================`);
  console.log(`Results: ${passedCount}/${totalCount} tests passed!`);
  console.log(`====================================================\n`);
}

runTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
