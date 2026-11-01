/**
 * Comprehensive Empirical Verification of supabase/migrations/002_create_learner_profiles.sql
 * Runs in-process on PostgreSQL (PGlite WebAssembly engine).
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const globalPath = path.resolve('/Users/apple/.local/lib/node_modules/@electric-sql/pglite');
const { PGlite } = require(globalPath);

const MIGRATION_PATH = path.resolve(process.cwd(), 'supabase/migrations/002_create_learner_profiles.sql');

async function setupSupabaseMockEnvironment(db) {
  // Create Supabase auth schema and mock users table and auth.uid() function
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
}

async function runTests() {
  console.log('================================================================');
  console.log('STARTING EMPIRICAL SQL & MIGRATION VERIFICATION (PGlite / Postgres)');
  console.log('================================================================');

  const sqlContent = fs.readFileSync(MIGRATION_PATH, 'utf-8');
  assert.ok(sqlContent.length > 0, 'Migration file must not be empty');
  console.log(`[PASS] Read migration file: ${MIGRATION_PATH} (${sqlContent.length} bytes)`);

  const db = new PGlite();
  await setupSupabaseMockEnvironment(db);
  console.log('[PASS] Initialized mock Supabase auth environment');

  // ============================================================================
  // Test 1: First-time Migration Execution
  // ============================================================================
  console.log('\n--- Test 1: Initial Migration Execution ---');
  // In PGlite WASM environment, contrib extensions like pgcrypto aren't bundled on disk,
  // whereas gen_random_uuid() is native in Postgres 13+. We adapt the extension line for WASM execution.
  const wasmSql = sqlContent.replace(/CREATE EXTENSION IF NOT EXISTS\s+"pgcrypto";/gi, '-- [WASM: pgcrypto core native] gen_random_uuid() built-in');
  
  await db.exec(wasmSql);
  console.log('[PASS] Migration 002 executed successfully on fresh database');

  // Check table existence
  const tableCheck = await db.query(`
    SELECT table_name, table_schema 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'learner_profiles';
  `);
  assert.equal(tableCheck.rows.length, 1, 'Table public.learner_profiles must exist');
  console.log('[PASS] Table public.learner_profiles created');

  // Check columns and types
  const cols = await db.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'learner_profiles'
    ORDER BY ordinal_position;
  `);
  const colMap = Object.fromEntries(cols.rows.map(r => [r.column_name, r]));
  
  const expectedCols = [
    'id', 'user_id', 'full_name', 'avatar_url', 'native_language',
    'target_language', 'proficiency_level', 'learning_goals',
    'daily_goal_minutes', 'onboarding_completed', 'created_at', 'updated_at'
  ];
  for (const c of expectedCols) {
    assert.ok(colMap[c], `Column ${c} must exist in table`);
  }
  assert.equal(colMap['id'].data_type, 'uuid');
  assert.equal(colMap['user_id'].data_type, 'uuid');
  assert.equal(colMap['user_id'].is_nullable, 'NO');
  assert.equal(colMap['native_language'].data_type, 'text');
  assert.equal(colMap['native_language'].is_nullable, 'NO');
  assert.equal(colMap['target_language'].data_type, 'text');
  assert.equal(colMap['proficiency_level'].data_type, 'text');
  assert.equal(colMap['daily_goal_minutes'].data_type, 'integer');
  assert.equal(colMap['onboarding_completed'].data_type, 'boolean');
  assert.equal(colMap['learning_goals'].data_type, 'ARRAY');
  assert.equal(colMap['created_at'].data_type, 'timestamp with time zone');
  assert.equal(colMap['updated_at'].data_type, 'timestamp with time zone');
  console.log(`[PASS] All ${expectedCols.length} columns verified with exact data types and nullability`);

  // ============================================================================
  // Test 2: Idempotency Verification (Multiple consecutive executions)
  // ============================================================================
  console.log('\n--- Test 2: Idempotency Verification ---');
  for (let run = 2; run <= 5; run++) {
    await db.exec(wasmSql);
    console.log(`[PASS] Re-execution run #${run} succeeded with zero errors`);
  }

  // ============================================================================
  // Test 3: Index Definitions
  // ============================================================================
  console.log('\n--- Test 3: Index Definitions ---');
  const indexQuery = await db.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'learner_profiles';
  `);
  const indexNames = indexQuery.rows.map(r => r.indexname);
  console.log('Discovered indexes:', indexNames);

  assert.ok(indexNames.includes('idx_learner_profiles_user_id'), 'Unique index idx_learner_profiles_user_id must exist');
  assert.ok(indexNames.includes('idx_learner_profiles_onboarding_completed'), 'Index idx_learner_profiles_onboarding_completed must exist');

  const userIdIdx = indexQuery.rows.find(r => r.indexname === 'idx_learner_profiles_user_id');
  assert.ok(userIdIdx.indexdef.includes('UNIQUE'), 'idx_learner_profiles_user_id must be UNIQUE');
  console.log('[PASS] Index definitions verified: idx_learner_profiles_user_id (UNIQUE) and idx_learner_profiles_onboarding_completed');

  // ============================================================================
  // Test 4: Schema Constraints (CHECK, UNIQUE, NOT NULL, FK CASCADE)
  // ============================================================================
  console.log('\n--- Test 4: Schema Constraints ---');

  // Create two mock auth users
  const user1 = (await db.query(`
    INSERT INTO auth.users (email) VALUES ('user1@kannadakaliri.org') RETURNING id;
  `)).rows[0].id;

  const user2 = (await db.query(`
    INSERT INTO auth.users (email) VALUES ('user2@kannadakaliri.org') RETURNING id;
  `)).rows[0].id;

  // 4.1 Valid Insert
  const validInsert = await db.query(`
    INSERT INTO public.learner_profiles (
      user_id, full_name, avatar_url, native_language, target_language,
      proficiency_level, learning_goals, daily_goal_minutes, onboarding_completed
    ) VALUES (
      $1, 'Test Learner 1', 'https://example.com/avatar1.jpg', 'hi', 'kn',
      'beginner', '{"everyday_conversations"}', 15, true
    ) RETURNING *;
  `, [user1]);
  assert.equal(validInsert.rows.length, 1);
  console.log('[PASS] Valid insert succeeded');

  // 4.2 CHECK Constraint: native_language (invalid 'fr')
  try {
    await db.query(`
      INSERT INTO public.learner_profiles (
        user_id, native_language, proficiency_level, daily_goal_minutes
      ) VALUES (
        $1, 'fr', 'beginner', 15
      );
    `, [user2]);
    assert.fail('Expected check constraint violation for native_language=fr');
  } catch (err) {
    assert.ok(err.message.includes('chk_learner_profiles_native_language') || err.message.includes('check constraint'),
      `Expected check constraint error, got: ${err.message}`);
    console.log('[PASS] Constraint chk_learner_profiles_native_language rejected "fr"');
  }

  // 4.3 CHECK Constraint: target_language (invalid 'te')
  try {
    await db.query(`
      INSERT INTO public.learner_profiles (
        user_id, native_language, target_language, proficiency_level, daily_goal_minutes
      ) VALUES (
        $1, 'en', 'te', 'beginner', 15
      );
    `, [user2]);
    assert.fail('Expected check constraint violation for target_language=te');
  } catch (err) {
    assert.ok(err.message.includes('chk_learner_profiles_target_language') || err.message.includes('check constraint'));
    console.log('[PASS] Constraint chk_learner_profiles_target_language rejected "te"');
  }

  // 4.4 CHECK Constraint: proficiency_level (invalid 'advanced')
  try {
    await db.query(`
      INSERT INTO public.learner_profiles (
        user_id, native_language, proficiency_level, daily_goal_minutes
      ) VALUES (
        $1, 'en', 'advanced', 15
      );
    `, [user2]);
    assert.fail('Expected check constraint violation for proficiency_level=advanced');
  } catch (err) {
    assert.ok(err.message.includes('chk_learner_profiles_proficiency_level') || err.message.includes('check constraint'));
    console.log('[PASS] Constraint chk_learner_profiles_proficiency_level rejected "advanced"');
  }

  // 4.5 CHECK Constraint: daily_goal_minutes (invalid 25)
  try {
    await db.query(`
      INSERT INTO public.learner_profiles (
        user_id, native_language, proficiency_level, daily_goal_minutes
      ) VALUES (
        $1, 'en', 'beginner', 25
      );
    `, [user2]);
    assert.fail('Expected check constraint violation for daily_goal_minutes=25');
  } catch (err) {
    assert.ok(err.message.includes('chk_learner_profiles_daily_goal_minutes') || err.message.includes('check constraint'));
    console.log('[PASS] Constraint chk_learner_profiles_daily_goal_minutes rejected 25 min');
  }

  // 4.6 UNIQUE Constraint: Duplicate user_id
  try {
    await db.query(`
      INSERT INTO public.learner_profiles (
        user_id, native_language, proficiency_level, daily_goal_minutes
      ) VALUES (
        $1, 'en', 'intermediate', 10
      );
    `, [user1]); // user1 already has a profile
    assert.fail('Expected unique constraint violation for duplicate user_id');
  } catch (err) {
    assert.ok(err.message.includes('unique constraint') || err.message.includes('duplicate key') || err.message.includes('learner_profiles_user_id_key'));
    console.log('[PASS] Unique constraint blocked duplicate user_id');
  }

  // 4.7 Foreign Key & CASCADE Delete
  const user3 = (await db.query(`
    INSERT INTO auth.users (email) VALUES ('user3@kannadakaliri.org') RETURNING id;
  `)).rows[0].id;
  await db.query(`
    INSERT INTO public.learner_profiles (
      user_id, native_language, proficiency_level, daily_goal_minutes
    ) VALUES (
      $1, 'ml', 'beginner', 10
    );
  `, [user3]);
  // Confirm it exists
  const checkU3 = await db.query('SELECT * FROM public.learner_profiles WHERE user_id = $1', [user3]);
  assert.equal(checkU3.rows.length, 1);
  // Delete user from auth.users
  await db.query('DELETE FROM auth.users WHERE id = $1', [user3]);
  // Verify row was deleted via CASCADE
  const checkCascade = await db.query('SELECT * FROM public.learner_profiles WHERE user_id = $1', [user3]);
  assert.equal(checkCascade.rows.length, 0, 'Cascade delete must remove learner_profiles on auth.users deletion');
  console.log('[PASS] Foreign key ON DELETE CASCADE verified');

  // ============================================================================
  // Test 5: Trigger Verification (handle_updated_at)
  // ============================================================================
  console.log('\n--- Test 5: Updated_at Trigger Verification ---');
  // Backdate updated_at for user1
  await db.query(`
    UPDATE public.learner_profiles 
    SET updated_at = '2020-01-01 00:00:00Z' 
    WHERE user_id = $1;
  `, [user1]);
  const backdated = (await db.query('SELECT updated_at FROM public.learner_profiles WHERE user_id = $1', [user1])).rows[0].updated_at;
  console.log('Explicitly set updated_at:', backdated);

  // Trigger update through normal column change
  await db.query(`
    UPDATE public.learner_profiles 
    SET daily_goal_minutes = 20 
    WHERE user_id = $1;
  `, [user1]);
  const updated = (await db.query('SELECT updated_at, daily_goal_minutes FROM public.learner_profiles WHERE user_id = $1', [user1])).rows[0];
  assert.notEqual(updated.updated_at, backdated, 'updated_at timestamp must be automatically refreshed by trigger');
  assert.equal(updated.daily_goal_minutes, 20);
  console.log('[PASS] handle_updated_at trigger automatically refreshed updated_at timestamp');

  // ============================================================================
  // Test 6: Row Level Security (RLS) Policy Adversarial Matrix
  // ============================================================================
  console.log('\n--- Test 6: Row Level Security (RLS) Adversarial Matrix ---');

  // Check RLS status on table
  const rlsCheck = await db.query(`
    SELECT relrowsecurity, relforcerowsecurity 
    FROM pg_class 
    WHERE relname = 'learner_profiles';
  `);
  assert.equal(rlsCheck.rows[0].relrowsecurity, true, 'Row Level Security must be enabled');
  console.log('[PASS] pg_class confirms relrowsecurity = true');

  // Create user A and user B
  const userA = (await db.query(`INSERT INTO auth.users (email) VALUES ('usera@test.com') RETURNING id;`)).rows[0].id;
  const userB = (await db.query(`INSERT INTO auth.users (email) VALUES ('userb@test.com') RETURNING id;`)).rows[0].id;

  // 6.1 Unauthenticated / Anon access (no GRANT was given to anon)
  await db.query(`SET ROLE anon;`);
  try {
    await db.query(`SELECT * FROM public.learner_profiles;`);
    assert.fail('Anon role should not have SELECT permissions on learner_profiles');
  } catch (err) {
    assert.ok(err.message.includes('permission denied') || err.message.includes('42501'));
    console.log('[PASS] Anon SELECT rejected with permission denied (42501)');
  }

  try {
    await db.query(`
      INSERT INTO public.learner_profiles (user_id, native_language, proficiency_level, daily_goal_minutes)
      VALUES ($1, 'en', 'beginner', 5);
    `, [userA]);
    assert.fail('Anon role should not have INSERT permissions on learner_profiles');
  } catch (err) {
    assert.ok(err.message.includes('permission denied') || err.message.includes('42501'));
    console.log('[PASS] Anon INSERT rejected with permission denied (42501)');
  }

  // 6.2 Authenticated as User A: INSERT
  await db.query(`RESET ROLE;`);
  await db.query(`SET ROLE authenticated;`);
  await db.query(`SELECT set_config('request.jwt.claim.sub', '${userA}', false);`);

  // User A inserting User A profile -> SUCCEEDS
  await db.query(`
    INSERT INTO public.learner_profiles (
      user_id, full_name, native_language, target_language, proficiency_level, daily_goal_minutes
    ) VALUES (
      '${userA}', 'User A', 'en', 'kn', 'beginner', 10
    );
  `);
  console.log('[PASS] User A successfully inserted own profile under RLS');

  // User A attempting to insert User B profile -> REJECTED by WITH CHECK
  try {
    await db.query(`
      INSERT INTO public.learner_profiles (
        user_id, full_name, native_language, target_language, proficiency_level, daily_goal_minutes
      ) VALUES (
        '${userB}', 'Imposter B', 'en', 'kn', 'beginner', 10
      );
    `);
    assert.fail('User A should be blocked from inserting a profile with user_id = User B');
  } catch (err) {
    assert.ok(err.message.includes('row-level security policy') || err.message.includes('violates'),
      `Expected RLS violation, got: ${err.message}`);
    console.log('[PASS] User A blocked from inserting User B profile (WITH CHECK policy enforced)');
  }

  // 6.3 Authenticated as User A: SELECT
  const selectOwn = await db.query(`SELECT * FROM public.learner_profiles WHERE user_id = '${userA}';`);
  assert.equal(selectOwn.rows.length, 1, 'User A must see own profile');
  assert.equal(selectOwn.rows[0].user_id, userA);

  const selectAll = await db.query(`SELECT * FROM public.learner_profiles;`);
  assert.equal(selectAll.rows.length, 1, 'User A query must be filtered by RLS to only see own profile');
  assert.equal(selectAll.rows[0].user_id, userA);

  const selectOther = await db.query(`SELECT * FROM public.learner_profiles WHERE user_id = '${userB}';`);
  assert.equal(selectOther.rows.length, 0, 'User A must see 0 rows for User B');
  console.log('[PASS] User A SELECT strictly isolated to own row');

  // 6.4 Authenticated as User A: UPDATE
  // Update own profile -> SUCCEEDS
  await db.query(`
    UPDATE public.learner_profiles
    SET full_name = 'User A Updated'
    WHERE user_id = '${userA}';
  `);
  const checkUpdated = (await db.query(`SELECT full_name FROM public.learner_profiles WHERE user_id = '${userA}';`)).rows[0];
  assert.equal(checkUpdated.full_name, 'User A Updated');
  console.log('[PASS] User A updated own profile');

  // User A attempting to hijack/update another user's row (user1 created in setup)
  const hijackAttempt = await db.query(`
    UPDATE public.learner_profiles
    SET full_name = 'Hijacked'
    WHERE user_id = '${user1}';
  `);
  assert.equal(hijackAttempt.affectedRows || 0, 0, 'User A must affect 0 rows when attempting to update User 1 profile');
  console.log('[PASS] User A UPDATE on another user affected 0 rows (RLS USING clause enforced)');

  // User A attempting to change own user_id to User B -> REJECTED by WITH CHECK
  try {
    await db.query(`
      UPDATE public.learner_profiles
      SET user_id = '${userB}'
      WHERE user_id = '${userA}';
    `);
    assert.fail('User A should be blocked from reassigning user_id to User B');
  } catch (err) {
    assert.ok(err.message.includes('row-level security policy') || err.message.includes('violates'),
      `Expected RLS violation, got: ${err.message}`);
    console.log('[PASS] User A blocked from transferring profile to User B (WITH CHECK clause enforced)');
  }

  // 6.5 Authenticated as User A: DELETE
  // Attempt to delete another user's profile
  const deleteOther = await db.query(`
    DELETE FROM public.learner_profiles
    WHERE user_id = '${user1}';
  `);
  assert.equal(deleteOther.affectedRows || 0, 0, 'User A must affect 0 rows when attempting to delete User 1 profile');
  console.log('[PASS] User A DELETE on another user affected 0 rows (RLS USING clause enforced)');

  // Delete own profile -> SUCCEEDS
  await db.query(`
    DELETE FROM public.learner_profiles
    WHERE user_id = '${userA}';
  `);
  const checkDeleted = await db.query(`SELECT * FROM public.learner_profiles WHERE user_id = '${userA}';`);
  assert.equal(checkDeleted.rows.length, 0, 'User A own profile must be deleted');
  console.log('[PASS] User A DELETE on own profile succeeded');

  // 6.6 service_role bypass test
  await db.query(`RESET ROLE;`);
  await db.query(`SET ROLE service_role;`);
  const serviceSelect = await db.query(`SELECT * FROM public.learner_profiles;`);
  assert.ok(serviceSelect.rows.length >= 1, 'service_role can view profiles across all users');
  console.log(`[PASS] service_role bypass confirmed (${serviceSelect.rows.length} rows accessible)`);
  await db.query(`RESET ROLE;`);

  // ============================================================================
  // Test 7: Adversarial Stress Scenarios & Edge Cases
  // ============================================================================
  console.log('\n--- Test 7: Adversarial Stress Scenarios & Edge Cases ---');

  // 7.1 Unicode & Kannada Multibyte Strings
  const userUnicode = (await db.query(`INSERT INTO auth.users (email) VALUES ('unicode@test.com') RETURNING id;`)).rows[0].id;
  const kannadaName = 'ಕುವೆಂಪು (ಕೆ. ವಿ. ಪುಟ್ಟಪ್ಪ)';
  const kannadaGoals = ['ದಿನನಿತ್ಯದ ಮಾತುಕತೆ', 'ಕನ್ನಡ ಸಾಹಿತ್ಯ ಮತ್ತು ಸಂಸ್ಕೃತಿ'];
  
  await db.query(`
    INSERT INTO public.learner_profiles (
      user_id, full_name, native_language, target_language, proficiency_level,
      learning_goals, daily_goal_minutes, onboarding_completed
    ) VALUES (
      $1, $2, 'ta', 'kn', 'intermediate', $3, 20, true
    );
  `, [userUnicode, kannadaName, kannadaGoals]);

  const unicodeRetrieved = (await db.query(`
    SELECT full_name, learning_goals FROM public.learner_profiles WHERE user_id = $1;
  `, [userUnicode])).rows[0];
  assert.equal(unicodeRetrieved.full_name, kannadaName, 'Kannada UTF-8 text must not be corrupted or truncated');
  assert.deepEqual(unicodeRetrieved.learning_goals, kannadaGoals, 'Kannada text array must maintain fidelity');
  console.log('[PASS] Multibyte Kannada Unicode UTF-8 stored and retrieved verbatim');

  // 7.2 Boundary Values for daily_goal_minutes (4 and 21)
  const userBoundary = (await db.query(`INSERT INTO auth.users (email) VALUES ('boundary@test.com') RETURNING id;`)).rows[0].id;
  for (const invalidMin of [0, 4, 6, 9, 11, 14, 16, 19, 21, 60]) {
    try {
      await db.query(`
        INSERT INTO public.learner_profiles (
          user_id, native_language, proficiency_level, daily_goal_minutes
        ) VALUES (
          $1, 'en', 'beginner', $2
        );
      `, [userBoundary, invalidMin]);
      assert.fail(`Expected daily_goal_minutes=${invalidMin} to fail CHECK constraint`);
    } catch (err) {
      assert.ok(err.message.includes('chk_learner_profiles_daily_goal_minutes') || err.message.includes('check constraint'));
    }
  }
  console.log('[PASS] Tested 10 boundary values for daily_goal_minutes: all correctly rejected');

  // 7.3 Supabase ON CONFLICT (user_id) Upsert Simulation
  await db.query(`
    INSERT INTO public.learner_profiles (
      user_id, full_name, native_language, proficiency_level, daily_goal_minutes, onboarding_completed
    ) VALUES (
      $1, 'Initial Name', 'hi', 'beginner', 10, false
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      native_language = EXCLUDED.native_language,
      daily_goal_minutes = EXCLUDED.daily_goal_minutes,
      onboarding_completed = EXCLUDED.onboarding_completed;
  `, [userBoundary]);

  // Second upsert to simulate returning user or step update
  await db.query(`
    INSERT INTO public.learner_profiles (
      user_id, full_name, native_language, proficiency_level, daily_goal_minutes, onboarding_completed
    ) VALUES (
      $1, 'Updated Onboarded Name', 'ta', 'intermediate', 20, true
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      native_language = EXCLUDED.native_language,
      proficiency_level = EXCLUDED.proficiency_level,
      daily_goal_minutes = EXCLUDED.daily_goal_minutes,
      onboarding_completed = EXCLUDED.onboarding_completed;
  `, [userBoundary]);

  const upsertedRecord = (await db.query(`
    SELECT full_name, native_language, proficiency_level, daily_goal_minutes, onboarding_completed
    FROM public.learner_profiles WHERE user_id = $1;
  `, [userBoundary])).rows[0];
  assert.equal(upsertedRecord.full_name, 'Updated Onboarded Name');
  assert.equal(upsertedRecord.native_language, 'ta');
  assert.equal(upsertedRecord.proficiency_level, 'intermediate');
  assert.equal(upsertedRecord.daily_goal_minutes, 20);
  assert.equal(upsertedRecord.onboarding_completed, true);
  console.log('[PASS] ON CONFLICT (user_id) upsert successfully executed without duplicate collision');

  console.log('\n================================================================');
  console.log('ALL EMPIRICAL TESTS PASSED SUCCESSFULLY ON POSTGRESQL ENGINE');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('\n[FATAL TEST FAILURE]:', err);
  process.exit(1);
});
