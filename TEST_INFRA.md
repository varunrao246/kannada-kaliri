# Test Infrastructure Specification: Milestone 02 E2E Testing Track

**Project**: Kannada Kaliri ("ಕನ್ನಡ ಕಲಿರಿ")  
**Milestone**: Milestone 02 — Multilingual Onboarding Flow & Learner Profile Engine  
**Author**: `teamwork_test_writer_e2e`  
**Date**: 2026-10-30  
**Status**: Ready & Operational  

---

## 1. Overview & Strategy

The E2E test infrastructure for Milestone 02 is designed as an **opaque-box, requirement-driven automated testing suite** covering Tiers 1 through 4. The suite exercises the application against the authoritative specifications defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

### Core Testing Objectives
1. **Opaque-Box Validation**: Test requirements from the user and API perspectives without reliance on private implementation details.
2. **Deterministic Authoritative Oracles**: Expected outputs are derived directly from documented specifications (Kannada script strings, language codes, constraint sets, redirect matrices).
3. **Progressive Testability & Zero Build Regressions**: All test suites compile under strict TypeScript (`npx tsc --noEmit`) and execute in standard Node.js without impacting Next.js production builds (`npm run build`).
4. **Idempotency & Isolation**: Each test is fully isolated, setting up its own state and fixtures, with zero cross-test state leakage.

---

## 2. Directory Layout & Architecture

All test assets are organized inside the `tests/` directory at the project root:

```
tests/
└── e2e/
    ├── harness/
    │   ├── types.ts              # Common DTOs, domain models, and result interfaces
    │   ├── spec-oracle.ts        # Authoritative specifications derived from requirements
    │   ├── mock-supabase.ts      # In-memory Supabase PostgreSQL + Auth simulation harness
    │   └── router-simulator.ts   # Edge proxy & server component redirect matrix evaluator
    ├── tier1-features.test.ts    # Tier 1: Feature Coverage (R1 to R5 >= 5 tests each)
    ├── tier2-boundaries.test.ts  # Tier 2: Boundary & Corner Cases (R1 to R5 >= 5 tests each)
    ├── tier3-combinations.test.ts# Tier 3: Pairwise Cross-Feature Combinations (17 tests)
    ├── tier4-scenarios.test.ts   # Tier 4: Real-World End-to-End User Journeys (5 tests)
    └── runner.ts                 # Unified executable test runner & reporter
```

---

## 3. Test Runner & Execution Commands

The test runner utilizes Node.js native testing capabilities (`node:test`, `node:assert/strict`) via `npx tsx` for instant TypeScript execution without transpile artifacts.

### 3.1 Run All Tests (Full Suite)
```bash
npx tsx tests/e2e/runner.ts
```

### 3.2 Run Specific Tiers
```bash
# Tier 1: Feature Coverage
npx tsx tests/e2e/tier1-features.test.ts

# Tier 2: Boundary & Corner Cases
npx tsx tests/e2e/tier2-boundaries.test.ts

# Tier 3: Cross-Feature Combinations
npx tsx tests/e2e/tier3-combinations.test.ts

# Tier 4: Real-World Application Scenarios
npx tsx tests/e2e/tier4-scenarios.test.ts
```

### 3.3 Static Type & Build Checks
```bash
# Verify TypeScript strict compilation across tests and app
npx tsc --noEmit

# Verify ESLint rules
npm run lint

# Verify Next.js production build with Turbopack
npm run build
```

---

## 4. Test Tiers & Requirement Mapping

| Tier | Focus | Requirement Scope | Minimum Target | Implemented |
|------|-------|-------------------|----------------|-------------|
| **Tier 1** | **Feature Coverage** | R1 (Onboarding Wizard), R2 (Database Schema), R3 (Profile Service), R4 (Routing/Auth), R5 (Design System) | >= 25 tests (>= 5/feature) | **31 tests** |
| **Tier 2** | **Boundary & Corner Cases** | Edge cases, empty inputs, single-select enforcement, check constraint violations, RLS enforcement, redirect loop prevention | >= 25 tests (>= 5/feature) | **29 tests** |
| **Tier 3** | **Cross-Feature Combinations** | Pairwise interactions: Auth State × Route × Language × Level × Goals × Commitment | >= 15 tests | **17 tests** |
| **Tier 4** | **Real-World Scenarios** | End-to-end user journeys: Tech Professional, Student, Busy Executive, Traveler/Heritage, Interrupted Session | >= 5 scenarios | **5 scenarios** |
| **Total** | | | **>= 70 tests** | **82 tests** |

