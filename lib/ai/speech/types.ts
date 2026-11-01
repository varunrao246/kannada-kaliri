/**
 * Speech Intelligence Type Definitions
 * Kannada Kaliri — Milestone 05
 *
 * Provider-agnostic interfaces for Speech-to-Text (STT) and Text-to-Speech (TTS).
 */

export type SpeechLanguageCode =
  | 'kn-IN' // Kannada (Default target)
  | 'en-IN' // Indian English
  | 'hi-IN' // Hindi
  | 'ta-IN' // Tamil
  | 'te-IN' // Telugu
  | 'ml-IN'; // Malayalam

export const SUPPORTED_SPEECH_LANGUAGES: Record<
  SpeechLanguageCode,
  { name: string; nativeName: string; defaultVoice: string }
> = {
  'kn-IN': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', defaultVoice: 'Kaveri' },
  'en-IN': { name: 'English (India)', nativeName: 'English', defaultVoice: 'Nalini' },
  'hi-IN': { name: 'Hindi', nativeName: 'हिन्दी', defaultVoice: 'Nalini' },
  'ta-IN': { name: 'Tamil', nativeName: 'தமிழ்', defaultVoice: 'Kaveri' },
  'te-IN': { name: 'Telugu', nativeName: 'తెలుగు', defaultVoice: 'Kaveri' },
  'ml-IN': { name: 'Malayalam', nativeName: 'മലയാളം', defaultVoice: 'Kaveri' },
};

export type AudioEncoding = 'wav' | 'webm' | 'mp3' | 'ogg' | 'pcm' | 'm4a' | 'flac' | 'aac';

export interface AudioInputMetadata {
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
}

// ─── Speech-to-Text (STT) ───────────────────────────────────────────────────

export interface STTRequest {
  /** Audio buffer or base64 string */
  audio: Buffer | Uint8Array | string;
  language: SpeechLanguageCode;
  format: AudioEncoding;
  mimeType: string;
  model?: string;
  samplingRate?: number;
}

export interface STTResponse {
  transcript: string;
  normalizedTranscript: string;
  confidence: number; // 0.0 - 1.0
  language: SpeechLanguageCode;
  durationSeconds?: number;
  provider: 'gnani-prisma' | 'mock-adapter';
  rawResponse?: unknown;
}

// ─── Text-to-Speech (TTS) ───────────────────────────────────────────────────

export interface TTSRequest {
  text: string;
  language: SpeechLanguageCode;
  voice?: string;
  speed?: number; // 0.5 - 2.0 (default 1.0, 0.85 recommended for language learning)
  pitch?: number;
  format?: 'mp3' | 'wav';
}

export interface TTSResponse {
  /** Base64-encoded audio data for browser audio element playback */
  audioBase64: string;
  mimeType: string;
  provider: 'gnani-timbre' | 'browser-fallback' | 'mock-adapter';
  language: SpeechLanguageCode;
  voice: string;
  cached?: boolean;
}

// ─── Speech Comparison & Spoken Practice ────────────────────────────────────

export interface SpeechComparisonResult {
  recognizedText: string;
  expectedText: string;
  isMatch: boolean;
  similarityScore: number; // 0 - 100
  feedbackMessage: string;
  normalizedRecognized: string;
  normalizedExpected: string;
}

// ─── Provider Errors ────────────────────────────────────────────────────────

export type SpeechErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_AUDIO'
  | 'UNSUPPORTED_LANGUAGE'
  | 'UNSUPPORTED_FORMAT'
  | 'PAYLOAD_TOO_LARGE'
  | 'TEXT_TOO_LONG'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_ERROR'
  | 'INTERNAL_ERROR';

export interface SpeechProviderError {
  code: SpeechErrorCode;
  message: string;
  statusCode: number;
  details?: unknown;
}

