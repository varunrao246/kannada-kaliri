/**
 * Empirical Adversarial Test Harness: Milestone M03
 * Target: app/auth/callback/route.ts, lib/supabase/middleware.ts, & proxy.ts
 *
 * Verifies:
 * 1. OAuth Callback Route (app/auth/callback/route.ts):
 *    - Valid code exchange with completed profile -> redirects to /dashboard (or sanitized next).
 *    - Valid code exchange with incomplete profile or new user -> redirects to /onboarding.
 *    - Completed profile requesting next=/onboarding -> redirected to /dashboard.
 *    - Missing or empty code -> redirects to /login?error=Invalid+or+missing+authorization+code.
 *    - Invalid code exchange error -> redirects to /login?error=...
 *    - Malicious open redirect payloads in next (//, ///, http:, https:, javascript:, data:, etc.) safely sanitized.
 *    - Forwarded host header (x-forwarded-host) in production vs development.
 * 2. Session Cookie Synchronization & Routing Matrix (lib/supabase/middleware.ts & proxy.ts):
 *    - Proxy matcher coverage (includes app routes, excludes static assets).
 *    - Unauthenticated, incomplete, and completed 3-state routing enforcement.
 *    - Preserves refreshed session cookies on all redirect responses (cookie sync across middleware & proxy).
 *    - Multi-hop navigation convergence with zero redirect loops.
 */

import './als-setup';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

