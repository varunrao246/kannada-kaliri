# KANNADA KALIRI — PRIVACY & DATA MAPPING
**Document Version:** 1.0.0  
**Target Platform:** ಕನ್ನಡ ಕಲಿರಿ — Kannada Kaliri  
**Compliance Context:** Digital Personal Data Protection (DPDP) Act, GDPR Principles, Privacy-by-Design  

---

## 1. PURPOSE AND SCOPE

This document maps all personal, educational, behavioral, conversational, and administrative data collected, processed, and stored across the Kannada Kaliri platform.

Kannada Kaliri collects only data strictly necessary to deliver personalized Kannada language instruction, track learner mastery, provide contextual AI tutoring, and maintain administrative oversight.

---

## 2. COMPREHENSIVE DATA INVENTORY

| Data Category | Specific Data Points | Storage Location (Table / Store) | Sensitivity | Purpose of Processing |
|---|---|---|---|---|
| **Identity & Authentication** | Email address, Supabase Auth UID, OAuth Provider Tokens (Google) | `auth.users` (Supabase Auth) | **Confidential** | Account creation, authentication, session management. |
| **Learner Profile** | Full Name, Native Language (`ta`, `te`, `hi`, `en`), Kannada Proficiency (`beginner`, `elementary`, `intermediate`), Learning Goal, Daily Goal (minutes), Script Preference (`kannada`, `kannada_english`, `english_only`), Onboarding Status | `public.learner_profiles` | **Personal** | Customizing instruction, explanations in native language, script scaffolding. |
| **Curriculum Progress** | Completed Lessons, Exercise Attempts, Answers, Accuracy Scores, Mistakes, Time Spent, Module Completion Status | `public.learning_progress`, `public.vocabulary_progress` | **Educational** | Tracking learning trajectory, adaptive difficulty adjustment, spaced repetition. |
| **Assessment & Exams** | Quiz Attempts, Diagnostic Scores, Error Categorization, Timestamps, Passed Flag | `public.assessment_sessions`, `public.assessment_answers` | **Educational** | Evaluating Kannada competency, unlocking subsequent curriculum tiers. |
| **AI Guru Conversations** | Chat session IDs, Learner queries, AI Guru pedagogical responses, Grammar corrections, Vocabulary hints, Feedback timestamps | `public.guru_conversations`, `public.guru_messages` | **Private Interaction** | Persistent multi-turn dialogue tutoring, context continuity across sessions. |
| **Real-World Scenarios** | Scenario IDs (Market, Bus, Doctor, etc.), User speech inputs, Character responses, Turn evaluations, Scenario completion rating | `public.scenario_attempts` | **Private Interaction** | Real-world conversational simulation, speaking assessment and feedback. |
| **Voice & Speech Media** | Spoken audio snippets (ephemeral), Transcripts, Pronunciation match confidence | Ephemeral memory buffer (not persisted to disk) | **Biometric / Voice** | Pronunciation verification via Gnani AI Prisma STT. Audio is streamed and deleted after recognition. |
| **Gamification & Engagement** | Total XP, Current Streak, Longest Streak, Streak Freezes, Unlocked Badges, Weekly Challenge status, Leaderboard rank | `public.daily_activity`, `public.learner_achievements`, `public.weekly_challenges`, `public.challenge_participants` | **Behavioral** | Motivation, habit formation, peer ranking. |
| **Administrative & Audit** | Admin user UUID, Role (`admin`, `super_admin`, `curriculum_editor`, `support`), Action Type, Resource Affected, IP / User Agent, Timestamp | `public.admin_users`, `public.admin_audit_logs` | **Administrative** | Governance, regulatory compliance, anomaly detection, operational telemetry. |

---

## 3. ACCESS CONTROL ARCHITECTURE

