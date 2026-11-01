# KANNADA KALIRI — MANUAL ACCEPTANCE TEST PLAN
## Production Release Gate: Step-by-Step Browser Acceptance Verification

**Product:** ಕನ್ನಡ ಕಲಿರಿ — Kannada Kaliri  
**Tagline:** Learn Kannada. Connect with Karnataka.  
**Audience:** Platform QA Engineers, Product Owners, and Native Kannada Reviewers  
**Date:** 2026-10-31  

---

## 1. PRE-TEST CHECKLIST

Before beginning manual testing in your browser:
1. Ensure `.env.local` contains valid server-side credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GNANI_API_KEY` (Used for both Gnani Prisma STT and Gnani Timbre TTS)
   - `AI_API_KEY` or `GEMINI_API_KEY` (Used for Google Gemini AI Guru & Scenarios)
2. Start the application locally:
   ```bash
   npm run build && npm run start -p 3000
   ```
3. Open your browser at `http://localhost:3000`.

---

## 2. STEP-BY-STEP USER VERIFICATION SCENARIOS

### Scenario 1: New Learner Registration & Multilingual Onboarding
- **Route:** `http://localhost:3000/signup`
- **Steps:**
  1. Register a new user with email and password or sign in with Google OAuth.
  2. Verify automatic redirection to `/onboarding`.
  3. Select your native explanation language (English, Hindi, Tamil, Telugu, or Malayalam).
  4. Select current Kannada proficiency (e.g., Beginner A1).
  5. Select learning goals and daily commitment (e.g., 15 minutes).
  6. Click **"Complete Onboarding"**.
- **Expected Outcome:** User is saved to `learner_profiles` table and redirected seamlessly to `/dashboard`.

---

### Scenario 2: Dashboard Navigation & Progress Tracking
- **Route:** `http://localhost:3000/dashboard`
- **Steps:**
  1. Observe the personalized greeting in your chosen native language.
  2. Verify Daily Goal Progress Widget, Streak Flame, and Adaptive Recommendation card.
  3. Verify that Next Lesson button points to `a1-m01-l01` (Kannada Vowels).
- **Expected Outcome:** Dashboard loads with zero layout shift and displays accurate learner statistics.

---

### Scenario 3: Lesson Study, Dual-Speed Audio & Vowel Practice
- **Route:** `http://localhost:3000/learn/a1-m01-l01`
- **Steps:**
  1. Scroll to the Vocabulary section with cards for `ಅ` (a), `ಆ` (aa), and `ಅಮ್ಮ` (Amma).
  2. Click **"Normal (1.0x)"** on `ಅಮ್ಮ`: listen to the crystal-clear Kaveri voice synthesis.
  3. Click **"Slow (0.75x)"** on `ಅಮ್ಮ`: observe pitch-preserved, slowed pronunciation ideal for learners.
  4. Click another word rapidly: verify that the previous audio immediately halts (exclusivity).
  5. Scroll to the **Voice & Speaking Practice** section.
  6. Tap the `[ಅಮ್ಮ (Amma)]` chip to select it for practice.
  7. Click the **Record** microphone button, grant browser permission, speak `"ಅಮ್ಮ"`, and click Stop.
- **Expected Outcome:**
  - Recognition returns `"ಅಮ್ಮ"` in ~0.2s.
  - Speech evaluation confirms a 100% match with encouraging Kannada praise (*"ಅದ್ಭುತ! (Adbhutha!)"*).
  - Microphone indicator in browser tab turns off immediately.
- **Note:** *[HUMAN LINGUISTIC REVIEW RECOMMENDED]* to verify authentic regional accent nuances.

---

### Scenario 4: Interactive Exercise Session
- **Route:** `http://localhost:3000/learn/a1-m01-l01` -> Click **"Practise (4 Exercises)"**
- **Steps:**
  1. Multiple Choice: Select the correct meaning for `"ಅಮ್ಮ"` (Mother).
  2. Word Matching: Connect Kannada words with native language equivalents.
  3. Sentence Construction: Arrange scrambled words into Subject-Object-Verb (SOV) order.
  4. Complete all exercises and submit.
