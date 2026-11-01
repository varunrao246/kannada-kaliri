# KANNADA KALIRI — SECURITY & PRIVACY QA REPORT

**Product:** ಕನ್ನಡ ಕಲಿರಿ — Kannada Kaliri  
**Tagline:** Learn Kannada. Connect with Karnataka.  
**Audited Controls:** Milestone 11 Security Hardening, Multi-Tenant Isolation, RLS Policies, Secret Protection  
**Date:** 2026-10-31  

---

## 1. THREE-IDENTITY ISOLATION AUDIT

The platform was audited across three isolated identities:
1. **Learner A (`user_a_123`):** Standard non-admin learner.
2. **Learner B (`user_b_456`):** Independent standard learner.
3. **Admin C (`admin_root`):** Platform administrator.

### Multi-Tenant Isolation Test Matrix:
| Target Area | Test Scenario | Expected Outcome | Actual Outcome | Status |
|:---|:---|:---|:---|:---:|
| `learner_profiles` | Learner A queries Learner B's profile directly | RLS Blocks Query (HTTP 403 / Code 42501) | RLS error returned, 0 data leaked | **VERIFIED** |
| `guru_conversations` | Learner A queries Learner B's Guru chat history | RLS Blocks Query | Only Learner A's conversations returned | **VERIFIED** |
| `exercise_attempts` | Learner A sends payload with `userId: "user_b_456"` | Server discards body UID, binds session UID | Bound strictly to session UID `user_a_123` | **VERIFIED** |
| `scenario_attempts` | Learner A requests completion for Learner B | Unauthorized / RLS rejection | Rejected cleanly | **VERIFIED** |
| `/admin/*` | Learner A attempts navigation to `/admin` | Redirected to `/admin/unauthorized` | Redirected to `/admin/unauthorized` | **VERIFIED** |
| `/api/admin/*` | Learner A makes direct fetch to `/api/admin/overview` | HTTP 401 / 403 Forbidden | Rejected with 401/403 Forbidden | **VERIFIED** |
| Admin Access | Admin C accesses `/admin` | Recognized via server `app_metadata.role` | Authorized cleanly as Admin | **VERIFIED** |

---

## 2. API CREDENTIAL & SECRET LEAKAGE VERIFICATION

- **`AI_API_KEY` & `GEMINI_API_KEY`:**
  - Audited client bundles: 0 occurrences found.
  - Audited browser network payloads: 0 occurrences found.
  - Audited error responses on invalid keys: Throws `AI_INVALID_CREDENTIALS` (HTTP 401) with clean message without echoing the key.
- **`GNANI_API_KEY`:**
  - Speech synthesis and transcription are strictly server-side proxies (`/api/speech/synthesize` and `/api/speech/transcribe`).
  - No secret tokens or authorization headers are exposed to browser clients.
- **Supabase Service Role Key:**
  - Not bundled in client code. Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public.

---

## 3. HTTP SECURITY HEADERS & DEFENSES

Configured in `next.config.ts` and verified on responses:
- `X-Frame-Options: DENY` (Clickjacking defense)
- `X-Content-Type-Options: nosniff` (MIME sniffing defense)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS)
- `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
- `Content-Security-Policy: default-src 'self' ...`

---

## 4. AUDIO & CONVERSATION EPHEMERALITY

- Voice audio recordings sent to `/api/speech/transcribe` remain in memory only during transcription and are immediately released.
- Zero audio files or voice waveforms are written to unauthenticated public storage buckets.
- Microphones are automatically released via `stream.getTracks().forEach(t => t.stop())`.

