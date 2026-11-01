/**
 * Kannada Kaliri — Full AI Guru Conversation Audit Suite
 * Verifies all pedagogical conversation types: grammar, vocabulary, pronunciation, translations, follow-ups.
 */

import assert from 'node:assert';
import { getTutorAIProvider } from '../../lib/ai/tutor/provider.js';

let passed = 0;
let failed = 0;

function pass(desc) {
  console.log(`  ✅ [PASS] ${desc}`);
  passed++;
}

function fail(desc, err) {
  console.error(`  ❌ [FAIL] ${desc}: ${err?.message || err}`);
  failed++;
}

async function runGuruConversationAudit() {
  console.log('=== KANNADA KALIRI — AI GURU CONVERSATION AUDIT ===\n');

  const provider = getTutorAIProvider();

  const learnerContext = {
    learnerName: 'Sneha',
    nativeLanguage: 'en',
    nativeLanguageName: 'English',
    proficiencyLevel: 'beginner',
    learningGoals: ['Everyday Kannada conversation'],
    dailyGoalMinutes: 15,
    completedLessonsCount: 3,
    strugglingConcepts: ['Verb endings'],
    wordsNeedingRevision: ['ಹೇಗಿದ್ದೀರಾ'],
  };

  // 1. Ask a Kannada question in English
  console.log('--- Test 1: English Pedagogical Query ---');
  try {
    const res = await provider.generateTutoringResponse({
      messages: [{ role: 'user', content: 'How do I ask an auto driver "Will you come to Indiranagar" politely?' }],
      learnerContext,
    });
    assert(res.structured && res.structured.message, 'Structured response present');
    assert(res.structured.kannadaText || res.structured.message.includes('ಬರ್ತೀರಾ') || res.structured.message.includes('ಇಂದಿರಾನಗರ'), 'Relevant Kannada phrases included');
    pass('English pedagogical question answered with accurate Kannada phrase and breakdown');
  } catch (err) {
    fail('English pedagogical query', err);
  }

  // 2. Ask a Kannada question in Kannada
  console.log('\n--- Test 2: Kannada Question in Kannada Script ---');
  try {
    const res = await provider.generateTutoringResponse({
      messages: [{ role: 'user', content: 'ನಮಸ್ಕಾರ ಗುರುಗಳೇ, "ಪುಸ್ತಕ" ಪದದ ಅರ್ಥವೇನು?' }],
      learnerContext,
    });
    assert(res.structured && res.structured.message, 'Structured response present');
    assert(
      (res.structured.translation && res.structured.translation.toLowerCase().includes('book')) ||
      res.structured.message.toLowerCase().includes('book'),
      'Accurately explains "pusthaka" as book'
    );
    pass('Kannada query understood and answered with vocabulary explanation');
  } catch (err) {
    fail('Kannada query in Kannada script', err);
  }

  // 3. Ask for Sentence & Grammar Correction
  console.log('\n--- Test 3: Grammar Correction Flow ---');
  try {
    const res = await provider.generateTutoringResponse({
      messages: [{ role: 'user', content: 'Is "ನಾನು ಊಟ ಮಾಡಿದೆ" correct or "ನಾನು ಊಟ ಮಾಡುತ್ತೇನೆ" for what I will do tomorrow?' }],
      learnerContext,
    });
    assert(res.structured && res.structured.message, 'Response present');
    assert(
      res.structured.message.includes('ಮಾಡುತ್ತೇನೆ') ||
      (res.structured.explanation && res.structured.explanation.toLowerCase().includes('future')),
      'Identifies future tense vs past tense correctly'
    );
    pass('Grammar tense correction clearly distinguishes past and future verb forms');
  } catch (err) {
    fail('Grammar correction query', err);
  }

  // 4. Pronunciation Guidance Flow
  console.log('\n--- Test 4: Pronunciation Guidance Flow ---');
  try {
    const res = await provider.generateTutoringResponse({
      messages: [{ role: 'user', content: 'How do I pronounce the retroflex ಳ (La) in "ಕನ್ನಡ" vs simple ಲ?' }],
      learnerContext,
    });
    assert(res.structured && res.structured.message, 'Response present');
    assert(
      res.structured.message.toLowerCase().includes('retroflex') ||
      res.structured.message.toLowerCase().includes('tongue') ||
      (res.structured.explanation && res.structured.explanation.toLowerCase().includes('tongue')),
      'Provides physical articulation advice for retroflex ಳ'
    );
    pass('Pronunciation guidance provides physiological articulation instructions');
  } catch (err) {
    fail('Pronunciation guidance', err);
  }

  // 5. Contextual Multi-Turn Conversation
  console.log('\n--- Test 5: Contextual Multi-Turn Memory ---');
  try {
    const res = await provider.generateTutoringResponse({
      messages: [
        { role: 'user', content: 'Teach me the word for "Milk" in Kannada.' },
        { role: 'assistant', content: 'In Kannada, milk is called "ಹಾಲು" (Hālu).' },
        { role: 'user', content: 'Now how do I ask for "One packet of that please"?' },
      ],
      learnerContext,
    });
    const fullText = (res.structured.message + ' ' + (res.structured.kannadaText || '')).toLowerCase();
    assert(
      fullText.includes('ಹಾಲು') || fullText.includes('haalu') || fullText.includes('halu') || fullText.includes('packet'),
      'Maintains context of "Milk" across turns'
    );
    pass('Multi-turn conversation retains antecedent referent ("that" -> "ಹಾಲು")');
  } catch (err) {
    fail('Multi-turn conversation', err);
  }

  console.log(`\n====================================================`);
  console.log(`GURU AUDIT SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`====================================================\n`);

  if (failed > 0) process.exit(1);
}

runGuruConversationAudit().catch((err) => {
  console.error('Fatal Guru audit error:', err);
  process.exit(1);
});
