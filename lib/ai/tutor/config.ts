/**
 * AI Kannada Guru — Configuration & Credential Validator
 * Kannada Kaliri — Milestone 06 & M11.5 Hardened
 *
 * Reads server-only configuration. Never exposes AI keys to client bundles or browser logs.
 * Implements strict placeholder detection, model compatibility resolution,
 * and unambiguous setup messaging.
 */

import type { AIProviderName } from './types';

export interface TutorAIConfig {
  provider: AIProviderName;
  apiKey: string | null;
  model: string;
  baseUrl: string | null;
  maxMessageLength: number;
  maxTokens: number;
  temperature: number;
  isPlaceholder: boolean;
}

export interface ConfigurationStatus {
  isConfigured: boolean;
  provider: AIProviderName;
  model: string;
  hasKey: boolean;
  isPlaceholder: boolean;
  message: string;
}

const PLACEHOLDER_PATTERNS = [
  'your_',
  'placeholder',
  'paste_',
  'xxx',
  '<key>',
  '<api_key>',
  'todo',
  'api_key_here',
  'my_key',
  'dummy',
  'insert_',
];

/**
 * Checks whether an API key string is merely a documentation placeholder.
 */
export function isPlaceholderKey(key: string | null | undefined): boolean {
  if (!key) return false;
  const trimmed = key.trim().toLowerCase();
  if (trimmed.length < 12) return true; // Genuine Google/OpenAI/Groq keys are always >= 30 chars
  return PLACEHOLDER_PATTERNS.some((pat) => trimmed.includes(pat));
}

/**
 * Resolves the active AI provider and server-side credentials with multi-variable support.
 */
export function getTutorAIConfig(): TutorAIConfig {
  const providerEnv = process.env.AI_PROVIDER?.toLowerCase().trim();
  const provider: AIProviderName =
    providerEnv === 'openai' ||
    providerEnv === 'groq' ||
    providerEnv === 'anthropic' ||
    providerEnv === 'mock'
      ? providerEnv
      : 'google'; // Default to Google Gemini

  // Multi-variable resolution in priority order
  let rawKey: string | null = null;

  if (process.env.AI_API_KEY?.trim()) {
    rawKey = process.env.AI_API_KEY.trim();
  } else if (provider === 'google') {
    rawKey =
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_AI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      null;
  } else if (provider === 'openai') {
    rawKey = process.env.OPENAI_API_KEY?.trim() || null;
  } else if (provider === 'groq') {
    rawKey = process.env.GROQ_API_KEY?.trim() || null;
  } else if (provider === 'anthropic') {
    rawKey = process.env.ANTHROPIC_API_KEY?.trim() || null;
  }

  const isPlaceholder = isPlaceholderKey(rawKey);
  const apiKey = isPlaceholder ? null : rawKey;

  // Modern verified model defaults
  let defaultModel = 'gemini-flash-lite-latest';
  if (provider === 'google') defaultModel = 'gemini-flash-lite-latest';
  if (provider === 'openai') defaultModel = 'gpt-4o-mini';
  if (provider === 'groq') defaultModel = 'llama-3.3-70b-versatile';
  if (provider === 'anthropic') defaultModel = 'claude-3-5-haiku-20241022';
  if (provider === 'mock') defaultModel = 'mock-tutor-v1';

  let rawModel = process.env.AI_MODEL?.trim() || defaultModel;
  // Automatically alias deprecated Gemini endpoints if legacy model specified in env
  if (rawModel === 'gemini-1.5-flash' || rawModel === 'gemini-2.5-flash') {
    rawModel = 'gemini-flash-lite-latest';
  }
  const model = rawModel;
  const baseUrl = process.env.AI_BASE_URL?.trim() || null;

  return {
    provider,
    apiKey,
    model,
    baseUrl,
    maxMessageLength: 1000,
    maxTokens: 1000,
    temperature: 0.7,
    isPlaceholder,
  };
}

/**
 * Determines whether the AI Guru runtime is genuinely configured and ready for live execution.
 */
export function isTutorAIConfigured(): boolean {
  const config = getTutorAIConfig();
  if (config.provider === 'mock') return true;
  return Boolean(config.apiKey && config.apiKey.length >= 12 && !config.isPlaceholder);
}

/**
 * Returns a friendly diagnostic status without ever echoing the secret key.
 */
export function getTutorConfigurationStatus(): ConfigurationStatus {
  const config = getTutorAIConfig();
  const rawKeyPresent = Boolean(
    process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY
  );

  if (config.provider === 'mock') {
    return {
      isConfigured: true,
      provider: 'mock',
      model: config.model,
      hasKey: true,
      isPlaceholder: false,
      message: 'Mock pedagogical provider active for testing and local simulation.',
    };
  }

  if (config.isPlaceholder) {
    return {
      isConfigured: false,
      provider: config.provider,
      model: config.model,
      hasKey: true,
      isPlaceholder: true,
      message:
        'A placeholder API key (e.g. "your_gemini_api_key_here") was detected in .env.local. Please replace it with your genuine Gemini, OpenAI, or Groq API key.',
    };
  }

  if (!config.apiKey) {
    return {
      isConfigured: false,
      provider: config.provider,
      model: config.model,
      hasKey: false,
      isPlaceholder: false,
      message:
        'The AI Guru requires an AI_API_KEY (or GEMINI_API_KEY) in server .env.local to generate real-time responses.',
    };
  }

  return {
    isConfigured: true,
    provider: config.provider,
    model: config.model,
    hasKey: rawKeyPresent,
    isPlaceholder: false,
    message: `Configured with ${config.provider} (${config.model}).`,
  };
}
