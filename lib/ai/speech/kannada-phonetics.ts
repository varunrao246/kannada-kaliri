/**
 * Kannada Kaliri — Linguistic & Phonetic Pronunciation Engine
 * Kannada Vowels (Swaragalu), Consonants (Vyanjanagalu) & Phonetic Contrast Rules
 *
 * Grounded in authentic Kannada grammar (Kavirajamarga & Shabdamaridarpana phonetic tradition):
 * - Hrasva (ಹ್ರಸ್ವ - 1 Matra / Short)
 * - Deergha (ದೀರ್ಘ - 2 Matras / Long)
 * - Sandhyakshara (ಸಂಧ್ಯಾಕ್ಷರ - Diphthongs)
 * - Yogavahagalu (ಯೋಗವಾಹಗಳು - Anusvara & Visarga)
 */

export type VowelCategory = 'hrasva' | 'deergha' | 'sandhyakshara' | 'yogavaha';

export interface VowelPhoneticDetail {
  vowel: string;
  name: string;
  category: VowelCategory;
  matras: number; // 1 for short, 2 for long
  ipa: string; // International Phonetic Alphabet
  transliterations: string[];
  description: string;
  contrastWith?: string; // e.g. 'ಅ' contrasts with 'ಆ'
  contrastTip?: string;
  canonicalWord: string;
  canonicalTransliteration: string;
  canonicalMeaning: string;
  acceptedSpeechVariants: string[];
}

