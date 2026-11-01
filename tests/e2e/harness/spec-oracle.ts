/**
 * Authoritative Specification Oracle for Milestone 02
 * Derived directly from ORIGINAL_REQUEST.md and PROJECT.md
 */

import { NativeLanguage, ProficiencyLevel, DailyGoalMinutes, LearningGoal } from './types';

export const SPEC_ORACLE = {
  // R1: Multilingual Onboarding Wizard
  onboarding: {
    route: '/onboarding',
    stepCount: 5,
    step1: {
      kannadaGreeting: 'ನಮಸ್ಕಾರ!',
      supportingCopy: "Let's make Kannada a part of your everyday life. Tell us a little about yourself. We'll create a Kannada learning experience that matches your language, pace and goals.",
      ctaText: "Let's Begin",
    },
    step2: {
      title: 'Your Native Language',
      languages: [
        { code: 'en' as NativeLanguage, name: 'English', nativeScript: 'English' },
        { code: 'hi' as NativeLanguage, name: 'Hindi', nativeScript: 'हिन्दी' },
        { code: 'ta' as NativeLanguage, name: 'Tamil', nativeScript: 'தமிழ்' },
        { code: 'te' as NativeLanguage, name: 'Telugu', nativeScript: 'తెలుగు' },
        { code: 'ml' as NativeLanguage, name: 'Malayalam', nativeScript: 'മലയാളം' },
      ],
      selectionMode: 'single' as const,
    },
    step3: {
      title: 'Your Kannada Level',
      levels: [
        {
          code: 'beginner' as ProficiencyLevel,
          title: 'Beginner',
          description: 'I am completely new to Kannada',
        },
        {
          code: 'elementary' as ProficiencyLevel,
          title: 'Elementary',
          description: 'I know a few words and basic phrases',
        },
        {
          code: 'intermediate' as ProficiencyLevel,
          title: 'Intermediate',
          description: 'I can understand some Kannada but struggle to speak confidently',
        },
      ],
      selectionMode: 'single' as const,
    },
    step4: {
      title: 'Your Learning Goal',
      goals: [
        { code: 'everyday_conversations' as LearningGoal, label: 'Everyday conversations' },
        { code: 'college_and_education' as LearningGoal, label: 'College and education' },
        { code: 'workplace_communication' as LearningGoal, label: 'Workplace communication' },
        { code: 'shopping_and_daily_activities' as LearningGoal, label: 'Shopping and daily activities' },
        { code: 'travel_and_exploring_karnataka' as LearningGoal, label: 'Travel and exploring Karnataka' },
        { code: 'communicating_with_local_communities' as LearningGoal, label: 'Communicating with local communities' },
        { code: 'understanding_kannada_culture' as LearningGoal, label: 'Understanding Kannada culture' },
      ],
      selectionMode: 'multiple' as const,
      minSelected: 1,
      maxSelected: 7,
    },
    step5: {
      title: 'Your Daily Learning Commitment & Summary',
      commitments: [5, 10, 15, 20] as DailyGoalMinutes[],
      defaultCommitment: 10 as DailyGoalMinutes,
      selectionMode: 'single' as const,
      ctaText: 'Create My Learning Journey',
    },
    successScreen: {
      heading: 'ನಮಸ್ಕಾರ! Your Kannada journey begins.',
      ctaText: 'Enter My Dashboard',
      ctaDestination: '/dashboard',
    },
  },

  // R2: Supabase Schema & Migration
  database: {
    tableName: 'learner_profiles',
    migrationFile: 'supabase/migrations/002_create_learner_profiles.sql',
    columns: [
      { name: 'id', type: 'UUID', primaryKey: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'UUID', nullable: false, unique: true, references: 'auth.users(id)', onDelete: 'CASCADE' },
      { name: 'full_name', type: 'TEXT', nullable: true },
      { name: 'avatar_url', type: 'TEXT', nullable: true },
      { name: 'native_language', type: 'TEXT', nullable: false, check: "IN ('en', 'hi', 'ta', 'te', 'ml')" },
      { name: 'target_language', type: 'TEXT', nullable: false, default: "'kn'" },
      { name: 'proficiency_level', type: 'TEXT', nullable: false, check: "IN ('beginner', 'elementary', 'intermediate')" },
      { name: 'learning_goals', type: 'TEXT[]', nullable: false, default: "'{}'" },
      { name: 'daily_goal_minutes', type: 'INTEGER', nullable: false, check: 'IN (5, 10, 15, 20)', default: '10' },
      { name: 'onboarding_completed', type: 'BOOLEAN', nullable: false, default: 'false' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: "timezone('utc'::text, now())" },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, default: "timezone('utc'::text, now())" },
    ],
    rls: {
      enabled: true,
      policies: [
        { name: 'Allow learners to select own profile', action: 'SELECT', check: 'auth.uid() = user_id' },
        { name: 'Allow learners to insert own profile', action: 'INSERT', check: 'auth.uid() = user_id' },
        { name: 'Allow learners to update own profile', action: 'UPDATE', check: 'auth.uid() = user_id' },
      ],
    },
    trigger: {
      name: 'handle_updated_at',
      event: 'BEFORE UPDATE',
      columnUpdated: 'updated_at',
    },
    indexes: ['user_id', 'onboarding_completed'],
  },

  // R3: Profile Persistence Service
  service: {
    modulePath: 'lib/services/profile.ts',
    expectedFunctions: [
      'getLearnerProfile',
      'createLearnerProfile',
      'updateLearnerProfile',
      'isOnboardingCompleted',
    ],
    upsertStrategy: {
      conflictTarget: 'user_id',
    },
    immutableFieldsOnUpdate: ['id', 'user_id', 'created_at'],
  },

  // R4: Authentication & Routing Rules
  routing: {
    routes: ['/', '/login', '/signup', '/onboarding', '/dashboard', '/auth/callback'],
    rules: [
      {
        description: 'Unauthenticated requests to /onboarding redirect to /login',
        condition: { authenticated: false, targetRoute: '/onboarding' },
        expectedAction: 'redirect',
        expectedTarget: '/login?redirect=/onboarding',
      },
      {
        description: 'Unauthenticated requests to /dashboard redirect to /login',
        condition: { authenticated: false, targetRoute: '/dashboard' },
        expectedAction: 'redirect',
        expectedTarget: '/login?redirect=/dashboard',
      },
      {
        description: 'Authenticated users with incomplete onboarding accessing /dashboard redirect to /onboarding',
        condition: { authenticated: true, onboardingCompleted: false, targetRoute: '/dashboard' },
        expectedAction: 'redirect',
        expectedTarget: '/onboarding',
      },
      {
        description: 'Authenticated users with incomplete onboarding accessing /login redirect to /onboarding',
        condition: { authenticated: true, onboardingCompleted: false, targetRoute: '/login' },
        expectedAction: 'redirect',
        expectedTarget: '/onboarding',
      },
      {
        description: 'Authenticated users with incomplete onboarding accessing /signup redirect to /onboarding',
        condition: { authenticated: true, onboardingCompleted: false, targetRoute: '/signup' },
        expectedAction: 'redirect',
        expectedTarget: '/onboarding',
      },
      {
        description: 'Authenticated users with incomplete onboarding accessing /onboarding are permitted',
        condition: { authenticated: true, onboardingCompleted: false, targetRoute: '/onboarding' },
        expectedAction: 'allow',
      },
      {
        description: 'Authenticated users with completed onboarding accessing /login redirect to /dashboard',
        condition: { authenticated: true, onboardingCompleted: true, targetRoute: '/login' },
        expectedAction: 'redirect',
        expectedTarget: '/dashboard',
      },
      {
        description: 'Authenticated users with completed onboarding accessing /signup redirect to /dashboard',
        condition: { authenticated: true, onboardingCompleted: true, targetRoute: '/signup' },
        expectedAction: 'redirect',
        expectedTarget: '/dashboard',
      },
      {
        description: 'Authenticated users with completed onboarding accessing /onboarding redirect to /dashboard',
        condition: { authenticated: true, onboardingCompleted: true, targetRoute: '/onboarding' },
        expectedAction: 'redirect',
        expectedTarget: '/dashboard',
      },
      {
        description: 'Authenticated users with completed onboarding accessing /dashboard are permitted',
        condition: { authenticated: true, onboardingCompleted: true, targetRoute: '/dashboard' },
        expectedAction: 'allow',
      },
      {
        description: 'OAuth callback with incomplete onboarding redirects to /onboarding',
        condition: { authenticated: true, onboardingCompleted: false, targetRoute: '/auth/callback' },
        expectedAction: 'redirect',
        expectedTarget: '/onboarding',
      },
      {
        description: 'OAuth callback with completed onboarding redirects to /dashboard',
        condition: { authenticated: true, onboardingCompleted: true, targetRoute: '/auth/callback' },
        expectedAction: 'redirect',
        expectedTarget: '/dashboard',
      },
    ],
  },

  // R5: Design System & Mobile Responsiveness
  design: {
    colorTokens: {
      royalNavy: '#101D36',
      royalNavyDark: '#0A1222',
      royalNavyDeep: '#070C18',
      royalNavyLight: '#1A2E56',
      mysoreGold: '#D5A64A',
      mysoreGoldLight: '#E8C77F',
      mysoreGoldDark: '#B5862B',
      warmIvory: '#F8F5EE',
      heritageCream: '#EDE5D6',
    },
    fonts: {
      serif: 'Cinzel',
      sans: 'Manrope',
      kannada: 'Noto Sans Kannada',
    },
    glassmorphismClasses: ['glass-panel', 'glass-panel-light', 'glass-card-hover', 'gold-gradient-text', 'gold-glow'],
    mobileAccessibility: {
      minTouchTargetPx: 44,
      recommendedTouchTargetPx: 48,
      safeAreaPadding: 'env(safe-area-inset-bottom)',
      viewportBreakpoints: {
        mobile: 640,
        tablet: 1024,
      },
    },
  },
};
