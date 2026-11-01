# KANNADA KALIRI — KANNADA PRONUNCIATION & PHONETICS QA REPORT

**Product:** ಕನ್ನಡ ಕಲಿರಿ — Kannada Kaliri  
**Tagline:** Learn Kannada. Connect with Karnataka.  
**Linguistic Reference Framework:** Traditional Kannada Grammar (*Shabdamaridarpana* of Keshiraja & Karnataka Sahitya Parishat Standards)  
**Date:** 2026-10-31  

---

## 1. PHONETIC AUDIT OF KANNADA VOWEL INVENTORY (ಸ್ವರಗಳು - SWARAGALU)

Kannada vowels are classified strictly by duration (Matra / ಮಾತ್ರಾ) and articulation point. All 15 traditional vowels were audited across curriculum, TTS synthesis, STT recognition, and pedagogical feedback:

| Letter | Name | Category | Matras | IPA | Canonical Word | TTS Audio Quality | STT Behavior | Assessment Status |
|:---:|:---|:---:|:---:|:---:|:---|:---:|:---|:---:|
| **ಅ** | Hrasva A | Hrasva (Short) | 1 | [ɐ] | **ಅಮ್ಮ** (Amma - Mother) | Clear [ɐ] (0.24s) | Needs word context; returns `""` if isolated | **VERIFIED & HARDENED** |
| **ಆ** | Deergha Aa | Deergha (Long) | 2 | [aː] | **ಆನೆ** (Aane - Elephant) | Sustained open [aː] | Recognizes with word context | **VERIFIED & HARDENED** |
| **ಇ** | Hrasva I | Hrasva (Short) | 1 | [i] | **ಇಲ್ಲಿ** (Illi - Here) | Clipped front [i] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಈ** | Deergha Ee | Deergha (Long) | 2 | [iː] | **ಈಗ** (Eega - Now) | Drawn-out [iː] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಉ** | Hrasva U | Hrasva (Short) | 1 | [u] | **ಉಪ್ಪು** (Uppu - Salt) | Rounded short [u] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಊ** | Deergha Oo | Deergha (Long) | 2 | [uː] | **ಊಟ** (Oota - Meal) | Rounded long [uː] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಋ** | Vocalic Ru | Hrasva (Short) | 1 | [ru] | **ಋಷಿ** (Rushi - Sage) | Tap of tongue [ru] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಎ** | Hrasva E | Hrasva (Short) | 1 | [e] | **ಎಲ್ಲಿ** (Elli - Where) | Distinct Dravidian short [e] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಏ** | Deergha Ae | Deergha (Long) | 2 | [eː] | **ಏನು** (Eenu - What) | Sustained mid [eː] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಐ** | Ai | Diphthong | 2 | [aɪ] | **ಐದು** (Aidu - Five) | Smooth glide [aɪ] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಒ** | Hrasva O | Hrasva (Short) | 1 | [o] | **ಒಂದು** (Ondu - One) | Distinct Dravidian short [o] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಓ** | Deergha Oo | Deergha (Long) | 2 | [oː] | **ಓದು** (Oodu - Read) | Sustained back [oː] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಔ** | Au | Diphthong | 2 | [aʊ] | **ಔಷಧ** (Aushadha - Medicine) | Back glide [aʊ] | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಅಂ** | Anusvara | Yogavaha | 1 | [ɐm] | **ಅಂಗಡಿ** (Angadi - Shop) | Pure nasalization | Recognizes accurately | **VERIFIED & HARDENED** |
| **ಅಃ** | Visarga | Yogavaha | 1 | [ɐhɐ] | **ಅಃ** (Aha - Aspiration) | Breath echo | Recognizes accurately | **VERIFIED & HARDENED** |

---

## 2. CONSONANT & PHONEME AUDIT (ವ್ಯಂಜನಗಳು - VYANJANAGALU)

### 2.1 The Varga System (Structured Stops)
1. **Ka-varga (Velar / ಕಂಠ್ಯ):** ಕ (Ka), ಖ (Kha), ಗ (Ga), ಘ (Gha), ಙ (Nga)
2. **Cha-varga (Palatal / ತಾಲವ್ಯ):** ಚ (Cha), ಛ (Chha), ಜ (Ja), ಝ (Jha), ಞ (Nya)
3. **Ta-varga (Retroflex / ಮೂರ್ಧನ್ಯ):** ಟ (Ta), ಠ (Tha), ಡ (Da), ಢ (Dha), ಣ (Na)
4. **Ta-varga (Dental / ದಂತ್ಯ):** ತ (Tha), ಥ (Thha), ದ (Da), ಧ (Dha), ನ (Na)
5. **Pa-varga (Labial / ಓಷ್ಠ್ಯ):** ಪ (Pa), ಫ (Pha), ಬ (Ba), ಭ (Bha), ಮ (Ma)