export const KANNADA_VOWEL_INVENTORY: Record<string, VowelPhoneticDetail> = {
  'ಅ': {
    vowel: 'ಅ',
    name: 'Hrasva A (Short A)',
    category: 'hrasva',
    matras: 1,
    ipa: 'ɐ',
    transliterations: ['a', 'u'],
    description: 'Short open central unrounded vowel [ɐ], like the "u" in English "cup" or "but". Held for 1 matra.',
    contrastWith: 'ಆ',
    contrastTip: '"ಅ" is short (1 matra as in "cup"), whereas "ಆ" is long (2 matras as in "father").',
    canonicalWord: 'ಅಮ್ಮ',
    canonicalTransliteration: 'Amma',
    canonicalMeaning: 'Mother',
    acceptedSpeechVariants: ['ಅ', 'ಆ', 'a', 'aa', 'ah', 'ha', 'ಅಮ್ಮ', 'amma', 'ಅಲ್ಲಿ', 'alli', 'ಅರಸ', 'arasa'],
  },
  'ಆ': {
    vowel: 'ಆ',
    name: 'Deergha Aa (Long Aa)',
    category: 'deergha',
    matras: 2,
    ipa: 'aː',
    transliterations: ['aa', 'a'],
    description: 'Long open back unrounded vowel [aː], like the "a" in "father" or "car". Held for 2 matras.',
    contrastWith: 'ಅ',
    contrastTip: 'Hold the vowel sound twice as long as "ಅ".',
    canonicalWord: 'ಆನೆ',
    canonicalTransliteration: 'Aane',
    canonicalMeaning: 'Elephant',
    acceptedSpeechVariants: ['ಆ', 'ಅ', 'aa', 'a', 'aane', 'ಆನೆ'],
  },
  'ಇ': {
    vowel: 'ಇ',
    name: 'Hrasva I (Short I)',
    category: 'hrasva',
    matras: 1,
    ipa: 'i',
    transliterations: ['i', 'e'],
    description: 'Short close front unrounded vowel [i], like the "i" in "pin" or "bit".',
    contrastWith: 'ಈ',
    contrastTip: '"ಇ" is brief and clipped; "ಈ" is drawn out like "feel".',
    canonicalWord: 'ಇಲ್ಲಿ',
    canonicalTransliteration: 'Illi',
    canonicalMeaning: 'Here',
    acceptedSpeechVariants: ['ಇ', 'ಈ', 'i', 'ee', 'illi', 'ಇಲ್ಲಿ', 'ಇಲಿ', 'ili', 'ಇದು', 'idu'],
  },
  'ಈ': {
    vowel: 'ಈ',
    name: 'Deergha Ee (Long Ee)',
    category: 'deergha',
    matras: 2,
    ipa: 'iː',
    transliterations: ['ee', 'ii', 'i'],
    description: 'Long close front unrounded vowel [iː], like the "ee" in "feel" or "meet".',
    contrastWith: 'ಇ',
    contrastTip: 'Extend the sound for 2 full beats.',
    canonicalWord: 'ಈಗ',
    canonicalTransliteration: 'Eega',
    canonicalMeaning: 'Now',
    acceptedSpeechVariants: ['ಈ', 'ಇ', 'ee', 'ii', 'eega', 'ಈಗ'],
  },
  'ಉ': {
    vowel: 'ಉ',
    name: 'Hrasva U (Short U)',
    category: 'hrasva',
    matras: 1,
    ipa: 'u',
    transliterations: ['u', 'oo'],
    description: 'Short close back rounded vowel [u], like the "u" in "put" or "book".',
    contrastWith: 'ಊ',
    contrastTip: '"ಉ" is short as in "put"; "ಊ" is long as in "moon".',
    canonicalWord: 'ಉಪ್ಪು',
    canonicalTransliteration: 'Uppu',
    canonicalMeaning: 'Salt',
    acceptedSpeechVariants: ['ಉ', 'ಊ', 'u', 'oo', 'uppu', 'ಉಪ್ಪು'],
  },
  'ಊ': {
    vowel: 'ಊ',
    name: 'Deergha Oo (Long Oo)',
    category: 'deergha',
    matras: 2,
    ipa: 'uː',
    transliterations: ['oo', 'uu', 'u'],
    description: 'Long close back rounded vowel [uː], like the "oo" in "moon" or "cool".',
    contrastWith: 'ಉ',
    contrastTip: 'Hold the rounded lips longer for 2 matras.',
    canonicalWord: 'ಊಟ',
    canonicalTransliteration: 'Oota',
    canonicalMeaning: 'Meal',
    acceptedSpeechVariants: ['ಊ', 'ಉ', 'oo', 'uu', 'oota', 'ಊಟ'],
  },
  'ಋ': {
    vowel: 'ಋ',
    name: 'Ru (Vocalic R)',
    category: 'hrasva',
    matras: 1,
    ipa: 'ru',
    transliterations: ['ru', 'ri'],
    description: 'Vocalic [ru], pronounced with a light tap of the tongue like "ru" in "Rishi".',
    canonicalWord: 'ಋಷಿ',
    canonicalTransliteration: 'Rushi',
    canonicalMeaning: 'Sage / Saint',
    acceptedSpeechVariants: ['ಋ', 'ಋಷಿ', 'ru', 'rishi', 'rushi'],
  },
  'ಎ': {
    vowel: 'ಎ',
    name: 'Hrasva E (Short E)',
    category: 'hrasva',
    matras: 1,
    ipa: 'e',
    transliterations: ['e'],
    description: 'Short close-mid front unrounded vowel [e], like the "e" in "bed" or "pet". Crucial Dravidian sound absent in Sanskrit/Hindi.',
    contrastWith: 'ಏ',
    contrastTip: '"ಎ" is short and quick (as in "bed"); "ಏ" is held long (as in "play").',
    canonicalWord: 'ಎಲ್ಲಿ',
    canonicalTransliteration: 'Elli',
    canonicalMeaning: 'Where',
    acceptedSpeechVariants: ['ಎ', 'ಏ', 'e', 'elli', 'ಎಲ್ಲಿ'],
  },
  'ಏ': {
    vowel: 'ಏ',
    name: 'Deergha Ae (Long Ae)',
    category: 'deergha',
    matras: 2,
    ipa: 'eː',
    transliterations: ['ee', 'ae', 'e'],
    description: 'Long close-mid front unrounded vowel [eː], like the "a" in "cake" or "name".',
    contrastWith: 'ಎ',
    contrastTip: 'Sustain the vowel for 2 full beats.',
    canonicalWord: 'ಏನು',
    canonicalTransliteration: 'Eenu',
    canonicalMeaning: 'What',
    acceptedSpeechVariants: ['ಏ', 'ಎ', 'ee', 'eenu', 'ಏನು'],
  },
  'ಐ': {
    vowel: 'ಐ',
    name: 'Ai (Diphthong)',
    category: 'sandhyakshara',
    matras: 2,
    ipa: 'aɪ',
    transliterations: ['ai'],
    description: 'Diphthong glided from [a] to [i], like the "i" in English "bite" or "kite".',
    canonicalWord: 'ಐದು',
    canonicalTransliteration: 'Aidu',
    canonicalMeaning: 'Five',
    acceptedSpeechVariants: ['ಐ', 'aidu', 'ai', 'ಐದು'],
  },
  'ಒ': {
    vowel: 'ಒ',
    name: 'Hrasva O (Short O)',
    category: 'hrasva',
    matras: 1,
    ipa: 'o',
    transliterations: ['o'],
    description: 'Short close-mid back rounded vowel [o], like the "o" in "boat" (clipped). Distinct Dravidian short "o".',
    contrastWith: 'ಓ',
    contrastTip: '"ಒ" is short and clipped; "ಓ" is sustained.',
    canonicalWord: 'ಒಂದು',
    canonicalTransliteration: 'Ondu',
    canonicalMeaning: 'One',
    acceptedSpeechVariants: ['ಒ', 'ಓ', 'o', 'ondu', 'ಒಂದು'],
  },
  'ಓ': {
    vowel: 'ಓ',
    name: 'Deergha Oo (Long O)',
    category: 'deergha',
    matras: 2,
    ipa: 'oː',
    transliterations: ['oo', 'o'],
    description: 'Long close-mid back rounded vowel [oː], like the "o" in "gold" or "boat" (sustained).',
    contrastWith: 'ಒ',
    contrastTip: 'Hold the "o" sound for 2 full beats.',
    canonicalWord: 'ಓದು',
    canonicalTransliteration: 'Oodu',
    canonicalMeaning: 'Read',
    acceptedSpeechVariants: ['ಓ', 'ಒ', 'oo', 'oodu', 'ಓದು'],
  },
  'ಔ': {
    vowel: 'ಔ',
    name: 'Au (Diphthong)',
    category: 'sandhyakshara',
    matras: 2,
    ipa: 'aʊ',
    transliterations: ['au', 'ou'],
    description: 'Diphthong glided from [a] to [u], like the "ow" in "cow" or "now".',
    canonicalWord: 'ಔಷಧ',
    canonicalTransliteration: 'Aushadha',
    canonicalMeaning: 'Medicine',
    acceptedSpeechVariants: ['ಔ', 'aushadha', 'au', 'ou', 'ಔಷಧ'],
  },
  'ಅಂ': {
    vowel: 'ಅಂ',
    name: 'Anusvara (Am)',
    category: 'yogavaha',
    matras: 1,
    ipa: 'ɐm',
    transliterations: ['am', 'an'],
    description: 'Nasal coda (Anusvara), nasalizes the preceding vowel.',
    canonicalWord: 'ಅಂಗಡಿ',
    canonicalTransliteration: 'Angadi',
    canonicalMeaning: 'Shop / Store',
    acceptedSpeechVariants: ['ಅಂ', 'am', 'angadi', 'ಅಂಗಡಿ'],
  },
  'ಅಃ': {
    vowel: 'ಅಃ',
    name: 'Visarga (Aha)',
    category: 'yogavaha',
    matras: 1,
    ipa: 'ɐhɐ',
    transliterations: ['aha', 'ah'],
    description: 'Voiceless glottal aspirate (Visarga), creates a gentle breath echo.',
    canonicalWord: 'ಅಃ',
    canonicalTransliteration: 'Aha',
    canonicalMeaning: 'Aspiration sound',
    acceptedSpeechVariants: ['ಅಃ', 'aha', 'ah'],
  },
};

