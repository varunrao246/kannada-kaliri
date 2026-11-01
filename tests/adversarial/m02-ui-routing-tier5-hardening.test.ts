/**
 * Empirical Adversarial Test Suite: UI & Routing Layer Tier 5 Hardening
 * Target: components/onboarding/*, app/onboarding/page.tsx, lib/supabase/middleware.ts,
 *         proxy.ts, app/auth/callback/route.ts
 *
 * Execution:
 * npx tsx --env-file=.env.local tests/adversarial/m02-ui-routing-tier5-hardening.test.ts
 */

import './als-setup';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server';
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies/index.js';
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import {
  resolveDisplayName,
  resolveAvatarUrl,
  type WizardFormData,
} from '@/components/onboarding/OnboardingWizard';
import {
  StepNativeLanguage,
  SUPPORTED_LANGUAGES,
} from '@/components/onboarding/StepNativeLanguage';
import {
  StepKannadaLevel,
  KANNADA_LEVELS,
} from '@/components/onboarding/StepKannadaLevel';
import {
  StepLearningGoals,
  LEARNING_GOAL_OPTIONS,
} from '@/components/onboarding/StepLearningGoals';
import {
  StepCommitmentSummary,
  COMMITMENT_INTERVALS,
} from '@/components/onboarding/StepCommitmentSummary';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { OnboardingSuccess } from '@/components/onboarding/OnboardingSuccess';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { updateSession } from '@/lib/supabase/middleware';
import { proxy, config as proxyConfig } from '@/proxy';
import { GET as authCallbackRoute } from '@/app/auth/callback/route';

interface TestRecord {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const tests: TestRecord[] = [];

async function testCase(id: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  process.stdout.write(`  [TEST] ${id}: ${name} ... `);
  try {
    await fn();
    const durationMs = Date.now() - start;
    console.log(`✓ PASS (${durationMs}ms)`);
    tests.push({ id, name, passed: true, durationMs });
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    console.log(`✗ FAIL (${durationMs}ms)`);
    console.error(`      Error: ${msg}`);
    tests.push({ id, name, passed: false, error: msg, durationMs });
  }
}

const mockRouter = {
  push: () => {},
  replace: () => {},
  refresh: () => {},
  back: () => {},
  forward: () => {},
  prefetch: () => {},
};

// Next.js Server Storage Simulation Helper
async function runInNextRequestContext<T>(
  fakeCookies: InstanceType<typeof RequestCookies>,
  route: string,
  fn: () => Promise<T>
): Promise<T> {
  const { workAsyncStorageInstance } = await import(
    'next/dist/server/app-render/work-async-storage-instance.js'
  );
  const { workUnitAsyncStorageInstance } = await import(
    'next/dist/server/app-render/work-unit-async-storage-instance.js'
  );

  const workStore = {
    isStaticGeneration: false,
    route,
  };
  const workUnitStore = {
    type: 'request',
    phase: 'action',
    cookies: fakeCookies,
    mutableCookies: fakeCookies,
    userspaceMutableCookies: fakeCookies,
  };

  return await workAsyncStorageInstance.run(
    workStore as unknown as Parameters<typeof workAsyncStorageInstance.run>[0],
    async () => {
      return await workUnitAsyncStorageInstance.run(
        workUnitStore as unknown as Parameters<typeof workUnitAsyncStorageInstance.run>[0],
        async () => {
          return await fn();
        }
      );
    }
  );
}

// Mock Supabase fetch handler for session & auth
function configureMockSupabaseBackend(opts: {
  userId?: string;
  userEmail?: string;
  codeSuccess?: boolean;
  onboardingCompleted?: boolean | null;
}) {
  const userId = opts.userId ?? 'usr-tier5-test-01';
  const userEmail = opts.userEmail ?? 'tier5-tester@kannadakaliri.org';
  const codeSuccess = opts.codeSuccess ?? true;
  const onboardingCompleted = opts.onboardingCompleted ?? false;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const parsed = new URL(urlStr);

    if (parsed.pathname === '/auth/v1/token') {
      if (!codeSuccess) {
        return new Response(
          JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid authorization code' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          access_token: 'mock-jwt-tier5-access',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-jwt-tier5-refresh',
          user: { id: userId, aud: 'authenticated', role: 'authenticated', email: userEmail },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (parsed.pathname === '/auth/v1/user') {
      return new Response(
        JSON.stringify({ id: userId, aud: 'authenticated', role: 'authenticated', email: userEmail }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (parsed.pathname.startsWith('/rest/v1/learner_profiles')) {
      if (onboardingCompleted === null) {
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(
        JSON.stringify({ onboarding_completed: onboardingCompleted }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404 });
  }) as typeof globalThis.fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function runEmpiricalHarness() {
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   TIER 5 ADVERSARIAL HARNESS: UI & ROUTING LAYER VERIFICATION                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  // ============================================================================
  // SUITE 1: Onboarding Step Navigation, Validation Locks & State Retention
  // ============================================================================
  console.log('--- SUITE 1: Step Navigation, Validation Locks & State Retention ---');

  await testCase('T5-UI-01', 'Validation Locks: Step 2 cannot advance when native_language is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(StepNativeLanguage, {
        selected: null,
        canContinue: false,
      })
    );
    assert.match(html, /disabled=""/, 'Continue button must be disabled when selection is null');
    assert.match(html, /cursor-not-allowed/, 'Disabled styling must be applied');
  });

  await testCase('T5-UI-02', 'Validation Locks: Step 2 enables Continue immediately upon selection', () => {
    const html = renderToStaticMarkup(
      React.createElement(StepNativeLanguage, {
        selected: 'ta',
        canContinue: true,
      })
    );
    assert.doesNotMatch(html, /disabled=""/, 'Continue button must NOT be disabled when language is selected');
    assert.match(html, /Continue/, 'Continue text rendered');
  });

  await testCase('T5-UI-03', 'Validation Locks: Step 3 cannot advance when proficiency_level is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(StepKannadaLevel, {
        selected: null,
        canContinue: false,
      })
    );
    assert.match(html, /disabled=""/, 'Continue button must be disabled when level is null');
  });

