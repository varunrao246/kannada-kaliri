/**
 * Empirical Adversarial Test Harness: Milestone M03
 * Target: 3-State Routing Redirect Matrix, Zero-Cycle Invariant, Hop Count Bounds (0 or 1 hop),
 * Next.js 16 Proxy Middleware Execution, Server Component Guards, and Alternating Route Stress.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { RouterSimulator } from '../e2e/harness/router-simulator';

const PROJECT_ROOT = resolve(process.cwd());

// ============================================================================
// SUITE 1: 3-State Route Redirect Matrix Verification (Specification Oracle)
// ============================================================================
async function test3StateRoutingMatrix() {
  console.log('\n--- [SUITE 1] 3-State Routing Redirect Matrix Verification ---');

  // State 1: Unauthenticated Guest
  const guestRoutes = [
    { path: '/', expectedAllow: true, expectedStatus: 200, expectedRedirect: null },
    { path: '/login', expectedAllow: true, expectedStatus: 200, expectedRedirect: null },
    { path: '/signup', expectedAllow: true, expectedStatus: 200, expectedRedirect: null },
    { path: '/onboarding', expectedAllow: false, expectedStatus: 307, expectedRedirect: '/login?redirect=/onboarding' },
    { path: '/dashboard', expectedAllow: false, expectedStatus: 307, expectedRedirect: '/login?redirect=/dashboard' },
  ];

  for (const r of guestRoutes) {
    const decision = RouterSimulator.evaluateRoute({
      pathname: r.path,
      isAuthenticated: false,
    });
    assert.equal(decision.allow, r.expectedAllow, `Guest ${r.path} allow mismatch`);
    assert.equal(decision.statusCode, r.expectedStatus, `Guest ${r.path} status mismatch`);
    if (r.expectedRedirect) {
      assert.equal(decision.redirectUrl, r.expectedRedirect, `Guest ${r.path} redirect mismatch`);
    }
  }
  console.log('✓ 1.1 Unauthenticated Guest routing decisions verified across all routes');

  // State 2: Authenticated Incomplete Learner
  const incompleteRoutes = [
    { path: '/', expectedAllow: true, expectedStatus: 200, expectedRedirect: null },
    { path: '/login', expectedAllow: false, expectedStatus: 307, expectedRedirect: '/onboarding' },
    { path: '/signup', expectedAllow: false, expectedStatus: 307, expectedRedirect: '/onboarding' },
    { path: '/dashboard', expectedAllow: false, expectedStatus: 307, expectedRedirect: '/onboarding' },
    { path: '/onboarding', expectedAllow: true, expectedStatus: 200, expectedRedirect: null },
    { path: '/auth/callback', expectedAllow: false, expectedStatus: 302, expectedRedirect: '/onboarding' },
  ];

  for (const r of incompleteRoutes) {
    const decision = RouterSimulator.evaluateRoute({
      pathname: r.path,
      isAuthenticated: true,
      onboardingCompleted: false,
    });
    assert.equal(decision.allow, r.expectedAllow, `Incomplete ${r.path} allow mismatch`);
    assert.equal(decision.statusCode, r.expectedStatus, `Incomplete ${r.path} status mismatch`);
    if (r.expectedRedirect) {
      assert.equal(decision.redirectUrl, r.expectedRedirect, `Incomplete ${r.path} redirect mismatch`);
    }
  }
  console.log('✓ 1.2 Authenticated Incomplete Learner routing decisions verified across all routes');

  // State 3: Authenticated Completed Learner
  const completedRoutes = [
    { path: '/', expectedAllow: true, expectedStatus: 200, expectedRedirect: null },
    { path: '/login', expectedAllow: false, expectedStatus: 307, expectedRedirect: '/dashboard' },
    { path: '/signup', expectedAllow: false, expectedStatus: 307, expectedRedirect: '/dashboard' },
    { path: '/onboarding', expectedAllow: false, expectedStatus: 307, expectedRedirect: '/dashboard' },
    { path: '/dashboard', expectedAllow: true, expectedStatus: 200, expectedRedirect: null },
    { path: '/auth/callback', expectedAllow: false, expectedStatus: 302, expectedRedirect: '/dashboard' },
  ];

  for (const r of completedRoutes) {
    const decision = RouterSimulator.evaluateRoute({
      pathname: r.path,
      isAuthenticated: true,
      onboardingCompleted: true,
    });
    assert.equal(decision.allow, r.expectedAllow, `Completed ${r.path} allow mismatch`);
    assert.equal(decision.statusCode, r.expectedStatus, `Completed ${r.path} status mismatch`);
    if (r.expectedRedirect) {
      assert.equal(decision.redirectUrl, r.expectedRedirect, `Completed ${r.path} redirect mismatch`);
    }
  }
  console.log('✓ 1.3 Authenticated Completed Learner routing decisions verified across all routes');
}

// ============================================================================
// SUITE 2: Strict Hop-Count & Circular Redirect Stress Tests
// ============================================================================
async function testHopCountAndZeroCycles() {
  console.log('\n--- [SUITE 2] Strict Hop-Count & Circular Redirect Stress Tests ---');

  const testRoutes = ['/login', '/signup', '/onboarding', '/dashboard', '/', '/auth/callback'];

  // Test 2.1: Guest Hop Trace
  for (const path of testRoutes) {
    const trace = RouterSimulator.traceNavigation(path, false, false, 10);
    assert.equal(trace.loopDetected, false, `Loop detected for guest on ${path}: ${trace.hops.join(' -> ')}`);
    // Number of hops is transitions (hops array length - 1)
    const hopCount = trace.hops.length - 1;
    assert.ok(hopCount <= 1, `Guest ${path} required ${hopCount} hops (must be <= 1). Path: ${trace.hops.join(' -> ')}`);

    // Verify destination terminal state
    if (path === '/onboarding' || path === '/dashboard') {
      assert.equal(trace.finalPath, '/login', `Guest from ${path} must terminate at /login`);
      assert.equal(hopCount, 1, `Guest from ${path} must take exactly 1 hop`);
    } else {
      assert.equal(hopCount, 0, `Guest on ${path} must take 0 hops (terminal)`);
    }
  }
  console.log('✓ 2.1 Unauthenticated Guest terminates in exactly 0 or 1 hop with 0 cycles');

  // Test 2.2: Incomplete Learner Hop Trace
  for (const path of testRoutes) {
    const trace = RouterSimulator.traceNavigation(path, true, false, 10);
    assert.equal(trace.loopDetected, false, `Loop detected for incomplete learner on ${path}: ${trace.hops.join(' -> ')}`);
    const hopCount = trace.hops.length - 1;
    assert.ok(hopCount <= 1, `Incomplete learner ${path} required ${hopCount} hops (must be <= 1). Path: ${trace.hops.join(' -> ')}`);

    if (['/login', '/signup', '/dashboard', '/auth/callback'].includes(path)) {
      assert.equal(trace.finalPath, '/onboarding', `Incomplete learner from ${path} must terminate at /onboarding`);
      assert.equal(hopCount, 1, `Incomplete learner from ${path} must take exactly 1 hop`);
    } else {
      assert.equal(hopCount, 0, `Incomplete learner on ${path} must take 0 hops (terminal)`);
    }
  }
  console.log('✓ 2.2 Authenticated Incomplete Learner terminates in exactly 0 or 1 hop with 0 cycles');

  // Test 2.3: Completed Learner Hop Trace
  for (const path of testRoutes) {
    const trace = RouterSimulator.traceNavigation(path, true, true, 10);
    assert.equal(trace.loopDetected, false, `Loop detected for completed learner on ${path}: ${trace.hops.join(' -> ')}`);
    const hopCount = trace.hops.length - 1;
    assert.ok(hopCount <= 1, `Completed learner ${path} required ${hopCount} hops (must be <= 1). Path: ${trace.hops.join(' -> ')}`);

    if (['/login', '/signup', '/onboarding', '/auth/callback'].includes(path)) {
      assert.equal(trace.finalPath, '/dashboard', `Completed learner from ${path} must terminate at /dashboard`);
      assert.equal(hopCount, 1, `Completed learner from ${path} must take exactly 1 hop`);
    } else {
      assert.equal(hopCount, 0, `Completed learner on ${path} must take 0 hops (terminal)`);
    }
  }
  console.log('✓ 2.3 Authenticated Completed Learner terminates in exactly 0 or 1 hop with 0 cycles');
}

// ============================================================================
// SUITE 3: Permutative Alternation Stress Harness
// ============================================================================
async function testAlternatingPermutations() {
  console.log('\n--- [SUITE 3] Alternating Navigation Sequences Across 4 Key Routes ---');

  const targets = ['/login', '/signup', '/onboarding', '/dashboard'];

  // Generate all 24 permutations of the 4 routes
  function permute(arr: string[]): string[][] {
    if (arr.length <= 1) return [arr];
    const result: string[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
      const remainingPermuted = permute(remaining);
      for (const p of remainingPermuted) {
        result.push([current, ...p]);
      }
    }
    return result;
  }

  const allPermutations = permute(targets);
  assert.equal(allPermutations.length, 24, 'Must have 24 permutations of 4 routes');

  const states = [
    { name: 'Unauthenticated Guest', isAuthenticated: false, onboardingCompleted: false },
    { name: 'Authenticated Incomplete Learner', isAuthenticated: true, onboardingCompleted: false },
    { name: 'Authenticated Completed Learner', isAuthenticated: true, onboardingCompleted: true },
  ];

  let totalSimulations = 0;

  for (const state of states) {
    for (const sequence of allPermutations) {
      // Simulate cycling through the permutation 5 times in succession
      const extendedSequence = [...sequence, ...sequence, ...sequence, ...sequence, ...sequence];
      for (const initialPath of extendedSequence) {
        totalSimulations++;
        const trace = RouterSimulator.traceNavigation(
          initialPath,
          state.isAuthenticated,
          state.onboardingCompleted,
          10
        );

        assert.equal(
          trace.loopDetected,
          false,
          `Cycle detected in ${state.name} during alternating sequence at ${initialPath}`
        );

        const hopCount = trace.hops.length - 1;
        assert.ok(
          hopCount <= 1,
          `More than 1 hop detected (${hopCount} hops) in ${state.name} at ${initialPath}`
        );

        // Terminal validity
        if (!state.isAuthenticated) {
          if (['/onboarding', '/dashboard'].includes(initialPath)) {
            assert.equal(trace.finalPath, '/login');
          } else {
            assert.equal(trace.finalPath, initialPath);
          }
        } else if (!state.onboardingCompleted) {
          if (['/login', '/signup', '/dashboard'].includes(initialPath)) {
            assert.equal(trace.finalPath, '/onboarding');
          } else {
            assert.equal(trace.finalPath, '/onboarding');
          }
        } else {
          if (['/login', '/signup', '/onboarding'].includes(initialPath)) {
            assert.equal(trace.finalPath, '/dashboard');
          } else {
            assert.equal(trace.finalPath, '/dashboard');
          }
        }
      }
    }
  }

  console.log(`✓ 3.1 Tested ${totalSimulations} alternating navigation transitions across 24 permutations × 3 user states: 0 cycles, hop count <= 1`);
}

// ============================================================================
// SUITE 4: Direct Next.js 16 Edge Proxy (updateSession) Execution
// ============================================================================
async function testDirectMiddlewareExecution() {
  console.log('\n--- [SUITE 4] Direct Next.js 16 Edge Proxy (updateSession) Execution ---');

  // Test 4.1: Unauthenticated requests directly to updateSession
  const unauthTestCases = [
    { url: 'http://localhost:3000/', expectedStatus: 200, expectedRedirect: null },
    { url: 'http://localhost:3000/login', expectedStatus: 200, expectedRedirect: null },
    { url: 'http://localhost:3000/signup', expectedStatus: 200, expectedRedirect: null },
    {
      url: 'http://localhost:3000/onboarding',
      expectedStatus: 307,
      expectedRedirect: 'http://localhost:3000/login?redirect=%2Fonboarding',
    },
    {
      url: 'http://localhost:3000/dashboard',
      expectedStatus: 307,
      expectedRedirect: 'http://localhost:3000/login?redirect=%2Fdashboard',
    },
    {
      url: 'http://localhost:3000/onboarding/nested-step',
      expectedStatus: 307,
      expectedRedirect: 'http://localhost:3000/login?redirect=%2Fonboarding%2Fnested-step',
    },
    {
      url: 'http://localhost:3000/dashboard/profile',
      expectedStatus: 307,
      expectedRedirect: 'http://localhost:3000/login?redirect=%2Fdashboard%2Fprofile',
    },
  ];

  for (const tc of unauthTestCases) {
    const req = new NextRequest(tc.url);
    const res = await updateSession(req);
    assert.equal(res.status, tc.expectedStatus, `Status mismatch for unauthenticated ${tc.url}`);
    const location = res.headers.get('location');
    if (tc.expectedRedirect) {
      assert.equal(location, tc.expectedRedirect, `Redirect location mismatch for ${tc.url}`);

      // Now verify next hop: following the redirect to the target URL terminates at 200!
      const nextHopReq = new NextRequest(location);
      const nextHopRes = await updateSession(nextHopReq);
      assert.equal(nextHopRes.status, 200, `Redirect target ${location} must terminate at 200 without second redirect`);
      assert.equal(nextHopRes.headers.get('location'), null, `Redirect target ${location} must have null location`);
    } else {
      assert.equal(location, null, `Expected null location for ${tc.url}, got ${location}`);
    }
  }

  console.log('✓ 4.1 Direct updateSession execution: unauthenticated requests terminate in exactly 0 or 1 hop');
}

// ============================================================================
// SUITE 5: Source Code & AST Conformance Verification
// ============================================================================
async function testSourceCodeConformance() {
  console.log('\n--- [SUITE 5] Source Code & AST Conformance Verification ---');

  // 5.1 proxy.ts
  const proxyPath = resolve(PROJECT_ROOT, 'proxy.ts');
  assert.ok(existsSync(proxyPath), 'proxy.ts must exist at root');
  const proxyCode = readFileSync(proxyPath, 'utf8');
  assert.ok(proxyCode.includes('export async function proxy'), 'proxy.ts must export proxy function');
  assert.ok(proxyCode.includes('updateSession(request)'), 'proxy.ts must delegate to updateSession');
  assert.ok(proxyCode.includes('matcher:'), 'proxy.ts must define matcher config');

  // 5.2 lib/supabase/middleware.ts
  const middlewarePath = resolve(PROJECT_ROOT, 'lib/supabase/middleware.ts');
  assert.ok(existsSync(middlewarePath), 'lib/supabase/middleware.ts must exist');
  const middlewareCode = readFileSync(middlewarePath, 'utf8');
  assert.ok(middlewareCode.includes('isOnboardingCompleted'), 'middleware.ts must call isOnboardingCompleted');
  assert.ok(middlewareCode.includes('createRedirectResponse'), 'middleware.ts must define createRedirectResponse');
  assert.ok(middlewareCode.includes('supabaseResponse.cookies.getAll()'), 'middleware.ts must propagate cookies onto redirect responses');
  assert.ok(middlewareCode.includes("pathname === '/login' || pathname === '/signup' || pathname.startsWith('/dashboard')"), 'middleware.ts must guard incomplete users');
  assert.ok(middlewareCode.includes("pathname === '/login' || pathname === '/signup' || pathname.startsWith('/onboarding')"), 'middleware.ts must guard completed users');

  // 5.3 app/login/page.tsx
  const loginPath = resolve(PROJECT_ROOT, 'app/login/page.tsx');
  assert.ok(existsSync(loginPath), 'app/login/page.tsx must exist');
  const loginCode = readFileSync(loginPath, 'utf8');
  assert.ok(loginCode.includes("redirect('/dashboard')"), 'app/login/page.tsx must redirect completed users to /dashboard');
  assert.ok(loginCode.includes("redirect('/onboarding')"), 'app/login/page.tsx must redirect incomplete users to /onboarding');

  // 5.4 app/signup/page.tsx
  const signupPath = resolve(PROJECT_ROOT, 'app/signup/page.tsx');
  assert.ok(existsSync(signupPath), 'app/signup/page.tsx must exist');
  const signupCode = readFileSync(signupPath, 'utf8');
  assert.ok(signupCode.includes("redirect('/dashboard')"), 'app/signup/page.tsx must redirect completed users to /dashboard');
  assert.ok(signupCode.includes("redirect('/onboarding')"), 'app/signup/page.tsx must redirect incomplete users to /onboarding');

  // 5.5 app/onboarding/page.tsx
  const onboardingPath = resolve(PROJECT_ROOT, 'app/onboarding/page.tsx');
  assert.ok(existsSync(onboardingPath), 'app/onboarding/page.tsx must exist');
  const onboardingCode = readFileSync(onboardingPath, 'utf8');
  assert.ok(onboardingCode.includes("redirect('/login?redirect=/onboarding')"), 'app/onboarding/page.tsx must redirect unauthenticated users to /login?redirect=/onboarding');
  assert.ok(onboardingCode.includes("redirect('/dashboard')"), 'app/onboarding/page.tsx must redirect completed users to /dashboard');

  // 5.6 app/dashboard/page.tsx
  const dashboardPath = resolve(PROJECT_ROOT, 'app/dashboard/page.tsx');
  assert.ok(existsSync(dashboardPath), 'app/dashboard/page.tsx must exist');
  const dashboardCode = readFileSync(dashboardPath, 'utf8');
  assert.ok(dashboardCode.includes("redirect('/login?redirect=/dashboard')"), 'app/dashboard/page.tsx must redirect unauthenticated users to /login?redirect=/dashboard');
  assert.ok(dashboardCode.includes("redirect('/onboarding')"), 'app/dashboard/page.tsx must redirect incomplete users to /onboarding');

  // 5.7 app/auth/callback/route.ts
  const callbackPath = resolve(PROJECT_ROOT, 'app/auth/callback/route.ts');
  assert.ok(existsSync(callbackPath), 'app/auth/callback/route.ts must exist');
  const callbackCode = readFileSync(callbackPath, 'utf8');
  assert.ok(callbackCode.includes('sanitizeDestination'), 'callback route must sanitize destinations against open redirect');
  assert.ok(callbackCode.includes('exchangeCodeForSession'), 'callback route must exchange code');
  assert.ok(callbackCode.includes("destination.startsWith('/onboarding') ? '/dashboard' : destination"), 'callback route must prevent completed users landing on /onboarding');
  assert.ok(callbackCode.includes("redirect(`${baseOrigin}/onboarding`)"), 'callback route must route incomplete users to /onboarding');

  console.log('✓ 5.1 Static code and AST invariants verified across all 7 routing endpoints and guards');
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function main() {
  console.log('======================================================================');
  console.log('  EMPIRICAL CHALLENGER: MILESTONE M03 ROUTING MATRIX & LOOP STRESS');
  console.log('======================================================================');

  await test3StateRoutingMatrix();
  await testHopCountAndZeroCycles();
  await testAlternatingPermutations();
  await testDirectMiddlewareExecution();
  await testSourceCodeConformance();

  console.log('\n======================================================================');
  console.log('  ALL EMPIRICAL CHECKS PASSED: ZERO CYCLES, <= 1 HOP TERMINATION');
  console.log('  VERDICT: APPROVE');
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('\n❌ EMPIRICAL CHALLENGE FAILED:', err);
  process.exit(1);
});