/**
 * Evaluates spoken input specifically for Kannada vowel pronunciation.
 * Differentiates automated speech-to-text string transcription from true phonetic scoring.
 */
export function evaluateKannadaVowelPronunciation(
  recognizedText: string,
  expectedVowel: string,
  expectedTransliteration?: string
): {
  isMatch: boolean;
  score: number;
  feedback: string;
  isVowel: boolean;
} {
  const cleanVowel = expectedVowel.trim();
  const vowelDetail = KANNADA_VOWEL_INVENTORY[cleanVowel];

  if (!vowelDetail) {
    return { isMatch: false, score: 0, feedback: '', isVowel: false };
  }

  const rec = (recognizedText || '').trim().toLowerCase();

  // If recognition was completely empty (very common for 0.2s isolated single vowels in ASR)
  if (!rec) {
    return {
      isMatch: false,
      score: 50, // Neutral non-penalizing score
      feedback: `Isolated vowel sounds like "${cleanVowel}" are very brief for automated speech recognition. For best results, try pronouncing it within an example word like "${vowelDetail.canonicalWord}" (${vowelDetail.canonicalTransliteration}), or listen to the reference audio.`,
      isVowel: true,
    };
  }

  // Exact character match
  if (rec === cleanVowel || rec.includes(cleanVowel)) {
    return {
      isMatch: true,
      score: 100,
      feedback: `ಅದ್ಭುತ! (Adbhutha!) Perfect pronunciation of "${cleanVowel}" (${vowelDetail.name}).`,
      isVowel: true,
    };
  }

  // Check expected transliteration match if provided
  if (expectedTransliteration && rec.includes(expectedTransliteration.toLowerCase())) {
    return {
      isMatch: true,
      score: 90,
      feedback: `Good effort! Your pronunciation of "${cleanVowel}" (${expectedTransliteration}) was recognized.`,
      isVowel: true,
    };
  }

  // Check canonical example word match (e.g. user said "ಅಮ್ಮ" for "ಅ")
  if (rec.includes(vowelDetail.canonicalWord) || rec.includes(vowelDetail.canonicalTransliteration.toLowerCase())) {
    return {
      isMatch: true,
      score: 95,
      feedback: `Very good! We recognized "${vowelDetail.canonicalWord}" (${vowelDetail.canonicalTransliteration}), demonstrating the authentic sound of "${cleanVowel}".`,
      isVowel: true,
    };
  }

  // Check accepted speech / transliteration variants
  const matchedVariant = vowelDetail.acceptedSpeechVariants.some((variant) =>
    rec.toLowerCase() === variant.toLowerCase() || rec.toLowerCase().includes(variant.toLowerCase())
  );

  if (matchedVariant) {
    return {
      isMatch: true,
      score: 85,
      feedback: `Good effort! Your pronunciation of "${cleanVowel}" (${vowelDetail.name}) was recognized clearly.`,
      isVowel: true,
    };
  }

  // Check contrastive pair (e.g. user said "ಆ" instead of "ಅ")
  if (vowelDetail.contrastWith && rec.includes(vowelDetail.contrastWith)) {
    return {
      isMatch: false,
      score: 65,
      feedback: `Close! We heard the contrast vowel "${vowelDetail.contrastWith}". ${vowelDetail.contrastTip || ''} Try again holding the vowel appropriately.`,
      isVowel: true,
    };
  }

  // Fallback for general vowel attempt
  return {
    isMatch: false,
    score: 50,
    feedback: `We heard "${recognizedText}". ${vowelDetail.description} Try practicing with the example word "${vowelDetail.canonicalWord}" (${vowelDetail.canonicalTransliteration}).`,
    isVowel: true,
  };
}