- **Expected Outcome:** Exercises validate accurately, display immediate feedback, calculate XP, and update mastery.

---

### Scenario 5: AI Kannada Guru Tutoring Chat
- **Route:** `http://localhost:3000/guru`
- **Steps:**
  1. Type in English: `"How do I ask an auto driver 'Meter haaki' politely?"` -> Press Enter.
  2. Verify Gemini returns a structured pedagogical response with Kannada script, transliteration, and cultural etiquette.
  3. Click the 🔊 button on the Guru response to listen to the generated Kannada audio.
  4. Click the microphone button in Guru chat, speak `"ನಮಸ್ಕಾರ, ಹೇಗಿದ್ದೀರಾ?"`, and observe the transcript populate the input field.
  5. Send the message: observe Guru maintain multi-turn pedagogical conversation.
- **Expected Outcome:** Guru responds warmly within 1.5–2.5 seconds with zero secret key leakage.

---

### Scenario 6: Local Shop Roleplay Simulator (High Priority)
- **Route:** `http://localhost:3000/scenarios/local-shop`
- **Steps:**
  1. Observe the scenario briefing: Shopping at Malleshwaram Kirani store with shopkeeper Manjunath.
  2. Turn 1: Click suggested reply `"ಒಂದು ಪ್ಯಾಕೆಟ್ ನಂದಿನಿ ಹಾಲು ಕೊಡಿ"` (One packet Nandini milk please).
  3. Turn 2: Manjunath confirms milk; type `"ಅರ್ಧ ಕೆಜಿ ಸಕ್ಕರೆ ಇದೆಯಾ? ಎಷ್ಟು ಆಯ್ತು?"` (Is half kg sugar there? How much total?).
  4. Turn 3: Manjunath quotes ₹110; type `"ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ ಅಣ್ಣಾ, ಗೂಗಲ್ ಪೇ ಮಾಡ್ತೀನಿ"` (Please reduce price a bit, I'll Google Pay).
  5. Turn 4: Manjunath agrees; type `"ಹಣ ಕಳಿಸಿದ್ದೇನೆ. ಧನ್ಯವಾದಗಳು, ಬರ್ತೀನಿ!"` (Money sent. Thank you, bye!).
  6. Observe transaction conclusion: click **"Complete Scenario"**.
- **Expected Outcome:**
  - Manjunath remains 100% in character throughout.
  - Final evaluation report displays confidence score, strengths, and cultural insights.

---

### Scenario 7: Executive Admin Dashboard & Analytics
- **Route:** `http://localhost:3000/admin`
- **Steps:**
  1. Access `/admin` with standard learner account: verify immediate rejection with redirection to `/admin/unauthorized`.
  2. Access `/admin` with configured administrator credentials: verify full dashboard renders with KPIs, retention charts, service health, and learner rosters.
- **Expected Outcome:** Server-side RBAC strictly isolates administrative functions from normal learners.

---

## 3. CHECKLIST SIGN-OFF MATRIX

| Scenario | Tested By | Date | Automated Status | Human Linguistic Status | Sign-off |
|:---|:---:|:---:|:---:|:---:|:---:|
| 1. Onboarding & Profile | Engineer | 2026-10-31 | 🟢 PASSED | N/A | [ ] |
| 2. Dashboard Navigation | Engineer | 2026-10-31 | 🟢 PASSED | N/A | [ ] |
| 3. Vowels & Audio Playback | Engineer | 2026-10-31 | 🟢 PASSED | 🟡 *HUMAN REVIEW RECOMMENDED* | [ ] |
| 4. Exercise Engine | Engineer | 2026-10-31 | 🟢 PASSED | N/A | [ ] |
| 5. AI Kannada Guru | Engineer | 2026-10-31 | 🟢 PASSED | 🟡 *HUMAN REVIEW RECOMMENDED* | [ ] |
| 6. Local Shop Roleplay | Engineer | 2026-10-31 | 🟢 PASSED | 🟡 *HUMAN REVIEW RECOMMENDED* | [ ] |
| 7. Admin Console RBAC | Engineer | 2026-10-31 | 🟢 PASSED | N/A | [ ] |