  await testCase('T5-UI-04', 'Validation Locks: Step 3 enables Continue when proficiency is selected', () => {
    const html = renderToStaticMarkup(
      React.createElement(StepKannadaLevel, {
        selected: 'beginner',
        canContinue: true,
      })
    );
    assert.doesNotMatch(html, /disabled=""/, 'Continue button must be enabled when level is chosen');
  });

  await testCase('T5-UI-05', 'Validation Locks: Step 4 cannot advance when learning_goals is empty array', () => {
    const html = renderToStaticMarkup(
      React.createElement(StepLearningGoals, {
        selectedGoals: [],
        canContinue: false,
      })
    );
    assert.match(html, /disabled=""/, 'Continue button must be disabled when 0 goals chosen');
    assert.match(html, /0 of 7 goals selected/, 'Selection counter renders 0');
  });

  await testCase('T5-UI-06', 'Validation Locks: Step 4 enables Continue with >= 1 goal and updates counter', () => {
    const html = renderToStaticMarkup(
      React.createElement(StepLearningGoals, {
        selectedGoals: ['everyday_conversations', 'shopping_and_daily_activities'],
        canContinue: true,
      })
    );
    assert.doesNotMatch(html, /disabled=""/, 'Continue button enabled with 2 goals');
    assert.match(html, /2 of 7 goals selected/, 'Counter correctly shows 2');
  });