/**
 * Demonstrative Words and Pedagogical Contrast Rules
 * Covers Proximate (ಇ - Closeness), Distant (ಅ - Distance), and Interrogative (ಎ - Query).
 */
export interface DemonstrativeWordDetail {
  kannada: string;
  transliteration: string;
  meaning: string;
  type: 'proximate' | 'distant' | 'interrogative';
  acceptedVariants: string[];
  contrastWith: {
    target: string;
    targetTranslit: string;
    rule: string;
  }[];
}

export const KANNADA_DEMONSTRATIVE_WORDS: Record<string, DemonstrativeWordDetail> = {
  'ಇಲ್ಲಿ': {
    kannada: 'ಇಲ್ಲಿ',
    transliteration: 'illi',
    meaning: 'Here (proximate location)',
    type: 'proximate',
    acceptedVariants: ['ಇಲ್ಲಿ', 'illi', 'ili', 'yilli'],
    contrastWith: [
      {
        target: 'ಅಲ್ಲಿ',
        targetTranslit: 'alli',
        rule: 'Remember: "ಇಲ್ಲಿ" (Illi) means HERE (near you), while "ಅಲ್ಲಿ" (Alli) means THERE (far from you). The prefix "ಇ-" signals proximity!',
      },
      {
        target: 'ಇಲ್ಲ',
        targetTranslit: 'illa',
        rule: 'You said "ಇಲ್ಲ" (Illa - No/None). The target is "ಇಲ್ಲಿ" (Illi - Here). End with the high "i" vowel!',
      },
    ],
  },
  'ಅಲ್ಲಿ': {
    kannada: 'ಅಲ್ಲಿ',
    transliteration: 'alli',
    meaning: 'There (distant location)',
    type: 'distant',
    acceptedVariants: ['ಅಲ್ಲಿ', 'alli', 'ali', 'yalli'],
    contrastWith: [
      {
        target: 'ಇಲ್ಲಿ',
        targetTranslit: 'illi',
        rule: 'Remember: "ಅಲ್ಲಿ" (Alli) means THERE (far from you), while "ಇಲ್ಲಿ" (Illi) means HERE (near you). The prefix "ಅ-" signals distance!',
      },
    ],
  },
  'ಎಲ್ಲಿ': {
    kannada: 'ಎಲ್ಲಿ',
    transliteration: 'elli',
    meaning: 'Where? (interrogative location)',
    type: 'interrogative',
    acceptedVariants: ['ಎಲ್ಲಿ', 'elli', 'eli'],
    contrastWith: [
      {
        target: 'ಇಲ್ಲಿ',
        targetTranslit: 'illi',
        rule: '"ಎಲ್ಲಿ" (Elli) is a question ("Where?"). The target is "ಇಲ್ಲಿ" (Illi - Here)!',
      },
    ],
  },
  'ಇದು': {
    kannada: 'ಇದು',
    transliteration: 'idu',
    meaning: 'This (proximate object)',
    type: 'proximate',
    acceptedVariants: ['ಇದು', 'idu', 'idhu'],
    contrastWith: [
      {
        target: 'ಅದು',
        targetTranslit: 'adu',
        rule: '"ಇದು" (Idu) means THIS (nearby), whereas "ಅದು" (Adu) means THAT (far away).',
      },
    ],
  },
  'ಅದು': {
    kannada: 'ಅದು',
    transliteration: 'adu',
    meaning: 'That (distant object)',
    type: 'distant',
    acceptedVariants: ['ಅದು', 'adu', 'adhu'],
    contrastWith: [
      {
        target: 'ಇದು',
        targetTranslit: 'idu',
        rule: '"ಅದು" (Adu) means THAT (distant), whereas "ಇದು" (Idu) means THIS (nearby).',
      },
    ],
  },
};

