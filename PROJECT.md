# Project: Kannada Kaliri — Milestone 02: Multilingual Onboarding & Learner Profile Engine

## Architecture
- **Framework & Runtime**: Next.js 16.4.3 (Turbopack, App Router), React 19.3.0, TypeScript 5 (strict).
- **Styling & Animation**: Tailwind CSS v4 (`@import "tailwindcss"`), Framer Motion 14.8.0, Mysore Royal design tokens (`#101D36`, `#D5A64A`, `#F8F5EE`, `#EDE5D6`), Google Fonts (Cinzel, Manrope, Noto Sans Kannada).
- **Database & Auth**: Supabase PostgreSQL with `@supabase/ssr` (async cookies client for server, browser client for client components).
- **Edge / Routing Proxy**: Next.js 16 `proxy.ts` delegating to `lib/supabase/middleware.ts` for session refresh and unauthenticated route protection, combined with Server Component page guards for deterministic onboarding state redirects.
- **Service Layer**: Decoupled, strongly-typed profile service in `lib/services/profile.ts` executing idempotent upserts keyed on `user_id`.

```
                    ┌──────────────────────────┐
                    │     User / Browser       │
                    └────────────┬─────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
     / (Landing)           /login, /signup         /onboarding
  [Public Server]       [Server + Client Form]  [Server + 5-Step Wizard]
                                 │                     │
                                 │                     ▼
                                 │             lib/services/profile.ts
                                 │             (upsert learner profile)
                                 │                     │
                                 ▼                     ▼
                        /dashboard [Protected]   Supabase PostgreSQL
                        (Requires Completed)     `learner_profiles` table
                                 │               (RLS: auth.uid() = user_id)
                                 ▼
                     /auth/callback [Route Handler]
                     (Redirects by onboarding status)
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | `learner_profiles` Table Schema | SQL migration defining table with UUID PK, foreign key on `auth.users(id)` (unique, cascade delete), and proper constraints | M01 | R2 / Survey 2 |
| F02 | Supported Language Constraints | CHECK constraint restricting `native_language` to `en`, `hi`, `ta`, `te`, `ml` with default `target_language = 'kn'` | M01 | R2 / Survey 2 |
| F03 | Proficiency & Goal Constraints | CHECK constraint restricting `proficiency_level` to `beginner`, `elementary`, `intermediate` and `daily_goal_minutes` to `5, 10, 15, 20` with `learning_goals TEXT[]` | M01 | R2 / Survey 2 |
| F04 | Automatic `updated_at` Trigger | PostgreSQL function & trigger keeping `updated_at` synchronized on profile modification | M01 | R2 / Survey 2 |
| F05 | Row Level Security (RLS) Policies | Strict RLS policies allowing authenticated users to SELECT, INSERT, UPDATE only their own profile (`auth.uid() = user_id`) | M01 | R2 / Survey 2 |
| F06 | Performance Indexes | B-tree index on `user_id` and unique index for fast lookups | M01 | R2 / Survey 2 |
| F07 | Learner Profile TypeScript Types | Type definitions in `types/profile.ts` and `types/database.ts` representing schema, DTOs, and Supabase client generics | M01 | R2 / Survey 2 |
| F08 | Profile Persistence Service | `lib/services/profile.ts` implementing `getLearnerProfile`, `createLearnerProfile`, `updateLearnerProfile`, and `isOnboardingCompleted` | M01 | R3 / Survey 2 |
| F09 | Idempotent Upsert Logic | Profile creation uses Supabase `.upsert()` with `onConflict: 'user_id'` preventing duplicate key collisions | M01 | R3 / Survey 2 |
| F10 | Onboarding Wizard Route Container | `/onboarding` route with Server Component wrapper enforcing auth guard and rendering 5-step wizard with step counter | M02 | R1 / Survey 1,3 |
| F11 | Wizard Step 1: Welcome Screen | Displays greeting "ನಮಸ್ಕಾರ!", user avatar (with fallback), user name, verbatim copy, and CTA "Let's Begin" | M02 | R1 / Survey 3 |
| F12 | Wizard Step 2: Native Language | Single-select cards for English (`en`), Hindi (`hi`), Tamil (`ta`), Telugu (`te`), Malayalam (`ml`) with native scripts and selected-state animations | M02 | R1 / Survey 3 |
| F13 | Wizard Step 3: Kannada Level | Single-select cards for Beginner, Elementary, Intermediate with descriptive helper copy | M02 | R1 / Survey 3 |
| F14 | Wizard Step 4: Learning Goals | Multi-select cards for 7 learning domains (everyday conversations, college, workplace, shopping, travel, community, culture) saving string array | M02 | R1 / Survey 3 |
| F15 | Wizard Step 5: Commitment & Summary | Single-select daily goal (5, 10, 15, 20 min) + confirmation summary card with CTA "Create My Learning Journey" | M02 | R1 / Survey 3 |
| F16 | Post-Onboarding Completion Screen | Success screen with "ನಮಸ್ಕಾರ! Your Kannada journey begins.", summary recap, and CTA "Enter My Dashboard" navigating to `/dashboard` | M02 | R1 / Survey 3 |
| F17 | Design System & Responsive Layout | Mysore Royal styling (`#101D36`, `#D5A64A`, `#F8F5EE`, `#EDE5D6`), glassmorphism, touch targets >= 44px, safe area padding, mobile-friendly navigation | M02 | R5 / Survey 1,3 |
| F18 | Framer Motion Step Transitions | Smooth animated transitions between wizard steps with reduced-motion support | M02 | R1, R5 / Survey 1,3 |
| F19 | Unauthenticated Route Protection | Unauthenticated requests to `/onboarding` redirect to `/login?redirect=/onboarding` | M03 | R4 / Survey 1,3 |
| F20 | Incomplete Onboarding Protection | Authenticated users with incomplete onboarding visiting `/dashboard`, `/login`, or `/signup` redirect to `/onboarding` | M03 | R4 / Survey 1,3 |
| F21 | Completed Onboarding Protection | Authenticated users with completed onboarding visiting `/login`, `/signup`, or `/onboarding` redirect to `/dashboard` | M03 | R4 / Survey 1,3 |
| F22 | OAuth Callback Dynamic Routing | `/auth/callback` handler exchanges code and redirects to `/dashboard` if onboarding is complete or `/onboarding` if incomplete | M03 | R4 / Survey 1,3 |
| F23 | Next.js 16 Proxy Session Sync | `proxy.ts` and `lib/supabase/middleware.ts` maintain continuous session cookie synchronization without redirect loops | M03 | R4 / Survey 1 |
| F24 | E2E Test Infrastructure & Runner | Automated E2E test runner executing Tiers 1-4 tests and validating acceptance criteria | E2E | AC / Dual Track |
| F25 | Full Test Suite Verification | 100% pass rate on E2E test suite + Tier 5 adversarial coverage hardening | Final | Dual Track |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M01 | Database Schema, Types & Service | Features F01-F09: `supabase/migrations/002_create_learner_profiles.sql`, `types/profile.ts`, `lib/services/profile.ts` | none | DONE |
| M02 | Onboarding Wizard UI & Components | Features F10-F18: `app/onboarding/page.tsx`, `components/onboarding/*`, design system & animations | M01 | DONE |
| M03 | Routing, Session Protection & Redirect Matrix | Features F19-F23: `lib/supabase/middleware.ts`, `app/dashboard/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, `app/auth/callback/route.ts` | M01, M02 | DONE |
| E2E | E2E Testing Track | Feature F24: Test harness, test runners, Tiers 1-4 tests, `TEST_INFRA.md`, publish `TEST_READY.md` | none | DONE |
| Final | E2E Test Pass & Adversarial Hardening | Feature F25: 100% pass on Tiers 1-4 + Tier 5 adversarial coverage hardening | M01, M02, M03, E2E | IN_PROGRESS |

## Interface Contracts

### M01 (Service Layer) ↔ M02 (Onboarding UI)
- **Module**: `lib/services/profile.ts`
- **Data Types** (`types/profile.ts`):
  ```typescript
  export type NativeLanguage = 'en' | 'hi' | 'ta' | 'te' | 'ml';
  export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate';
  export type DailyGoalMinutes = 5 | 10 | 15 | 20;
  export type LearningGoal =
    | 'everyday_conversations'
    | 'college_and_education'
    | 'workplace_communication'
    | 'shopping_and_daily_activities'
    | 'travel_and_exploring_karnataka'
    | 'communicating_with_local_communities'
    | 'understanding_kannada_culture';

  export interface LearnerProfile {
    id: string;
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    native_language: NativeLanguage;
    target_language: string; // 'kn'
    proficiency_level: ProficiencyLevel;
    learning_goals: string[];
    daily_goal_minutes: DailyGoalMinutes;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface CreateLearnerProfileDTO {
    user_id?: string; // Optional if resolved from session
    full_name?: string | null;
    avatar_url?: string | null;
    native_language: NativeLanguage;
    target_language?: string;
    proficiency_level: ProficiencyLevel;
    learning_goals: string[];
    daily_goal_minutes: DailyGoalMinutes;
    onboarding_completed?: boolean;
  }
  ```
- **Function Signatures**:
  - `getLearnerProfile(userId?: string, client?: SupabaseClient): Promise<LearnerProfile | null>`
  - `createLearnerProfile(payload: CreateLearnerProfileDTO, client?: SupabaseClient): Promise<LearnerProfile>`
  - `updateLearnerProfile(userId: string, updates: Partial<CreateLearnerProfileDTO>, client?: SupabaseClient): Promise<LearnerProfile>`
  - `isOnboardingCompleted(userId?: string, client?: SupabaseClient): Promise<boolean>`
- **Error Handling**: Functions throw typed `ProfileServiceError` with descriptive message on network/database failure. If record is not found, `getLearnerProfile` returns `null` (not throwing).

### M01 (Service Layer) ↔ M03 (Routing & Session)
- **Functions Used**:
  - `isOnboardingCompleted(userId?: string, client?: SupabaseClient): Promise<boolean>`
- **Behavior**:
  - If user is not authenticated: returns `false`.
  - If user has no `learner_profiles` row: returns `false`.
  - If row exists and `onboarding_completed === true`: returns `true`.
  - Otherwise returns `false`.
- **Latency & Reliability**: Queries only `select('onboarding_completed').eq('user_id', userId).maybeSingle()`.

## Code Layout
- `supabase/migrations/002_create_learner_profiles.sql` (Database migration)
- `types/profile.ts` (Profile & onboarding TypeScript interfaces)
- `types/database.ts` (Supabase Database definitions)
- `lib/services/profile.ts` (Profile persistence service)
- `app/onboarding/page.tsx` (Onboarding route Server Component with auth guard)
- `components/onboarding/`
  - `OnboardingWizard.tsx` (Main 5-step wizard state machine and layout)
  - `StepWelcome.tsx` (Step 1 Welcome view)
  - `StepNativeLanguage.tsx` (Step 2 Language selector)
  - `StepKannadaLevel.tsx` (Step 3 Proficiency selector)
  - `StepLearningGoals.tsx` (Step 4 Multi-select goals)
  - `StepCommitmentSummary.tsx` (Step 5 Daily goal & review card)
  - `OnboardingSuccess.tsx` (Post-onboarding celebration view)
  - `StepIndicator.tsx` (Step progress bar)
- `lib/supabase/middleware.ts` (Edge session update & routing rules)
- `app/dashboard/page.tsx` (Dashboard server guard: checks onboarding completion)
- `app/login/page.tsx` (Login server guard: redirects based on onboarding status)
- `app/signup/page.tsx` (Signup server guard: redirects based on onboarding status)
- `app/auth/callback/route.ts` (OAuth callback redirecting based on onboarding status)
- `tests/e2e/` (Opaque-box E2E test suites)