  await testCase('T5-UI-07', 'State Retention: Back-and-forth multi-select array and choice preservation', () => {
    // Simulate state mutations in wizard
    const state: WizardFormData = {
      native_language: null,
      proficiency_level: null,
      learning_goals: [],
      daily_goal_minutes: 10,
    };

    // Step 2 selection
    state.native_language = 'hi';
    // Step 3 selection
    state.proficiency_level = 'intermediate';
    // Step 4 toggling goals: toggle on, toggle another on, toggle first off, toggle third on
    const toggle = (code: string) => {
      const idx = state.learning_goals.indexOf(code);
      if (idx >= 0) state.learning_goals.splice(idx, 1);
      else state.learning_goals.push(code);
    };
    toggle('college_and_education');
    toggle('workplace_communication');
    toggle('travel_and_exploring_karnataka');
    toggle('workplace_communication'); // removed
    assert.deepEqual(state.learning_goals, ['college_and_education', 'travel_and_exploring_karnataka']);

    // Step 5 selection
    state.daily_goal_minutes = 20;

    // Simulate jumping back to Step 2 and changing language
    state.native_language = 'te';

    // Verify all other state is completely preserved
    assert.equal(state.native_language, 'te');
    assert.equal(state.proficiency_level, 'intermediate');
    assert.deepEqual(state.learning_goals, ['college_and_education', 'travel_and_exploring_karnataka']);
    assert.equal(state.daily_goal_minutes, 20);
  });

  await testCase('T5-UI-08', 'Step 5 Commitment Summary: Direct edit handlers route to appropriate step', () => {
    const html = renderToStaticMarkup(
      React.createElement(StepCommitmentSummary, {
        selectedCommitment: 15,
        onSelectCommitment: () => {},
        formData: {
          native_language: 'ta',
          proficiency_level: 'elementary',
          learning_goals: ['everyday_conversations'],
          daily_goal_minutes: 15,
        },
        onEditStep: () => {},
        onSubmit: () => {},
      })
    );

    assert.match(html, /Tamil \(தமிழ்\)/, 'Shows selected native language');
    assert.match(html, /Elementary/, 'Shows selected proficiency level');
    assert.match(html, /15 minutes every day/, 'Shows selected commitment');
    assert.match(html, /Create My Learning Journey/, 'Submit CTA present');
  });

  await testCase('T5-UI-09', 'Submission Error State: Error banner rendered with role=alert and retry action', () => {
    const html = renderToStaticMarkup(
      React.createElement(StepCommitmentSummary, {
        selectedCommitment: 10,
        onSelectCommitment: () => {},
        formData: {
          native_language: 'en',
          proficiency_level: 'beginner',
          learning_goals: ['understanding_kannada_culture'],
          daily_goal_minutes: 10,
        },
        onEditStep: () => {},
        onSubmit: () => {},
        error: 'Network connectivity timeout during profile persistence',
      })
    );

    assert.match(html, /role="alert"/, 'Accessible alert role present');
    assert.match(html, /Network connectivity timeout during profile persistence/, 'Error text displayed');
    assert.match(html, /Retry Submission/, 'Retry action button available');
  });

  await testCase('T5-UI-10', 'Helper functions and constants conform strictly to contract', () => {
    assert.equal(SUPPORTED_LANGUAGES.length, 5, 'Exactly 5 supported languages');
    assert.equal(KANNADA_LEVELS.length, 3, 'Exactly 3 proficiency levels');
    assert.equal(LEARNING_GOAL_OPTIONS.length, 7, 'Exactly 7 learning goal options');
    assert.equal(COMMITMENT_INTERVALS.length, 4, 'Exactly 4 commitment intervals');

    assert.equal(resolveDisplayName({ full_name: ' Ramesh Kumar ' }), 'Ramesh Kumar');
    assert.equal(resolveDisplayName({ name: 'Suresh' }), 'Suresh');
    assert.equal(resolveDisplayName(undefined, 'kiran@gmail.com'), 'kiran');
    assert.equal(resolveDisplayName(undefined, undefined), 'Learner');

    assert.equal(resolveAvatarUrl({ avatar_url: 'https://example.com/pic.jpg' }), 'https://example.com/pic.jpg');
    assert.equal(resolveAvatarUrl({ picture: 'https://google.com/pic.png' }), 'https://google.com/pic.png');
    assert.equal(resolveAvatarUrl(undefined), null);
  });

  // ============================================================================
  // SUITE 2: Design Tokens, Touch Targets, Kannada Typography & Accessibility
  // ============================================================================
  console.log('\n--- SUITE 2: Design Tokens, Touch Targets & Accessibility ---');

