# TEST_READY: Milestone 02 E2E Test Suite Specification & Results

**Project**: Kannada Kaliri ("ಕನ್ನಡ ಕಲಿರಿ")  
**Milestone**: Milestone 02 — Multilingual Onboarding Flow & Learner Profile Engine  
**Author**: `teamwork_test_writer_e2e`  
**Date**: 2026-10-30  
**Test Suite Status**: **READY & OPERATIONAL (100% Pass Rate)**  

---

## 1. Quick Start & Execution

The automated E2E test suite can be run at any time via a single command:

```bash
npx tsx tests/e2e/runner.ts
```

### Static Typecheck & Build Validation
```bash
# Verify 0 TypeScript strict errors
npx tsc --noEmit

# Verify 0 ESLint warnings/errors
npm run lint

# Verify Next.js Turbopack build
npm run build
```

---

## 2. Test Execution Summary

```
==============================================================================
  KANNADA KALIRI — MILESTONE 02 E2E TEST RUNNER
  Opaque-Box Requirement-Driven Test Suite (Tiers 1-4)
==============================================================================

  ✓ PASS [Tier 1] Feature Coverage (R1-R5)                 : 31 tests
  ✓ PASS [Tier 2] Boundary & Corner Cases (R1-R5)          : 29 tests
  ✓ PASS [Tier 3] Cross-Feature Combinations               : 17 tests
  ✓ PASS [Tier 4] Real-World Application Scenarios         : 5 tests

==============================================================================
  RESULT: ALL 82 / 82 TESTS PASSED (0 failures)
==============================================================================
```

- **Total Test Cases**: 82
- **Passed**: 82 (100%)
- **Failed**: 0 (0%)
- **Execution Duration**: ~2.5 seconds total

---

## 3. Tier Breakdown & Coverage

### Tier 1: Feature Coverage (31 Tests — Target >= 25)
- **R1: Onboarding Wizard Route (`/onboarding`)**:
  - `R1-F01`: Verbatim Kannada greeting "ನಮಸ್ಕಾರ!", supporting copy, and "Let's Begin" CTA.
  - `R1-F02`: User avatar and name extraction with fallback badge and email prefix fallback.
  - `R1-F03`: Native language card selector (5 languages: `en`, `hi`, `ta`, `te`, `ml`) with native scripts and single-selection enforcement.
  - `R1-F04`: Kannada proficiency baseline assessment (3 levels: `beginner`, `elementary`, `intermediate`) with descriptive helper text.
  - `R1-F05`: Multi-select learning goals (7 domains) requiring >= 1 goal, serialized as `string[]`.
  - `R1-F06`: Daily commitment selector (`5, 10, 15, 20` min), summary confirmation card, and "Create My Learning Journey" CTA.
  - `R1-F07`: Post-onboarding celebration screen ("ನಮಸ್ಕಾರ! Your Kannada journey begins.") with dashboard navigation CTA.
- **R2: Database Schema & Migration (`supabase/migrations/002_create_learner_profiles.sql`)**:
  - `R2-F01`: Table `learner_profiles` DDL defines UUID PK with `gen_random_uuid()`.
  - `R2-F02`: Foreign key on `auth.users(id)` with `ON DELETE CASCADE` and unique constraint on `user_id`.
  - `R2-F03`: CHECK constraints enforce supported languages, levels, and commitment intervals.
  - `R2-F04`: Default values set `target_language = 'kn'`, `onboarding_completed = false`, `daily_goal_minutes = 10`, `learning_goals = '{}'`.
  - `R2-F05`: Automatic `handle_updated_at` trigger updates `updated_at` before row update.
  - `R2-F06`: Row Level Security (RLS) policies enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE.
- **R3: Profile Persistence Service (`lib/services/profile.ts`)**:
  - `R3-F01`: `createLearnerProfile` persists complete profile DTO with `onboarding_completed: true` using upsert keyed on `user_id`.
  - `R3-F02`: `getLearnerProfile` retrieves stored profile by `userId` or resolves from active session.
  - `R3-F03`: `isOnboardingCompleted` returns `true` when profile exists and `onboarding_completed === true`.
  - `R3-F04`: `isOnboardingCompleted` returns `false` when no profile exists or `onboarding_completed === false`.
  - `R3-F05`: `updateLearnerProfile` updates specific preferences while preserving immutable fields (`id`, `user_id`, `created_at`).
  - `R3-F06`: Idempotent upsert logic prevents duplicate profile creation on repeat submissions.
