/**
 * Speech Configuration & Constants
 * Kannada Kaliri — Milestone 05
 *
 * Reads server-only configuration. Never exposes API keys to client bundles.
 */

import type { SpeechLanguageCode } from './types';
import type { NativeLanguage } from '@/types/profile';

export interface GnaniConfig {
  apiKey: string | null;
  sttEndpoint: string;
  ttsEndpoint: string;
  sttModel: string;
  ttsModel: string;
  ttsVoice: string;
  authHeader: string;
  timeoutMs: number;
  maxAudioSizeBytes: number;
  maxTextLengthChars: number;
}

export function getGnaniConfig(): GnaniConfig {
  return {
    apiKey: process.env.GNANI_API_KEY || null,
    sttEndpoint:
      process.env.GNANI_STT_ENDPOINT ||
      'https://api.vachana.ai/stt/v3',
    ttsEndpoint:
      process.env.GNANI_TTS_ENDPOINT ||
      'https://api.vachana.ai/api/v1/tts/inference',
    sttModel: process.env.GNANI_STT_MODEL || 'prisma-v3.0',
    ttsModel: process.env.GNANI_TTS_MODEL || 'timbre-v2.5',
    ttsVoice: process.env.GNANI_TTS_VOICE || 'Kaveri',
    authHeader: process.env.GNANI_AUTH_HEADER || 'X-API-Key-ID',
    timeoutMs: parseInt(process.env.GNANI_TIMEOUT_MS || '10000', 10),
    maxAudioSizeBytes: 10 * 1024 * 1024, // 10MB limit
    maxTextLengthChars: 1000, // Safe upper bound for learning snippets
  };
}

export function isGnaniConfigured(): boolean {
  const config = getGnaniConfig();
  return Boolean(config.apiKey && config.apiKey.trim().length > 0);
}

/**
 * Maps a learner profile's native_language code (en, hi, ta, te, ml) to SpeechLanguageCode
 */
export function mapNativeToSpeechLanguage(
  nativeLanguage?: NativeLanguage | string | null
): SpeechLanguageCode {
  switch (nativeLanguage) {
    case 'hi':
      return 'hi-IN';
    case 'ta':
      return 'ta-IN';
    case 'te':
      return 'te-IN';
    case 'ml':
      return 'ml-IN';
    case 'en':
      return 'en-IN';
    default:
      return 'kn-IN'; // Default to Kannada target
  }
}

/**
 * Supported MIME types for browser audio recording upload
 */
export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp3',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
];

/**
 * Resolves standard file extension from MIME type
 */
export function resolveAudioFormat(
  mimeType: string
): 'wav' | 'mp3' | 'ogg' | 'm4a' | 'flac' | 'aac' | 'webm' {
  const cleanMime = mimeType.split(';')[0].toLowerCase().trim();
  if (cleanMime.includes('wav')) return 'wav';
  if (cleanMime.includes('ogg')) return 'ogg';
  if (cleanMime.includes('mp3') || cleanMime.includes('mpeg')) return 'mp3';
  if (cleanMime.includes('m4a') || cleanMime.includes('mp4')) return 'm4a';
  if (cleanMime.includes('flac')) return 'flac';
  if (cleanMime.includes('aac')) return 'aac';
  if (cleanMime.includes('webm')) return 'webm';
  return 'wav';
}

