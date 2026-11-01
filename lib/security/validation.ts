/**
 * Input & Output Security Validation Library
 * Kannada Kaliri — Milestone 11 Security Hardening
 *
 * Provides strict boundary validation and prompt injection defenses:
 * - Media size & MIME whitelist verification
 * - Text length bounds
 * - Prompt injection neutralization
 * - Safe JSON parsing and sanitized error responses
 */

export const LIMITS = {
  // Speech STT
  MAX_AUDIO_BYTES: 10 * 1024 * 1024, // 10 Megabytes
  ALLOWED_AUDIO_MIMES: [
    'audio/webm',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/x-m4a',
    'audio/m4a',
    'audio/aac',
    'audio/mp4',
  ],

  // Speech TTS
  MAX_TTS_TEXT_LENGTH: 500, // 500 characters max per TTS synthesis

  // AI Conversational input
  MAX_GURU_PROMPT_LENGTH: 1000, // 1000 characters max per Guru message
  MAX_SCENARIO_INPUT_LENGTH: 1000, // 1000 characters max per Scenario turn
} as const;

export interface ValidationResult<T = void> {
  isValid: boolean;
  error?: string;
  data?: T;
}

/**
 * Validates audio file size and MIME format for Speech-to-Text.
 */
export function validateAudioUpload(
  sizeInBytes: number,
  mimeType: string | null | undefined
): ValidationResult {
  if (sizeInBytes <= 0) {
    return { isValid: false, error: 'Audio payload is empty.' };
  }

  if (sizeInBytes > LIMITS.MAX_AUDIO_BYTES) {
    return {
      isValid: false,
      error: `Audio payload exceeds maximum permitted size of ${LIMITS.MAX_AUDIO_BYTES / (1024 * 1024)}MB.`,
    };
  }

  if (!mimeType) {
    return { isValid: false, error: 'Audio MIME type is required.' };
  }

  const normalizedMime = mimeType.split(';')[0].trim().toLowerCase();
  const isAllowed = (LIMITS.ALLOWED_AUDIO_MIMES as readonly string[]).includes(normalizedMime);

  if (!isAllowed) {
    return {
      isValid: false,
      error: `Unsupported audio format: "${mimeType}". Allowed formats: webm, wav, mp3, ogg, m4a, aac.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates text string for Text-to-Speech synthesis.
 */
export function validateTTSText(text: unknown): ValidationResult<string> {
  if (typeof text !== 'string') {
    return { isValid: false, error: 'Text must be a valid string.' };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Text cannot be empty.' };
  }

  if (trimmed.length > LIMITS.MAX_TTS_TEXT_LENGTH) {
    return {
      isValid: false,
      error: `Text exceeds maximum allowed length of ${LIMITS.MAX_TTS_TEXT_LENGTH} characters.`,
    };
  }

  return { isValid: true, data: trimmed };
}

/**
 * Validates and sanitizes learner message for AI Kannada Guru.
 */
export function validateGuruPrompt(prompt: unknown): ValidationResult<string> {
  if (typeof prompt !== 'string') {
    return { isValid: false, error: 'Message must be a string.' };
  }

  const trimmed = prompt.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Message cannot be empty.' };
  }

  if (trimmed.length > LIMITS.MAX_GURU_PROMPT_LENGTH) {
    return {
      isValid: false,
      error: `Message exceeds maximum allowed length of ${LIMITS.MAX_GURU_PROMPT_LENGTH} characters.`,
    };
  }

  return { isValid: true, data: sanitizePromptInput(trimmed) };
}

/**
 * Validates and sanitizes learner speech input for Scenario Simulator.
 */
export function validateScenarioInput(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Speech input must be a string.' };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Speech input cannot be empty.' };
  }

  if (trimmed.length > LIMITS.MAX_SCENARIO_INPUT_LENGTH) {
    return {
      isValid: false,
      error: `Speech input exceeds maximum allowed length of ${LIMITS.MAX_SCENARIO_INPUT_LENGTH} characters.`,
    };
  }

  return { isValid: true, data: sanitizePromptInput(trimmed) };
}

/**
 * Neutralizes potential prompt injection markers and control delimiters.
 */
export function sanitizePromptInput(input: string): string {
  // Strip control null characters
  let sanitized = input.replace(/\0/g, '');

  // Strip or neutralize markers commonly used to mimic instruction boundaries
  sanitized = sanitized
    .replace(/\[\/?(SYSTEM|ASSISTANT|INSTRUCTION|AI_RULES)\]/gi, '')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    .replace(/<\|endoftext\|>/gi, '');

  return sanitized;
}

/**
 * Safely parses JSON with fallback, avoiding unhandled exceptions.
 */
export function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Sanitizes errors returned to clients to prevent schema/credential leakage.
 */
export function sanitizeErrorMessage(error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallback;

  if (typeof error === 'string') {
    // Check if error contains sensitive keywords
    if (/supabase|postgres|password|secret|bearer|key|jwt|column|relation/i.test(error)) {
      return fallback;
    }
    return error;
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (/supabase|postgres|password|secret|bearer|key|jwt|column|relation/i.test(msg)) {
      return fallback;
    }
    return msg;
  }

  return fallback;
}
