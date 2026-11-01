/**
 * Speech Intelligence Master Provider Abstraction
 * Kannada Kaliri — Milestone 05
 *
 * Decouples frontend and route handlers from the underlying vendor (Gnani AI).
 * Allows plugging in alternative engines or mock providers without changing application logic.
 */

import { transcribeWithGnaniPrisma, compareSpokenAnswer } from './gnani-stt';
import { synthesizeWithGnaniTimbre } from './gnani-tts';
import { isGnaniConfigured } from './speech-config';
import type {
  STTRequest,
  STTResponse,
  TTSRequest,
  TTSResponse,
} from './types';

export interface ISpeechProvider {
  name: string;
  isAvailable(): boolean;
  transcribe(req: STTRequest): Promise<STTResponse>;
  synthesize(req: TTSRequest): Promise<TTSResponse>;
}

/**
 * Gnani AI Production Implementation
 */
export class GnaniSpeechProvider implements ISpeechProvider {
  name = 'gnani-ai';

  isAvailable(): boolean {
    return isGnaniConfigured();
  }

  async transcribe(req: STTRequest): Promise<STTResponse> {
    return transcribeWithGnaniPrisma(req);
  }

  async synthesize(req: TTSRequest): Promise<TTSResponse> {
    return synthesizeWithGnaniTimbre(req);
  }
}

/**
 * Mock Speech Provider for testing and offline development
 */
export class MockSpeechProvider implements ISpeechProvider {
  name = 'mock-provider';
  private mockTranscript: string = 'ನಮಸ್ಕಾರ';

  setMockTranscript(t: string): void {
    this.mockTranscript = t;
  }

  isAvailable(): boolean {
    return true;
  }

  async transcribe(req: STTRequest): Promise<STTResponse> {
    return {
      transcript: this.mockTranscript,
      normalizedTranscript: this.mockTranscript.trim(),
      confidence: 0.95,
      language: req.language,
      durationSeconds: 1.5,
      provider: 'mock-adapter',
    };
  }

  async synthesize(req: TTSRequest): Promise<TTSResponse> {
    // Return a minimal valid 1-second silent WAV base64
    const silentWavBase64 =
      'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    return {
      audioBase64: silentWavBase64,
      mimeType: 'audio/wav',
      provider: 'mock-adapter',
      language: req.language,
      voice: req.voice || 'mock-voice',
      cached: false,
    };
  }
}

// Singleton instances
const gnaniProvider = new GnaniSpeechProvider();
const mockProvider = new MockSpeechProvider();

/**
 * Returns active provider.
 * When useMock = true, uses the mock provider for tests.
 */
export function getSpeechProvider(useMock = false): ISpeechProvider {
  if (useMock) return mockProvider;
  return gnaniProvider;
}

/**
 * High-level helper to transcribe speech using the active provider
 */
export async function transcribeSpeech(
  req: STTRequest,
  useMock = false
): Promise<STTResponse> {
  const provider = getSpeechProvider(useMock);
  return provider.transcribe(req);
}

/**
 * High-level helper to synthesize speech using the active provider
 */
export async function synthesizeSpeech(
  req: TTSRequest,
  useMock = false
): Promise<TTSResponse> {
  const provider = getSpeechProvider(useMock);
  return provider.synthesize(req);
}

export { compareSpokenAnswer };
