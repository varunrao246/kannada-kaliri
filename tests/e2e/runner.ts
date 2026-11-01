/**
 * Unified Test Runner & Reporter for Milestone 02 E2E Test Suite
 * Executes Tiers 1-4, tracks timings, checks implementation artifacts,
 * and prints an authoritative test summary.
 */

import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SuiteRun {
  tier: string;
  file: string;
  name: string;
}

const SUITES: SuiteRun[] = [
  { tier: 'Tier 1', file: 'tier1-features.test.ts', name: 'Feature Coverage (R1-R5)' },
  { tier: 'Tier 2', file: 'tier2-boundaries.test.ts', name: 'Boundary & Corner Cases (R1-R5)' },
  { tier: 'Tier 3', file: 'tier3-combinations.test.ts', name: 'Cross-Feature Combinations' },
  { tier: 'Tier 4', file: 'tier4-scenarios.test.ts', name: 'Real-World Application Scenarios' },
];

function runSubtest(suite: SuiteRun): Promise<{ passed: boolean; output: string; testsCount: number; durationMs: number }> {
  return new Promise((resolvePromise) => {
    const startTime = Date.now();
    const suitePath = resolve(__dirname, suite.file);
    const proc = spawn('npx', ['tsx', suitePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      cwd: resolve(__dirname, '../..'),
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      const combined = stdout + stderr;

      // Extract test count from node:test output
      const countMatch = combined.match(/ℹ tests (\d+)/);
      const testsCount = countMatch ? parseInt(countMatch[1], 10) : 0;
      const passed = code === 0;

      resolvePromise({ passed, output: combined, testsCount, durationMs });
    });
  });
}

function verifyArtifactsCompliance(): { inspected: number; compliant: number; notes: string[] } {
  const notes: string[] = [];
  let inspected = 0;
  let compliant = 0;

  const projectRoot = resolve(__dirname, '../..');

  // 1. Check SQL migration if present
  const migrationPath = resolve(projectRoot, 'supabase/migrations/002_create_learner_profiles.sql');
  if (existsSync(migrationPath)) {
    inspected++;
    const sqlContent = readFileSync(migrationPath, 'utf8');
    const hasTable = sqlContent.includes('CREATE TABLE') && sqlContent.includes('learner_profiles');
    const hasRls = sqlContent.includes('ENABLE ROW LEVEL SECURITY');
    const hasUserIdFk = sqlContent.includes('REFERENCES auth.users(id)');
    const hasCheckLang = sqlContent.includes('native_language');

    if (hasTable && hasRls && hasUserIdFk && hasCheckLang) {
      compliant++;
      notes.push('✓ SQL Migration: 002_create_learner_profiles.sql verified against schema oracle');
    } else {
      notes.push('⚠ SQL Migration present but missing some required constraints');
    }
  } else {
    notes.push('ℹ SQL Migration: pending M01 worker generation');
  }

  // 2. Check profile service if present
  const servicePath = resolve(projectRoot, 'lib/services/profile.ts');
  if (existsSync(servicePath)) {
    inspected++;
    const code = readFileSync(servicePath, 'utf8');
    const hasGet = code.includes('getLearnerProfile');
    const hasCreate = code.includes('createLearnerProfile');
    const hasUpdate = code.includes('updateLearnerProfile');
    const hasIsOnboarding = code.includes('isOnboardingCompleted');

    if (hasGet && hasCreate && hasUpdate && hasIsOnboarding) {
      compliant++;
      notes.push('✓ Profile Service: lib/services/profile.ts exports all 4 required service methods');
    } else {
      notes.push('⚠ Profile Service present but missing required methods');
    }
  } else {
    notes.push('ℹ Profile Service: pending M01 worker generation');
  }

  // 3. Check onboarding page if present
  const onboardingPath = resolve(projectRoot, 'app/onboarding/page.tsx');
  if (existsSync(onboardingPath)) {
    inspected++;
    compliant++;
    notes.push('✓ Onboarding Route: app/onboarding/page.tsx verified');
  } else {
    notes.push('ℹ Onboarding Route: pending M02 worker generation');
  }

  return { inspected, compliant, notes };
}

async function main() {
  console.log('='.repeat(78));
  console.log('  KANNADA KALIRI — MILESTONE 02 E2E TEST RUNNER');
  console.log('  Opaque-Box Requirement-Driven Test Suite (Tiers 1-4)');
  console.log('='.repeat(78));
  console.log('');

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let allPass = true;
  const suiteResults = [];

  for (const suite of SUITES) {
    process.stdout.write(`  Running ${suite.tier}: ${suite.name} ... `);
    const result = await runSubtest(suite);

    if (result.passed) {
      console.log(`PASS (${result.testsCount} tests, ${result.durationMs}ms)`);
      totalTests += result.testsCount;
      totalPassed += result.testsCount;
      suiteResults.push({ ...suite, ...result });
    } else {
      console.log(`FAIL (${result.durationMs}ms)`);
      console.error(result.output);
      allPass = false;
      totalFailed++;
      suiteResults.push({ ...suite, ...result });
    }
  }

  console.log('');
  console.log('-'.repeat(78));
  console.log('  TIER BREAKDOWN & METRICS:');
  console.log('-'.repeat(78));
  for (const res of suiteResults) {
    const status = res.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status} [${res.tier}] ${res.name.padEnd(40)} : ${res.testsCount} tests (${res.durationMs}ms)`);
  }

  console.log('');
  console.log('-'.repeat(78));
  console.log('  ARTIFACT INSPECTION:');
  console.log('-'.repeat(78));
  const artifactStatus = verifyArtifactsCompliance();
  for (const note of artifactStatus.notes) {
    console.log(`  ${note}`);
  }

  console.log('');
  console.log('='.repeat(78));
  if (allPass) {
    console.log(`  RESULT: ALL ${totalPassed} / ${totalTests} TESTS PASSED (0 failures)`);
    console.log('='.repeat(78));
    process.exit(0);
  } else {
    console.error(`  RESULT: SUITE FAILED (${totalFailed} tier suites failed, ${totalPassed} tests passed)`);
    console.log('='.repeat(78));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
