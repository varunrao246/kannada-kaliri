// tests/e2e/test-m03-curriculum-dashboard.mjs
// Comprehensive test suite for Milestone 03: Curriculum Engine & Student Dashboard

import { A1_MODULES, getAllLessons, getLessonById } from '../../lib/curriculum/index.js';

async function runTests() {
  console.log('====================================================');
  console.log('  KANNADA KALIRI — MILESTONE 03 VERIFICATION SUITE  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      if (details) console.log(`   └─ ${details}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      if (details) console.error(`   └─ ${details}`);
      failed++;
    }
  }

  // 1. Curriculum Structure Verification
  console.log('--- Suite 1: A1 Curriculum Structure & Authenticity ---');
  assert(A1_MODULES.length === 5, 'Curriculum contains all 5 required A1 Modules', `Count: ${A1_MODULES.length}`);

  const allLessons = getAllLessons();
  assert(allLessons.length >= 14, 'All lessons registered across modules', `Total lessons: ${allLessons.length}`);

  // Module 1 check
  const mod1 = A1_MODULES[0];
  assert(mod1.title === 'Kannada Foundations', 'Module 1 is Kannada Foundations', `Title: ${mod1.title}`);
  assert(mod1.kannadaTitle.includes('ಅಡಿಪಾಯ'), 'Module 1 has authentic Kannada title', mod1.kannadaTitle);

  // Module 2 check
  const mod2 = A1_MODULES[1];
  assert(mod2.title === 'Everyday Vocabulary', 'Module 2 is Everyday Vocabulary', mod2.title);

  // Module 3 check
  const mod3 = A1_MODULES[2];
  assert(mod3.title === 'Building Sentences', 'Module 3 is Building Sentences', mod3.title);

  // Module 4 check
  const mod4 = A1_MODULES[3];
  assert(mod4.title === 'Everyday Conversations', 'Module 4 is Everyday Conversations', mod4.title);

  // Module 5 check
  const mod5 = A1_MODULES[4];
  assert(mod5.title === 'Karnataka Life & Culture', 'Module 5 is Karnataka Life & Culture', mod5.title);

  // 2. Multilingual Personalization Support
  console.log('\n--- Suite 2: Multilingual Support (Hindi, Tamil, Telugu, Malayalam) ---');
  const lesson1 = getLessonById('a1-m01-l01');
  assert(lesson1 !== null, 'Lesson 1.1 found by ID');
  const vocab1 = lesson1?.content?.vocabulary?.[0];
  assert(vocab1 && vocab1.meaningNative?.hi, 'Hindi translation present', vocab1?.meaningNative?.hi);
  assert(vocab1 && vocab1.meaningNative?.ta, 'Tamil translation present', vocab1?.meaningNative?.ta);
  assert(vocab1 && vocab1.meaningNative?.te, 'Telugu translation present', vocab1?.meaningNative?.te);
  assert(vocab1 && vocab1.meaningNative?.ml, 'Malayalam translation present', vocab1?.meaningNative?.ml);

  // 3. Database Migration Schema Check
  console.log('\n--- Suite 3: Database Migration Schema 003 ---');
  const fs = await import('fs');
  const migration = fs.readFileSync('supabase/migrations/003_create_curriculum_and_progress.sql', 'utf8');
  assert(migration.includes('CREATE TABLE IF NOT EXISTS public.courses'), 'Migration creates courses table');
  assert(migration.includes('CREATE TABLE IF NOT EXISTS public.modules'), 'Migration creates modules table');
  assert(migration.includes('CREATE TABLE IF NOT EXISTS public.lessons'), 'Migration creates lessons table');
  assert(migration.includes('CREATE TABLE IF NOT EXISTS public.learning_progress'), 'Migration creates learning_progress table');
  assert(migration.includes('CREATE TABLE IF NOT EXISTS public.daily_activity'), 'Migration creates daily_activity table');
  assert(migration.includes('ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY'), 'RLS enabled on progress');
  assert(migration.includes('ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY'), 'RLS enabled on daily activity');
  assert(migration.includes('auth.uid()') && migration.includes('user_id'), 'User isolation enforced via auth.uid()');

  // 4. Learning Progress Service Exports & Types
  console.log('\n--- Suite 4: Learning Progress Service API ---');
  const serviceCode = fs.readFileSync('lib/services/learning-progress.ts', 'utf8');
  assert(serviceCode.includes('export async function getCurriculumWithProgress'), 'Exports getCurriculumWithProgress');
  assert(serviceCode.includes('export async function getLessonWithProgress'), 'Exports getLessonWithProgress');
  assert(serviceCode.includes('export async function getNextLesson'), 'Exports getNextLesson');
  assert(serviceCode.includes('export async function startLesson'), 'Exports startLesson');
  assert(serviceCode.includes('export async function completeLesson'), 'Exports completeLesson');
  assert(serviceCode.includes('export async function getDailyGoalStats'), 'Exports getDailyGoalStats');
  assert(serviceCode.includes('export async function getLearningStreak'), 'Exports getLearningStreak');
  assert(serviceCode.includes('export async function getSkillsOverview'), 'Exports getSkillsOverview');
  assert(serviceCode.includes('export async function getDailyRecommendation'), 'Exports getDailyRecommendation');

  // 5. Route Protection Check
  console.log('\n--- Suite 5: Route Protection & Navigation ---');
  const learnPage = fs.readFileSync('app/learn/page.tsx', 'utf8');
  assert(learnPage.includes("redirect('/login?redirect=/learn')"), 'Unauthenticated /learn redirects to /login');

  const lessonPage = fs.readFileSync('app/learn/[lessonId]/page.tsx', 'utf8');
  assert(lessonPage.includes("redirect(`/login?redirect=/learn/${lessonId}`)"), 'Unauthenticated /learn/[lessonId] redirects to /login');

  console.log('\n====================================================');
  console.log(`TOTAL PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
