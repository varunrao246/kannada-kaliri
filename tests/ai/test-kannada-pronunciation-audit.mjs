/**
 * Kannada Kaliri — Kannada Linguistic & Phonetic Pronunciation Audit Suite
 * Verifies all 15 traditional Kannada vowels (Swaragalu), phonetics, and speech assessment.
 */

import assert from 'node:assert';
import { KANNADA_VOWEL_INVENTORY } from '../../lib/ai/speech/kannada-phonetics.ts';
import { compareSpokenAnswer } from '../../lib/ai/speech/provider.ts';
import { downsampleTo16000 } from '../../lib/ai/speech/audio-recorder.ts';

let passed = 0;
let failed = 0;

function pass(desc) {
  console.log(`  ✅ [PASS] ${desc}`);
  passed++;
}

async function runPronunciationAudit() {
  console.log('=== KANNADA KALIRI — LINGUISTIC & PHONETIC PRONUNCIATION AUDIT ===\n');

  // Suite 1: Full 15-Vowel Inventory Integrity
  console.log('--- Suite 1: Traditional Kannada Vowel Inventory (Swaragalu) ---');
  const expectedVowels = ['ಅ', 'ಆ', 'ಇ', 'ಈ', 'ಉ', 'ಊ', 'ಋ', 'ಎ', 'ಏ', 'ಐ', 'ಒ', 'ಓ', 'ಔ', 'ಅಂ', 'ಅಃ'];
  
  for (const v of expectedVowels) {
    const detail = KANNADA_VOWEL_INVENTORY[v];
    assert(detail, `Vowel "${v}" must be registered in phonetic inventory`);
    assert(detail.ipa && detail.ipa.length > 0, `Vowel "${v}" has IPA definition: [${detail.ipa}]`);
    assert(detail.canonicalWord && detail.canonicalWord.length > 0, `Vowel "${v}" has canonical word: "${detail.canonicalWord}"`);
    assert(detail.matras === 1 || detail.matras === 2, `Vowel "${v}" has valid mora count: ${detail.matras}`);
    pass(`Vowel "${v}" (${detail.name}) verified: [${detail.ipa}], Canonical: "${detail.canonicalWord}"`);
  }

  // Suite 2: Vowel 'ಅ' Isolated Pronunciation & Short/Long Contrast
  console.log('\n--- Suite 2: Specific Vowel "ಅ" (Short A) Investigation ---');
  
  // Exact match
  const exactA = compareSpokenAnswer('ಅ', 'ಅ');
  assert.strictEqual(exactA.isMatch, true, 'Exact "ಅ" recognized');
  assert.strictEqual(exactA.similarityScore, 100, 'Exact match scores 100%');
  pass('Exact "ಅ" pronunciation succeeds with 100%');

  // Canonical word match (saying "ಅಮ್ಮ" when learning "ಅ")
  const ammaForA = compareSpokenAnswer('ಅಮ್ಮ', 'ಅ');
  assert.strictEqual(ammaForA.isMatch, true, 'Canonical word "ಅಮ್ಮ" recognized as correct realization of "ಅ"');
  assert(ammaForA.similarityScore >= 95, 'High score for canonical word');
  pass('Saying canonical word "ಅಮ್ಮ" recognized as authentic pronunciation of "ಅ"');

  // Transliteration match ("a" or "ah")
  const translitA = compareSpokenAnswer('a', 'ಅ');
  assert.strictEqual(translitA.isMatch, true, 'Transliteration "a" accepted as valid phonetic representation');
  pass('Transliteration "a" accepted without penalty');

  // Contrastive pair: user says long "ಆ" instead of short "ಅ"
  const longAaAttempt = compareSpokenAnswer('ಆ', 'ಅ');
  assert(longAaAttempt.feedbackMessage.includes('contrast') || longAaAttempt.feedbackMessage.includes('Good effort'), 'Contrast feedback given for vowel length difference');
  pass('Contrastive pair ("ಆ" for "ಅ") provides constructive vowel length feedback');

  // Brief/Empty speech on isolated short vowel (ASR threshold edge case)
  const emptyVowelA = compareSpokenAnswer('', 'ಅ');
  assert.strictEqual(emptyVowelA.isMatch, false, 'Marked as needing review');
  assert(emptyVowelA.similarityScore >= 50, 'Non-punitive score (not 0%)');
  assert(emptyVowelA.feedbackMessage.includes('brief') || emptyVowelA.feedbackMessage.includes('Isolated vowel'), 'Honest feedback explaining brevity of isolated vowels');
  pass('Empty/brief audio on isolated vowel gives honest, non-punitive guidance');

  // Suite 3: Dravidian Distinct Vowels (Short vs Long E and O)
  console.log('\n--- Suite 3: Distinct Dravidian Phonemes ("ಎ" vs "ಏ", "ಒ" vs "ಓ") ---');
  
  // Short E
  const shortE = compareSpokenAnswer('ಎ', 'ಎ');
  assert.strictEqual(shortE.isMatch, true, 'Short E "ಎ" verified');
  pass('Hrasva E "ಎ" verified');

  // Long Ae
  const longAe = compareSpokenAnswer('ಏ', 'ಏ');
  assert.strictEqual(longAe.isMatch, true, 'Long Ae "ಏ" verified');
  pass('Deergha Ae "ಏ" verified');

  // Short O
  const shortO = compareSpokenAnswer('ಒ', 'ಒ');
  assert.strictEqual(shortO.isMatch, true, 'Short O "ಒ" verified');
  pass('Hrasva O "ಒ" verified');

  // Long Oo
  const longOo = compareSpokenAnswer('ಓ', 'ಓ');
  assert.strictEqual(longOo.isMatch, true, 'Long Oo "ಓ" verified');
  pass('Deergha Oo "ಓ" verified');

  // Suite 4: Multi-Word Regular Kannada Phrases (ASR String Comparison Preservation)
  console.log('\n--- Suite 4: Multi-Word Phrase Comparison Invariants ---');
  
  const greeting = compareSpokenAnswer('ನಮಸ್ಕಾರ', 'ನಮಸ್ಕಾರ');
  assert.strictEqual(greeting.isMatch, true, 'Exact word match preserved');
  assert.strictEqual(greeting.similarityScore, 100, 'Full score for greeting');
  pass('Multi-word phrase exact match preserved');

  const sentence = compareSpokenAnswer('ಹೇಗಿದ್ದೀರಾ', 'ನೀವು ಹೇಗಿದ್ದೀರಾ');
  assert(sentence.similarityScore >= 45, 'Partial credit awarded for partial match');
  pass('Partial credit logic preserved for multi-word phrases');

  // Suite 5: Demonstrative Words & Contrast ("ಇಲ್ಲಿ" vs "ಅಲ್ಲಿ", "illi" vs "alli")
  console.log('\n--- Suite 5: Demonstrative & Transliteration Intelligence ("ಇಲ್ಲಿ" / "ಅಲ್ಲಿ") ---');

  // Exact "ಇಲ್ಲಿ" (Here)
  const exactIlli = compareSpokenAnswer('ಇಲ್ಲಿ', 'ಇಲ್ಲಿ');
  assert.strictEqual(exactIlli.isMatch, true, 'Exact "ಇಲ್ಲಿ" recognized');
  assert.strictEqual(exactIlli.similarityScore, 100, 'Exact "ಇಲ್ಲಿ" scores 100%');
  pass('Exact "ಇಲ್ಲಿ" (Here) recognized with 100%');

  // Transliteration "illi" for "ಇಲ್ಲಿ"
  const translitIlli = compareSpokenAnswer('illi', 'ಇಲ್ಲಿ');
  assert.strictEqual(translitIlli.isMatch, true, 'Transliteration "illi" accepted for "ಇಲ್ಲಿ"');
  assert(translitIlli.similarityScore >= 95, 'Transliteration "illi" scores >= 95%');
  pass('Transliteration "illi" recognized for "ಇಲ್ಲಿ" without penalty');

  // Variant "ili" for "ಇಲ್ಲಿ"
  const variantIli = compareSpokenAnswer('ili', 'ಇಲ್ಲಿ');
  assert.strictEqual(variantIli.isMatch, true, 'Variant "ili" accepted for "ಇಲ್ಲಿ"');
  pass('Phonetic variant "ili" accepted for "ಇಲ್ಲಿ"');

  // Exact "ಅಲ್ಲಿ" (There)
  const exactAlli = compareSpokenAnswer('ಅಲ್ಲಿ', 'ಅಲ್ಲಿ');
  assert.strictEqual(exactAlli.isMatch, true, 'Exact "ಅಲ್ಲಿ" recognized');
  assert.strictEqual(exactAlli.similarityScore, 100, 'Exact "ಅಲ್ಲಿ" scores 100%');
  pass('Exact "ಅಲ್ಲಿ" (There) recognized with 100%');

  // Transliteration "alli" for "ಅಲ್ಲಿ"
  const translitAlli = compareSpokenAnswer('alli', 'ಅಲ್ಲಿ');
  assert.strictEqual(translitAlli.isMatch, true, 'Transliteration "alli" accepted for "ಅಲ್ಲಿ"');
  pass('Transliteration "alli" accepted for "ಅಲ್ಲಿ" without penalty');

  // Contrastive test: User says "ಅಲ್ಲಿ" (There) when target was "ಇಲ್ಲಿ" (Here)
  const alliForIlli = compareSpokenAnswer('ಅಲ್ಲಿ', 'ಇಲ್ಲಿ');
  assert.strictEqual(alliForIlli.isMatch, false, 'Marked for learner review');
  assert.strictEqual(alliForIlli.similarityScore, 70, 'Awarded constructive contrast score 70%');
  assert(
    alliForIlli.feedbackMessage.includes('HERE') || alliForIlli.feedbackMessage.includes('proximity'),
    'Constructive feedback explains proximate vs distant contrast'
  );
  pass('Saying "ಅಲ್ಲಿ" for "ಇಲ್ಲಿ" returns proximate vs distant demonstrative pedagogical guidance');

  // Contrastive test: User says "illi" when target was "ಅಲ್ಲಿ"
  const illiForAlli = compareSpokenAnswer('illi', 'ಅಲ್ಲಿ');
  assert.strictEqual(illiForAlli.isMatch, false, 'Marked for learner review');
  assert.strictEqual(illiForAlli.similarityScore, 70, 'Awarded constructive contrast score 70%');
  assert(
    illiForAlli.feedbackMessage.includes('THERE') || illiForAlli.feedbackMessage.includes('distance'),
    'Constructive feedback explains distant vs proximate contrast'
  );
  pass('Saying "illi" for "ಅಲ್ಲಿ" returns distant vs proximate demonstrative pedagogical guidance');

  // Common vocabulary transliteration: "namaskara" for "ನಮಸ್ಕಾರ"
  const namaskaraTranslit = compareSpokenAnswer('namaskara', 'ನಮಸ್ಕಾರ');
  assert.strictEqual(namaskaraTranslit.isMatch, true, 'Transliteration "namaskara" recognized');
  pass('Common vocabulary transliteration "namaskara" recognized with high confidence');

  // Suite 6: Audio Resampling & 16kHz Guarantee (Audio Hardware Independence)
  console.log('\n--- Suite 6: Audio Resampling & 16kHz Hardware Normalization ---');
  
  // 48000Hz -> 16000Hz (typical modern Mac & Windows default)
  const samples48k = new Float32Array(48000); // 1 second at 48kHz
  for (let i = 0; i < 48000; i++) samples48k[i] = Math.sin((2 * Math.PI * 440 * i) / 48000);
  const resampledFrom48k = downsampleTo16000(samples48k, 48000);
  assert.strictEqual(resampledFrom48k.length, 16000, '48kHz input cleanly downsamples to exactly 16000 samples');
  pass('48000Hz -> 16000Hz downsampling ratio verified (1.000s duration preserved)');

  // 44100Hz -> 16000Hz (typical external USB mics & audio interfaces)
  const samples44k = new Float32Array(44100); // 1 second at 44.1kHz
  for (let i = 0; i < 44100; i++) samples44k[i] = Math.sin((2 * Math.PI * 440 * i) / 44100);
  const resampledFrom44k = downsampleTo16000(samples44k, 44100);
  assert.strictEqual(resampledFrom44k.length, 16000, '44.1kHz input cleanly downsamples to exactly 16000 samples');
  pass('44100Hz -> 16000Hz downsampling ratio verified (1.000s duration preserved)');

  // Identity test: 16000Hz passes through without modification
  const samples16k = new Float32Array(16000);
  const passThrough = downsampleTo16000(samples16k, 16000);
  assert.strictEqual(passThrough, samples16k, '16000Hz input passes through without reallocating');
  pass('16000Hz input pass-through optimization verified');

  console.log(`\n====================================================`);
  console.log(`PRONUNCIATION AUDIT SUMMARY: ${passed} passed, 0 failed`);
  console.log(`====================================================\n`);

  if (failed > 0) process.exit(1);
}

runPronunciationAudit().catch((err) => {
  console.error('Fatal pronunciation audit failure:', err);
  process.exit(1);
});
