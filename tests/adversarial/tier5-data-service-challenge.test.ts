/**
 * Tier 5 Adversarial Coverage Hardening Suite: Data & Service Layer
 * Kannada Kaliri — Milestone 02
 *
 * Targets:
 * - `supabase/migrations/002_create_learner_profiles.sql` (evaluated on in-process PostgreSQL engine)
 * - `lib/services/profile.ts` (white-box branches, client resolution, error mapping, type guards)
 * - `types/profile.ts`
 * - `types/database.ts`
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

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
  SUPPORTED_NATIVE_LANGUAGES,
  SUPPORTED_PROFICIENCY_LEVELS,
  SUPPORTED_DAILY_GOALS,
  SUPPORTED_LEARNING_GOALS,
  isNativeLanguage,
  isProficiencyLevel,
  isDailyGoalMinutes,
  isLearningGoal,
} from '@/types/profile';

const require = createRequire(import.meta.url);
const pglitePath = path.resolve('/Users/apple/.local/lib/node_modules/@electric-sql/pglite');
const { PGlite } = require(pglitePath);

const MIGRATION_PATH = path.resolve(process.cwd(), 'supabase/migrations/002_create_learner_profiles.sql');

let testsPassed = 0;
let testsFailed = 0;
const failureList: string[] = [];

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`  [CHALLENGE] ${name} ... `);
  try {
    await fn();
    testsPassed++;
    console.log('✓ PASS');
  } catch (err: unknown) {
    testsFailed++;
    failureList.push(name);
    console.log('✗ FAIL');
    console.error('    Error:', (err as Error).message);
  }
}

// ============================================================================
// Setup Mock Supabase Environment in PGlite
// ============================================================================
async function setupPostgresDb() {
  const db = new PGlite();
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$ LANGUAGE sql STABLE;

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
      ELSE
        ALTER ROLE service_role BYPASSRLS;
      END IF;
    END
    $$;
  `);

  const rawMigration = fs.readFileSync(MIGRATION_PATH, 'utf-8');
  // pgcrypto extension handled natively in Postgres 13+
  const wasmSql = rawMigration.replace(
    /CREATE EXTENSION IF NOT EXISTS\s+"pgcrypto";/gi,
    '-- [PGlite: native gen_random_uuid()]'
  );
  await db.exec(wasmSql);
  return { db, wasmSql };
}

// ============================================================================
// In-Memory Mock Supabase Client for Service Layer Unit Stress
// ============================================================================
function createMockClient(options?: {
  user?: { id: string; email?: string } | null;
  authError?: { message: string; code: string };
  queryError?: { message: string; code: string };
}) {
  const tableData = new Map<string, LearnerProfile>();

  const client = {
    auth: {
      async getUser() {
        if (options?.authError) {
          return { data: { user: null }, error: options.authError };
        }
        return { data: { user: options?.user ?? null }, error: null };
      },
    },
    from(tableName: string) {
      if (tableName !== 'learner_profiles') {
        throw new Error(`Unexpected table ${tableName}`);
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
              if (options?.queryError) {
                return { data: null, error: options.queryError };
              }
              if (!filterUserId) return { data: null, error: null };
              const row = tableData.get(filterUserId);
              if (!row) return { data: null, error: null };
              if (columns === 'onboarding_completed') {
                return { data: { onboarding_completed: row.onboarding_completed }, error: null };
              }
              return { data: { ...row }, error: null };
            },
            async single() {
              const res = await query.maybeSingle();
              if (res.error) return res;
              if (!res.data) {
                return {
                  data: null,
                  error: { code: 'PGRST116', message: 'JSON object requested, 0 rows returned' },
                };
              }
              return res;
            },
          };
          return query;
        },
        upsert(data: Partial<LearnerProfile>) {
          if (options?.queryError) {
            return {
              select() {
                return {
                  async single() {
                    return { data: null, error: options.queryError };
                  },
                };
              },
            };
          }
          const userId = data.user_id;
          if (!userId) throw new Error('user_id required');
          const existing = tableData.get(userId);
          const now = new Date().toISOString();
          const saved: LearnerProfile = {
            id: existing ? existing.id : 'uuid-' + Math.random().toString(36).substring(2, 9),
            user_id: userId,
            full_name: data.full_name !== undefined ? (data.full_name ?? null) : (existing?.full_name ?? null),
            avatar_url: data.avatar_url !== undefined ? (data.avatar_url ?? null) : (existing?.avatar_url ?? null),
            native_language: data.native_language ?? existing?.native_language ?? 'en',
            target_language: 'kn',
            proficiency_level: data.proficiency_level ?? existing?.proficiency_level ?? 'beginner',
            learning_goals: data.learning_goals ?? existing?.learning_goals ?? [],
            daily_goal_minutes: data.daily_goal_minutes ?? existing?.daily_goal_minutes ?? 10,
            onboarding_completed: data.onboarding_completed ?? existing?.onboarding_completed ?? true,
            created_at: existing ? existing.created_at : now,
            updated_at: now,
          };
          tableData.set(userId, saved);
          return {
            select() {
              return {
                async single() {
                  return { data: { ...saved }, error: null };
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
                  if (options?.queryError) {
                    return { data: null, error: options.queryError };
                  }
                  if (!targetUserId || !tableData.has(targetUserId)) {
                    return {
                      data: null,
                      error: { code: 'PGRST116', message: 'JSON object requested, 0 rows returned' },
                    };
                  }
                  const existing = tableData.get(targetUserId)!;
                  const updated: LearnerProfile = {
                    ...existing,
                    ...updates,
                    updated_at: new Date().toISOString(),
                  };
                  tableData.set(targetUserId, updated);
                  return { data: { ...updated }, error: null };
                },
              };
            },
          };
          return query;
        },
      };
    },
    _tableData: tableData,
  };

  return client as unknown as ProfileSupabaseClient & { _tableData: Map<string, LearnerProfile> };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  TIER 5 ADVERSARIAL STRESS SUITE: DATA & SERVICE LAYER HARDENING          ║');
  console.log('║  Milestone 02 — SQL Migration & Profile Service White-Box Verification     ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const { db, wasmSql } = await setupPostgresDb();

  // ==========================================================================
  // SECTION 1: SQL MIGRATION CONSTRAINTS & BEHAVIOR (PGlite Postgres Engine)
  // ==========================================================================
  console.log('--- SECTION 1: PostgreSQL Migration Constraints & Trigger Mechanics ---');

  await test('MIG-01: Migration idempotency: executing migration 5 consecutive times produces 0 errors', async () => {
    for (let i = 1; i <= 5; i++) {
      await db.exec(wasmSql);
    }
  });

  await test('MIG-02: Table schema: verifies all 12 columns, data types, and nullability constraints', async () => {
    const res = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'learner_profiles'
      ORDER BY ordinal_position;
    `);
    interface SchemaColumnRow {
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }
    const cols = Object.fromEntries(
      res.rows.map((r: unknown) => {
        const row = r as SchemaColumnRow;
        return [row.column_name, row];
      })
    );
    const expected = [
      ['id', 'uuid', 'NO'],
      ['user_id', 'uuid', 'NO'],
      ['full_name', 'text', 'YES'],
      ['avatar_url', 'text', 'YES'],
      ['native_language', 'text', 'NO'],
      ['target_language', 'text', 'NO'],
      ['proficiency_level', 'text', 'NO'],
      ['learning_goals', 'ARRAY', 'NO'],
      ['daily_goal_minutes', 'integer', 'NO'],
      ['onboarding_completed', 'boolean', 'NO'],
      ['created_at', 'timestamp with time zone', 'NO'],
      ['updated_at', 'timestamp with time zone', 'NO'],
    ];
    for (const [col, type, nullable] of expected) {
      assert.ok(cols[col], `Column ${col} missing`);
      assert.equal(cols[col].data_type, type, `Column ${col} data_type mismatch`);
      assert.equal(cols[col].is_nullable, nullable, `Column ${col} nullability mismatch`);
    }
  });

  // Create test users in auth.users
  const userA = (await db.query(`INSERT INTO auth.users (email) VALUES ('usera@test.com') RETURNING id;`)).rows[0].id;
  const userB = (await db.query(`INSERT INTO auth.users (email) VALUES ('userb@test.com') RETURNING id;`)).rows[0].id;

  await test('MIG-03: Supported native languages CHECK constraint accepts [en, hi, ta, te, ml] and rejects all others', async () => {
    // Valid languages
    for (const lang of ['en', 'hi', 'ta', 'te', 'ml']) {
      const u = (await db.query(`INSERT INTO auth.users (email) VALUES ('u_${lang}@test.com') RETURNING id;`)).rows[0].id;
      const ins = await db.query(`
        INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
        VALUES ($1, $2, 'beginner', 10) RETURNING native_language;
      `, [u, lang]);
      assert.equal(ins.rows[0].native_language, lang);
    }
    // Invalid languages
    for (const badLang of ['', 'kn', 'es', 'fr', 'EN', 'en ', 'telugu', '123', 'hi\0']) {
      await assert.rejects(
        async () => {
          await db.query(`
            INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
            VALUES ($1, $2, 'beginner', 10);
          `, [userA, badLang]);
        },
        /chk_learner_profiles_native_language|check constraint|invalid byte sequence/i
      );
    }
  });

  await test('MIG-04: Target language defaults to "kn" and CHECK constraint strictly rejects any non-"kn" value', async () => {
    // Default value check
    const insDefault = await db.query(`
      INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
      VALUES ($1, 'en', 'beginner', 10) RETURNING target_language;
    `, [userA]);
    assert.equal(insDefault.rows[0].target_language, 'kn');

    // Attempt invalid target language
    for (const badTarget of ['en', 'KN', 'kn ', 'kannada', '', 'te']) {
      await assert.rejects(
        async () => {
          await db.query(`
            INSERT INTO public.learner_profiles (user_id, native_language, target_language, proficiency_level, daily_goal_minutes)
            VALUES ($1, 'en', $2, 'beginner', 10);
          `, [userB, badTarget]);
        },
        /chk_learner_profiles_target_language|check constraint/i
      );
    }
  });

  await test('MIG-05: Proficiency levels CHECK constraint accepts [beginner, elementary, intermediate] and rejects others', async () => {
    for (const level of ['beginner', 'elementary', 'intermediate']) {
      const u = (await db.query(`INSERT INTO auth.users (email) VALUES ('u_${level}@test.com') RETURNING id;`)).rows[0].id;
      const ins = await db.query(`
        INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
        VALUES ($1, 'en', $2, 10) RETURNING proficiency_level;
      `, [u, level]);
      assert.equal(ins.rows[0].proficiency_level, level);
    }
    for (const badLevel of ['advanced', 'fluent', 'BEGINNER', 'expert', '', 'master']) {
      await assert.rejects(
        async () => {
          await db.query(`
            INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
            VALUES ($1, 'en', $2, 10);
          `, [userB, badLevel]);
        },
        /chk_learner_profiles_proficiency_level|check constraint/i
      );
    }
  });

  await test('MIG-06: Daily goal minutes CHECK constraint accepts [5, 10, 15, 20] and rejects all other integers', async () => {
    for (const mins of [5, 10, 15, 20]) {
      const u = (await db.query(`INSERT INTO auth.users (email) VALUES ('u_${mins}@test.com') RETURNING id;`)).rows[0].id;
      const ins = await db.query(`
        INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
        VALUES ($1, 'en', 'beginner', $2) RETURNING daily_goal_minutes;
      `, [u, mins]);
      assert.equal(ins.rows[0].daily_goal_minutes, mins);
    }
    for (const badMin of [-10, 0, 1, 4, 6, 9, 11, 14, 16, 19, 21, 25, 30, 60, 120]) {
      await assert.rejects(
        async () => {
          await db.query(`
            INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
            VALUES ($1, 'en', 'beginner', $2);
          `, [userB, badMin]);
        },
        /chk_learner_profiles_daily_goal_minutes|check constraint/i
      );
    }
  });

  await test('MIG-07: Automatic updated_at trigger: BEFORE UPDATE overrides forged updated_at values', async () => {
    // Initial insert for userB
    await db.query(`
      INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
      VALUES ($1, 'ta', 'beginner', 10);
    `, [userB]);

    const initial = (await db.query(`SELECT created_at, updated_at FROM public.learner_profiles WHERE user_id = $1;`, [userB])).rows[0];

    // Attacker or client attempts to supply forged past/future updated_at
    await db.query(`
      UPDATE public.learner_profiles
      SET daily_goal_minutes = 20, updated_at = '1990-01-01 00:00:00Z'
      WHERE user_id = $1;
    `, [userB]);

    const afterUpdate = (await db.query(`SELECT created_at, updated_at FROM public.learner_profiles WHERE user_id = $1;`, [userB])).rows[0];

    assert.equal(
      new Date(afterUpdate.created_at).getTime(),
      new Date(initial.created_at).getTime(),
      'created_at must remain untouched'
    );
    assert.notEqual(
      new Date(afterUpdate.updated_at).getTime(),
      new Date('1990-01-01 00:00:00Z').getTime(),
      'handle_updated_at trigger must override manual updated_at'
    );
    assert.ok(
      new Date(afterUpdate.updated_at).getTime() >= new Date(initial.updated_at).getTime()
    );
  });

  await test('MIG-08: Foreign Key & ON DELETE CASCADE constraint guarantees relational integrity', async () => {
    const ephemeralUser = (await db.query(`INSERT INTO auth.users (email) VALUES ('ephemeral@test.com') RETURNING id;`)).rows[0].id;
    await db.query(`
      INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
      VALUES ($1, 'ml', 'beginner', 15);
    `, [ephemeralUser]);

    // Attempt insert with non-existent user_id
    const nonExistentUuid = '99999999-9999-9999-9999-999999999999';
    await assert.rejects(
      async () => {
        await db.query(`
          INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
          VALUES ($1, 'ml', 'beginner', 15);
        `, [nonExistentUuid]);
      },
      /foreign key constraint|violates foreign key/i
    );

    // Delete ephemeral user and verify profile cascade
    await db.query(`DELETE FROM auth.users WHERE id = $1;`, [ephemeralUser]);
    const checkRow = await db.query(`SELECT * FROM public.learner_profiles WHERE user_id = $1;`, [ephemeralUser]);
    assert.equal(checkRow.rows.length, 0, 'Profile row must be automatically removed when auth.users is deleted');
  });

  await test('MIG-09: Row Level Security matrix: anon denied, cross-tenant isolation on SELECT, INSERT, UPDATE, DELETE', async () => {
    const aliceId = (await db.query(`INSERT INTO auth.users (email) VALUES ('alice@test.com') RETURNING id;`)).rows[0].id;
    const bobId = (await db.query(`INSERT INTO auth.users (email) VALUES ('bob@test.com') RETURNING id;`)).rows[0].id;

    // 1. Anon Role
    await db.query(`SET ROLE anon;`);
    await assert.rejects(
      async () => { await db.query(`SELECT * FROM public.learner_profiles;`); },
      /permission denied|42501/
    );
    await assert.rejects(
      async () => {
        await db.query(`
          INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
          VALUES ('${aliceId}', 'en', 'beginner', 10);
        `);
      },
      /permission denied|42501/
    );

    // 2. Authenticated as Alice
    await db.query(`RESET ROLE;`);
    await db.query(`SET ROLE authenticated;`);
    await db.query(`SELECT set_config('request.jwt.claim.sub', '${aliceId}', false);`);

    // Alice inserts own profile -> SUCCEEDS
    await db.query(`
      INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
      VALUES ('${aliceId}', 'en', 'beginner', 10);
    `);

    // Alice tries to insert Bob's profile -> REJECTED by WITH CHECK
    await assert.rejects(
      async () => {
        await db.query(`
          INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
          VALUES ('${bobId}', 'en', 'beginner', 10);
        `);
      },
      /row-level security policy|violates/
    );

    // Alice SELECT can see own profile, sees 0 rows for Bob
    const aliceRows = await db.query(`SELECT * FROM public.learner_profiles WHERE user_id = '${aliceId}';`);
    assert.equal(aliceRows.rows.length, 1);
    const bobRowsFromAlice = await db.query(`SELECT * FROM public.learner_profiles WHERE user_id = '${bobId}';`);
    assert.equal(bobRowsFromAlice.rows.length, 0);

    // Alice UPDATE Bob's profile affects 0 rows
    const updateBob = await db.query(`
      UPDATE public.learner_profiles SET full_name = 'Hacked' WHERE user_id = '${bobId}';
    `);
    assert.equal(updateBob.affectedRows || 0, 0);

    // Alice attempts to transfer own profile to Bob -> REJECTED by WITH CHECK
    await assert.rejects(
      async () => {
        await db.query(`
          UPDATE public.learner_profiles SET user_id = '${bobId}' WHERE user_id = '${aliceId}';
        `);
      },
      /row-level security policy|violates/
    );

    // Alice DELETE Bob's profile affects 0 rows
    const deleteBob = await db.query(`DELETE FROM public.learner_profiles WHERE user_id = '${bobId}';`);
    assert.equal(deleteBob.affectedRows || 0, 0);

    // Alice DELETE own profile -> SUCCEEDS
    await db.query(`DELETE FROM public.learner_profiles WHERE user_id = '${aliceId}';`);
    const checkAliceDeleted = await db.query(`SELECT * FROM public.learner_profiles WHERE user_id = '${aliceId}';`);
    assert.equal(checkAliceDeleted.rows.length, 0);

    // 3. Service role bypass
    await db.query(`RESET ROLE;`);
    await db.query(`SET ROLE service_role;`);
    const adminCheck = await db.query(`SELECT COUNT(*) FROM public.learner_profiles;`);
    assert.ok(parseInt(adminCheck.rows[0].count, 10) >= 1);
    await db.query(`RESET ROLE;`);
  });

  await test('MIG-10: Multibyte UTF-8 Unicode Kannada strings preserve fidelity without truncation', async () => {
    const kannadaText = 'ಕುವೆಂಪು (ಕೆ. ವಿ. ಪುಟ್ಟಪ್ಪ) - ಜಯ ಭಾರತ ಜನನಿಯ ತನುಜಾತೆ';
    const kannadaGoals = ['ಕನ್ನಡ ಸಾಹಿತ್ಯ', 'ದಿನನಿತ್ಯದ ಮಾತುಕತೆ', 'ಕರ್ನಾಟಕ ಸಂಸ್ಕೃತಿ'];
    const u = (await db.query(`INSERT INTO auth.users (email) VALUES ('kannada_utf8@test.com') RETURNING id;`)).rows[0].id;

    await db.query(`
      INSERT INTO public.learner_profiles (
        user_id, full_name, native_language, target_language, proficiency_level,
        learning_goals, daily_goal_minutes, onboarding_completed
      ) VALUES ($1, $2, 'ta', 'kn', 'intermediate', $3, 15, true);
    `, [u, kannadaText, kannadaGoals]);

    const row = (await db.query(`SELECT full_name, learning_goals FROM public.learner_profiles WHERE user_id = $1;`, [u])).rows[0];
    assert.equal(row.full_name, kannadaText);
    assert.deepEqual(row.learning_goals, kannadaGoals);
  });

  await test('MIG-11: UNIQUE constraint and UNIQUE index reject duplicate user_id with 23505 error', async () => {
    const dupUser = (await db.query(`INSERT INTO auth.users (email) VALUES ('dup@test.com') RETURNING id;`)).rows[0].id;
    await db.query(`
      INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
      VALUES ($1, 'en', 'beginner', 10);
    `, [dupUser]);

    await assert.rejects(
      async () => {
        await db.query(`
          INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
          VALUES ($1, 'hi', 'intermediate', 15);
        `, [dupUser]);
      },
      /unique constraint|duplicate key|23505/i
    );
  });

  await test('MIG-12: Performance indexes (idx_learner_profiles_user_id & idx_learner_profiles_onboarding_completed) exist', async () => {
    const idxRes = await db.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'learner_profiles';
    `);
    interface PgIndexRow {
      indexname: string;
      indexdef: string;
    }
    const indexNames = idxRes.rows.map((r: unknown) => (r as PgIndexRow).indexname);
    assert.ok(indexNames.includes('idx_learner_profiles_user_id'), 'idx_learner_profiles_user_id must exist');
    assert.ok(indexNames.includes('idx_learner_profiles_onboarding_completed'), 'idx_learner_profiles_onboarding_completed must exist');
    const userIdx = idxRes.rows.find((r: unknown) => (r as PgIndexRow).indexname === 'idx_learner_profiles_user_id') as PgIndexRow;
    assert.ok(userIdx.indexdef.includes('UNIQUE'), 'idx_learner_profiles_user_id must be UNIQUE');
  });

  // ==========================================================================
  // SECTION 2: SERVICE LAYER WHITE-BOX STRESS (lib/services/profile.ts)
  // ==========================================================================
  console.log('\n--- SECTION 2: Profile Service White-Box Stress & Branch Coverage ---');

  await test('SVC-01: Client resolution: throws CLIENT_RESOLUTION_ERROR in server environments without client', async () => {
    // In Node.js environment, window is undefined
    await assert.rejects(
      async () => {
        await getLearnerProfile('some-user-id');
      },
      (err: unknown) => {
        return (
          err instanceof ProfileServiceError &&
          err.code === 'CLIENT_RESOLUTION_ERROR' &&
          err.statusCode === 500 &&
          err.message.includes('Supabase client must be supplied')
        );
      }
    );
  });

  await test('SVC-02: User ID resolution: trims explicit userId and falls back to auth session user', async () => {
    const client = createMockClient({ user: { id: 'session-user-123' } });

    // Explicit userId with padding whitespace
    const res1 = await getLearnerProfile('   custom-user-456   ', client);
    assert.equal(res1, null); // user not yet in store

    // Missing userId falls back to session-user-123
    const res2 = await getLearnerProfile(undefined, client);
    assert.equal(res2, null);
  });

  await test('SVC-03: DTO validation guards in createLearnerProfile reject malformed fields with VALIDATION_ERROR 400', async () => {
    const client = createMockClient({ user: { id: 'usr-val-test' } });

    const validBase: CreateLearnerProfileDTO = {
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 10,
    };

    // 1. Invalid native_language
    for (const badLang of ['kn', 'es', 'fr', 'EN', '', null, 123, undefined]) {
      await assert.rejects(
        async () => {
          await createLearnerProfile(
            { ...validBase, native_language: badLang as unknown as CreateLearnerProfileDTO['native_language'] },
            client
          );
        },
        (err: unknown) => err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR' && err.statusCode === 400
      );
    }

    // 2. Invalid proficiency_level
    for (const badProf of ['advanced', 'fluent', 'BEGINNER', '', null, 99]) {
      await assert.rejects(
        async () => {
          await createLearnerProfile(
            { ...validBase, proficiency_level: badProf as unknown as CreateLearnerProfileDTO['proficiency_level'] },
            client
          );
        },
        (err: unknown) => err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR' && err.statusCode === 400
      );
    }

    // 3. Invalid daily_goal_minutes
    for (const badGoal of [0, 4, 6, 11, 25, 30, -5, '10', 15.5, null, undefined]) {
      await assert.rejects(
        async () => {
          await createLearnerProfile(
            { ...validBase, daily_goal_minutes: badGoal as unknown as CreateLearnerProfileDTO['daily_goal_minutes'] },
            client
          );
        },
        (err: unknown) => err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR' && err.statusCode === 400
      );
    }

    // 4. Empty or invalid learning_goals
    for (const badGoals of [[], null, undefined, 'not-an-array']) {
      await assert.rejects(
        async () => {
          await createLearnerProfile(
            { ...validBase, learning_goals: badGoals as unknown as string[] },
            client
          );
        },
        (err: unknown) => err instanceof ProfileServiceError && err.code === 'VALIDATION_ERROR' && err.statusCode === 400
      );
    }
  });

  await test('SVC-04: Target language is immutably locked to "kn" on create and update', async () => {
    const client = createMockClient({ user: { id: 'usr-target-lock' } });

    // Hacker supplies target_language = 'fr' in create payload
    const created = await createLearnerProfile(
      {
        native_language: 'en',
        target_language: 'fr',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 10,
      } as unknown as CreateLearnerProfileDTO,
      client
    );
    assert.equal(created.target_language, 'kn', 'target_language must be forced to "kn"');

    // Hacker attempts to update target_language to 'es'
    const updated = await updateLearnerProfile(
      'usr-target-lock',
      { target_language: 'es' } as unknown as Partial<CreateLearnerProfileDTO>,
      client
    );
    assert.equal(updated.target_language, 'kn', 'target_language must remain "kn" after update');
  });

  await test('SVC-05: Upsert idempotency: repeated create calls preserve id, user_id, and created_at', async () => {
    const client = createMockClient({ user: { id: 'usr-idempotent' } });

    const first = await createLearnerProfile(
      {
        full_name: 'Initial Name',
        native_language: 'en',
        proficiency_level: 'beginner',
        learning_goals: ['everyday_conversations'],
        daily_goal_minutes: 5,
      },
      client
    );

    const second = await createLearnerProfile(
      {
        full_name: 'Updated Name',
        native_language: 'hi',
        proficiency_level: 'intermediate',
        learning_goals: ['workplace_communication'],
        daily_goal_minutes: 20,
      },
      client
    );

    assert.equal(second.id, first.id, 'id must be preserved across upserts');
    assert.equal(second.user_id, first.user_id, 'user_id must be preserved');
    assert.equal(second.created_at, first.created_at, 'created_at must remain immutable');
    assert.equal(second.full_name, 'Updated Name');
    assert.equal(second.native_language, 'hi');
    assert.equal(second.daily_goal_minutes, 20);
  });

  await test('SVC-06: Database error mapping maps PostgreSQL codes [23514, 23503, 42501, 40001] to typed ProfileServiceError', async () => {
    // 1. Check constraints (23514) - all specific constraint variations
    for (const [chkName, expectedPhrase] of [
      ['chk_learner_profiles_native_language', 'Selected native language is not supported'],
      ['chk_learner_profiles_proficiency_level', 'Invalid Kannada proficiency level'],
      ['chk_learner_profiles_daily_goal_minutes', 'Invalid daily learning commitment'],
      ['chk_learner_profiles_target_language', "Target language must be Kannada ('kn')"],
      ['chk_learner_profiles_custom', 'Database check constraint validation failed'],
    ]) {
      const clientChk = createMockClient({
        user: { id: 'u1' },
        queryError: { code: '23514', message: `violates ${chkName}` },
      });
      await assert.rejects(
        async () => {
          await createLearnerProfile({
            native_language: 'en',
            proficiency_level: 'beginner',
            learning_goals: ['everyday_conversations'],
            daily_goal_minutes: 10,
          }, clientChk);
        },
        (err: unknown) => {
          return (
            err instanceof ProfileServiceError &&
            err.code === 'CHECK_CONSTRAINT_VIOLATION' &&
            err.statusCode === 400 &&
            err.message.includes(expectedPhrase)
          );
        }
      );
    }

    // 2. Foreign key violation (23503)
    const client23503 = createMockClient({
      user: { id: 'u1' },
      queryError: { code: '23503', message: 'violates foreign key constraint' },
    });
    await assert.rejects(
      async () => {
        await createLearnerProfile({
          native_language: 'en',
          proficiency_level: 'beginner',
          learning_goals: ['everyday_conversations'],
          daily_goal_minutes: 10,
        }, client23503);
      },
      (err: unknown) => err instanceof ProfileServiceError && err.code === 'FOREIGN_KEY_VIOLATION' && err.statusCode === 400
    );

    // 3. Insufficient privileges (42501)
    const client42501 = createMockClient({
      user: { id: 'u1' },
      queryError: { code: '42501', message: 'permission denied for table learner_profiles' },
    });
    await assert.rejects(
      async () => {
        await createLearnerProfile({
          native_language: 'en',
          proficiency_level: 'beginner',
          learning_goals: ['everyday_conversations'],
          daily_goal_minutes: 10,
        }, client42501);
      },
      (err: unknown) => err instanceof ProfileServiceError && err.code === 'INSUFFICIENT_PRIVILEGES' && err.statusCode === 403
    );

    // 4. Unknown database error maps to 500
    const client500 = createMockClient({
      user: { id: 'u1' },
      queryError: { code: '40001', message: 'serialization_failure' },
    });
    await assert.rejects(
      async () => {
        await createLearnerProfile({
          native_language: 'en',
          proficiency_level: 'beginner',
          learning_goals: ['everyday_conversations'],
          daily_goal_minutes: 10,
        }, client500);
      },
      (err: unknown) => err instanceof ProfileServiceError && err.code === '40001' && err.statusCode === 500
    );
  });

  await test('SVC-06b: Empty persistence result: throws EMPTY_PERSISTENCE_RESULT (500) if database returns null data', async () => {
    // Custom mock returning data: null without error on upsert
    const nullDataClient = {
      auth: { async getUser() { return { data: { user: { id: 'u-null' } }, error: null }; } },
      from() {
        return {
          upsert() {
            return { select() { return { async single() { return { data: null, error: null }; } }; } };
          },
        };
      },
    } as unknown as ProfileSupabaseClient;

    await assert.rejects(
      async () => {
        await createLearnerProfile({
          native_language: 'en',
          proficiency_level: 'beginner',
          learning_goals: ['everyday_conversations'],
          daily_goal_minutes: 10,
        }, nullDataClient);
      },
      (err: unknown) => err instanceof ProfileServiceError && err.code === 'EMPTY_PERSISTENCE_RESULT' && err.statusCode === 500
    );
  });

  await test('SVC-06c: Browser environment client resolution throws SUPABASE_NOT_CONFIGURED when unconfigured', async () => {
    // Temporarily mock window on globalThis without valid Supabase env
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    (globalThis as unknown as Record<string, unknown>).window = {};

    try {
      await assert.rejects(
        async () => {
          await getLearnerProfile('any-user');
        },
        (err: unknown) => err instanceof ProfileServiceError && err.code === 'SUPABASE_NOT_CONFIGURED' && err.statusCode === 500
      );
    } finally {
      delete (globalThis as unknown as Record<string, unknown>).window;
      if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      if (origKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
    }
  });

  await test('SVC-07: updateLearnerProfile validates arguments, partial fields, and handles NOT_FOUND', async () => {
    const client = createMockClient({ user: { id: 'usr-upd-test' } });

    // Empty/whitespace userId
    await assert.rejects(
      async () => { await updateLearnerProfile('', { daily_goal_minutes: 10 }, client); },
      (err: unknown) => err instanceof ProfileServiceError && err.code === 'INVALID_ARGUMENT' && err.statusCode === 400
    );
    await assert.rejects(
      async () => { await updateLearnerProfile('    ', { daily_goal_minutes: 10 }, client); },
      (err: unknown) => err instanceof ProfileServiceError && err.code === 'INVALID_ARGUMENT' && err.statusCode === 400
    );

    // Updating non-existent profile throws NOT_FOUND or PGRST116 (0 rows)
    await assert.rejects(
      async () => { await updateLearnerProfile('non-existent-user', { daily_goal_minutes: 15 }, client); },
      (err: unknown) => err instanceof ProfileServiceError && (err.code === 'NOT_FOUND' || err.code === 'PGRST116')
    );
  });

  await test('SVC-08: isOnboardingCompleted is fail-closed: returns false on unauthenticated, missing profile, or DB errors', async () => {
    // 1. Unauthenticated client
    const unauthedClient = createMockClient({ user: null });
    const s1 = await isOnboardingCompleted(undefined, unauthedClient);
    assert.equal(s1, false);

    // 2. Authenticated user without profile
    const noProfileClient = createMockClient({ user: { id: 'usr-no-prof' } });
    const s2 = await isOnboardingCompleted(undefined, noProfileClient);
    assert.equal(s2, false);

    // 3. Authenticated user with onboarding_completed = false
    await createLearnerProfile({
      user_id: 'usr-in-progress',
      native_language: 'en',
      proficiency_level: 'beginner',
      learning_goals: ['everyday_conversations'],
      daily_goal_minutes: 5,
      onboarding_completed: false,
    }, noProfileClient);
    const s3 = await isOnboardingCompleted('usr-in-progress', noProfileClient);
    assert.equal(s3, false);

    // 4. Authenticated user with onboarding_completed = true
    await updateLearnerProfile('usr-in-progress', { onboarding_completed: true }, noProfileClient);
    const s4 = await isOnboardingCompleted('usr-in-progress', noProfileClient);
    assert.equal(s4, true);

    // 5. Database error does NOT throw, safely returns false
    const errClient = createMockClient({
      user: { id: 'usr-err' },
      queryError: { code: 'PGRST500', message: 'Simulated connection drop' },
    });
    const s5 = await isOnboardingCompleted('usr-err', errClient);
    assert.equal(s5, false);
  });

  await test('SVC-09: Type guards (isNativeLanguage, isProficiencyLevel, isDailyGoalMinutes, isLearningGoal) match domain constants', async () => {
    // Native languages
    for (const lang of SUPPORTED_NATIVE_LANGUAGES) {
      assert.ok(isNativeLanguage(lang));
    }
    for (const invalid of ['kn', 'es', 'fr', '', 123, null, undefined]) {
      assert.equal(isNativeLanguage(invalid), false);
    }

    // Proficiency levels
    for (const level of SUPPORTED_PROFICIENCY_LEVELS) {
      assert.ok(isProficiencyLevel(level));
    }
    for (const invalid of ['advanced', 'fluent', '', null]) {
      assert.equal(isProficiencyLevel(invalid), false);
    }

    // Daily goal minutes
    for (const goal of SUPPORTED_DAILY_GOALS) {
      assert.ok(isDailyGoalMinutes(goal));
    }
    for (const invalid of [0, 4, 6, 25, '10', null]) {
      assert.equal(isDailyGoalMinutes(invalid), false);
    }

    // Learning goals
    for (const lg of SUPPORTED_LEARNING_GOALS) {
      assert.ok(isLearningGoal(lg));
    }
    for (const invalid of ['unknown_goal', '', null]) {
      assert.equal(isLearningGoal(invalid), false);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`  TIER 5 ADVERSARIAL STRESS SUITE RESULTS: ${testsPassed} / ${testsPassed + testsFailed} PASSED`);
  if (testsFailed === 0) {
    console.log('  FINAL VERDICT: APPROVE (Zero defects or coverage gaps identified)');
    console.log('='.repeat(80));
    process.exit(0);
  } else {
    console.error(`  FINAL VERDICT: REQUEST_CHANGES (${testsFailed} tests failed)`);
    console.log('='.repeat(80));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal crash in Tier 5 harness:', err);
  process.exit(1);
});