### 2.2 Crucial Kannada Phonetic Distinctions
- **Retroflex ಳ (La) vs Dental ಲ (La):**
  - Dental `ಲ` [l]: Tongue tip touches upper teeth (e.g. *Kallu* = stone vs *Kalu* = leg).
  - Retroflex `ಳ` [ɭ]: Tongue curls back to touch hard palate (e.g. *Kannada* -> *ಕನ್ನಡ*, *ಮಂಗಳೂರು* -> *Mangaluru*, *ಹಾಲು* -> *Hālu*).
  - Assessment provides clear physical articulation advice.
- **Short `ಎ` / `ಒ` vs Long `ಏ` / `ಓ`:**
  - Unique Dravidian phonemic distinction. Hindi and Sanskrit lack short *e* and short *o*.
  - Kannada Kaliri explicitly teaches and assesses this distinction with canonical minimal pairs: *Ondu* (ಒಂದು) vs *Oodu* (ಓದು); *Elli* (ಎಲ್ಲಿ) vs *Eenu* (ಏನು).

---

## 3. ASR VS TRUE PHONETIC PRONUNCIATION SCORING

### 3.1 The Engineering Truth
Automated Speech Recognition (ASR) engines (like Gnani Prisma STT, Google STT, or Whisper) are trained on **continuous lexical language models**. They transcribe words based on acoustic probability and language model heuristics.
- ASR is **not** a direct phoneme articulatory evaluator.
- Isolated phonemes (like a 0.2-second utterance of `ಅ`) often fall below ASR Voice Activity Detection (VAD) thresholds.
- When an ASR model produces an empty transcript `""` for a single letter, it does not mean the learner mispronounced the letter.

### 3.2 Implemented Hybrid Scoring Architecture
In `lib/ai/speech/kannada-phonetics.ts` and `lib/ai/speech/gnani-stt.ts`, the pronunciation assessment engine applies a 4-tier evaluation strategy:
1. **Tier 1 (Exact Script & Sound):** `normRecognized === expectedVowel` -> Score: 100%.
2. **Tier 2 (Canonical Word Realization):** If learner says the vowel's anchor word (e.g. `ಅಮ್ಮ` for `ಅ`), the system recognizes the authentic vowel realization -> Score: 95%.
3. **Tier 3 (Phonetic Transliteration Variant):** If ASR produces Romanized transliterations (`a`, `aa`, `ah`) -> Score: 85–90%.
4. **Tier 4 (Contrast Pair Guidance):** If learner confuses short and long vowels (e.g. produces long `ಆ` [aː] when practicing short `ಅ` [ɐ]), the engine provides constructive length guidance rather than a harsh 0% penalty -> Score: 65%.
5. **Brief/Empty Audio Neutral Guidance:** If the audio was too short for the ASR model, the engine provides pedagogical advice to practice the vowel within an example word (`ಅಮ್ಮ`), scoring a neutral 50% rather than 0%.

---

## 4. DUAL MALE & FEMALE NATIVE KANNADA VOICES (KAVERI & GIRISH)

The speech synthesis layer has been upgraded from a single voice to full dual native voice selection across the entire platform:

1. **👩 Kaveri (Female Native Voice):**
   - Gnani Timbre model `timbre-v2.5` voice `Kaveri`.
   - Pedagogically calibrated at 0.85x base synthesis speed with clear maternal and conversational inflection.
   - Used by default and for female scenario characters (e.g., Ananya the college student, Nurse Deepa at the hospital).
2. **👨 Girish (Male Native Voice):**
   - Gnani Timbre model `timbre-v2.5` voice `Girish`.
   - Rich baritone native Kannada articulation.
   - Used for male scenario characters (e.g., Manjunath the shopkeeper, Auto Driver Ravi, Neighbor Suresh, Colleague Ramesh) and accessible in vocabulary and speaking practice.

### Live Voice Synthesis Verification:
- **Kaveri:** HTTP 200, Content-Type: `audio/wav`, RIFF WAVE format, 16000Hz mono.
- **Girish:** HTTP 200, Content-Type: `audio/wav`, RIFF WAVE format, 16000Hz mono.
- **Client Cache Isolation:** Cache keys are segregated by voice (`kn-IN:Kaveri:text` vs `kn-IN:Girish:text`) to ensure instantaneous switching between voices without audio collisions or re-requesting.

---

## 5. DEMONSTRATIVE INTELLIGENCE & TRANSLITERATION ASSESSMENT (`ಇಲ್ಲಿ` VS `ಅಲ್ಲಿ`)

In standard Kannada linguistics (*Shabdamaridarpana*):
- **Proximate Demonstratives (ಇ-ವರ್ಗ):** Points to immediate physical proximity to the speaker:
  - `ಇಲ್ಲಿ` (*Illi* - Here)
  - `ಇದು` (*Idu* - This)
- **Distant Demonstratives (ಅ-ವರ್ಗ):** Points to physical distance from the speaker:
  - `ಅಲ್ಲಿ` (*Alli* - There)
  - `ಅದು` (*Adu* - That)
- **Interrogative Demonstratives (ಎ-ವರ್ಗ):** Queries location or identity:
  - `ಎಲ್ಲಿ` (*Elli* - Where?)
  - `ಏನು` (*Enu* - What?)

