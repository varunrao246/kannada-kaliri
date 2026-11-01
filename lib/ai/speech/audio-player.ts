/**
 * Universal Audio Player with Provider Abstraction & Browser Fallback
 * Kannada Kaliri — Milestone 05 & M11.5 Audio Experience
 *
 * Features:
 * - Plays authentic Kannada speech via Gnani Timbre TTS
 * - Dual playback speed support: Slow (0.75x) and Normal (1.0x) using playbackRate
 * - Audio reuse: cached audio data is not re-requested for different speeds
 * - Pitch preservation (preserves natural voice pitch when slowing down)
 * - Exclusive playback: prevents overlapping playback when switching words
 * - Clear loading, playing, error, and fallback states
 * - Graceful fallback to browser speech synthesis
 */

import type { SpeechLanguageCode } from './types';

export type AudioPlaybackSpeed = 0.75 | 1.0;
export type KannadaVoice = 'Kaveri' | 'Girish' | 'female' | 'male';

export interface PlayAudioResult {
  source: 'gnani-timbre' | 'browser-fallback';
  cached?: boolean;
}

export type AudioStateCallback = (state: 'loading' | 'playing' | 'idle' | 'fallback' | 'error') => void;

export interface PlayKannadaSpeechOptions {
  speed?: AudioPlaybackSpeed | number;
  voice?: KannadaVoice | string;
  onStateChange?: AudioStateCallback;
}

// Global active audio tracker to ensure only one audio element plays at any time
let activeAudio: HTMLAudioElement | null = null;
let activeAbortController: AbortController | null = null;

// In-memory audio cache for synthesized audio data (keyed by language:voice:text)
const textAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();

/**
 * Stops any currently playing audio immediately.
 */
export function stopKannadaSpeech(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore pause exceptions
    }
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speech synthesis exceptions
    }
  }
}

/**
 * Pronounces a Kannada word or phrase.
 * Stops previous audio before starting.
 */
export async function playKannadaSpeech(
  text: string,
  language: SpeechLanguageCode = 'kn-IN',
  optionsOrCb?: PlayKannadaSpeechOptions | AudioStateCallback
): Promise<PlayAudioResult> {
  if (typeof window === 'undefined') return { source: 'browser-fallback' };

  // Resolve options or callback
  let options: PlayKannadaSpeechOptions = {};
  if (typeof optionsOrCb === 'function') {
    options = { onStateChange: optionsOrCb };
  } else if (optionsOrCb) {
    options = optionsOrCb;
  }

  const speed: AudioPlaybackSpeed = options.speed === 0.75 ? 0.75 : 1.0;
  const onStateChange = options.onStateChange;

  // Resolve voice: Girish (Male) or Kaveri (Female)
  const resolvedVoice =
    options.voice === 'male' || options.voice === 'Girish' ? 'Girish' : 'Kaveri';

  // 1. Immediately cancel any currently active playback
  stopKannadaSpeech();

  const abortController = new AbortController();
  activeAbortController = abortController;

  const trimmedText = text.trim();
  if (!trimmedText) {
    onStateChange?.('idle');
    return { source: 'browser-fallback' };
  }

  onStateChange?.('loading');

  const cacheKey = `${language}:${resolvedVoice}:${trimmedText}`;
  let audioData = textAudioCache.get(cacheKey);

  try {
    // 2. Fetch from Gnani Timbre backend if not in memory cache
    if (!audioData) {
      const res = await fetch('/api/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmedText,
          language,
          voice: resolvedVoice,
          speed: 1.0, // Always synthesize at native 1.0x so client can modulate rate cleanly
        }),
        signal: abortController.signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          audioData = {
            audioBase64: data.audioBase64,
            mimeType: data.mimeType || 'audio/wav',
          };
          textAudioCache.set(cacheKey, audioData);
        }
      }
    }

    // Check if aborted while fetching
    if (abortController.signal.aborted) {
      onStateChange?.('idle');
      return { source: 'gnani-timbre' };
    }

    // 3. Play audio via HTML5 Audio with configured playbackRate & pitch preservation
    if (audioData) {
      onStateChange?.('playing');
      await playAudioWithRate(audioData.audioBase64, audioData.mimeType, speed, abortController.signal);
      onStateChange?.('idle');
      return { source: 'gnani-timbre', cached: Boolean(audioData) };
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      onStateChange?.('idle');
      return { source: 'gnani-timbre' };
    }
    // Network or server error -> proceed to browser speech fallback
  }

  // 4. Graceful Browser Web Speech API fallback
  if (abortController.signal.aborted) {
    onStateChange?.('idle');
    return { source: 'browser-fallback' };
  }

  onStateChange?.('fallback');
  playBrowserSpeech(trimmedText, language, speed);
  setTimeout(() => onStateChange?.('idle'), 1600);

  return { source: 'browser-fallback' };
}

function playAudioWithRate(
  base64: string,
  mimeType: string,
  speed: AudioPlaybackSpeed,
  signal: AbortSignal
): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioUrl = `data:${mimeType};base64,${base64}`;
      const audio = new Audio(audioUrl);
      activeAudio = audio;

      // Event listener to reinforce playback rate and pitch preservation across browser lifecycle
      const applyPlaybackSpeed = () => {
        try {
          audio.playbackRate = speed;
          audio.defaultPlaybackRate = speed;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((audio as any).mozPreservesPitch !== undefined) (audio as any).mozPreservesPitch = true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((audio as any).webkitPreservesPitch !== undefined) (audio as any).webkitPreservesPitch = true;
          if ('preservesPitch' in audio) {
            audio.preservesPitch = true;
          }
        } catch {
          // Ignore browser playback rate errors
        }
      };

      applyPlaybackSpeed();
      audio.addEventListener('loadedmetadata', applyPlaybackSpeed);
      audio.addEventListener('canplay', applyPlaybackSpeed);
      audio.addEventListener('play', applyPlaybackSpeed);
      audio.addEventListener('playing', applyPlaybackSpeed);

      const cleanup = () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }
        resolve();
      };

      signal.addEventListener('abort', () => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          // Ignore pause exceptions
        }
        cleanup();
      });

      audio.onended = () => cleanup();
      audio.onerror = () => cleanup();

      audio.play().catch(() => cleanup());
    } catch {
      resolve();
    }
  });
}

function playBrowserSpeech(text: string, language: string, speed: AudioPlaybackSpeed): void {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = speed === 0.75 ? 0.75 : 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis exceptions
  }
}

/**
 * Clears the client-side audio cache.
 */
export function clearAudioPlayerCache(): void {
  textAudioCache.clear();
}
