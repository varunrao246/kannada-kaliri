/**
 * Gnani AI Timbre TTS (Text-to-Speech) Adapter
 * Kannada Kaliri — Milestone 05
 *
 * Handles speech synthesis requests to Gnani Timbre.
 * Implements in-memory caching for repeated lesson phrases to optimize performance and cost.
 */

import { getGnaniConfig, isGnaniConfigured } from './speech-config';
import type { TTSRequest, TTSResponse, SpeechProviderError } from './types';

// ─── In-Memory Safe TTS Cache (Key: lang:voice:rate:text) ────────────────────
const ttsCache = new Map<string, { audioBase64: string; mimeType: string }>();

function buildCacheKey(req: TTSRequest): string {
  return `${req.language}:${req.voice || 'default'}:${req.speed || 1.0}:${req.text.trim()}`;
}

export function clearTTSCache(): void {
  ttsCache.clear();
}

// ─── Gnani Timbre TTS Client ────────────────────────────────────────────────
export async function synthesizeWithGnaniTimbre(
  req: TTSRequest
): Promise<TTSResponse> {
  const config = getGnaniConfig();

  // Validate text length
  if (!req.text || req.text.trim().length === 0) {
    const err: SpeechProviderError = {
      code: 'TEXT_TOO_LONG',
      message: 'Synthesis text cannot be empty.',
      statusCode: 400,
    };
    throw err;
  }

  if (req.text.length > config.maxTextLengthChars) {
    const err: SpeechProviderError = {
      code: 'TEXT_TOO_LONG',
      message: `Text length (${req.text.length}) exceeds maximum allowable limit of ${config.maxTextLengthChars} characters.`,
      statusCode: 400,
    };
    throw err;
  }

  // Check cache for identical static lesson phrase
  const cacheKey = buildCacheKey(req);
  const cached = ttsCache.get(cacheKey);
  if (cached) {
    return {
      audioBase64: cached.audioBase64,
      mimeType: cached.mimeType,
      provider: 'gnani-timbre',
      language: req.language,
      voice: req.voice || config.ttsModel,
      cached: true,
    };
  }

  if (!isGnaniConfigured()) {
    const err: SpeechProviderError = {
      code: 'PROVIDER_NOT_CONFIGURED',
      message:
        'Gnani AI credentials (GNANI_API_KEY) are not configured on the server. Live speech synthesis is blocked until valid credentials are provided.',
      statusCode: 503,
    };
    throw err;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    // Construct headers: Vachana AI expects X-API-Key-ID: <GNANI_API_KEY>
    // Reuses the exact single API key for both services
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [config.authHeader]: config.apiKey!,
    };

    // Vachana AI Timbre TTS JSON specification
    const selectedVoice = req.voice || config.ttsVoice;
    const containerFormat = req.format || 'wav';

    const payload = {
      text: req.text,
      language: req.language,
      model: config.ttsModel,
      voice: selectedVoice,
      speed: req.speed || 0.85, // Pedagogically calibrated for language learners
      audio_config: {
        sample_rate: 16000,
        container: containerFormat,
      },
    };

    const response = await fetch(config.ttsEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const err: SpeechProviderError = {
        code: 'PROVIDER_ERROR',
        message: `Gnani Timbre TTS returned HTTP ${response.status}: ${errorText || response.statusText}`,
        statusCode: response.status >= 500 ? 502 : response.status,
        details: errorText,
      };
      throw err;
    }

    const contentType = response.headers.get('content-type') || '';
    let audioBase64 = '';
    let mimeType = 'audio/mp3';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      audioBase64 =
        data.audio_content ||
        data.audioContent ||
        data.audio ||
        data.data?.audio ||
        '';
      mimeType = data.mime_type || data.mimeType || 'audio/mp3';
    } else {
      // Binary audio stream
      const buffer = await response.arrayBuffer();
      const nodeBuf = Buffer.from(buffer);
      audioBase64 = nodeBuf.toString('base64');

      // Determine accurate MIME type via magic bytes
      const isRiffWav =
        nodeBuf.length >= 12 &&
        nodeBuf.toString('ascii', 0, 4) === 'RIFF' &&
        nodeBuf.toString('ascii', 8, 12) === 'WAVE';
      const isMp3 =
        nodeBuf.length >= 3 &&
        (nodeBuf.toString('ascii', 0, 3) === 'ID3' ||
          (nodeBuf[0] === 0xff && (nodeBuf[1] & 0xe0) === 0xe0));

      if (isRiffWav) {
        mimeType = 'audio/wav';
      } else if (isMp3) {
        mimeType = 'audio/mp3';
      } else {
        mimeType = req.format === 'mp3' ? 'audio/mp3' : 'audio/wav';
      }
    }

    // Cache the successful lesson phrase synthesis
    ttsCache.set(cacheKey, { audioBase64, mimeType });

    return {
      audioBase64,
      mimeType,
      provider: 'gnani-timbre',
      language: req.language,
      voice: req.voice || config.ttsModel,
      cached: false,
    };
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      const timeoutErr: SpeechProviderError = {
        code: 'PROVIDER_TIMEOUT',
        message: `Gnani Timbre TTS request timed out after ${config.timeoutMs}ms.`,
        statusCode: 504,
      };
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