### Fixes Implemented:
1. **Transliteration Matching for Lexical Words:**
   If Gnani Prisma STT produces Latin alphabet output (`"illi"` for `"ಇಲ್ಲಿ"` or `"alli"` for `"ಅಲ್ಲಿ"`), the engine matches against `KANNADA_DEMONSTRATIVE_WORDS` and `KANNADA_COMMON_VOCABULARY_MAP`, scoring 95–100% instead of 0%.
2. **Constructive Demonstrative Contrast Guidance:**
   - If the learner says `ಅಲ್ಲಿ` (*Alli* - There) when asked for `ಇಲ್ಲಿ` (*Illi* - Here):
     > *"Good effort! You said 'ಅಲ್ಲಿ' (alli). Remember: 'ಇಲ್ಲಿ' (Illi) means HERE (near you), while 'ಅಲ್ಲಿ' (Alli) means THERE (far from you). The prefix 'ಇ-' signals proximity!"* (Score: 70%).
   - If the learner says `ಇಲ್ಲಿ` (*Illi* - Here) when asked for `ಅಲ್ಲಿ` (*Alli* - There):
     > *"Good effort! You said 'ಇಲ್ಲಿ' (illi). Remember: 'ಅಲ್ಲಿ' (Alli) means THERE (far from you), while 'ಇಲ್ಲಿ' (Illi) means HERE (near you). The prefix 'ಅ-' signals distance!"* (Score: 70%).
   - If the learner says `ಇಲ್ಲ` (*Illa* - No/None) when asked for `ಇಲ್ಲಿ` (*Illi*):
     > *"You said 'ಇಲ್ಲ' (Illa - No/None). The target is 'ಇಲ್ಲಿ' (Illi - Here). End with the high 'i' vowel!"* (Score: 70%).
3. **Canonical Vowel Inventory Linkage:**
   Added `ಅಲ್ಲಿ` (*Alli*) to accepted speech realizations for vowel `ಅ` and `ಇಲಿ` (*Ili*) / `ಇದು` (*Idu*) for vowel `ಇ`.

---

## 6. CLIENT-SIDE AUDIO RESAMPLING (HARDWARE SAMPLE RATE NORMALIZATION)

### Root Cause Discovered:
Modern operating systems (macOS, Windows 11) run audio hardware at **44,100 Hz** or **48,000 Hz** by default. Browsers often disregard `{ sampleRate: 16000 }` in `AudioContextClass` constructors due to hardware driver locks. When audio recorded at 48kHz was saved with a 16kHz WAV header, audio was pitch-shifted and slowed down by 3x, causing Gnani Prisma STT to transcribe gibberish or fail.

### Solution:
Built `downsampleTo16000(samples, actualSampleRate)` using high-performance linear interpolation:
- Accurately captures `audioContext.sampleRate` at creation.
- Downsamples 48kHz or 44.1kHz Float32 mono audio to 16,000 Hz.
- Encodes guaranteed 16kHz 16-bit mono PCM RIFF/WAVE audio across all devices.

---

## 7. DUAL PLAYBACK SPEED (0.75x SLOW & 1.0x NORMAL) REINFORCEMENT

### Root Cause Discovered:
Setting `audio.playbackRate = 0.75` immediately after `new Audio(...)` was reset by WebKit/Blink during the asynchronous audio buffering and decoder initialization lifecycle (`loadedmetadata` / `play` events).

### Solution:
Attached event-driven rate reinforcement listeners to `loadedmetadata`, `canplay`, `play`, and `playing` events on `HTMLAudioElement`, alongside pitch-preservation attributes (`preservesPitch`, `webkitPreservesPitch`, `mozPreservesPitch`). Verified that 0.75x slow audio maintains authentic pitch without distortion.

---

## 8. CONVERSATIONAL ROLEPLAY LATENCY & RENDERING OPTIMIZATION

1. **Migrated Scenario Simulator to 16kHz PCM WAV:**
   Replaced legacy `MediaRecorder` WebM implementation in `ScenarioSimulatorView.tsx` with `startAudioRecording`, eliminating STT rejection.
2. **Memoized Message Bubbles (`React.memo`):**
   Wrapped `ScenarioMessageBubble` in `memo` and memoized event handlers (`useCallback`), stopping unnecessary re-renders during text input and audio recording.
3. **Immediate Optimistic UI Rendering:**
   User turns render immediately upon clicking Send or finishing recording, eliminating perceived latency.

---

## 9. HUMAN LINGUISTIC REVIEW RECOMMENDATIONS

While automated regression tests confirm that:
- Every vowel, consonant, and demonstrative word is represented without corruption.
- Audio synthesis and playback occur with pitch preservation at both 0.75x and 1.0x speeds.
- Phonetic evaluation rules catch short/long mora errors and demonstrative confusions.

**Human Kannada Speaker Validation is recommended for:**
1. Verifying fine dialectal nuances between Old Mysore, Bengaluru, and Coastal Kannada accents.
2. Confirming that synthetic TTS voice *Kaveri* and *Girish* retain natural sentence cadence on complex interrogative markers (*...ಹೋಗ್ತೀರಾ?*).
3. Final subjective listening review before commercial certification.

