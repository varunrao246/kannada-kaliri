/**
 * Router & Edge Proxy Simulation Harness for Milestone 02
 * Implements and validates the 3-state routing matrix and redirect loop protection.
 */

import { RoutingDecision } from './types';

export interface RouteRequestContext {
  pathname: string;
  searchParams?: Record<string, string>;
  isAuthenticated: boolean;
  onboardingCompleted?: boolean;
}

export class RouterSimulator {
  /**
   * Evaluates the routing decision based on Next.js 16 Proxy + Server Component Guards
   */
  public static evaluateRoute(context: RouteRequestContext): RoutingDecision {
    const { pathname, isAuthenticated, onboardingCompleted = false } = context;

    // 1. Unauthenticated users
    if (!isAuthenticated) {
      if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
        return {
          allow: false,
          statusCode: 307,
          redirectUrl: '/login?redirect=/onboarding',
          reason: 'Unauthenticated access to /onboarding requires authentication',
        };
      }
      if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
        return {
          allow: false,
          statusCode: 307,
          redirectUrl: `/login?redirect=${pathname}`,
          reason: 'Unauthenticated access to /dashboard requires authentication',
        };
      }
      // Public routes (/login, /signup, /, etc.)
      return {
        allow: true,
        statusCode: 200,
        reason: 'Public route accessible to unauthenticated users',
      };
    }

    // 2. Authenticated users with INCOMPLETE onboarding
    if (!onboardingCompleted) {
      if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
        return {
          allow: false,
          statusCode: 307,
          redirectUrl: '/onboarding',
          reason: 'Authenticated user with incomplete onboarding must complete onboarding before dashboard access',
        };
      }
      if (pathname === '/login' || pathname === '/signup') {
        return {
          allow: false,
          statusCode: 307,
          redirectUrl: '/onboarding',
          reason: 'Authenticated user visiting auth pages redirected to resume onboarding',
        };
      }
      if (pathname === '/auth/callback') {
        return {
          allow: false,
          statusCode: 302,
          redirectUrl: '/onboarding',
          reason: 'OAuth callback directs incomplete user to onboarding flow',
        };
      }
      if (pathname === '/onboarding' || pathname === '/') {
        return {
          allow: true,
          statusCode: 200,
          reason: 'Authenticated user permitted on onboarding wizard',
        };
      }
    }

    // 3. Authenticated users with COMPLETED onboarding
    if (onboardingCompleted) {
      if (pathname === '/login' || pathname === '/signup') {
        return {
          allow: false,
          statusCode: 307,
          redirectUrl: '/dashboard',
          reason: 'Authenticated user with completed onboarding visiting auth pages redirected to dashboard',
        };
      }
      if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
        return {
          allow: false,
          statusCode: 307,
          redirectUrl: '/dashboard',
          reason: 'Authenticated user who has already completed onboarding redirected to dashboard',
        };
      }
      if (pathname === '/auth/callback') {
        return {
          allow: false,
          statusCode: 302,
          redirectUrl: '/dashboard',
          reason: 'OAuth callback directs completed user to dashboard',
        };
      }
      if (pathname === '/dashboard' || pathname === '/') {
        return {
          allow: true,
          statusCode: 200,
          reason: 'Authenticated user with completed profile permitted on dashboard',
        };
      }
    }

    return {
      allow: true,
      statusCode: 200,
      reason: 'Route access permitted',
    };
  }

  /**
   * Simulates full navigation hop sequence to assert absence of redirect loops
   */
  public static traceNavigation(
    initialPath: string,
    isAuthenticated: boolean,
    onboardingCompleted: boolean,
    maxHops: number = 5
  ): { finalPath: string; hops: string[]; loopDetected: boolean } {
    let currentPath = initialPath;
    const hops: string[] = [initialPath];
    const visited = new Set<string>([initialPath]);

    for (let i = 0; i < maxHops; i++) {
      const decision = RouterSimulator.evaluateRoute({
        pathname: currentPath.split('?')[0],
        isAuthenticated,
        onboardingCompleted,
      });

      if (decision.allow || !decision.redirectUrl) {
        break;
      }

      const nextHop = decision.redirectUrl.split('?')[0];
      if (visited.has(nextHop)) {
        hops.push(nextHop);
        return { finalPath: nextHop, hops, loopDetected: true };
      }

      visited.add(nextHop);
      hops.push(nextHop);
      currentPath = nextHop;
    }

    return { finalPath: hops[hops.length - 1], hops, loopDetected: false };
  }
}
