'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import type {
  ScenarioDefinition,
  ScenarioChatMessage,
  ScenarioAssistanceOptions,
  ScenarioCompletionFeedback,
} from '@/lib/scenarios/types';
import type { LearnerTutoringContext } from '@/lib/ai/tutor/types';
import { playKannadaSpeech, stopKannadaSpeech } from '@/lib/ai/speech/audio-player';
import { startAudioRecording, type AudioRecorderController } from '@/lib/ai/speech/audio-recorder';
import { ScenarioFeedbackModal } from './ScenarioFeedbackModal';

interface ScenarioSimulatorViewProps {
  scenario: ScenarioDefinition;
  learnerContext: LearnerTutoringContext;
  attemptId: string;
  initialMessages: ScenarioChatMessage[];
  isAIConfigured: boolean;
}

export function ScenarioSimulatorView({
  scenario,
  learnerContext,
  attemptId: initialAttemptId,
  initialMessages,
  isAIConfigured: initialConfigured,
}: ScenarioSimulatorViewProps) {
  // Pre-seed initial character message if history is empty
  const [messages, setMessages] = useState<ScenarioChatMessage[]>(() => {
    if (initialMessages.length > 0) return initialMessages;
    return [
      {
        id: 'msg-init-char',
        attemptId: initialAttemptId,
        role: 'character',
        kannadaText: scenario.initialMessage.kannadaText,
        transliteration: scenario.initialMessage.transliteration,
        englishTranslation: scenario.initialMessage.englishTranslation,
        suggestedReplies: scenario.initialMessage.suggestedReplies,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(initialConfigured);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Assistance settings
  const [assistance, setAssistance] = useState<ScenarioAssistanceOptions>({
    showTransliteration: true,
    showTranslation: true,
    showGrammarTips: true,
  });

  // Audio Playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioSourceNotice, setAudioSourceNotice] = useState<string | null>(null);

  // Speech recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef<AudioRecorderController | null>(null);

  // Final evaluation / Feedback state
  const [completionFeedback, setCompletionFeedback] = useState<ScenarioCompletionFeedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up recorder and audio on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
      stopKannadaSpeech();
    };
  }, []);

  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  // Complete scenario and view evaluation feedback
  const handleCompleteScenario = useCallback(
    async (currentMessages?: ScenarioChatMessage[]) => {
      const msgs = currentMessages || messages;
      setIsEvaluating(true);
      try {
        const transcript = msgs.map((m) => ({
          role: m.role,
          content: m.kannadaText,
        }));

        const res = await fetch('/api/scenarios/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: scenario.id,
            attemptId: initialAttemptId,
            transcript,
          }),
        });

        const data = await res.json();
        if (res.ok && data.feedback) {
          setCompletionFeedback(data.feedback);
          setShowFeedbackModal(true);
        }
      } catch (err) {
        console.error('Failed to finalize scenario:', err);
      } finally {
        setIsEvaluating(false);
      }
    },
    [initialAttemptId, messages, scenario.id]
  );

  // Handle sending a turn
  const handleSendTurn = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputText).trim();
      if (!text || isLoading) return;

      setInputText('');
      setErrorMessage(null);

      counterRef.current += 1;
      const tempMsgId = `user-msg-${counterRef.current}`;
      const userMsg: ScenarioChatMessage = {
        id: tempMsgId,
        attemptId: initialAttemptId,
        role: 'user',
        kannadaText: text,
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      const transcriptForAPI = updatedMessages.map((m) => ({
        role: m.role,
        content: m.kannadaText,
      }));

      try {
        const res = await fetch('/api/scenarios/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: scenario.id,
            attemptId: initialAttemptId,
            message: text,
            transcript: transcriptForAPI,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error === 'AI_PROVIDER_NOT_CONFIGURED') {
            setIsConfigured(false);
            setErrorMessage(
              'AI runtime key is required in server .env.local to simulate real-time character responses.'
            );
          } else {
            setErrorMessage(data.message || 'Failed to interact with character.');
          }
          return;
        }

        if (data.characterMessage) {
          setMessages((prev) => [...prev, data.characterMessage]);

          // Automatically prompt completion if scenario objective is achieved
          if (data.isObjectiveCompleted && updatedMessages.length >= scenario.targetTurns * 2) {
            handleCompleteScenario(updatedMessages);
          }
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [handleCompleteScenario, initialAttemptId, inputText, isLoading, messages, scenario.id, scenario.targetTurns]
  );

  // Play audio using Gnani Timbre with fallback & character voice gender
  const handlePlayAudio = useCallback(
    async (text: string, msgId: string) => {
      if (playingMessageId === msgId) return;

      setPlayingMessageId(msgId);
      const charVoice = scenario.character.voiceGender === 'male' ? 'Girish' : 'Kaveri';
      setAudioSourceNotice(`Synthesizing ${scenario.character.name}'s voice (${charVoice})...`);

      try {
        const result = await playKannadaSpeech(text, 'kn-IN', {
          voice: charVoice,
          onStateChange: (state) => {
            if (state === 'playing') {
              setAudioSourceNotice(
                `Voice: Gnani Timbre (${charVoice} - ${scenario.character.name})`
              );
            } else if (state === 'idle') {
              setPlayingMessageId(null);
              setAudioSourceNotice(null);
            }
          },
        });

        if (result.source === 'browser-fallback') {
          setAudioSourceNotice('Voice: Browser Speech Fallback');
          setTimeout(() => {
            setPlayingMessageId(null);
            setAudioSourceNotice(null);
          }, 3000);
        }
      } catch {
        setPlayingMessageId(null);
        setAudioSourceNotice(null);
      }
    },
    [playingMessageId, scenario.character.name, scenario.character.voiceGender]
  );

  // Audio recording with authentic 16kHz PCM WAV
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setIsRecording(true);
      setRecordingSeconds(0);

      const controller = await startAudioRecording(15, (seconds) => {
        setRecordingSeconds(seconds);
      });
      recorderRef.current = controller;
    } catch (err) {
      setIsRecording(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Microphone access was denied or is not supported.'
      );
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    setIsRecording(false);
    try {
      const result = await recorderRef.current.stop();
      recorderRef.current = null;
      if (result.blob && result.blob.size > 0) {
        await transcribeRecordedAudio(result.blob);
      }
    } catch (err) {
      recorderRef.current = null;
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not process audio recording.'
      );
    }
  };

  const transcribeRecordedAudio = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'roleplay_recording.wav');
      formData.append('language', 'kn-IN');

      const res = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        if (data.transcript && data.transcript.trim().length > 0) {
          setInputText(data.transcript);
          setErrorMessage(null);
        } else {
          setErrorMessage(
            data.message ||
              'No speech was clearly detected. Please speak closer to the microphone and try again.'
          );
        }
      } else {
        setErrorMessage(
          data.error ||
            data.message ||
            'Could not transcribe speech. Please try speaking again or typing your response.'
        );
      }
    } catch {
      setErrorMessage('Failed to send recording to transcription service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setMessages([
      {
        id: 'msg-init-char',
        attemptId: initialAttemptId,
        role: 'character',
        kannadaText: scenario.initialMessage.kannadaText,
        transliteration: scenario.initialMessage.transliteration,
        englishTranslation: scenario.initialMessage.englishTranslation,
        suggestedReplies: scenario.initialMessage.suggestedReplies,
        createdAt: new Date().toISOString(),
      },
    ]);
    setShowFeedbackModal(false);
  };

  // Latest character suggested replies
  const latestCharacterMsg = [...messages].reverse().find((m) => m.role === 'character');
  const activeSuggestedReplies = latestCharacterMsg?.suggestedReplies || [];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto px-4 py-4 sm:py-6">
      {/* ─── Scenario & Character Header ────────────────────────────── */}
      <header className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/scenarios"
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-sm transition-colors"
            title="Back to Scenarios"
          >
            ←
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            {scenario.character.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {scenario.character.name} <span className="text-xs font-semibold text-amber-900">({scenario.character.role})</span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {scenario.difficulty}
              </span>
            </div>
            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <span>📍 {scenario.location}</span>
              <span>·</span>
              <span>{scenario.title}</span>
              <span>·</span>
              <span className="text-slate-700 font-medium">Explanations in {learnerContext.nativeLanguageName}</span>
            </p>
          </div>
        </div>

        {/* Turn Progress & Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="px-3 py-1 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 font-medium">
            Turn: <strong className="text-slate-900">{userTurnCount}</strong> / {scenario.targetTurns}
          </div>

          <button
            onClick={() => handleCompleteScenario()}
            disabled={isEvaluating || userTurnCount === 0}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isEvaluating ? 'Evaluating...' : 'Finish & Review'}</span>
            <span>✓</span>
          </button>
        </div>
      </header>

      {/* ─── Learning Assistance Bar ─────────────────────────────────── */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span>💡 Learning Assistance:</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={assistance.showTransliteration}
              onChange={(e) =>
                setAssistance((prev) => ({ ...prev, showTransliteration: e.target.checked }))
              }
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Transliteration</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={assistance.showTranslation}
              onChange={(e) =>
                setAssistance((prev) => ({ ...prev, showTranslation: e.target.checked }))
              }
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Meaning</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={assistance.showGrammarTips}
              onChange={(e) =>
                setAssistance((prev) => ({ ...prev, showGrammarTips: e.target.checked }))
              }
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Grammar Tips</span>
          </label>
        </div>
      </div>

      {/* ─── Unconfigured Guidance Banner ────────────────────────────── */}
      {!isConfigured && (
        <div className="mb-3 bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="font-semibold text-amber-950 flex items-center gap-1">
                <span>⚡</span>
                <span>AI API Key Needed for Live Roleplay</span>
              </div>
              <p>
                To enable live dynamic character responses, configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">AI_API_KEY</code> in <code className="font-mono">.env.local</code>.
              </p>
            </div>
            <Link
              href="/scenarios"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shrink-0"
            >
              Back
            </Link>
          </div>
        </div>
      )}

      {/* ─── Error Notification ──────────────────────────────────────── */}
      {errorMessage && (
        <div className="mb-2 bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-xl text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ─── Audio Notice ────────────────────────────────────────────── */}
      {audioSourceNotice && (
        <div className="mb-2 text-center text-xs text-amber-800 bg-amber-50 border border-amber-200 py-1 px-3 rounded-full w-fit mx-auto animate-pulse">
          🔊 {audioSourceNotice}
        </div>
      )}

      {/* ─── Chat Message Stream ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 p-3 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-inner">
        {messages.map((msg) => (
          <ScenarioMessageBubble
            key={msg.id}
            message={msg}
            character={scenario.character}
            assistance={assistance}
            onPlayAudio={handlePlayAudio}
            isPlayingAudio={playingMessageId === msg.id}
          />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 max-w-lg">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-sm shadow-inner">
              {scenario.character.avatar}
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-sm text-xs text-stone-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{scenario.character.name} is responding in Kannada...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Suggested Replies (Chips) ───────────────────────────────── */}
      {activeSuggestedReplies.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-stone-400 shrink-0">Try saying:</span>
          {activeSuggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSendTurn(reply.split('(')[0].trim())}
              className="shrink-0 px-3 py-1 rounded-full bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50/60 text-xs text-slate-800 transition-all shadow-2xs text-left"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* ─── Input Controls ──────────────────────────────────────────── */}
      <footer className="mt-2 bg-white border border-stone-200 rounded-2xl p-2.5 sm:p-3 shadow-sm">
        {isRecording && (
          <div className="mb-2 bg-red-50 border border-red-200 rounded-xl p-2 px-3 flex items-center justify-between text-xs text-red-700 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>Recording Kannada speech... ({recordingSeconds}s / 15s)</span>
            </div>
            <button
              onClick={stopRecording}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-xs"
            >
              Done Recording
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Mic Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`p-2.5 rounded-xl border transition-all ${
              isRecording
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-stone-50 text-stone-700 hover:bg-amber-50 hover:text-amber-800 border-stone-200'
            }`}
            title={isRecording ? 'Stop Recording' : 'Speak Kannada (Gnani STT)'}
          >
            🎙️
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendTurn();
              }
            }}
            placeholder={`Reply to ${scenario.character.name} in Kannada...`}
            disabled={isLoading || isRecording}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendTurn()}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Send</span>
            <span>↗</span>
          </button>
        </div>
      </footer>

      {/* ─── Feedback & Evaluation Modal ─────────────────────────────── */}
      {showFeedbackModal && completionFeedback && (
        <ScenarioFeedbackModal
          feedback={completionFeedback}
          scenario={scenario}
          onRestart={handleRestart}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-Component: Scenario Message Bubble ────────────────────────────────

interface ScenarioMessageBubbleProps {
  message: ScenarioChatMessage;
  character: ScenarioDefinition['character'];
  assistance: ScenarioAssistanceOptions;
  onPlayAudio: (text: string, id: string) => void;
  isPlayingAudio: boolean;
}

const ScenarioMessageBubble = memo(function ScenarioMessageBubble({
  message,
  character,
  assistance,
  onPlayAudio,
  isPlayingAudio,
}: ScenarioMessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-xl bg-slate-900 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs">
          <p className="text-sm font-sans whitespace-pre-wrap">{message.kannadaText}</p>
        </div>
      </div>
    );
  }

  // Character Bubble
  return (
    <div className="flex items-start gap-3 max-w-2xl">
      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-sm shrink-0 mt-1 shadow-inner">
        {character.avatar}
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-4 shadow-sm text-slate-800 space-y-2">
          {/* Primary Kannada Text + Audio Button */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-bold text-slate-900 font-sans tracking-wide leading-relaxed">
              {message.kannadaText}
            </p>
            <button
              onClick={() => onPlayAudio(message.kannadaText, message.id)}
              className={`p-2 rounded-lg border transition-all shrink-0 ${
                isPlayingAudio
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : 'bg-stone-50 text-stone-700 hover:text-amber-700 hover:border-amber-300 border-stone-200'
              }`}
              title="Listen with Gnani Timbre TTS"
            >
              🔊
            </button>
          </div>

          {/* Transliteration */}
          {assistance.showTransliteration && message.transliteration && (
            <p className="text-xs font-medium text-amber-900/90 italic border-t border-stone-100 pt-1.5">
              {message.transliteration}
            </p>
          )}

          {/* Meaning */}
          {assistance.showTranslation && message.englishTranslation && (
            <p className="text-xs text-stone-600">
              Meaning: {message.englishTranslation}
            </p>
          )}

          {/* Grammar Insight Tip */}
          {assistance.showGrammarTips && message.grammarExplanation && (
            <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] text-amber-950 bg-amber-50/70 p-2 rounded-lg">
              <span className="font-semibold text-amber-900">Cultural &amp; Language Note: </span>
              {message.grammarExplanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