---

## 5. Specification Oracle & Expected Output Derivation

All expected values in the test suite are derived from the project's authoritative source of truth:
1. **Kannada Copy & Strings**:
   - Greeting: `"ನಮಸ್ಕಾರ!"`
   - Intro Copy: `"Let's make Kannada a part of your everyday life. Tell us a little about yourself. We'll create a Kannada learning experience that matches your language, pace and goals."`
   - Completion Heading: `"ನಮಸ್ಕಾರ! Your Kannada journey begins."`
   - CTAs: `"Let's Begin"`, `"Create My Learning Journey"`, `"Enter My Dashboard"`
2. **Languages & Native Scripts**:
   - Supported: `en` (English), `hi` (हिन्दी), `ta` (தமிழ்), `te` (తెలుగు), `ml` (മലയാളം)
   - Target Language: `'kn'` (Kannada)
3. **Proficiency Levels**:
   - `beginner`: "I am completely new to Kannada"
   - `elementary`: "I know a few words and basic phrases"
   - `intermediate`: "I can understand some Kannada but struggle to speak confidently"
4. **Learning Goals**:
   - `everyday_conversations`, `college_and_education`, `workplace_communication`, `shopping_and_daily_activities`, `travel_and_exploring_karnataka`, `communicating_with_local_communities`, `understanding_kannada_culture`
5. **Daily Commitments**:
   - `5`, `10`, `15`, `20` minutes (Default: `10` minutes)
6. **Database Schema & RLS**:
   - Table: `learner_profiles`
   - User FK: `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL`
   - RLS Policy: `auth.uid() = user_id` for SELECT, INSERT, UPDATE
7. **Routing Matrix**:
   - Unauthenticated on `/onboarding` or `/dashboard` -> `/login?redirect=...`
   - Authenticated Incomplete on `/dashboard`, `/login`, or `/signup` -> `/onboarding`
   - Authenticated Completed on `/login`, `/signup`, or `/onboarding` -> `/dashboard`

---

## 6. Harness & Simulation Environment

To achieve high-speed deterministic test runs independent of remote database connectivity, the test suite features:
- **`MockSupabaseClient`**: Implements `@supabase/supabase-js` API contracts in-memory:
  - Auth simulation (`signInWithPassword`, `signUp`, `signOut`, `getUser`, `onAuthStateChange`).
  - Table simulation (`from('learner_profiles')`) with `.select()`, `.insert()`, `.update()`, `.upsert()`, and `.maybeSingle()`.
  - Enforces database CHECK constraints and UNIQUE constraints.
  - Enforces Row Level Security (RLS) policies by filtering on active session user ID.
- **`RouterSimulator`**: Implements the exact 3-state routing matrix defined in `PROJECT.md § Interface Contracts (M01 ↔ M03)`, evaluating edge proxy redirects and server component page guards.
- **Dynamic Module Adapter**: When physical files (`lib/services/profile.ts`, `supabase/migrations/002_create_learner_profiles.sql`) are generated by milestone implementation agents, the test harness automatically inspects the live artifacts and validates their adherence to the specification.

---

## 7. Verification & Invalidation Protocol

- **Validation Check**: Run `npx tsx tests/e2e/runner.ts`. All 82 tests across Tiers 1-4 must report `PASS` with zero failures.
- **Typecheck Check**: Run `npx tsc --noEmit`. Must exit with status code 0.
- **Build Check**: Run `npm run build`. Must compile successfully without warnings or route errors.
- **Invalidation Condition**: If any requirement in `ORIGINAL_REQUEST.md` or `PROJECT.md` changes (e.g. adding a 6th native language or changing daily commitment intervals), the oracle constants in `spec-oracle.ts` and corresponding tests must be updated to maintain authoritative fidelity.