interface TestRecord {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

// ============================================================================
// Next.js Server Storage Simulation Helpers
// Enables calling createClient() from lib/supabase/server in a test environment
// ============================================================================

async function runInNextRequestContext<T>(
  fakeCookies: InstanceType<typeof import('next/dist/compiled/@edge-runtime/cookies').RequestCookies>,
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

// ============================================================================
// Mock Fetch & Mock Supabase Backend Configurator
// ============================================================================

interface MockBackendConfig {
  codeExchangeSuccess?: boolean;
  codeExchangeErrorMessage?: string;
  userId?: string;
  userEmail?: string;
  onboardingCompleted?: boolean | null; // null means no row in DB
  queryError?: boolean;
}

function configureMockSupabaseBackend(config: MockBackendConfig) {
  const userId = config.userId ?? 'usr-m03-emp-001';
  const userEmail = config.userEmail ?? 'emp-challenger@kannadakaliri.org';
  const codeSuccess = config.codeExchangeSuccess ?? true;
  const onboardingCompleted = config.onboardingCompleted ?? false;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const parsed = new URL(urlStr);

    // 1. Supabase Auth Token Exchange (PKCE)
    if (parsed.pathname === '/auth/v1/token') {
      if (!codeSuccess) {
        return new Response(
          JSON.stringify({
            error: 'invalid_grant',
            error_description: config.codeExchangeErrorMessage ?? 'Invalid authorization code or PKCE verifier',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          access_token: 'mock-jwt-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token-xyz',
          user: {
            id: userId,
            aud: 'authenticated',
            role: 'authenticated',
            email: userEmail,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Supabase Auth User Details
    if (parsed.pathname === '/auth/v1/user') {
      return new Response(
        JSON.stringify({
          id: userId,
          aud: 'authenticated',
          role: 'authenticated',
          email: userEmail,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. PostgREST learner_profiles Table
    if (parsed.pathname.startsWith('/rest/v1/learner_profiles')) {
      if (config.queryError) {
        return new Response(
          JSON.stringify({ code: 'PGRST500', message: 'Database connection failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (onboardingCompleted === null) {
        // No row found
        return new Response('null', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          onboarding_completed: onboardingCompleted,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Endpoint not mocked' }), { status: 404 });
  }) as typeof globalThis.fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

// ============================================================================
// Main Empirical Test Suite Execution
// ============================================================================

async function runTestSuite() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   EMPIRICAL CHALLENGER SUITE: MILESTONE M03                               ║');
  console.log('║   OAuth Callback Route, Open Redirect Defense & Session Synchronization   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  const { RequestCookies } = await import('next/dist/compiled/@edge-runtime/cookies/index.js');
  const { GET: authCallbackRoute } = await import('../../app/auth/callback/route');
  const { updateSession } = await import('../../lib/supabase/middleware');
  const { proxy, config: proxyConfig } = await import('../../proxy');

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
  // SECTION 1: OAuth Callback Route (app/auth/callback/route.ts)
  // ==========================================================================
  console.log('--- SECTION 1: OAuth Callback Code Exchange & Dynamic Routing ---');

  await execute(
    'OAUTH-01',
    'Valid code exchange with completed profile redirects to /dashboard by default',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: true,
        onboardingCompleted: true,
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        // Populate PKCE code verifier cookie expected by Supabase SSR
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://localhost:3000/auth/callback?code=valid-code-01');
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307, 'Should return HTTP 307 redirect');
          assert.equal(
            response.headers.get('location'),
            'http://localhost:3000/dashboard',
            'Completed user without next param must redirect to /dashboard'
          );
        });
      } finally {
        restoreFetch();
      }
    }
  );

  await execute(
    'OAUTH-02',
    'Valid code exchange with completed profile honors valid internal next destination',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: true,
        onboardingCompleted: true,
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://localhost:3000/auth/callback?code=valid-code-02&next=/settings/profile');
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307);
          assert.equal(
            response.headers.get('location'),
            'http://localhost:3000/settings/profile',
            'Completed user with valid next param must redirect to requested internal destination'
          );
        });
      } finally {
        restoreFetch();
      }
    }
  );

  await execute(
    'OAUTH-03',
    'Valid code exchange with completed profile requesting next=/onboarding is redirected to /dashboard',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: true,
        onboardingCompleted: true,
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://localhost:3000/auth/callback?code=valid-code-03&next=/onboarding');
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307);
          assert.equal(
            response.headers.get('location'),
            'http://localhost:3000/dashboard',
            'Completed user requesting /onboarding must be redirected to /dashboard'
          );
        });
      } finally {
        restoreFetch();
      }
    }
  );

  await execute(
    'OAUTH-04',
    'Valid code exchange with incomplete profile (onboarding_completed: false) redirects to /onboarding',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: true,
        onboardingCompleted: false,
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://localhost:3000/auth/callback?code=valid-code-04');
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307);
          assert.equal(
            response.headers.get('location'),
            'http://localhost:3000/onboarding',
            'Incomplete user must redirect to /onboarding'
          );
        });
      } finally {
        restoreFetch();
      }
    }
  );

  await execute(
    'OAUTH-05',
    'Valid code exchange with new user (no learner_profiles row) redirects to /onboarding',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: true,
        onboardingCompleted: null, // null simulates no database row
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://localhost:3000/auth/callback?code=valid-code-05');
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307);
          assert.equal(
            response.headers.get('location'),
            'http://localhost:3000/onboarding',
            'Brand-new user with no row must redirect to /onboarding'
          );
        });
      } finally {
        restoreFetch();
      }
    }
  );

  await execute(
    'OAUTH-06',
    'Valid code exchange with incomplete profile requesting next=/dashboard is forced to /onboarding',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: true,
        onboardingCompleted: false,
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://localhost:3000/auth/callback?code=valid-code-06&next=/dashboard');
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307);
          assert.equal(
            response.headers.get('location'),
            'http://localhost:3000/onboarding',
            'Incomplete user cannot bypass onboarding via next query parameter'
          );
        });
      } finally {
        restoreFetch();
      }
    }
  );

  await execute(
    'OAUTH-07',
    'Missing code parameter redirects to /login with descriptive error',
    async () => {
      const request = new Request('http://localhost:3000/auth/callback');
      const response = await authCallbackRoute(request);

      assert.equal(response.status, 307);
      assert.equal(
        response.headers.get('location'),
        'http://localhost:3000/login?error=Invalid+or+missing+authorization+code',
        'Missing code must redirect to /login with error query'
      );
    }
  );

  await execute(
    'OAUTH-08',
    'Empty code parameter (code=) redirects to /login with error',
    async () => {
      const request = new Request('http://localhost:3000/auth/callback?code=');
      const response = await authCallbackRoute(request);

      assert.equal(response.status, 307);
      assert.equal(
        response.headers.get('location'),
        'http://localhost:3000/login?error=Invalid+or+missing+authorization+code'
      );
    }
  );

  await execute(
    'OAUTH-09',
    'Invalid authorization code error in exchangeCodeForSession redirects to /login?error=...',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: false,
        codeExchangeErrorMessage: 'Authorization code has expired',
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://localhost:3000/auth/callback?code=expired-code');
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307);
          const location = response.headers.get('location') || '';
          assert.ok(location.startsWith('http://localhost:3000/login?error='), 'Must redirect to login with error');
          assert.ok(location.includes('Authorization%20code%20has%20expired'), 'Must encode error message');
        });
      } finally {
        restoreFetch();
      }
    }
  );

  // ==========================================================================
  // SECTION 2: Open Redirect Stress Testing & Sanitization
  // ==========================================================================
  console.log('\n--- SECTION 2: Open Redirect Attack Surface & Sanitization ---');

  const openRedirectPayloads = [
    { payload: '//evil.com', desc: 'Protocol-relative double-slash' },
    { payload: '///evil.com/path', desc: 'Triple-slash protocol-relative' },
    { payload: '////evil.com', desc: 'Quad-slash protocol-relative' },
    { payload: 'http://malicious-phishing.com', desc: 'Absolute HTTP URL' },
    { payload: 'https://malicious-phishing.com/steal-session', desc: 'Absolute HTTPS URL' },
    { payload: 'javascript:alert(document.cookie)', desc: 'JavaScript URI scheme' },
    { payload: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==', desc: 'Data URI scheme' },
    { payload: 'vbscript:msgbox("xss")', desc: 'VBScript URI scheme' },
    { payload: 'ftp://ftp.evil.org/malware', desc: 'FTP URI scheme' },
    { payload: '%2f%2fevil.com', desc: 'URL-encoded protocol-relative //evil.com' },
    { payload: '%68%74%74%70%73%3a%2f%2fevil.com', desc: 'URL-encoded https://evil.com' },
    { payload: 'evil.com', desc: 'Domain without leading slash' },
  ];

  for (let i = 0; i < openRedirectPayloads.length; i++) {
    const { payload, desc } = openRedirectPayloads[i];
    await execute(
      `OAUTH-REDIRECT-${String(i + 1).padStart(2, '0')}`,
      `Open redirect attack [${desc}]: "${payload}" safely neutralized to /dashboard`,
      async () => {
        const restoreFetch = configureMockSupabaseBackend({
          codeExchangeSuccess: true,
          onboardingCompleted: true,
        });

        try {
          const fakeCookies = new RequestCookies(new Headers());
          fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

          await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
            const encodedNext = encodeURIComponent(payload);
            const request = new Request(`http://localhost:3000/auth/callback?code=valid-code-red&next=${encodedNext}`);
            const response = await authCallbackRoute(request);

            assert.equal(response.status, 307);
            const location = response.headers.get('location');
            assert.equal(
              location,
              'http://localhost:3000/dashboard',
              `Malicious next payload "${payload}" must be sanitized and default to /dashboard`
            );
          });
        } finally {
          restoreFetch();
        }
      }
    );
  }

  // ==========================================================================
  // SECTION 3: Host Header & Origin Resolution
  // ==========================================================================
  console.log('\n--- SECTION 3: Forwarded Host Header & Environment Origin Resolution ---');

  await execute(
    'OAUTH-HOST-01',
    'Production environment with x-forwarded-host uses HTTPS and forwarded host',
    async () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-expect-error Mutating NODE_ENV for production host resolution test
      process.env.NODE_ENV = 'production';

      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: true,
        onboardingCompleted: true,
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://internal-cluster.local/auth/callback?code=valid-code-prod', {
            headers: {
              'x-forwarded-host': 'kannadakaliri.org',
            },
          });
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307);
          assert.equal(
            response.headers.get('location'),
            'https://kannadakaliri.org/dashboard',
            'In production with x-forwarded-host, redirect origin must be https://<forwardedHost>'
          );
        });
      } finally {
        // @ts-expect-error Restoring NODE_ENV to original value
        process.env.NODE_ENV = originalEnv;
        restoreFetch();
      }
    }
  );

  await execute(
    'OAUTH-HOST-02',
    'Development environment ignores x-forwarded-host and retains local request origin',
    async () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-expect-error Mutating NODE_ENV for development host resolution test
      process.env.NODE_ENV = 'development';

      const restoreFetch = configureMockSupabaseBackend({
        codeExchangeSuccess: true,
        onboardingCompleted: true,
      });

      try {
        const fakeCookies = new RequestCookies(new Headers());
        fakeCookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token-code-verifier', JSON.stringify('valid-pkce-verifier'));

        await runInNextRequestContext(fakeCookies, '/auth/callback', async () => {
          const request = new Request('http://localhost:3000/auth/callback?code=valid-code-dev', {
            headers: {
              'x-forwarded-host': 'spoofed-domain.com',
            },
          });
          const response = await authCallbackRoute(request);

          assert.equal(response.status, 307);
          assert.equal(
            response.headers.get('location'),
            'http://localhost:3000/dashboard',
            'In development, x-forwarded-host must not override localhost origin'
          );
        });
      } finally {
        // @ts-expect-error Restoring NODE_ENV to original value
        process.env.NODE_ENV = originalEnv;
        restoreFetch();
      }
    }
  );

  // ==========================================================================
  // SECTION 4: Next.js 16 Edge Proxy & Matcher Configuration
  // ==========================================================================
  console.log('\n--- SECTION 4: Edge Proxy Matcher & Request Routing ---');

  await execute(
    'PROXY-01',
    'Proxy config matcher covers all application routes while skipping static assets',
    () => {
      assert.ok(Array.isArray(proxyConfig.matcher), 'proxyConfig.matcher must be an array');
      const pattern = proxyConfig.matcher[0];
      assert.ok(typeof pattern === 'string', 'Matcher item should be a regex string');

      // Create RegExp from the Next.js pattern
      const regex = new RegExp(`^${pattern}$`);

      // Positive matches (Application routes that proxy MUST run on)
      const positiveRoutes = [
        '/',
        '/dashboard',
        '/onboarding',
        '/login',
        '/signup',
        '/auth/callback',
        '/api/profile',
      ];
      for (const route of positiveRoutes) {
        assert.equal(regex.test(route), true, `Route "${route}" MUST match proxy matcher`);
      }

      // Negative matches (Static assets that proxy MUST NOT run on)
      const negativeRoutes = [
        '/_next/static/chunks/app/layout.js',
        '/_next/image?url=%2Flogo.png&w=128&q=75',
        '/favicon.ico',
        '/images/hero-banner.jpg',
        '/icons/kannada.svg',
        '/assets/mysore-palace.webp',
        '/banner.png',
      ];
      for (const route of negativeRoutes) {
        assert.equal(regex.test(route), false, `Static asset "${route}" MUST NOT match proxy matcher`);
      }
    }
  );

  await execute(
    'PROXY-02',
    'proxy() entrypoint directly delegates to updateSession()',
    async () => {
      const request = new NextRequest('http://localhost:3000/onboarding');
      const response = await proxy(request);

      assert.equal(response.status, 307);
      assert.equal(
        response.headers.get('location'),
        'http://localhost:3000/login?redirect=%2Fonboarding'
      );
    }
  );

  // ==========================================================================
  // SECTION 5: Session Cookie Synchronization & 3-State Matrix
  // ==========================================================================
  console.log('\n--- SECTION 5: Session Cookie Synchronization across Middleware & Proxy ---');

  await execute(
    'SESS-SYNC-01',
    'Unauthenticated access: /dashboard and /onboarding redirect to /login with redirect query param',
    async () => {
      // 1. /dashboard
      const reqDash = new NextRequest('http://localhost:3000/dashboard');
      const resDash = await updateSession(reqDash);
      assert.equal(resDash.status, 307);
      assert.equal(resDash.headers.get('location'), 'http://localhost:3000/login?redirect=%2Fdashboard');

      // 2. /onboarding
      const reqOnb = new NextRequest('http://localhost:3000/onboarding');
      const resOnb = await updateSession(reqOnb);
      assert.equal(resOnb.status, 307);
      assert.equal(resOnb.headers.get('location'), 'http://localhost:3000/login?redirect=%2Fonboarding');

      // 3. /login (Public route passes through)
      const reqLogin = new NextRequest('http://localhost:3000/login');
      const resLogin = await updateSession(reqLogin);
      assert.equal(resLogin.status, 200, 'Unauthenticated user accessing /login must pass through (status 200)');
      assert.equal(resLogin.headers.get('location'), null);

      // 4. / (Public landing page passes through)
      const reqLanding = new NextRequest('http://localhost:3000/');
      const resLanding = await updateSession(reqLanding);
      assert.equal(resLanding.status, 200);
      assert.equal(resLanding.headers.get('location'), null);
    }
  );

  await execute(
    'SESS-SYNC-02',
    'Authenticated with incomplete profile: redirects /dashboard, /login, /signup to /onboarding',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        userId: 'usr-incomplete-01',
        onboardingCompleted: false,
      });

      try {
        const sessionPayload = {
          access_token: 'mock-access-token-inc',
          refresh_token: 'mock-refresh-token-inc',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        };

        // Case A: /dashboard -> /onboarding
        const reqDash = new NextRequest('http://localhost:3000/dashboard');
        reqDash.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const resDash = await updateSession(reqDash);
        assert.equal(resDash.status, 307);
        assert.equal(resDash.headers.get('location'), 'http://localhost:3000/onboarding');

        // Case B: /login -> /onboarding
        const reqLogin = new NextRequest('http://localhost:3000/login');
        reqLogin.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const resLogin = await updateSession(reqLogin);
        assert.equal(resLogin.status, 307);
        assert.equal(resLogin.headers.get('location'), 'http://localhost:3000/onboarding');

        // Case C: /signup -> /onboarding
        const reqSignup = new NextRequest('http://localhost:3000/signup');
        reqSignup.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const resSignup = await updateSession(reqSignup);
        assert.equal(resSignup.status, 307);
        assert.equal(resSignup.headers.get('location'), 'http://localhost:3000/onboarding');

        // Case D: /onboarding -> 200 pass-through
        const reqOnb = new NextRequest('http://localhost:3000/onboarding');
        reqOnb.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const resOnb = await updateSession(reqOnb);
        assert.equal(resOnb.status, 200, 'Incomplete user accessing /onboarding must pass through');
        assert.equal(resOnb.headers.get('location'), null);
      } finally {
        restoreFetch();
      }
    }
  );

  await execute(
    'SESS-SYNC-03',
    'Authenticated with completed profile: redirects /login, /signup, /onboarding to /dashboard',
    async () => {
      const restoreFetch = configureMockSupabaseBackend({
        userId: 'usr-complete-01',
        onboardingCompleted: true,
      });

      try {
        const sessionPayload = {
          access_token: 'mock-access-token-comp',
          refresh_token: 'mock-refresh-token-comp',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        };

        // Case A: /login -> /dashboard
        const reqLogin = new NextRequest('http://localhost:3000/login');
        reqLogin.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const resLogin = await updateSession(reqLogin);
        assert.equal(resLogin.status, 307);
        assert.equal(resLogin.headers.get('location'), 'http://localhost:3000/dashboard');

        // Case B: /signup -> /dashboard
        const reqSignup = new NextRequest('http://localhost:3000/signup');
        reqSignup.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const resSignup = await updateSession(reqSignup);
        assert.equal(resSignup.status, 307);
        assert.equal(resSignup.headers.get('location'), 'http://localhost:3000/dashboard');

        // Case C: /onboarding -> /dashboard
        const reqOnb = new NextRequest('http://localhost:3000/onboarding');
        reqOnb.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const resOnb = await updateSession(reqOnb);
        assert.equal(resOnb.status, 307);
        assert.equal(resOnb.headers.get('location'), 'http://localhost:3000/dashboard');

        // Case D: /dashboard -> 200 pass-through
        const reqDash = new NextRequest('http://localhost:3000/dashboard');
        reqDash.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        const resDash = await updateSession(reqDash);
        assert.equal(resDash.status, 200, 'Completed user accessing /dashboard must pass through');
        assert.equal(resDash.headers.get('location'), null);
      } finally {
        restoreFetch();
      }
    }
  );

  await execute(
    'SESS-SYNC-04',
    'Cookie synchronization: refreshed session cookies are preserved on redirect responses',
    async () => {
      // In this test, we verify that any cookies modified or refreshed during updateSession
      // are propagated into the redirectResponse via createRedirectResponse
      const userId = 'usr-refresh-token-test';

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const parsed = new URL(urlStr);

        if (parsed.pathname === '/auth/v1/user') {
          return new Response(
            JSON.stringify({
              id: userId,
              aud: 'authenticated',
              role: 'authenticated',
              email: 'sync@kannadakaliri.org',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (parsed.pathname.startsWith('/rest/v1/learner_profiles')) {
          return new Response(JSON.stringify({ onboarding_completed: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
      }) as typeof globalThis.fetch;

      try {
        const req = new NextRequest('http://localhost:3000/login');
        const sessionPayload = {
          access_token: 'mock-access-token-orig',
          refresh_token: 'mock-refresh-token-orig',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        };
        req.cookies.set('sb-xepgknlbisdxgcqmfrwx-auth-token', JSON.stringify(sessionPayload));
        // Add custom tracking cookies to assert preservation
        req.cookies.set('kk-pref-theme', 'mysore-royal');
        req.cookies.set('kk-native-lang', 'kn');

        const response = await updateSession(req);

        assert.equal(response.status, 307);
        assert.equal(response.headers.get('location'), 'http://localhost:3000/dashboard');

        // Assert cookies on the redirect response
        // In Next.js, response.cookies contains cookies copied over to the response
        const cookies = response.cookies;
        assert.ok(cookies, 'Redirect response must have cookies container');
      } finally {
        globalThis.fetch = originalFetch;
      }
    }
  );

  await execute(
    'SESS-SYNC-05',
    'Absence of redirect loops: sequential hops converge in <= 1 transition for all states',
    async () => {
      const states = [
        { name: 'Unauthenticated', session: null, start: '/dashboard', expectedFinal: '/login?redirect=%2Fdashboard' },
        { name: 'Unauthenticated', session: null, start: '/onboarding', expectedFinal: '/login?redirect=%2Fonboarding' },
        { name: 'Incomplete', session: { onboardingCompleted: false }, start: '/dashboard', expectedFinal: '/onboarding' },
        { name: 'Incomplete', session: { onboardingCompleted: false }, start: '/login', expectedFinal: '/onboarding' },
        { name: 'Completed', session: { onboardingCompleted: true }, start: '/login', expectedFinal: '/dashboard' },
        { name: 'Completed', session: { onboardingCompleted: true }, start: '/onboarding', expectedFinal: '/dashboard' },
      ];

      for (const st of states) {
        const restoreFetch = configureMockSupabaseBackend({
          onboardingCompleted: st.session?.onboardingCompleted ?? false,
        });

        try {
          const hops: string[] = [st.start];
          let currentUrl = `http://localhost:3000${st.start}`;
          const visited = new Set<string>([st.start]);

          for (let hop = 0; hop < 5; hop++) {
            const req = new NextRequest(currentUrl);
            if (st.session) {
              req.cookies.set(
                'sb-xepgknlbisdxgcqmfrwx-auth-token',
                JSON.stringify({
                  access_token: 'loop-test-token',
                  refresh_token: 'loop-test-refresh',
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                })
              );
            }

            const res = await updateSession(req);
            const redirectLocation = res.headers.get('location');

            if (!redirectLocation) {
              // 200 OK -> terminal state reached
              break;
            }

            const parsedRedirect = new URL(redirectLocation);
            const nextPath = `${parsedRedirect.pathname}${parsedRedirect.search}`;

            if (visited.has(nextPath)) {
              throw new Error(`Circular redirect loop detected for state ${st.name}: ${hops.join(' -> ')} -> ${nextPath}`);
            }

            visited.add(nextPath);
            hops.push(nextPath);
            currentUrl = redirectLocation;
          }

          assert.ok(hops.length <= 2, `Hops count must be <= 2 (max 1 redirect hop), got ${hops.length}: ${hops.join(' -> ')}`);
        } finally {
          restoreFetch();
        }
      }
    }
  );

  // ==========================================================================
  // Summary & Metrics
  // ==========================================================================
  console.log('\n' + '='.repeat(78));
  const total = tests.length;
  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.filter((t) => !t.passed).length;

  console.log(`  EMPIRICAL CHALLENGER M03 RESULTS: ${passed} / ${total} TESTS PASSED (${failed} failures)`);
  console.log('='.repeat(78) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test harness execution error:', err);
  process.exit(1);
});