/**
 * Common Kannada Vocabulary Transliteration Index
 */
export const KANNADA_COMMON_VOCABULARY_MAP: Record<
  string,
  { kannada: string; transliteration: string; variants: string[] }
> = {
  'ಇಲ್ಲಿ': { kannada: 'ಇಲ್ಲಿ', transliteration: 'illi', variants: ['illi', 'ili', 'yilli'] },
  'ಅಲ್ಲಿ': { kannada: 'ಅಲ್ಲಿ', transliteration: 'alli', variants: ['alli', 'ali', 'yalli'] },
  'ಎಲ್ಲಿ': { kannada: 'ಎಲ್ಲಿ', transliteration: 'elli', variants: ['elli', 'eli'] },
  'ಇದು': { kannada: 'ಇದು', transliteration: 'idu', variants: ['idu', 'idhu'] },
  'ಅದು': { kannada: 'ಅದು', transliteration: 'adu', variants: ['adu', 'adhu'] },
  'ಏನು': { kannada: 'ಏನು', transliteration: 'enu', variants: ['enu', 'yenu'] },
  'ಹೌದು': { kannada: 'ಹೌದು', transliteration: 'houdu', variants: ['houdu', 'haudu', 'howdu'] },
  'ಇಲ್ಲ': { kannada: 'ಇಲ್ಲ', transliteration: 'illa', variants: ['illa', 'ila'] },
  'ನಮಸ್ಕಾರ': {
    kannada: 'ನಮಸ್ಕಾರ',
    transliteration: 'namaskara',
    variants: ['namaskara', 'namaskaram', 'namaskar'],
  },
  'ಧನ್ಯವಾದ': {
    kannada: 'ಧನ್ಯವಾದ',
    transliteration: 'dhanyavada',
    variants: ['dhanyavada', 'dhanyavadagalu', 'dhanyawada'],
  },
  'ಅಮ್ಮ': { kannada: 'ಅಮ್ಮ', transliteration: 'amma', variants: ['amma', 'ama'] },
  'ಅಪ್ಪ': { kannada: 'ಅಪ್ಪ', transliteration: 'appa', variants: ['appa', 'apa'] },
  'ನೀರು': { kannada: 'ನೀರು', transliteration: 'neeru', variants: ['neeru', 'niru'] },
  'ಊಟ': { kannada: 'ಊಟ', transliteration: 'oota', variants: ['oota', 'uta'] },
  'ಬನ್ನಿ': { kannada: 'ಬನ್ನಿ', transliteration: 'banni', variants: ['banni', 'bani'] },
  'ಹೋಗಿ': { kannada: 'ಹೋಗಿ', transliteration: 'hogi', variants: ['hogi', 'hoogi'] },
};

