import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { synthesizeSpeech } from '@/lib/ai/speech/provider';
import { getGnaniConfig } from '@/lib/ai/speech/speech-config';
import {
  SUPPORTED_SPEECH_LANGUAGES,
  type SpeechLanguageCode,
} from '@/lib/ai/speech/types';
import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import { sanitizeErrorMessage, validateTTSText } from '@/lib/security/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated. Please sign in to access speech synthesis.' },
        { status: 401 }
      );
    }

    // Rate Limiting (30 TTS per minute)
    const rateLimit = checkRateLimit(
      getClientIdentifier(request, user.id),
      RATE_LIMITS.TTS
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Speech synthesis rate limit reached. Please wait a moment.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 2. Parse and validate payload
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const {
      text,
      language = 'kn-IN',
      speed = 0.85,
      voice,
    } = body as {
      text?: string;
      language?: SpeechLanguageCode;
      speed?: number;
      voice?: string;
    };

    const textValidation = validateTTSText(text);
    if (!textValidation.isValid || !textValidation.data) {
      return NextResponse.json(
        { error: textValidation.error || 'Invalid text' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 3. Validate language
    if (!(language in SUPPORTED_SPEECH_LANGUAGES)) {
      return NextResponse.json(
        {
          error: `Unsupported language code "${language}". Supported: ${Object.keys(
            SUPPORTED_SPEECH_LANGUAGES
          ).join(', ')}`,
        },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const config = getGnaniConfig();

    // 4. Select voice
    const selectedVoice =
      voice || SUPPORTED_SPEECH_LANGUAGES[language]?.defaultVoice || config.ttsVoice;

    // 5. Synthesize audio
    const ttsResponse = await synthesizeSpeech({
      text: textValidation.data,
      language,
      speed: typeof speed === 'number' ? Math.max(0.5, Math.min(2.0, speed)) : 0.85,
      voice: selectedVoice,
    });

    return NextResponse.json(
      {
        audioBase64: ttsResponse.audioBase64,
        mimeType: ttsResponse.mimeType,
        provider: ttsResponse.provider,
        language: ttsResponse.language,
        voice: ttsResponse.voice,
        cached: ttsResponse.cached ?? false,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; statusCode?: number };
    const statusCode = err.statusCode || 500;

    return NextResponse.json(
      {
        error: sanitizeErrorMessage(err.message, 'Speech synthesis failed'),
        code: err.code || 'INTERNAL_ERROR',
        fallbackToBrowser: true,
      },
      { status: statusCode }
    );
  }
}