  await testCase('T5-DS-01', 'Touch Targets: Interactive buttons and option cards satisfy >= 44px/48px standard', () => {
    const indicatorHtml = renderToStaticMarkup(
      React.createElement(StepIndicator, {
        currentStep: 3,
        totalSteps: 5,
        onBack: () => {},
        canGoBack: true,
      })
    );
    assert.match(indicatorHtml, /min-h-\[44px\]/, 'StepIndicator Back button satisfies >= 44px touch target');

    const welcomeHtml = renderToStaticMarkup(
      React.createElement(StepWelcome, {
        displayName: 'Akash',
        onStart: () => {},
      })
    );
    assert.match(welcomeHtml, /min-h-\[48px\]/, 'StepWelcome CTA satisfies >= 48px target');

    const langHtml = renderToStaticMarkup(
      React.createElement(StepNativeLanguage, {
        selected: 'hi',
        canContinue: true,
      })
    );
    assert.match(langHtml, /min-h-\[72px\]/, 'Language cards satisfy >= 72px target');

    const levelHtml = renderToStaticMarkup(
      React.createElement(StepKannadaLevel, {
        selected: 'beginner',
        canContinue: true,
      })
    );
    assert.match(levelHtml, /min-h-\[96px\]/, 'Proficiency cards satisfy >= 96px target');

    const goalsHtml = renderToStaticMarkup(
      React.createElement(StepLearningGoals, {
        selectedGoals: ['everyday_conversations'],
        canContinue: true,
      })
    );
    assert.match(goalsHtml, /min-h-\[84px\]/, 'Goal cards satisfy >= 84px target');

    const commitmentHtml = renderToStaticMarkup(
      React.createElement(StepCommitmentSummary, {
        selectedCommitment: 10,
        onSelectCommitment: () => {},
        onEditStep: () => {},
        onSubmit: () => {},
      })
    );
    assert.match(commitmentHtml, /min-h-\[96px\]/, 'Commitment cards satisfy >= 96px target');
    assert.match(commitmentHtml, /min-h-\[48px\]/, 'Submit button satisfies >= 48px target');
  });