| Data Store | Access Controls (RLS / Server / Client) | Permitted Actors |
|---|---|---|
| `auth.users` | Supabase Auth internal schema. Not directly queryable by clients. | Supabase Auth, Service Role. |
| `learner_profiles` | RLS: `auth.uid() = user_id`. Server Component verified. | Authenticated Owner, Verified Admins (read-only for support). |
| `learning_progress` & `vocabulary_progress` | RLS: `auth.uid() = user_id` for SELECT, INSERT, UPDATE. | Authenticated Owner, Verified Admins. |
| `assessment_*` | RLS: `auth.uid() = user_id`. | Authenticated Owner, Verified Admins. |
| `guru_*` | RLS: `auth.uid() = user_id`. Chat messages isolated to conversation owner. | Authenticated Owner only. |
| `scenario_attempts` | RLS: `auth.uid() = user_id`. | Authenticated Owner only. |
| `daily_activity` & `learner_achievements` | RLS: `auth.uid() = user_id`. Gamification service verifies claims server-side. | Authenticated Owner, Leaderboard Aggregator (pseudonymized). |
| `admin_users` & `admin_audit_logs` | RLS: Strictly restricted to active admin UUIDs. | Active Admins (`is_active = true`). |

---

## 4. DATA RETENTION & LIFECYCLE POLICIES

1. **Active Learner Accounts:**
   - Profile, curriculum progress, achievements, and conversation history are retained for the lifetime of the active account to support continuous learning.
2. **Ephemeral Voice Audio:**
   - Audio files submitted to `/api/speech/transcribe` are held strictly in memory during processing and discarded immediately after transcription. No voice recordings are stored permanently in the database or file storage.
3. **Session Cookies & Tokens:**
   - Auth tokens are managed securely in HTTP-only, secure, `SameSite=Lax` cookies with configurable expiration.
4. **Administrative Audit Logs:**
   - Admin audit trails are retained for 365 days for compliance, after which they may be archived or purged by database cron jobs.

---

## 5. LEARNER DATA DELETION & RIGHT-TO-BE-FORGOTTEN (CASCADE SPECIFICATION)

When a learner exercises their right to account deletion:
- Deleting the user from `auth.users` triggers foreign key cascades across all relational tables:
  ```sql
  -- Foreign key cascading behaviour:
  learner_profiles: ON DELETE CASCADE
  learning_progress: ON DELETE CASCADE
  vocabulary_progress: ON DELETE CASCADE
  assessment_sessions: ON DELETE CASCADE
  assessment_answers: ON DELETE CASCADE
  guru_conversations: ON DELETE CASCADE
  guru_messages: ON DELETE CASCADE
  scenario_attempts: ON DELETE CASCADE
  daily_activity: ON DELETE CASCADE
  learner_achievements: ON DELETE CASCADE
  challenge_participants: ON DELETE CASCADE
  ```
- All personal identifiers, progress metrics, quiz results, chat transcripts, and scenario recordings are permanently and atomically removed.
- Public aggregate statistics (e.g. total completed lessons platform-wide) retain no learner identifiers or linkage.

---

## 6. DATA TRANSMISSION & THIRD-PARTY PROCESSORS

| Third Party Processor | Purpose | Data Transmitted | Privacy Safeguards |
|---|---|---|---|
| **Supabase (PostgreSQL / Auth)** | Database & Authentication | Encrypted credentials, profiles, progress, history. | SOC 2 Type II certified, encrypted in transit (TLS 1.3) and at rest (AES-256). |
| **Gnani AI (Prisma & Timbre)** | Speech Recognition (STT) & Speech Synthesis (TTS) | Audio chunks for STT; Kannada text phrases for TTS. | Server-to-server TLS calls. Credentials held exclusively server-side. No user PII transmitted. |
| **Google Gemini AI** | AI Kannada Guru & Scenario Conversations | Anonymized learner query, native language code, proficiency level. | Server-to-server TLS calls. No email or user UUID transmitted to LLM API. |

---

## 7. ANONYMIZATION & PSEUDONYMIZATION

- Leaderboards display public profiles using the learner's chosen display name or initials.
- System analytics aggregates data (e.g., average completion rate per lesson) without user identifiers.
- API logs mask IP addresses and sanitize all query parameters containing potential PII.

