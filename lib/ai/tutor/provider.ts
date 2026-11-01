/**
 * AI Kannada Guru — Provider Implementations
 * Kannada Kaliri — Milestone 06 & M11.5 Hardened
 *
 * Implements Google Gemini, OpenAI/Groq compatible REST APIs,
 * Mock provider for testing, and strict configuration validation.
 */

import type {
  TutorProviderRequest,
  TutorProviderResponse,
  AIProviderName,
} from './types';
import { getTutorAIConfig, isTutorAIConfigured } from './config';
import { buildTutorSystemPrompt } from './prompts';
import { parseTutorResponse } from './response-parser';

export class TutorAIError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'TutorAIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  get status(): number {
    return this.statusCode;
  }
}

export interface ITutorAIProvider {
  readonly name: AIProviderName;
  generateTutoringResponse(request: TutorProviderRequest): Promise<TutorProviderResponse>;
}

/**
 * Google Gemini REST Provider
 */
export class GoogleGeminiProvider implements ITutorAIProvider {
  readonly name: AIProviderName = 'google';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-flash-lite-latest') {
    this.apiKey = apiKey;
    this.model =
      model === 'gemini-1.5-flash' || model === 'gemini-2.5-flash'
        ? 'gemini-flash-lite-latest'
        : model;
  }

  async generateTutoringResponse(request: TutorProviderRequest): Promise<TutorProviderResponse> {
    const systemPrompt = request.customSystemPrompt || buildTutorSystemPrompt(request.learnerContext);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Map conversation history to Gemini contents
    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || '25000', 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 1000,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (
          response.status === 400 &&
          (errorText.includes('API_KEY_INVALID') || errorText.includes('INVALID_ARGUMENT'))
        ) {
          throw new TutorAIError(
            'The configured Google Gemini API key is invalid or unauthorized.',
            'AI_INVALID_CREDENTIALS',
            401
          );
        }
        if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
          throw new TutorAIError(
            'Google Gemini API rate limit or quota exceeded. Please try again in a few moments.',
            'AI_QUOTA_EXCEEDED',
            429
          );
        }
        throw new TutorAIError(
          `Gemini API returned status ${response.status}: ${errorText.slice(0, 150)}`,
          'GEMINI_API_ERROR',
          response.status
        );
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) {
        throw new TutorAIError(
          'Gemini returned an empty response candidate.',
          'AI_EMPTY_RESPONSE',
          502
        );
      }

      const structured = parseTutorResponse(rawText);

      return {
        rawText,
        structured,
        provider: 'google',
        model: this.model,
      };
    } catch (err: unknown) {
      if (err instanceof TutorAIError) throw err;
      if ((err as Error)?.name === 'AbortError') {
        throw new TutorAIError(
          `Google Gemini request timed out after ${timeoutMs / 1000}s.`,
          'AI_PROVIDER_TIMEOUT',
          504
        );
      }
      throw new TutorAIError(
        `Gemini request failed: ${err instanceof Error ? err.message : String(err)}`,
        'NETWORK_OR_RUNTIME_ERROR',
        500,
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * OpenAI / Groq / OpenRouter Compatible Provider
 */
export class OpenAICompatibleProvider implements ITutorAIProvider {
  readonly name: AIProviderName;
  private apiKey: string;
  private model: string;
  private baseUrl?: string | null;

  constructor(
    name: AIProviderName,
    apiKey: string,
    model: string,
    baseUrl?: string | null
  ) {
    this.name = name;
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async generateTutoringResponse(request: TutorProviderRequest): Promise<TutorProviderResponse> {
    const systemPrompt = request.customSystemPrompt || buildTutorSystemPrompt(request.learnerContext);
    let endpoint = this.baseUrl || 'https://api.openai.com/v1';
    if (this.name === 'groq' && !this.baseUrl) {
      endpoint = 'https://api.groq.com/openai/v1';
    }
    const url = `${endpoint.replace(/\/+$/, '')}/chat/completions`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || '25000', 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1000,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 || response.status === 403) {
          throw new TutorAIError(
            `The configured ${this.name} API key is invalid or expired.`,
            'AI_INVALID_CREDENTIALS',
            401
          );
        }
        if (response.status === 429) {
          throw new TutorAIError(
            `${this.name} API quota or rate limit exceeded. Please try again shortly.`,
            'AI_QUOTA_EXCEEDED',
            429
          );
        }
        throw new TutorAIError(
          `${this.name} API returned status ${response.status}: ${errorText.slice(0, 150)}`,
          'AI_PROVIDER_ERROR',
          response.status
        );
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      if (!rawText) {
        throw new TutorAIError(
          `${this.name} returned an empty response candidate.`,
          'AI_EMPTY_RESPONSE',
          502
        );
      }
      const structured = parseTutorResponse(rawText);

      return {
        rawText,
        structured,
        provider: this.name,
        model: this.model,
      };
    } catch (err: unknown) {
      if (err instanceof TutorAIError) throw err;
      if ((err as Error)?.name === 'AbortError') {
        throw new TutorAIError(
          `${this.name} request timed out after ${timeoutMs / 1000}s.`,
          'AI_PROVIDER_TIMEOUT',
          504
        );
      }
      throw new TutorAIError(
        `${this.name} request failed: ${err instanceof Error ? err.message : String(err)}`,
        'NETWORK_OR_RUNTIME_ERROR',
        500,
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Mock Provider for testing and local verification
 */
export class MockTutorProvider implements ITutorAIProvider {
  readonly name: AIProviderName = 'mock';

  async generateTutoringResponse(request: TutorProviderRequest): Promise<TutorProviderResponse> {
    const lastUserMessage =
      [...request.messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';

    let kannadaText = 'ನಮಸ್ಕಾರ! ನೀವು ಹೇಗಿದ್ದೀರಿ?';
    let transliteration = 'Namaskāra! Neevu hēgiddīri?';
    let translation = 'Hello! How are you?';
    let explanation =
      'In Kannada, "ನೀವು" (neevu) is the polite/respectful form of "you", suitable for strangers, elders, and colleagues.';
    let message = `ನಮಸ್ಕಾರ ${request.learnerContext.learnerName}! I am your Kannada Guru. I'm here to help you master Kannada comfortably in ${request.learnerContext.nativeLanguageName}.`;

    if (lastUserMessage.includes('coffee') || lastUserMessage.includes('ಕಾಫಿ') || lastUserMessage.includes('order')) {
      kannadaText = 'ಒಂದು ಕಾಫಿ ಕೊಡಿ, ಸಕ್ಕರೆ ಬೇಡ.';
      transliteration = 'Ondu kāphi kodi, sakkare bēda.';
      translation = 'Give one coffee, sugar not needed.';
      explanation =
        'Notice the SOV word order: "ಒಂದು ಕಾಫಿ" (one coffee) + "ಕೊಡಿ" (give - polite). In darshinis across Bengaluru, "ಕೊಡಿ" (kodi) is the respectful request form.';
      message =
        'Here is the classic Bengaluru Darshini coffee ordering phrase! In Kannada, always place the verb "ಕೊಡಿ" (kodi) at the very end.';
    } else if (lastUserMessage.includes('how are you') || lastUserMessage.includes('hegidira') || lastUserMessage.includes('ಹೇಗಿದ್ದೀರಿ')) {
      kannadaText = 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು!';
      transliteration = 'Naanu chennāgiddēne, dhanyavādagalu!';
      translation = 'I am doing well, thank you!';
      explanation =
        '"ಚೆನ್ನಾಗಿದ್ದೇನೆ" (chennaagiddene) comes from "ಚೆನ್ನಾಗಿ" (well/good) + "ಇದ್ದೇನೆ" (I am).';
      message = 'To answer "How are you?", you say: ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ (Naanu chennaagiddēne)!';
    }

    const structured = {
      message,
      kannadaText,
      transliteration,
      translation,
      explanation,
      suggestedReplies: [
        'How do I say "Thank you very much"?',
        'Teach me numbers from 1 to 10',
        'How do I ask an auto driver "How much to Indiranagar"?',
      ],
      exercise: {
        prompt: 'How do you say "I am doing well" in Kannada?',
        expectedKannada: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ',
        options: ['ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ', 'ನೀವು ಹೇಗಿದ್ದೀರಿ?', 'ಊಟ ಆಯ್ತಾ?'],
        hint: 'Starts with ನಾನು (Naanu)',
      },
    };

    return {
      rawText: JSON.stringify(structured),
      structured,
      provider: 'mock',
      model: 'mock-tutor-v1',
    };
  }
}

/**
 * Factory to create configured provider
 */
export function getTutorAIProvider(): ITutorAIProvider {
  const config = getTutorAIConfig();

  if (config.provider === 'mock') {
    return new MockTutorProvider();
  }

  if (!isTutorAIConfigured()) {
    throw new TutorAIError(
      config.isPlaceholder
        ? 'A placeholder API key was detected in .env.local. Please replace it with a valid Gemini/OpenAI/Groq key.'
        : 'Runtime AI provider is not configured. Please set AI_API_KEY in server environment.',
      'AI_PROVIDER_NOT_CONFIGURED',
      503
    );
  }

  const apiKey = config.apiKey!;

  switch (config.provider) {
    case 'google':
      return new GoogleGeminiProvider(apiKey, config.model);
    case 'openai':
    case 'groq':
    case 'anthropic':
      return new OpenAICompatibleProvider(config.provider, apiKey, config.model, config.baseUrl);
    default:
      return new GoogleGeminiProvider(apiKey, config.model);
  }
}
