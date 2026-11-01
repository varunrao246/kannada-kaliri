/**
 * Gnani AI Prisma STT (Speech-to-Text) Adapter
 * Kannada Kaliri — Milestone 05
 *
 * Handles speech recognition requests to Gnani Prisma.
 * Implements authoritative request normalization, timeout, and speech comparison.
 */

import { getGnaniConfig, isGnaniConfigured } from './speech-config';
import {
  evaluateKannadaVowelPronunciation,
  evaluateDemonstrativeOrVocabulary,
} from './kannada-phonetics';
import type {
  STTRequest,
  STTResponse,
  SpeechComparisonResult,
  SpeechProviderError,
} from './types';

// ─── Normalization Helper ───────────────────────────────────────────────────
export function normalizeKannadaSpeechText(text: string): string {
  return text
    .replace(/[.,!?।'"\-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// ─── Similarity & Feedback Logic ────────────────────────────────────────────
/**
 * Computes Levenshtein edit distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= an; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bn; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[an][bn];
}

/**
 * Compares recognized speech against expected lesson phrase.
 * Provides honest, encouraging pedagogical feedback without false phoneme claims.
 */
export function compareSpokenAnswer(
  recognizedText: string,
  expectedText: string,
  expectedTransliteration?: string
): SpeechComparisonResult {
  const normRecognized = normalizeKannadaSpeechText(recognizedText);
  const normExpected = normalizeKannadaSpeechText(expectedText);

  // Linguistic Vowel Assessment Hook
  const vowelEval = evaluateKannadaVowelPronunciation(recognizedText, expectedText, expectedTransliteration);
  if (vowelEval.isVowel) {
    return {
      recognizedText,
      expectedText,
      isMatch: vowelEval.isMatch,
      similarityScore: vowelEval.score,
      feedbackMessage: vowelEval.feedback,
      normalizedRecognized: normRecognized,
      normalizedExpected: normExpected,
    };
  }

  // Demonstrative Words & Transliteration Hook (e.g. 'ಇಲ್ಲಿ', 'ಅಲ್ಲಿ', 'ಎಲ್ಲಿ', 'ನಮಸ್ಕಾರ')
  const demoEval = evaluateDemonstrativeOrVocabulary(recognizedText, expectedText, expectedTransliteration);
  if (demoEval.isHandled) {
    return {
      recognizedText,
      expectedText,
      isMatch: demoEval.isMatch,
      similarityScore: demoEval.score,
      feedbackMessage: demoEval.feedback,
      normalizedRecognized: normRecognized,
      normalizedExpected: normExpected,
    };
  }

  if (!normRecognized) {
    return {
      recognizedText,
      expectedText,
      isMatch: false,
      similarityScore: 0,
      feedbackMessage: 'No speech was clearly recognized. Please try speaking closer to the microphone.',
      normalizedRecognized: normRecognized,
      normalizedExpected: normExpected,
    };
  }

  // Exact match
  if (normRecognized === normExpected) {
    return {
      recognizedText,
      expectedText,
      isMatch: true,
      similarityScore: 100,
      feedbackMessage: 'ಅದ್ಭುತ! (Adbhutha!) We recognized your response clearly.',
      normalizedRecognized: normRecognized,
      normalizedExpected: normExpected,
    };
  }

  // Calculate similarity based on Levenshtein distance
  const maxLen = Math.max(normRecognized.length, normExpected.length);
  const distance = levenshteinDistance(normRecognized, normExpected);
  const similarityScore = Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));

  const isMatch = similarityScore >= 75;

  let feedbackMessage = '';
  if (isMatch) {
    feedbackMessage = `Very close! We recognized: "${normRecognized}". Good effort on pronouncing this phrase.`;
  } else if (similarityScore >= 45) {
    feedbackMessage = `Good try! We heard: "${normRecognized}". Try speaking the full phrase: "${expectedText}".`;
  } else {
    feedbackMessage = `We recognized: "${normRecognized}". Take a deep breath and try speaking once more.`;
  }

  return {
    recognizedText,
    expectedText,
    isMatch,
    similarityScore,
    feedbackMessage,
    normalizedRecognized: normRecognized,
    normalizedExpected: normExpected,
  };
}

// ─── Gnani Prisma STT Client ────────────────────────────────────────────────
export async function transcribeWithGnaniPrisma(
  req: STTRequest
): Promise<STTResponse> {
  const config = getGnaniConfig();

  if (!isGnaniConfigured()) {
    const err: SpeechProviderError = {
      code: 'PROVIDER_NOT_CONFIGURED',
      message:
        'Gnani AI credentials (GNANI_API_KEY) are not configured on the server. Live speech recognition is blocked until valid credentials are provided.',
      statusCode: 503,
    };
    throw err;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    // Construct headers: Vachana AI expects X-API-Key-ID: <GNANI_API_KEY>
    const headers: Record<string, string> = {
      [config.authHeader]: config.apiKey!,
    };

    // Determine request body format
    let body: BodyInit;
    if (typeof req.audio === 'string') {
      // Base64 JSON payload
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        audio_content: req.audio,
        language_code: req.language,
        encoding: req.format,
        model: req.model || config.sttModel,
        sampling_rate: req.samplingRate || 16000,
      });
    } else {
      // Multipart FormData: Vachana AI Prisma expects 'audio_file', 'model', 'language_code'
      const formData = new FormData();
      const audioBlob = new Blob([req.audio as BlobPart], { type: req.mimeType });
      // Keep authentic extension based on genuine MIME type without false renaming
      const fileExt = req.format || 'wav';
      formData.append('audio_file', audioBlob, `speech_recording.${fileExt}`);
      formData.append('language_code', req.language);
      formData.append('model', req.model || config.sttModel);
      body = formData;
    }

    const response = await fetch(config.sttEndpoint, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const err: SpeechProviderError = {
        code: 'PROVIDER_ERROR',
        message: `Gnani Prisma STT returned HTTP ${response.status}: ${errorText || response.statusText}`,
        statusCode: response.status >= 500 ? 502 : response.status,
        details: errorText,
      };
      throw err;
    }

    const data = await response.json();

    // Normalize Gnani response schema variations
    const rawTranscript =
      data.transcript ||
      data.text ||
      data.asr_result ||
      data.result?.[0]?.text ||
      data.data?.transcript ||
      '';

    const confidence =
      typeof data.confidence === 'number'
        ? data.confidence
        : typeof data.result?.[0]?.confidence === 'number'
        ? data.result[0].confidence
        : 0.9;

    return {
      transcript: rawTranscript,
      normalizedTranscript: normalizeKannadaSpeechText(rawTranscript),
      confidence,
      language: req.language,
      provider: 'gnani-prisma',
      rawResponse: data,
    };
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      const timeoutErr: SpeechProviderError = {
        code: 'PROVIDER_TIMEOUT',
        message: `Gnani Prisma STT request timed out after ${config.timeoutMs}ms.`,
        statusCode: 504,
      };
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

