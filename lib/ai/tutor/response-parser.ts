/**
 * AI Kannada Guru — Response Parser
 * Kannada Kaliri — Milestone 06
 *
 * Robustly parses and validates structured LLM output with safe fallbacks.
 */

import type { TutorStructuredResponse, GrammarCorrection, TutorQuickExercise } from './types';

export function parseTutorResponse(rawText: string): TutorStructuredResponse {
  if (!rawText || rawText.trim() === '') {
    return {
      message: 'ನಮಸ್ಕಾರ! How can I assist you with Kannada today?',
      kannadaText: 'ನಮಸ್ಕಾರ!',
      transliteration: 'Namaskāra!',
      translation: 'Hello / Greetings!',
      suggestedReplies: [
        'How do I order coffee in Kannada?',
        'Teach me basic greetings',
        'Help me with Kannada grammar',
      ],
    };
  }

  let textToParse = rawText.trim();

  // 1. Check for markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    textToParse = fenceMatch[1].trim();
  } else {
    // Check for outermost curly braces { ... }
    const firstBrace = textToParse.indexOf('{');
    const lastBrace = textToParse.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      textToParse = textToParse.slice(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(textToParse);

    if (parsed && typeof parsed === 'object') {
      const message =
        typeof parsed.message === 'string' && parsed.message.trim().length > 0
          ? parsed.message.trim()
          : typeof parsed.content === 'string'
          ? parsed.content.trim()
          : rawText.slice(0, 500);

      const kannadaText =
        typeof parsed.kannadaText === 'string' && parsed.kannadaText.trim().length > 0
          ? parsed.kannadaText.trim()
          : undefined;

      const transliteration =
        typeof parsed.transliteration === 'string' && parsed.transliteration.trim().length > 0
          ? parsed.transliteration.trim()
          : undefined;

      const translation =
        typeof parsed.translation === 'string' && parsed.translation.trim().length > 0
          ? parsed.translation.trim()
          : undefined;

      const explanation =
        typeof parsed.explanation === 'string' && parsed.explanation.trim().length > 0
          ? parsed.explanation.trim()
          : undefined;

      // Validate corrections array
      let corrections: GrammarCorrection[] | undefined;
      if (Array.isArray(parsed.corrections) && parsed.corrections.length > 0) {
        corrections = parsed.corrections
          .filter(
            (c: unknown): c is Record<string, unknown> =>
              Boolean(c) && typeof c === 'object' && typeof (c as Record<string, unknown>).corrected === 'string'
          )
          .map((c: Record<string, unknown>) => ({
            original: String(c.original || ''),
            corrected: String(c.corrected || ''),
            explanation: String(c.explanation || ''),
          }));
      }

      // Validate suggested replies
      let suggestedReplies: string[] | undefined;
      if (Array.isArray(parsed.suggestedReplies) && parsed.suggestedReplies.length > 0) {
        suggestedReplies = parsed.suggestedReplies
          .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
          .map((s: string) => s.trim())
          .slice(0, 4);
      }

      // Validate micro exercise
      let exercise: TutorQuickExercise | undefined;
      if (parsed.exercise && typeof parsed.exercise === 'object') {
        const pe = parsed.exercise as Record<string, unknown>;
        if (typeof pe.prompt === 'string' && pe.prompt.trim().length > 0) {
          exercise = {
            prompt: pe.prompt.trim(),
            expectedKannada: typeof pe.expectedKannada === 'string' ? pe.expectedKannada.trim() : undefined,
            options: Array.isArray(pe.options) ? pe.options.map(String) : undefined,
            hint: typeof pe.hint === 'string' ? pe.hint.trim() : undefined,
          };
        }
      }

      return {
        message,
        kannadaText,
        transliteration,
        translation,
        explanation,
        corrections: corrections && corrections.length > 0 ? corrections : undefined,
        suggestedReplies: suggestedReplies && suggestedReplies.length > 0 ? suggestedReplies : undefined,
        exercise,
      };
    }
  } catch {
    // Non-JSON or malformed output — fallback safely to plain text
  }

  // Regex to detect any Kannada script characters in the raw text
  const kannadaMatch = rawText.match(/[\u0C80-\u0CFF\s,!?।]+/g);
  let kannadaText: string | undefined;
  if (kannadaMatch) {
    const candidate = kannadaMatch.join(' ').trim();
    if (candidate.length > 3) {
      kannadaText = candidate;
    }
  }

  return {
    message: rawText.replace(/```[a-z]*|```/g, '').trim(),
    kannadaText,
    suggestedReplies: [
      'Tell me more about this',
      'Give me an example sentence',
      'How do I say this politely in Kannada?',
    ],
  };
}

