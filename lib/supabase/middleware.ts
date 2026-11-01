import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from './client';
import { isOnboardingCompleted } from '@/lib/services/profile';
import type { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Helper to construct redirect responses while preserving refreshed session cookies
  const createRedirectResponse = (targetPath: string, searchParams?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    url.search = '';
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    const redirectResponse = NextResponse.redirect(url);
    // Requirement R4: Preserve refreshed session cookies across all redirect responses
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // If Supabase is not configured yet, prevent access to protected routes
  if (!isSupabaseConfigured()) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
      return createRedirectResponse('/login', { redirect: pathname });
    }
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Revalidate the auth token with the Supabase Auth server.
  // Note: Do not replace getUser() with getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Unauthenticated users:
  // If pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'):
  // redirect to /login?redirect=${pathname}
  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
      return createRedirectResponse('/login', { redirect: pathname });
    }
    return supabaseResponse;
  }

  // 2. Authenticated users:
  // Performance optimization: Only query learner_profiles onboarding state
  // for routes that perform onboarding-conditional redirection.
  const needsOnboardingCheck =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding');

  if (!needsOnboardingCheck) {
    return supabaseResponse;
  }

  const onboardingCompleted = await isOnboardingCompleted(user.id, supabase);

  // Incomplete onboarding (onboarding_completed !== true):
  // If pathname === '/login' || pathname === '/signup' || pathname.startsWith('/dashboard'):
  // redirect to /onboarding
  if (!onboardingCompleted) {
    if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/dashboard')) {
      return createRedirectResponse('/onboarding');
    }
    return supabaseResponse;
  }

  // Completed onboarding (onboarding_completed === true):
  // If pathname === '/login' || pathname === '/signup' || pathname.startsWith('/onboarding'):
  // redirect to /dashboard
  if (onboardingCompleted) {
    if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/onboarding')) {
      return createRedirectResponse('/dashboard');
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}