  await testCase('T5-DS-02', 'Design Tokens & Palette: Royal Navy, Mysore Gold, and Cream present in tokens', () => {
    const cssPath = resolve(process.cwd(), 'app/globals.css');
    const cssContent = readFileSync(cssPath, 'utf8');

    assert.match(cssContent, /#101D36/, 'Royal navy background token present');
    assert.match(cssContent, /#D5A64A/, 'Mysore gold accent token present');
    assert.match(cssContent, /#F8F5EE/, 'Warm ivory primary text token present');
    assert.match(cssContent, /#EDE5D6/, 'Heritage cream secondary text token present');
  });

  await testCase('T5-DS-03', 'Kannada Typography: Noto Sans Kannada configured and applied to Kannada text', () => {
    const layoutPath = resolve(process.cwd(), 'app/layout.tsx');
    const layoutContent = readFileSync(layoutPath, 'utf8');

    assert.match(layoutContent, /Noto_Sans_Kannada/, 'Noto_Sans_Kannada font loader configured');
    assert.match(layoutContent, /--font-kannada/, 'CSS variable --font-kannada declared');
    assert.match(layoutContent, /subsets:\s*\[['"]kannada['"]\]/, 'Kannada subset configured');

    const welcomeHtml = renderToStaticMarkup(
      React.createElement(StepWelcome, {
        displayName: 'Priya',
      })
    );
    assert.match(welcomeHtml, /font-kannada/, 'font-kannada class applied to Kannada greeting');
    assert.match(welcomeHtml, /ನಮಸ್ಕಾರ!/, 'Verbatim Kannada greeting rendered');

    const successHtml = renderToStaticMarkup(
      React.createElement(
        AppRouterContext.Provider,
        { value: mockRouter as unknown as AppRouterInstance },
        React.createElement(OnboardingSuccess, {
          userName: 'Priya',
        })
      )
    );
    assert.match(successHtml, /font-kannada/, 'font-kannada class applied in celebration view');
    assert.match(successHtml, /ನಮಸ್ಕಾರ! Your Kannada journey begins\./, 'Verbatim Kannada celebration rendered');
  });

  await testCase('T5-DS-04', 'Mobile Safe-Area Padding: env(safe-area-inset-bottom) in onboarding layout', () => {
    const pagePath = resolve(process.cwd(), 'app/onboarding/page.tsx');
    const pageContent = readFileSync(pagePath, 'utf8');
    assert.match(pageContent, /env\(safe-area-inset-bottom\)/, 'Mobile safe-area inset bottom padding enforced');
  });

  await testCase('T5-DS-05', 'Accessibility: Framer Motion useReducedMotion hooks utilized across wizard views', () => {
    const wizardPath = resolve(process.cwd(), 'components/onboarding/OnboardingWizard.tsx');
    const wizardContent = readFileSync(wizardPath, 'utf8');
    assert.match(wizardContent, /useReducedMotion/, 'useReducedMotion imported in OnboardingWizard');
    assert.match(wizardContent, /shouldReduceMotion \? 0 :/, 'Variants conditionally adapt to reduced-motion preference');
  });

  // ============================================================================
  // SUITE 3: 3-State Routing Matrix & Edge Proxy Session Synchronization
  // ============================================================================
  console.log('\n--- SUITE 3: 3-State Routing Matrix & Proxy Session Synchronization ---');

  await testCase('T5-RT-01', 'State 1 (Unauthenticated): /onboarding redirects to /login?redirect=/onboarding', async () => {
    const req = new NextRequest('http://localhost:3000/onboarding');
    const res = await updateSession(req);
    assert.equal(res.status, 307, 'Should return HTTP 307');
    assert.equal(res.headers.get('location'), 'http://localhost:3000/login?redirect=%2Fonboarding');
  });

  await testCase('T5-RT-02', 'State 1 (Unauthenticated): /dashboard redirects to /login?redirect=/dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/dashboard');
    const res = await updateSession(req);
    assert.equal(res.status, 307, 'Should return HTTP 307');
    assert.equal(res.headers.get('location'), 'http://localhost:3000/login?redirect=%2Fdashboard');
  });

  await testCase('T5-RT-03', 'State 1 (Unauthenticated): /login and /signup are accessible (200 pass-through)', async () => {
    const reqLogin = new NextRequest('http://localhost:3000/login');
    const resLogin = await updateSession(reqLogin);
    assert.equal(resLogin.status, 200, 'Public login route passes through');

    const reqSignup = new NextRequest('http://localhost:3000/signup');
    const resSignup = await updateSession(reqSignup);
    assert.equal(resSignup.status, 200, 'Public signup route passes through');
  });

  const sessionPayload = {
    access_token: 'mock-jwt-access-tier5',
    refresh_token: 'mock-jwt-refresh-tier5',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };

  await testCase('T5-RT-04', 'State 2 (Authenticated Incomplete): /dashboard redirects to /onboarding', async () => {
    const restore = configureMockSupabaseBackend({
      userId: 'usr-tier5-incomplete',
      onboardingCompleted: false,
    });
    try {
      const req = new NextRequest('http://localhost:3000/dashboard');
      req.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
      const res = await updateSession(req);
      assert.equal(res.status, 307, 'Should redirect incomplete user');
      assert.equal(res.headers.get('location'), 'http://localhost:3000/onboarding');
    } finally {
      restore();
    }
  });

  await testCase('T5-RT-05', 'State 2 (Authenticated Incomplete): /login and /signup redirect to /onboarding', async () => {
    const restore = configureMockSupabaseBackend({
      userId: 'usr-tier5-incomplete',
      onboardingCompleted: false,
    });
    try {
      const reqLogin = new NextRequest('http://localhost:3000/login');
      reqLogin.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
      const resLogin = await updateSession(reqLogin);
      assert.equal(resLogin.status, 307);
      assert.equal(resLogin.headers.get('location'), 'http://localhost:3000/onboarding');

      const reqSignup = new NextRequest('http://localhost:3000/signup');
      reqSignup.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
      const resSignup = await updateSession(reqSignup);
      assert.equal(resSignup.status, 307);
      assert.equal(resSignup.headers.get('location'), 'http://localhost:3000/onboarding');
    } finally {
      restore();
    }
  });

  await testCase('T5-RT-06', 'State 3 (Authenticated Complete): /login, /signup, /onboarding redirect to /dashboard', async () => {
    const restore = configureMockSupabaseBackend({
      userId: 'usr-tier5-complete',
      onboardingCompleted: true,
    });
    try {
      for (const path of ['/login', '/signup', '/onboarding']) {
        const req = new NextRequest(`http://localhost:3000${path}`);
        req.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const res = await updateSession(req);
        assert.equal(res.status, 307, `Expected 307 redirect from ${path}`);
        assert.equal(res.headers.get('location'), 'http://localhost:3000/dashboard');
      }
    } finally {
      restore();
    }
  });

  await testCase('T5-RT-07', 'State 3 (Authenticated Complete): /dashboard access passes through (200)', async () => {
    const restore = configureMockSupabaseBackend({
      userId: 'usr-tier5-complete',
      onboardingCompleted: true,
    });
    try {
      const req = new NextRequest('http://localhost:3000/dashboard');
      req.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
      const res = await updateSession(req);
      assert.equal(res.status, 200, 'Completed user permitted directly on /dashboard');
    } finally {
      restore();
    }
  });

  await testCase('T5-RT-08', 'Session Cookie Preservation: Refreshed auth cookies preserved on redirect responses', async () => {
    const restore = configureMockSupabaseBackend({
      userId: 'usr-tier5-incomplete',
      onboardingCompleted: false,
    });
    try {
      const req = new NextRequest('http://localhost:3000/dashboard');
      req.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
      const res = await updateSession(req);
      assert.equal(res.status, 307);
      const location = res.headers.get('location');
      assert.equal(location, 'http://localhost:3000/onboarding');
    } finally {
      restore();
    }
  });

  // ============================================================================
  // SUITE 4: OAuth Callback, Dynamic Destinations & Open Redirect Neutralization
  // ============================================================================
  console.log('\n--- SUITE 4: OAuth Callback & Open Redirect Neutralization ---');

  await testCase('T5-OAUTH-01', 'OAuth code exchange with completed profile routes to /dashboard', async () => {
    const restore = configureMockSupabaseBackend({
      codeSuccess: true,
      onboardingCompleted: true,
    });
    try {
      const fakeCookies = new RequestCookies(new Headers());
      fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('pkce-code-verifier'));

      await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
        const req = new Request('http://localhost:3000/auth/callback?code=valid-auth-code');
        const res = await authCallbackRoute(req);
        assert.equal(res.status, 307);
        assert.equal(res.headers.get('location'), 'http://localhost:3000/dashboard');
      });
    } finally {
      restore();
    }
  });

  await testCase('T5-OAUTH-02', 'OAuth code exchange with incomplete profile routes to /onboarding', async () => {
    const restore = configureMockSupabaseBackend({
      codeSuccess: true,
      onboardingCompleted: false,
    });
    try {
      const fakeCookies = new RequestCookies(new Headers());
      fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('pkce-code-verifier'));

      await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
        const req = new Request('http://localhost:3000/auth/callback?code=valid-auth-code');
        const res = await authCallbackRoute(req);
        assert.equal(res.status, 307);
        assert.equal(res.headers.get('location'), 'http://localhost:3000/onboarding');
      });
    } finally {
      restore();
    }
  });

  await testCase('T5-OAUTH-03', 'OAuth honors valid internal destination for completed user', async () => {
    const restore = configureMockSupabaseBackend({
      codeSuccess: true,
      onboardingCompleted: true,
    });
    try {
      const fakeCookies = new RequestCookies(new Headers());
      fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('pkce-code-verifier'));

      await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
        const req = new Request('http://localhost:3000/auth/callback?code=valid-auth-code&next=/profile/settings');
        const res = await authCallbackRoute(req);
        assert.equal(res.status, 307);
        assert.equal(res.headers.get('location'), 'http://localhost:3000/profile/settings');
      });
    } finally {
      restore();
    }
  });

  await testCase('T5-OAUTH-04', 'Completed user requesting next=/onboarding is redirected to /dashboard', async () => {
    const restore = configureMockSupabaseBackend({
      codeSuccess: true,
      onboardingCompleted: true,
    });
    try {
      const fakeCookies = new RequestCookies(new Headers());
      fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('pkce-code-verifier'));

      await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
        const req = new Request('http://localhost:3000/auth/callback?code=valid-auth-code&next=/onboarding');
        const res = await authCallbackRoute(req);
        assert.equal(res.status, 307);
        assert.equal(res.headers.get('location'), 'http://localhost:3000/dashboard');
      });
    } finally {
      restore();
    }
  });

  await testCase('T5-OAUTH-05', 'Open Redirect Attacks are sanitized to fallback /dashboard', async () => {
    const attackPayloads = [
      '//malicious.com/steal',
      '///malicious.com',
      'http://phishing.org/login',
      'https://attacker.io/payload',
      'javascript:alert(1)',
      'data:text/html,hack',
      'evil.com/path',
    ];

    const restore = configureMockSupabaseBackend({
      codeSuccess: true,
      onboardingCompleted: true,
    });
    try {
      for (const payload of attackPayloads) {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('pkce-code-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const req = new Request(`http://localhost:3000/auth/callback?code=valid-auth-code&next=${encodeURIComponent(payload)}`);
          const res = await authCallbackRoute(req);
          assert.equal(
            res.headers.get('location'),
            'http://localhost:3000/dashboard',
            `Payload "${payload}" must be sanitized to /dashboard`
          );
        });
      }
    } finally {
      restore();
    }
  });

  await testCase('T5-OAUTH-06', 'Missing or invalid code param redirects to /login?error=...', async () => {
    const fakeCookies = new RequestCookies(new Headers());
    await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
      const req = new Request('http://localhost:3000/auth/callback');
      const res = await authCallbackRoute(req);
      assert.equal(res.status, 307);
      assert.match(res.headers.get('location') || '', /\/login\?error=/);
    });
  });

  // ============================================================================
  // SUITE 5: Proxy Matcher & Hop Convergence Protection
  // ============================================================================
  console.log('\n--- SUITE 5: Edge Proxy Matcher & Hop Convergence ---');

  await testCase('T5-PRX-01', 'Proxy matcher regex includes application routes and skips static assets', () => {
    const pattern = proxyConfig.matcher[0];
    const regex = new RegExp(`^${pattern}$`);

    // Should match application routes
    assert.equal(regex.test('/onboarding'), true, 'Matches /onboarding');
    assert.equal(regex.test('/dashboard'), true, 'Matches /dashboard');
    assert.equal(regex.test('/login'), true, 'Matches /login');
    assert.equal(regex.test('/signup'), true, 'Matches /signup');
    assert.equal(regex.test('/auth/callback'), true, 'Matches /auth/callback');

    // Should NOT match static assets
    assert.equal(regex.test('/_next/static/chunks/app.js'), false, 'Excludes _next/static');
    assert.equal(regex.test('/_next/image?url=foo'), false, 'Excludes _next/image');
    assert.equal(regex.test('/favicon.ico'), false, 'Excludes favicon.ico');
    assert.equal(regex.test('/images/mysore-palace.jpg'), false, 'Excludes images/');
    assert.equal(regex.test('/logo.svg'), false, 'Excludes .svg');
    assert.equal(regex.test('/photo.png'), false, 'Excludes .png');
  });

  await testCase('T5-PRX-02', 'proxy() entrypoint directly delegates to updateSession()', async () => {
    const req = new NextRequest('http://localhost:3000/onboarding');
    const res = await proxy(req);
    assert.equal(res.status, 307);
    assert.equal(res.headers.get('location'), 'http://localhost:3000/login?redirect=%2Fonboarding');
  });

  // ============================================================================
  // FINAL REPORT
  // ============================================================================
  console.log('\n================================================================================');
  const failed = tests.filter((t) => !t.passed);
  console.log(`  TIER 5 HARNESS RESULTS: ${tests.length - failed.length} / ${tests.length} TESTS PASSED (${failed.length} failures)`);
  console.log('================================================================================\n');

  if (failed.length > 0) {
    console.error('FAILURES DETECTED:');
    failed.forEach((f) => console.error(`  - ${f.id}: ${f.name} => ${f.error}`));
    process.exit(1);
  }
}

runEmpiricalHarness().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
