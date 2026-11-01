'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  Square,
  Volume2,
  RotateCcw,
  Play,
  Pause,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { playKannadaSpeech, stopKannadaSpeech } from '@/lib/ai/speech/audio-player';
import { startAudioRecording, type AudioRecorderController } from '@/lib/ai/speech/audio-recorder';
import type { SpeechComparisonResult } from '@/lib/ai/speech/types';

interface VoicePracticeProps {
  expectedText: string;
  expectedTransliteration?: string;
  expectedMeaning?: string;
  onSuccess?: () => void;
  title?: string;
}

type AudioState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

export default function VoicePractice({
  expectedText,
  expectedTransliteration,
  expectedMeaning,
  onSuccess,
  title = 'Speaking Practice',
}: VoicePracticeProps) {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [comparison, setComparison] = useState<SpeechComparisonResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [audioSourceNotice, setAudioSourceNotice] = useState<string | null>(null);
  const [sttProvider, setSttProvider] = useState<string | null>(null);
  const [referenceVoice, setReferenceVoice] = useState<'Kaveri' | 'Girish'>('Kaveri');
  const [referenceSpeed, setReferenceSpeed] = useState<0.75 | 1.0>(1.0);

  const recorderRef = useRef<AudioRecorderController | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Clean up media streams and object URLs on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
      stopKannadaSpeech();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Pronounce reference phrase using provider
  const handlePlayReference = async (
    targetVoice: 'Kaveri' | 'Girish' = referenceVoice,
    targetSpeed: 0.75 | 1.0 = referenceSpeed
  ) => {
    setReferenceVoice(targetVoice);
    setReferenceSpeed(targetSpeed);
    const result = await playKannadaSpeech(expectedText, 'kn-IN', {
      voice: targetVoice,
      speed: targetSpeed,
      onStateChange: (st) => {
        if (st === 'fallback') {
          setAudioSourceNotice('Using browser speech fallback');
        } else if (st === 'playing') {
          setAudioSourceNotice(
            `Playing ${targetVoice === 'Kaveri' ? '👩 Kaveri (Female)' : '👨 Girish (Male)'} at ${targetSpeed}x`
          );
        } else if (st === 'idle') {
          setTimeout(() => setAudioSourceNotice(null), 2500);
        }
      },
    });

    if (result.source === 'browser-fallback') {
      setAudioSourceNotice('Audio: Browser speech fallback');
      setTimeout(() => setAudioSourceNotice(null), 3000);
    }
  };

  // Send audio to /api/speech/transcribe
  const processAudio = useCallback(async (audioBlob: Blob) => {
    setAudioState('processing');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'spoken_kannada.wav');
      formData.append('language', 'kn-IN');
      formData.append('expectedText', expectedText);
      if (expectedTransliteration) {
        formData.append('expectedTransliteration', expectedTransliteration);
      }

      const res = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error || 'Speech transcription could not be completed at this time.'
        );
        setAudioState('error');
        return;
      }

      setComparison(data.comparison);
      setSttProvider(data.provider || 'gnani-prisma');
      setAudioState('completed');

      if (data.comparison?.isMatch && onSuccess) {
        onSuccess();
      }
    } catch {
      setErrorMessage('Network connection lost while analyzing speech. Please try again.');
      setAudioState('error');
    }
  }, [expectedText, expectedTransliteration, onSuccess]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    const controller = recorderRef.current;
    if (!controller) return;
    recorderRef.current = null;
    setAudioState('processing');

    try {
      const { blob } = await controller.stop();
      if (blob.size === 0) {
        setErrorMessage('Empty recording detected. Please speak into your microphone.');
        setAudioState('error');
        return;
      }

      const localUrl = URL.createObjectURL(blob);
      setAudioUrl(localUrl);

      // Process audio with backend
      await processAudio(blob);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Recording failed.');
      setAudioState('error');
    }
  }, [processAudio]);

  // Start recording authentic 16kHz mono WAV
  const startRecording = async () => {
    setErrorMessage(null);
    setComparison(null);
    stopKannadaSpeech();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      setAudioState('recording');
      setRecordingSeconds(0);

      const controller = await startAudioRecording(15, (sec) => {
        setRecordingSeconds(sec);
        if (sec >= 15) {
          stopRecording();
        }
      });

      recorderRef.current = controller;
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser settings to practise speaking.'
        );
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('No microphone device was found on your computer or mobile device.');
      } else {
        setErrorMessage(`Microphone error: ${error.message || 'Unable to access microphone'}`);
      }
      setAudioState('error');
    }
  };

  // Play learner's recorded audio
  const handleTogglePlayback = () => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingRecorded(false);
    }

    if (isPlayingRecorded) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsPlayingRecorded(false);
    } else {
      stopKannadaSpeech();
      audioElementRef.current.play().catch(() => {});
      setIsPlayingRecorded(true);
    }
  };

  const handleReset = () => {
    stopKannadaSpeech();
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    setAudioState('idle');
    setComparison(null);
    setSttProvider(null);
    setErrorMessage(null);
    setRecordingSeconds(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0A1222] via-[#101D36] to-[#0A1222] border border-[#D5A64A]/30 p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D5A64A]" />
          <h3 className="font-serif text-lg font-bold text-[#F8F5EE]">{title}</h3>
        </div>

        {audioSourceNotice && (
          <span className="text-[10px] text-[#D5A64A] bg-[#D5A64A]/10 px-2.5 py-1 rounded-full border border-[#D5A64A]/25">
            {audioSourceNotice}
          </span>
        )}
      </div>

      {/* Target Phrase Display */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 text-center space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D5A64A] block">
          Say this in Kannada:
        </span>

        <p className="font-kannada text-4xl sm:text-5xl font-bold text-[#F8F5EE]">
          {expectedText}
        </p>

        {expectedTransliteration && (
          <p className="text-sm font-mono text-[#D5A64A]">&quot;{expectedTransliteration}&quot;</p>
        )}

        {expectedMeaning && (
          <p className="text-xs text-[#EDE5D6]/70 italic">{expectedMeaning}</p>
        )}

        {/* Reference Pronunciation Controls (Dual Voice & Dual Speed) */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handlePlayReference(referenceVoice, referenceSpeed)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#101D36] text-xs font-semibold text-[#D5A64A] border border-[#D5A64A]/40 hover:bg-[#D5A64A]/10 transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Hear Pronunciation</span>
          </button>

          {/* Voice Switcher */}
          <div className="inline-flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handlePlayReference('Kaveri', referenceSpeed)}
              title="Kaveri (Female Voice)"
              className={`px-2 py-1 rounded-lg text-[11px] font-sans transition-all cursor-pointer ${
                referenceVoice === 'Kaveri'
                  ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-xs'
                  : 'text-[#EDE5D6]/70 hover:text-[#EDE5D6]'
              }`}
            >
              👩 Kaveri
            </button>
            <button
              type="button"
              onClick={() => handlePlayReference('Girish', referenceSpeed)}
              title="Girish (Male Voice)"
              className={`px-2 py-1 rounded-lg text-[11px] font-sans transition-all cursor-pointer ${
                referenceVoice === 'Girish'
                  ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-xs'
                  : 'text-[#EDE5D6]/70 hover:text-[#EDE5D6]'
              }`}
            >
              👨 Girish
            </button>
          </div>

          {/* Speed Switcher */}
          <div className="inline-flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handlePlayReference(referenceVoice, 0.75)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                referenceSpeed === 0.75
                  ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-xs'
                  : 'text-[#EDE5D6]/70 hover:text-[#EDE5D6]'
              }`}
            >
              Slow
            </button>
            <button
              type="button"
              onClick={() => handlePlayReference(referenceVoice, 1.0)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                referenceSpeed === 1.0
                  ? 'bg-[#D5A64A] text-[#101D36] font-bold shadow-xs'
                  : 'text-[#EDE5D6]/70 hover:text-[#EDE5D6]'
              }`}
            >
              Normal
            </button>
          </div>
        </div>
      </div>

      {/* Recording Area */}
      <div className="flex flex-col items-center justify-center space-y-4 py-2">
        {audioState === 'idle' && (
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-[#D5A64A] text-[#101D36] flex items-center justify-center shadow-lg shadow-[#D5A64A]/30 hover:scale-105 transition-transform cursor-pointer"
              aria-label="Start recording"
            >
              <Mic className="w-8 h-8" />
            </button>
            <p className="text-xs text-[#EDE5D6]/70">
              Tap the microphone to speak your answer (recorded in clean WAV)
            </p>
          </div>
        )}

        {audioState === 'recording' && (
          <div className="text-center space-y-4">
            <div className="relative">
              <button
                type="button"
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 animate-pulse cursor-pointer"
                aria-label="Stop recording"
              >
                <Square className="w-7 h-7 fill-white" />
              </button>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-red-400">
                Recording... 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </p>
              <p className="text-xs text-[#EDE5D6]/60">
                Tap square button when finished (max 15s)
              </p>
            </div>
          </div>
        )}

        {audioState === 'processing' && (
          <div className="text-center space-y-3 py-4">
            <Loader2 className="w-10 h-10 text-[#D5A64A] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#F8F5EE]">
              Analyzing your Kannada speech...
            </p>
            <p className="text-xs text-[#EDE5D6]/60">
              Converting audio to text and verifying pronunciation via Gnani Prisma
            </p>
          </div>
        )}

        {audioState === 'error' && (
          <div className="w-full rounded-2xl bg-red-500/10 border border-red-500/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-left flex-1">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Microphone / Speech Notice
                </p>
                <p className="text-xs text-[#EDE5D6]/80 leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#EDE5D6] hover:bg-white/10 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {audioState === 'completed' && comparison && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-4"
          >
            {/* Feedback Banner */}
            <div
              className={`rounded-2xl p-5 border ${
                comparison.isMatch
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {comparison.isMatch ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-left flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {comparison.isMatch ? 'Speech Recognized' : 'Try Speaking Again'}
                    </p>
                    <div className="flex items-center gap-2">
                      {sttProvider && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 border border-white/10 text-[#EDE5D6]/80">
                          STT: {sttProvider === 'gnani-prisma' ? 'Gnani Prisma' : 'Mock Adapter'}
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold">
                        {comparison.similarityScore}% match
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#EDE5D6]/90 leading-relaxed">
                    {comparison.feedbackMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* Recognized vs Expected Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#EDE5D6]/50 uppercase tracking-wider font-semibold block">
                  We Heard (Recognized Text)
                </span>
                <p className="font-kannada text-lg font-bold text-[#F8F5EE]">
                  {comparison.recognizedText || '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#EDE5D6]/50 uppercase tracking-wider font-semibold block">
                  Target Phrase
                </span>
                <p className="font-kannada text-lg font-bold text-[#D5A64A]">
                  {expectedText}
                </p>
              </div>
            </div>

            {/* Actions: Replay user audio & Retry */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {audioUrl && (
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#EDE5D6] hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isPlayingRecorded ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingRecorded ? 'Pause Recording' : 'Listen to Your Voice'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D5A64A] text-[#101D36] text-xs font-bold uppercase tracking-wider hover:bg-[#E8C77F] transition-colors cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practise Again</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