- **R4: Authentication, Session, and Routing Rules**:
  - `R4-F01`: Unauthenticated request to `/onboarding` redirects to `/login?redirect=/onboarding`.
  - `R4-F02`: Authenticated user with incomplete onboarding requesting `/dashboard` redirects to `/onboarding`.
  - `R4-F03`: Authenticated user with incomplete onboarding requesting `/login` or `/signup` redirects to `/onboarding`.
  - `R4-F04`: Authenticated user with completed onboarding requesting `/login` or `/signup` redirects to `/dashboard`.
  - `R4-F05`: Authenticated user with completed onboarding requesting `/onboarding` redirects to `/dashboard`.
  - `R4-F06`: OAuth callback `/auth/callback` redirects completed users to `/dashboard` and incomplete users to `/onboarding`.
- **R5: Design System and Mobile Responsiveness**:
  - `R5-F01`: Mysore Royal color tokens (`#101D36`, `#D5A64A`, `#F8F5EE`, `#EDE5D6`, `#0A1222`).
  - `R5-F02`: Typography configuration (`Cinzel`, `Manrope`, `Noto Sans Kannada`).
  - `R5-F03`: Glassmorphism and luxury styling utility classes (`.glass-panel`, `.gold-glow`, `.gold-gradient-text`).
  - `R5-F04`: Touch target sizing (minimum 44px / 48px).
  - `R5-F05`: Safe-area insets (`env(safe-area-inset-bottom)`) for mobile notches.
  - `R5-F06`: Framer Motion reduced-motion accessibility fallback.

---

### Tier 2: Boundary & Corner Cases (29 Tests — Target >= 25)
- **R1 Boundaries**:
  - `R1-B01`: Name extraction with null, whitespace, or empty strings cleanly falls back to email prefix or 'Learner'.
  - `R1-B02`: Language selector rapid switching guarantees strict single selection (no accumulation).
  - `R1-B03`: Advancing without choosing a level is prevented ("Continue" button disabled).
  - `R1-B04`: Goal toggling extremes: selecting all 7 goals preserves all 7; deselecting all 7 leaves empty array `[]` and disables advancement.
  - `R1-B05`: Goal toggle idempotency prevents duplicate string entries.
  - `R1-B06`: Commitment duration boundaries (minimum 5m, maximum 20m valid; 0m, -5m, 30m, 60m rejected).
- **R2 Boundaries**:
  - `R2-B01`: CHECK constraint rejects invalid language codes (e.g. `'fr'`, `'es'`).
  - `R2-B02`: CHECK constraint rejects invalid levels (e.g. `'expert'`, `'fluent'`).
  - `R2-B03`: CHECK constraint rejects invalid commitment durations (e.g. `0`, `45`).
  - `R2-B04`: Foreign key rejects profile insertion without `user_id`.
  - `R2-B05`: RLS boundary prevents User A from reading User B's profile.
  - `R2-B06`: RLS boundary prevents User A from updating User B's profile.
- **R3 Boundaries**:
  - `R3-B01`: `getLearnerProfile` returns `null` (without throwing) when no profile exists.
  - `R3-B02`: `getLearnerProfile` returns `null` when session is unauthenticated.
  - `R3-B03`: `createLearnerProfile` accepts missing optional fields (`avatar_url = null`, `full_name = null`) saving clean defaults.
  - `R3-B04`: Network failure propagates error without crashing service.
  - `R3-B05`: Concurrency / double-click boundary executes idempotently without unique key collisions.
  - `R3-B06`: Empty `learning_goals` array does not crash service.
- **R4 Boundaries**:
  - `R4-B01`: Deep nested unauthenticated access (e.g. `/dashboard/settings/profile`) redirects to `/login` preserving full path.
  - `R4-B02`: Unauthenticated access to root landing page `/` is permitted (200 OK).
  - `R4-B03`: Redirect loop prevention: user on `/onboarding` never redirects to `/onboarding`.
  - `R4-B04`: Redirect loop prevention: user on `/dashboard` never redirects to `/dashboard`.
  - `R4-B05`: Open redirect attack vector is mitigated by sanitizing destination.
  - `R4-B06`: OAuth callback missing auth code parameter redirects safely to login error state.
- **R5 Boundaries**:
  - `R5-B01`: Compact 320px mobile viewport boundaries maintain non-overflow layout.
  - `R5-B02`: Kannada complex conjunct rendering preserves diacritic line height (>= 1.5 ratio).
  - `R5-B03`: Contrast ratio of Warm Ivory on Royal Navy exceeds WCAG AA standards (15.3:1 vs 4.5:1 required).
  - `R5-B04`: Wizard step index strictly bounded between 1 and 5 (no negative or overflow states).
  - `R5-B05`: Empty avatar URL gracefully falls back to initial badge dimensions.

---

