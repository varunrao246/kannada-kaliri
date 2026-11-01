/**
 * Milestone 06: AI Kannada Guru Intelligent Tutor Verification Suite
 * Kannada Kaliri
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getTutorAIConfig,
  isTutorAIConfigured,
} from '../../lib/ai/tutor/config.ts';

import {
  buildTutorSystemPrompt,
} from '../../lib/ai/tutor/prompts.ts';

import {
  parseTutorResponse,
} from '../../lib/ai/tutor/response-parser.ts';

import {
  MockTutorProvider,
  getTutorAIProvider,
  TutorAIError,
} from '../../lib/ai/tutor/provider.ts';

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
    if (details) console.log(`   └─ ${details}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
    if (details) console.error(`   └─ ${details}`);
  }
}

console.log('====================================================');
console.log('  KANNADA KALIRI — MILESTONE 06 VERIFICATION SUITE  ');
console.log('====================================================\n');

// ─── Suite 1: Configuration & Credential Safety ──────────────────────────────
console.log('--- Suite 1: Configuration & Credential Safety ---');

const config = getTutorAIConfig();
assert(typeof config.provider === 'string', 'Provider property is resolved', config.provider);
assert(typeof config.model === 'string', 'Model property is resolved', config.model);
assert(config.maxMessageLength === 1000, 'Max message length set to 1000 chars');
assert(config.maxTokens === 1000, 'Max tokens set to 1000');
assert(config.temperature === 0.7, 'Default temperature is 0.7');

// In local environment without AI_API_KEY, isTutorAIConfigured() must be honest
const isConfigured = isTutorAIConfigured();
assert(typeof isConfigured === 'boolean', 'Honest boolean configuration status', `Configured: ${isConfigured}`);

// ─── Suite 2: Pedagogical System Prompt Synthesis ────────────────────────────
console.log('\n--- Suite 2: Pedagogical System Prompt Synthesis ---');

const sampleContextHindi = {
  learnerName: 'Amit',
  nativeLanguage: 'hi',
  nativeLanguageName: 'Hindi',
  proficiencyLevel: 'beginner',
  learningGoals: ['Daily Conversation', 'Market & Travel'],
  dailyGoalMinutes: 15,
  currentLessonTitle: 'Lesson 2: Ordering Food (ಕಾಫಿ / ತಿಂಡಿ)',
  completedLessonsCount: 3,
  recentAssessmentScore: 85,
  strugglingConcepts: ['Sentence Word Order (SOV)'],
  wordsNeedingRevision: ['ಕಾಫಿ (kaaphi - Coffee)', 'ಕೊಡಿ (kodi - Give)'],
};

const promptHindi = buildTutorSystemPrompt(sampleContextHindi);
assert(promptHindi.includes('ಕನ್ನಡ ಗುರು'), 'Prompt includes Guru persona name');
assert(promptHindi.includes('Amit'), 'Prompt personalizes with learner name');
assert(promptHindi.includes('हिन्दी') || promptHindi.includes('Hindi'), 'Prompt instructs Hindi explanation language');
assert(promptHindi.includes('Subject-Object-Verb') || promptHindi.includes('SOV'), 'Prompt enforces SOV linguistic grammar rules');
assert(promptHindi.includes('Sentence Word Order (SOV)'), 'Prompt injects real struggling concepts');
assert(promptHindi.includes('ಕಾಫಿ (kaaphi - Coffee)'), 'Prompt injects real vocabulary needing revision');

// Test Tamil native language instruction
const sampleContextTamil = {
  learnerName: 'Priya',
  nativeLanguage: 'ta',
  nativeLanguageName: 'Tamil',
  proficiencyLevel: 'elementary',
  learningGoals: ['Workplace & Commute'],
  dailyGoalMinutes: 10,
  completedLessonsCount: 5,
  strugglingConcepts: [],
  wordsNeedingRevision: [],
};
const promptTamil = buildTutorSystemPrompt(sampleContextTamil);
assert(promptTamil.includes('Tamil') && promptTamil.includes('தமிழ்'), 'Prompt contains Tamil language instructions');

// ─── Suite 3: Structured Response Parsing & Fallbacks ────────────────────────
console.log('\n--- Suite 3: Structured Response Parsing & Fallbacks ---');

// Test 1: Clean JSON
const cleanJson = JSON.stringify({
  message: 'ನಮಸ್ಕಾರ! To order filter coffee politely, say: ಒಂದು ಕಾಫಿ ಕೊಡಿ (Ondu kāphi kodi).',
  kannadaText: 'ಒಂದು ಕಾಫಿ ಕೊಡಿ',
  transliteration: 'Ondu kāphi kodi',
  translation: 'Give one coffee (polite)',
  explanation: 'In Kannada, "ಕೊಡಿ" (kodi) is the polite imperative form used with shopkeepers.',
  corrections: [
    {
      original: 'ಕಾಫಿ ಕೊಡು',
      corrected: 'ಕಾಫಿ ಕೊಡಿ',
      explanation: 'ಕೊಡು is informal, use ಕೊಡಿ for respectful requests.',
    },
  ],
  suggestedReplies: ['ಸಕ್ಕರೆ ಕಡಿಮೆ ಹಾಕಿ', 'ಎಷ್ಟು ಆಯ್ತು?'],
  exercise: {
    prompt: 'How do you ask for water politely in Kannada?',
    expectedKannada: 'ನೀರು ಕೊಡಿ',
    options: ['ನೀರು ಕೊಡಿ', 'ಕಾಫಿ ಕೊಡಿ'],
  },
});

const parsedClean = parseTutorResponse(cleanJson);
assert(parsedClean.message.includes('filter coffee'), 'Parses message field');
assert(parsedClean.kannadaText === 'ಒಂದು ಕಾಫಿ ಕೊಡಿ', 'Parses kannadaText field');
assert(parsedClean.transliteration === 'Ondu kāphi kodi', 'Parses transliteration');
assert(parsedClean.corrections?.length === 1, 'Parses grammar corrections array');
assert(parsedClean.corrections?.[0].corrected === 'ಕಾಫಿ ಕೊಡಿ', 'Validates corrected phrase');
assert(parsedClean.suggestedReplies?.length === 2, 'Parses suggested replies');
assert(parsedClean.exercise?.expectedKannada === 'ನೀರು ಕೊಡಿ', 'Parses micro-exercise');

// Test 2: Markdown code fence ```json ... ```
const fencedJson = `Here is your lesson:\n\`\`\`json\n${cleanJson}\n\`\`\`\nHope this helps!`;
const parsedFenced = parseTutorResponse(fencedJson);
assert(parsedFenced.kannadaText === 'ಒಂದು ಕಾಫಿ ಕೊಡಿ', 'Parses JSON enclosed in markdown fences');

// Test 3: Raw text with Kannada script fallback
const rawKannadaText = 'Hello! You can say ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ to mean I am fine.';
const parsedRaw = parseTutorResponse(rawKannadaText);
assert(parsedRaw.message.includes('I am fine'), 'Raw fallback preserves message');
assert(parsedRaw.kannadaText?.includes('ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ'), 'Extracts Kannada unicode script from raw text');
assert(parsedRaw.suggestedReplies && parsedRaw.suggestedReplies.length > 0, 'Provides default suggested replies on fallback');

// ─── Suite 4: Provider Implementations & Error Guards ────────────────────────
console.log('\n--- Suite 4: Provider Implementations & Error Guards ---');

// Test Mock Provider
const mockProvider = new MockTutorProvider();
assert(mockProvider.name === 'mock', 'Mock provider name is mock');

const mockReq = {
  messages: [{ role: 'user', content: 'How do I order coffee in Bengaluru?' }],
  learnerContext: sampleContextHindi,
};

const mockRes = await mockProvider.generateTutoringResponse(mockReq);
assert(mockRes.provider === 'mock', 'Mock response returns correct provider tag');
assert(mockRes.structured.kannadaText?.includes('ಕಾಫಿ'), 'Mock coffee query returns coffee phrase');
assert(mockRes.structured.suggestedReplies?.length === 3, 'Mock returns 3 suggested replies');
assert(mockRes.structured.exercise?.expectedKannada !== undefined, 'Mock returns interactive micro-quiz');

// Test Unconfigured Guard
let guardTriggered = false;
try {
  // If not configured, getTutorAIProvider() should throw TutorAIError
  if (!isTutorAIConfigured()) {
    getTutorAIProvider();
  } else {
    guardTriggered = true; // In configured environment
  }
} catch (err) {
  if (err instanceof TutorAIError && err.code === 'AI_PROVIDER_NOT_CONFIGURED') {
    guardTriggered = true;
  }
}
assert(guardTriggered, 'Unconfigured environment throws structured AI_PROVIDER_NOT_CONFIGURED error');

// ─── Suite 5: Database Schema & Migration SQL ────────────────────────────────
console.log('\n--- Suite 5: Database Schema & Migration SQL ---');

const migrationPath = resolve(process.cwd(), 'supabase/migrations/005_create_guru_chat_history.sql');
assert(existsSync(migrationPath), 'Migration 005 file exists on disk', migrationPath);

const migrationSql = readFileSync(migrationPath, 'utf-8');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.guru_conversations'), 'Defines guru_conversations table');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.guru_messages'), 'Defines guru_messages table');
assert(migrationSql.includes('ALTER TABLE public.guru_conversations ENABLE ROW LEVEL SECURITY'), 'RLS enabled on guru_conversations');
assert(migrationSql.includes('ALTER TABLE public.guru_messages ENABLE ROW LEVEL SECURITY'), 'RLS enabled on guru_messages');
assert(migrationSql.includes('auth.uid() = user_id'), 'Strict user ownership check (auth.uid() = user_id)');
assert(migrationSql.includes('handle_guru_conversation_updated_at'), 'Trigger updates updated_at on new messages');

// ─── Suite 6: Architectural File Presence ────────────────────────────────────
console.log('\n--- Suite 6: Architectural File Presence ---');

const requiredFiles = [
  'lib/ai/tutor/types.ts',
  'lib/ai/tutor/config.ts',
  'lib/ai/tutor/context.ts',
  'lib/ai/tutor/prompts.ts',
  'lib/ai/tutor/response-parser.ts',
  'lib/ai/tutor/provider.ts',
  'lib/services/guru-history.ts',
  'app/api/guru/chat/route.ts',
  'app/api/guru/conversations/route.ts',
  'components/guru/GuruChatView.tsx',
  'app/guru/page.tsx',
];

for (const rel of requiredFiles) {
  const full = resolve(process.cwd(), rel);
  assert(existsSync(full), `Verified module exists: ${rel}`);
}

// ─── Final Summary ───────────────────────────────────────────────────────────
console.log('\n====================================================');
console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
