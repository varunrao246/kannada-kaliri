'use client';

import React, { useState } from 'react';
import { Volume2, Loader2, AlertCircle } from 'lucide-react';
import {
  playKannadaSpeech,
  stopKannadaSpeech,
  type AudioPlaybackSpeed,
  type KannadaVoice,
} from '@/lib/ai/speech/audio-player';

interface WordPronunciationControlProps {
  kannadaText: string;
  wordId?: string;
  activeAudioId?: string | null;
  onActiveChange?: (activeId: string | null) => void;
  className?: string;
  showLabels?: boolean;
}

export function WordPronunciationControl({
  kannadaText,
  wordId = 'word-default',
  activeAudioId,
  onActiveChange,
  className = '',
}: WordPronunciationControlProps) {
  const [speed, setSpeed] = useState<AudioPlaybackSpeed>(1.0);
  const [voice, setVoice] = useState<Extract<KannadaVoice, 'Kaveri' | 'Girish'>>('Kaveri');
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const isCurrentActive = activeAudioId === wordId;

  const handlePlay = async (targetSpeed: AudioPlaybackSpeed = speed, targetVoice: 'Kaveri' | 'Girish' = voice) => {
    setErrorNotice(null);
    setSpeed(targetSpeed);
    setVoice(targetVoice);
    onActiveChange?.(wordId);
    setIsLoading(true);

    try {
      await playKannadaSpeech(kannadaText, 'kn-IN', {
        speed: targetSpeed,
        voice: targetVoice,
        onStateChange: (state) => {
          if (state === 'loading') {
            setIsLoading(true);
          } else if (state === 'playing') {
            setIsLoading(false);
          } else if (state === 'idle') {
            setIsLoading(false);
            if (activeAudioId === wordId) {
              onActiveChange?.(null);
            }
          } else if (state === 'error') {
            setIsLoading(false);
            setErrorNotice('Audio generation failed');
            setTimeout(() => setErrorNotice(null), 3000);
            if (activeAudioId === wordId) {
              onActiveChange?.(null);
            }
          }
        },
      });
    } catch {
      setIsLoading(false);
      setErrorNotice('Audio unavailable');
      setTimeout(() => setErrorNotice(null), 3000);
      onActiveChange?.(null);
    }
  };

  const handleToggleCurrent = () => {
    if (isCurrentActive) {
      stopKannadaSpeech();
      onActiveChange?.(null);
      setIsLoading(false);
    } else {
      handlePlay(speed, voice);
    }
  };

  return (
    <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <div
        className="inline-flex items-center gap-1 bg-[#101D36]/90 border border-[#D5A64A]/30 rounded-xl p-1 shadow-sm backdrop-blur-sm"
        role="group"
        aria-label={`Pronunciation controls for ${kannadaText}`}
      >
        {/* Main Speaker Button */}
        <button
          type="button"
          onClick={handleToggleCurrent}
          disabled={isLoading}
          aria-label={`Listen to ${kannadaText} (${voice === 'Kaveri' ? 'Female' : 'Male'})`}
          title={isCurrentActive ? 'Stop pronunciation' : `Pronounce "${kannadaText}" (${voice})`}
          className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
            isCurrentActive
              ? 'bg-[#D5A64A] text-[#101D36] scale-105 shadow-sm'
              : 'text-[#D5A64A] hover:bg-[#D5A64A]/15 active:scale-95'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#D5A64A]" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        {/* Divider */}
        <span className="w-px h-3.5 bg-white/10 mx-0.5" aria-hidden="true" />

        {/* Voice Gender Switcher: Kaveri (Female) & Girish (Male) */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5" role="radiogroup" aria-label="Voice selection">
          <button
            type="button"
            onClick={() => handlePlay(speed, 'Kaveri')}
            title="Female Voice (Kaveri)"
            aria-label="Female voice"
            className={`px-1.5 py-0.5 rounded text-[11px] font-sans transition-all cursor-pointer ${
              voice === 'Kaveri'
                ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-2xs'
                : 'text-[#EDE5D6]/70 hover:text-[#EDE5D6] hover:bg-white/5'
            }`}
          >
            👩 F
          </button>
          <button
            type="button"
            onClick={() => handlePlay(speed, 'Girish')}
            title="Male Voice (Girish)"
            aria-label="Male voice"
            className={`px-1.5 py-0.5 rounded text-[11px] font-sans transition-all cursor-pointer ${
              voice === 'Girish'
                ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-2xs'
                : 'text-[#EDE5D6]/70 hover:text-[#EDE5D6] hover:bg-white/5'
            }`}
          >
            👨 M
          </button>
        </div>

        {/* Divider */}
        <span className="w-px h-3.5 bg-white/10 mx-0.5" aria-hidden="true" />

        {/* Slow Speed Button (0.75x) */}
        <button
          type="button"
          onClick={() => handlePlay(0.75, voice)}
          aria-label={`Pronounce ${kannadaText} slowly`}
          aria-pressed={speed === 0.75 && isCurrentActive}
          className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
            speed === 0.75 && isCurrentActive
              ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-xs'
              : speed === 0.75
              ? 'bg-[#D5A64A]/20 text-[#D5A64A] font-semibold'
              : 'text-[#EDE5D6]/70 hover:text-[#EDE5D6] hover:bg-white/5'
          }`}
        >
          Slow
        </button>

        {/* Normal Speed Button (1.0x) - Default */}
        <button
          type="button"
          onClick={() => handlePlay(1.0, voice)}
          aria-label={`Pronounce ${kannadaText} at normal speed`}
          aria-pressed={speed === 1.0 && isCurrentActive}
          className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
            speed === 1.0 && isCurrentActive
              ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-xs'
              : speed === 1.0
              ? 'bg-[#D5A64A]/20 text-[#D5A64A] font-semibold'
              : 'text-[#EDE5D6]/70 hover:text-[#EDE5D6] hover:bg-white/5'
          }`}
        >
          Normal
        </button>
      </div>

      {errorNotice && (
        <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
          <AlertCircle className="w-3 h-3" />
          {errorNotice}
        </span>
      )}
    </div>
  );
}