### Tier 3: Cross-Feature Combinations (17 Tests — Target >= 15)
- `T3-C01` to `T3-C08`: Complete pairwise matrix across Auth State (Unauth, Incomplete, Completed) × Route (`/login`, `/signup`, `/onboarding`, `/dashboard`).
- `T3-C09` to `T3-C13`: Pairwise combinations across all 5 native languages (`hi`, `ta`, `te`, `ml`, `en`), all 3 levels (`beginner`, `elementary`, `intermediate`), varying goals, and all 4 commitment durations (`5, 10, 15, 20`).
- `T3-C14` & `T3-C15`: OAuth Callback × Incomplete vs Completed onboarding session routing.
- `T3-C16`: Multi-user RLS boundary preventing cross-tenant data corruption.
- `T3-C17`: Wizard Navigation Back/Forward preserves accumulated form selections across all steps.

---

### Tier 4: Real-World Application Scenarios (5 Tests — Target >= 5)
- `T4-S01`: **The Tech Professional Journey (Bangalore Relocation)**: New engineer signs up, selects Hindi, Beginner, workplace & everyday goals, 15 min, completes onboarding, verifies summary, enters dashboard, and validates auth redirect protection.
- `T4-S02`: **The College Student Journey (Chennai to Mysore)**: Tamil student signs in via Google OAuth, selects Tamil, Elementary, college goals, 10 min, reaches dashboard, and later updates commitment to 20 min with full history preservation.
- `T4-S03`: **The Busy Executive Journey (5-minute Micro-learning)**: Unauthenticated executive intercepted at `/onboarding`, redirected to login, logs in, resumed at onboarding, selects Telugu, Intermediate, 5 min, enters dashboard.
- `T4-S04`: **The Cultural Enthusiast & Traveler Journey (Full Goal Selection)**: Malayalam speaker navigates back and forth across steps, selects all 7 learning goals, 20 min, verifies summary card, completes onboarding to celebration screen.
- `T4-S05`: **The Interrupted Onboarding & Session Recovery Journey**: User drops connection mid-flow at Step 3; subsequent attempt to access `/dashboard` is intercepted and redirected back to `/onboarding`; user finishes remaining steps, submits profile, and is granted dashboard access.

---

## 4. Acceptance Criteria Verification Checklist

| Criterion | Source | Status | Verified In |
|-----------|--------|--------|-------------|
| Unauthenticated requests to `/onboarding` redirect to `/login` | R4 | **VERIFIED** | `R4-F01`, `T3-C01`, `T4-S03` |
| Authenticated user guided through 5-step wizard with step counter & navigation | R1 | **VERIFIED** | `R1-F01` - `R1-F06`, `T4-S04` |
| Step 2 enforces single selection among `en`, `hi`, `ta`, `te`, `ml` with native scripts | R1 | **VERIFIED** | `R1-F03`, `R1-B02`, `T3-C09`-`T3-C13` |
| Step 3 enforces single selection among `beginner`, `elementary`, `intermediate` | R1 | **VERIFIED** | `R1-F04`, `R1-B03` |
| Step 4 allows selecting multiple learning goals and saves them as string array | R1 | **VERIFIED** | `R1-F05`, `R1-B04`, `R1-B05` |
| Step 5 enforces one commitment duration (5, 10, 15, 20 min) and shows summary | R1 | **VERIFIED** | `R1-F06`, `R1-B06` |
| Successful submission presents completion screen and routes to `/dashboard` | R1 | **VERIFIED** | `R1-F07`, `T4-S01`, `T4-S04` |
| Migration `002_create_learner_profiles.sql` creates table with columns, checks, RLS | R2 | **VERIFIED** | `R2-F01` - `R2-F06`, `R2-B01` - `R2-B06` |
| `lib/services/profile.ts` exports required functions with explicit types | R3 | **VERIFIED** | `R3-F01` - `R3-F06`, Artifact Inspection |
| Profile saving uses idempotent upsert logic keyed on `user_id` preventing collisions | R3 | **VERIFIED** | `R3-F06`, `R3-B05`, `T4-S01` |
| Authenticated completed users visiting `/login`, `/signup`, `/onboarding` -> `/dashboard` | R4 | **VERIFIED** | `R4-F04`, `R4-F05`, `T3-C06`, `T3-C08` |
| Authenticated incomplete users visiting `/dashboard`, `/login`, `/signup` -> `/onboarding` | R4 | **VERIFIED** | `R4-F02`, `R4-F03`, `T3-C03`, `T3-C05` |
| OAuth login and session persistence remain operational without redirect loops | R4 | **VERIFIED** | `R4-F06`, `R4-B03`, `R4-B04`, `T3-C14` |
| `npx tsc --noEmit` passes with 0 errors | Build | **VERIFIED** | Exited with status 0 |
| `npm run lint` passes with 0 errors | Build | **VERIFIED** | Exited with status 0 |
| `npm run build` succeeds with 0 errors | Build | **VERIFIED** | Next.js Turbopack 8/8 routes compiled |
