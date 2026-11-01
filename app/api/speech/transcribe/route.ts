import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeSpeech, compareSpokenAnswer } from '@/lib/ai/speech/provider';
import {
  getGnaniConfig,
} from '@/lib/ai/speech/speech-config';
import type { SpeechLanguageCode } from '@/lib/ai/speech/types';
import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import { sanitizeErrorMessage, validateAudioUpload } from '@/lib/security/validation';
import { inspectAudioForSTT } from '@/lib/ai/speech/audio-validator';

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
        { error: 'Unauthenticated. Please sign in to access speech recognition.' },
        { status: 401 }
      );
    }

    // Rate Limiting (15 STT per minute)
    const rateLimit = checkRateLimit(
      getClientIdentifier(request, user.id),
      RATE_LIMITS.STT
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Speech transcription rate limit reached. Please wait before recording again.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const config = getGnaniConfig();
    const contentType = request.headers.get('content-type') || '';

    let audioBuffer: Buffer | null = null;
    let mimeType = 'audio/wav';
    let language: SpeechLanguageCode = 'kn-IN';
    let expectedText = '';
    let expectedTransliteration = '';

    // 2. Parse Multipart or JSON request
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File | null;
      const langParam = formData.get('language') as string | null;
      const expectedParam = formData.get('expectedText') as string | null;
      const translitParam = formData.get('expectedTransliteration') as string | null;

      if (!audioFile) {
        return NextResponse.json(
          { error: 'Missing "audio" file in form-data payload' },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      const rawMime = audioFile.type || 'audio/wav';
      const validation = validateAudioUpload(audioFile.size, rawMime);
      if (!validation.isValid) {
        const status = audioFile.size > config.maxAudioSizeBytes ? 413 : 415;
        return NextResponse.json(
          { error: validation.error },
          { status, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      mimeType = rawMime;
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);

      if (langParam) language = langParam as SpeechLanguageCode;
      if (expectedParam) expectedText = expectedParam;
      if (translitParam) expectedTransliteration = translitParam;
    } else {
      // JSON payload with base64 audio
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { error: 'Invalid JSON payload' },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      const {
        audio,
        mimeType: reqMime,
        language: reqLang,
        expectedText: reqExpected,
        expectedTransliteration: reqTranslit,
      } = body as {
        audio: string;
        mimeType?: string;
        language?: SpeechLanguageCode;
        expectedText?: string;
        expectedTransliteration?: string;
      };

      if (!audio || typeof audio !== 'string') {
        return NextResponse.json(
          { error: 'Missing "audio" base64 payload' },
          { status: 400, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      const buffer = Buffer.from(audio, 'base64');
      const targetMime = reqMime || 'audio/wav';
      const validation = validateAudioUpload(buffer.length, targetMime);
      if (!validation.isValid) {
        const status = buffer.length > config.maxAudioSizeBytes ? 413 : 415;
        return NextResponse.json(
          { error: validation.error },
          { status, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      audioBuffer = buffer;
      if (reqMime) mimeType = reqMime;
      if (reqLang) language = reqLang;
      if (reqExpected) expectedText = reqExpected;
      if (reqTranslit) expectedTransliteration = reqTranslit;
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Audio payload is empty. Please record audio before transcribing.' },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 3. Inspect genuine file signature (magic bytes) to guarantee Gnani compatibility
    const inspection = inspectAudioForSTT(audioBuffer, mimeType);
    if (!inspection.isSupportedBySTT) {
      return NextResponse.json(
        {
          error:
            inspection.error ||
            'Unsupported audio format. Gnani Prisma STT supports: wav, mp3, m4a, ogg, flac, aac.',
          code: 'UNSUPPORTED_AUDIO_FORMAT',
        },
        { status: 415, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 4. Validate language code
    const validLanguages: SpeechLanguageCode[] = [
      'kn-IN',
      'en-IN',
      'hi-IN',
      'ta-IN',
      'te-IN',
      'ml-IN',
    ];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        {
          error: `Invalid or unsupported language code "${language}". Supported: ${validLanguages.join(', ')}`,
        },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 5. Transcribe via Provider with validated genuine format
    const sttResponse = await transcribeSpeech({
      audio: audioBuffer,
      language,
      format: inspection.fileExtension as 'wav' | 'mp3' | 'ogg' | 'webm',
      mimeType: inspection.mimeType,
    });

    // 6. Compare with expected text if provided
    let comparison = null;
    if (expectedText && expectedText.trim().length > 0) {
      comparison = compareSpokenAnswer(
        sttResponse.transcript,
        expectedText,
        expectedTransliteration
      );
    }

    const isEmpty = !sttResponse.transcript || sttResponse.transcript.trim().length === 0;

    return NextResponse.json(
      {
        transcript: sttResponse.transcript,
        normalizedTranscript: sttResponse.normalizedTranscript,
        confidence: sttResponse.confidence,
        language: sttResponse.language,
        provider: sttResponse.provider,
        comparison,
        isEmpty,
        message: isEmpty
          ? 'No clear speech detected. Please speak closer to the microphone and try again.'
          : undefined,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; statusCode?: number };
    const statusCode = err.statusCode || 500;
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(err.message, 'Speech recognition failed'),
        code: err.code || 'INTERNAL_ERROR',
      },
      { status: statusCode }
    );
  }
}