/**
 * Checks if spoken input matches or contrasts with demonstrative words (like 'ಇಲ್ಲಿ' / 'ಅಲ್ಲಿ')
 * or common transliterations.
 */
export function evaluateDemonstrativeOrVocabulary(
  recognizedText: string,
  expectedText: string,
  expectedTransliteration?: string
): {
  isHandled: boolean;
  isMatch: boolean;
  score: number;
  feedback: string;
} {
  const normRec = (recognizedText || '').trim().toLowerCase();
  const normExp = (expectedText || '').trim();

  // 1. Direct demonstrative match or contrast check
  const demo = KANNADA_DEMONSTRATIVE_WORDS[normExp];
  if (demo) {
    // Exact Kannada or accepted transliteration variant
    const isExact =
      normRec === demo.kannada ||
      normRec.includes(demo.kannada) ||
      demo.acceptedVariants.some((v) => normRec === v || normRec.includes(v));

    if (isExact) {
      return {
        isHandled: true,
        isMatch: true,
        score: 100,
        feedback: `ಅದ್ಭುತ! (Adbhutha!) Perfect pronunciation of "${demo.kannada}" (${demo.transliteration} - ${demo.meaning}).`,
      };
    }

    // Check contrastive demonstrative pairs (e.g. learner said 'ಅಲ್ಲಿ' for 'ಇಲ್ಲಿ')
    for (const contrast of demo.contrastWith) {
      if (
        normRec === contrast.target ||
        normRec.includes(contrast.target) ||
        normRec === contrast.targetTranslit ||
        normRec.includes(contrast.targetTranslit)
      ) {
        return {
          isHandled: true,
          isMatch: false,
          score: 70,
          feedback: `Good effort! You said "${contrast.target}" (${contrast.targetTranslit}). ${contrast.rule}`,
        };
      }
    }
  }

  // 2. Transliteration match via expectedTransliteration parameter
  if (expectedTransliteration && normRec.length > 0) {
    const cleanTranslit = expectedTransliteration.trim().toLowerCase();
    if (normRec === cleanTranslit || normRec.includes(cleanTranslit)) {
      return {
        isHandled: true,
        isMatch: true,
        score: 95,
        feedback: `Very good! We recognized "${normExp}" (${expectedTransliteration}) clearly.`,
      };
    }
  }

  // 3. Known common vocabulary transliteration map
  const vocab = KANNADA_COMMON_VOCABULARY_MAP[normExp];
  if (vocab) {
    const isTranslitMatch = vocab.variants.some((v) => normRec === v || normRec.includes(v));
    if (isTranslitMatch) {
      return {
        isHandled: true,
        isMatch: true,
        score: 95,
        feedback: `Very good! We recognized "${vocab.kannada}" (${vocab.transliteration}) clearly.`,
      };
    }
  }

  return { isHandled: false, isMatch: false, score: 0, feedback: '' };
}
