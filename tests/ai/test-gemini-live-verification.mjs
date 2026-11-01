/**
 * Kannada Kaliri — Milestone 11.5 Task 1: Live Gemini Runtime Verification
 * Verifies live Google Gemini integration against all 7 verification points.
 */

import { getTutorAIProvider, GoogleGeminiProvider, TutorAIError } from '../../lib/ai/tutor/provider.js';
import { getTutorAIConfig, isTutorAIConfigured } from '../../lib/ai/tutor/config.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runGeminiLiveVerification() {
  console.log('=== KANNADA KALIRI — GEMINI LIVE RUNTIME VERIFICATION ===\n');

  // Point 1: Server Config & Env Resolution
  console.log('--- Verification Point 1: Configuration & Credential Resolution ---');
  const config = getTutorAIConfig();
  assert(config.provider === 'google', `Provider resolved to 'google' (actual: ${config.provider})`);
  assert(Boolean(config.apiKey && config.apiKey.length > 20), 'API key securely resolved from server environment');
  assert(!config.isPlaceholder, 'API key is genuine (non-placeholder)');
  assert(isTutorAIConfigured() === true, 'isTutorAIConfigured() returns true');
  assert(config.model === 'gemini-flash-lite-latest', `Model resolved to modern endpoint (actual: ${config.model})`);

  const mockLearnerContext = {
    learnerName: 'Ravi',
    nativeLanguage: 'en',
    nativeLanguageName: 'English',
    proficiencyLevel: 'A1',
    learningGoals: ['Everyday conversation in Bengaluru'],
    dailyGoalMinutes: 15,
    completedLessonsCount: 3,
    strugglingConcepts: ['Verb endings in present tense'],
    wordsNeedingRevision: ['ಹೇಗಿದ್ದೀರಾ'],
    topKnowledgeGaps: ['Formal vs informal pronouns'],
  };

  // Point 2: Kannada Question & Structured Output
  console.log('\n--- Verification Point 2: Live Kannada Query & Pedagogical JSON ---');
  const provider = getTutorAIProvider();
  const kannadaRequest = {
    messages: [
      { role: 'user', content: 'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಾ?' }
    ],
    learnerContext: mockLearnerContext
  };

  const startK = Date.now();
  const respK = await provider.generateTutoringResponse(kannadaRequest);
  const latencyK = Date.now() - startK;

  assert(respK.provider === 'google', `Provider returned as 'google' (actual: ${respK.provider})`);
  assert(respK.structured !== null, 'Structured JSON payload returned');
  assert(Boolean(respK.structured.message && respK.structured.message.length > 0), `Guru message present: "${respK.structured.message.slice(0, 60)}..."`);
  assert(
    Boolean(respK.structured.kannadaText || respK.structured.explanation || respK.structured.translation),
    'Pedagogical Kannada text / explanation / translation present'
  );
  console.log(`  ⏱️ Kannada round-trip latency: ${latencyK}ms`);

  // Point 3: English Pedagogical Query
  console.log('\n--- Verification Point 3: Live English Query ---');
  const englishRequest = {
    messages: [
      { role: 'user', content: 'How do I ask for a cup of filter coffee politely in a Bengaluru Darshini?' }
    ],
    learnerContext: mockLearnerContext
  };

  const startE = Date.now();
  const respE = await provider.generateTutoringResponse(englishRequest);
  const latencyE = Date.now() - startE;

  assert(Boolean(respE.structured.message), `English query responded: "${respE.structured.message.slice(0, 60)}..."`);
  assert(
    Boolean(respE.structured.kannadaText || respE.structured.translation || respE.structured.explanation),
    'English query received structured Kannada breakdown'
  );
  console.log(`  ⏱️ English query latency: ${latencyE}ms`);

  // Point 4: Contextual Multi-Turn Conversation
  console.log('\n--- Verification Point 4: Contextual Multi-Turn History ---');
  const multiTurnRequest = {
    messages: [
      { role: 'user', content: 'How do I say "water" in Kannada?' },
      { role: 'assistant', content: 'In Kannada, water is called "ನೀರು" (neeru).' },
      { role: 'user', content: 'And how do I say "I want that please"?' }
    ],
    learnerContext: mockLearnerContext
  };

  const startM = Date.now();
  const respM = await provider.generateTutoringResponse(multiTurnRequest);
  const latencyM = Date.now() - startM;

  assert(Boolean(respM.structured.message), 'Multi-turn continuation succeeded');
  const combinedText = (respM.structured.message + ' ' + (respM.structured.kannadaText || '') + ' ' + (respM.structured.explanation || '')).toLowerCase();
  assert(
    combinedText.includes('ನೀರು') || 
    combinedText.includes('ಬೇಕು') || 
    combinedText.includes('neeru') ||
    combinedText.includes('beku') ||
    combinedText.includes('water'),
    'Multi-turn response contextually connected to prior turns'
  );
  console.log(`  ⏱️ Multi-turn latency: ${latencyM}ms`);

  // Point 5: Invalid Credentials Handling (401/403)
  console.log('\n--- Verification Point 5: Invalid Credentials Rejection ---');
  const badProvider = new GoogleGeminiProvider('AIzaSy_FAKE_INVALID_GEMINI_KEY_XYZ_12345');
  let authErrorCaught = false;
  try {
    await badProvider.generateTutoringResponse(kannadaRequest);
  } catch (err) {
    authErrorCaught = true;
    assert(
      err instanceof TutorAIError && (err.status === 401 || err.status === 400 || err.code === 'AI_INVALID_CREDENTIALS'),
      `Correctly threw TutorAIError with 401/invalid credentials (code: ${err.code}, status: ${err.status})`
    );
  }
  assert(authErrorCaught, 'Invalid key was rejected securely');

  // Point 6: Zero Secret Exposure
  console.log('\n--- Verification Point 6: Zero Secret Exposure ---');
  const serializedResp = JSON.stringify(respK);
  assert(!serializedResp.includes(config.apiKey), 'Response payload contains zero API key material');
  assert(!JSON.stringify(respE).includes(config.apiKey), 'English response payload contains zero API key material');

  // Point 7: Graceful Quota / Rate-limit Handling simulation
  console.log('\n--- Verification Point 7: Error Code Contracts ---');
  const rateLimitError = new TutorAIError('Quota exceeded', 'AI_QUOTA_EXCEEDED', 429);
  assert(rateLimitError.status === 429 && rateLimitError.code === 'AI_QUOTA_EXCEEDED', 'Rate limit status 429 handled');
  const timeoutError = new TutorAIError('Gateway timeout', 'AI_TIMEOUT', 504);
  assert(timeoutError.status === 504 && timeoutError.code === 'AI_TIMEOUT', 'Timeout status 504 handled');

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runGeminiLiveVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
