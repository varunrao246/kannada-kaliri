'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { LearnerTutoringContext, TutorChatMessage, TutorStructuredResponse } from '@/lib/ai/tutor/types';
import { playKannadaSpeech, stopKannadaSpeech } from '@/lib/ai/speech/audio-player';
import { startAudioRecording, type AudioRecorderController } from '@/lib/ai/speech/audio-recorder';

interface GuruChatViewProps {
  initialContext: LearnerTutoringContext;
  initialMessages: TutorChatMessage[];
  conversationId: string;
  isAIConfigured: boolean;
}

const STARTER_PROMPTS = [
  'How do I order coffee in a Bengaluru Darshini?',
  'Teach me basic Kannada greetings with polite forms',
  'How do I ask an auto driver "Meter haaki"?',
  'Explain how Kannada SOV word order works',
];

export function GuruChatView({
  initialContext,
  initialMessages,
  conversationId: initialConvId,
  isAIConfigured: initialConfigured,
}: GuruChatViewProps) {
  const [messages, setMessages] = useState<TutorChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(initialConfigured);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioSourceNotice, setAudioSourceNotice] = useState<string | null>(null);

  // Speech recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef<AudioRecorderController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up recording controller on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
      stopKannadaSpeech();
    };
  }, []);

  const counterRef = useRef(0);

  const handleSendMessage = React.useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputText).trim();
      if (!text || isLoading) return;

      setInputText('');
      setErrorMessage(null);

      counterRef.current += 1;
      const tempUserId = `user-msg-${counterRef.current}`;
      const userMsg: TutorChatMessage = {
        id: tempUserId,
        conversationId: initialConvId,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/guru/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error === 'AI_PROVIDER_NOT_CONFIGURED') {
            setIsConfigured(false);
            setErrorMessage(
              data.message ||
                'The AI Guru requires an AI_API_KEY (or GEMINI_API_KEY) in server .env.local to generate real-time responses.'
            );
          } else {
            setErrorMessage(data.message || 'Failed to communicate with Guru.');
          }
          return;
        }

        if (data.assistantMessage) {
          setMessages((prev) => [...prev, data.assistantMessage]);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [initialConvId, inputText, isLoading]
  );

  const handlePlayAudio = async (text: string, msgId: string) => {
    if (playingMessageId === msgId) return;

    setPlayingMessageId(msgId);
    setAudioSourceNotice('Synthesizing speech...');

    try {
      const result = await playKannadaSpeech(text, 'kn-IN', (state) => {
        if (state === 'playing') {
          setAudioSourceNotice(
            result?.source === 'gnani-timbre' ? 'Playing: Gnani Timbre TTS' : 'Playing: Browser Audio'
          );
        } else if (state === 'idle') {
          setPlayingMessageId(null);
          setAudioSourceNotice(null);
        }
      });

      setAudioSourceNotice(
        result.source === 'gnani-timbre' ? 'Audio Source: Gnani Timbre' : 'Audio Source: Browser Voice'
      );
      setTimeout(() => {
        setPlayingMessageId(null);
        setAudioSourceNotice(null);
      }, 3500);
    } catch {
      setPlayingMessageId(null);
      setAudioSourceNotice(null);
    }
  };

  // Microphone recording (clean 16kHz mono WAV)
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      stopKannadaSpeech();
      setIsRecording(true);
      setRecordingSeconds(0);

      const controller = await startAudioRecording(15, (sec) => {
        setRecordingSeconds(sec);
        if (sec >= 15) {
          stopRecording();
        }
      });

      recorderRef.current = controller;
    } catch (err: unknown) {
      setIsRecording(false);
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied in your browser settings.');
      } else {
        setErrorMessage('Microphone access was denied or is not supported.');
      }
    }
  };

  const stopRecording = async () => {
    const controller = recorderRef.current;
    if (!controller) return;
    recorderRef.current = null;
    setIsRecording(false);

    try {
      const { blob } = await controller.stop();
      if (blob.size > 0) {
        await transcribeRecordedAudio(blob);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Recording failed.');
    }
  };

  const transcribeRecordedAudio = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'speech.wav');
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
              'No speech was clearly detected. Please hold the microphone closer and speak clearly in Kannada.'
          );
        }
      } else {
        setErrorMessage(
          data.error ||
            data.message ||
            'Could not transcribe speech. Please try speaking again or typing your message.'
        );
      }
    } catch {
      setErrorMessage('Failed to send speech recording to transcription service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Do you want to clear your conversation history with Guru?')) return;
    try {
      const res = await fetch('/api/guru/conversations', { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto px-4 py-4 sm:py-6">
      {/* ─── Guru Header ────────────────────────────────────────────── */}
      <header className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-2xl shadow-inner">
            🪔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                ಕನ್ನಡ ಗುರು <span className="text-amber-700 font-serif">· AI Guru</span>
              </h1>
              {isConfigured ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Key Needed
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Personalized Kannada Tutor · Explanations in{' '}
              <span className="font-semibold text-slate-700">{initialContext.nativeLanguageName}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
            Level: <strong className="capitalize">{initialContext.proficiencyLevel}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            {initialContext.currentLessonTitle}
          </span>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-2.5 py-1 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 border border-stone-200 transition-colors"
              title="Clear conversation"
            >
              Clear Chat
            </button>
          )}
        </div>
      </header>

      {/* ─── Unconfigured Guidance Banner ────────────────────────────── */}
      {!isConfigured && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950 text-sm">
                <span>⚡</span>
                <span>AI Runtime Credentials Required</span>
              </div>
              <p>
                To chat live with Kannada Guru, add your AI API key to{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-mono">.env.local</code>:
              </p>
              <pre className="mt-1 bg-stone-900 text-amber-200 p-2 rounded-lg font-mono text-[11px] overflow-x-auto">
{`AI_PROVIDER=google
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-1.5-flash`}
              </pre>
              <p className="text-stone-600 pt-1">
                Supports Google Gemini, OpenAI (<code className="font-mono">AI_PROVIDER=openai</code>), and Groq (<code className="font-mono">AI_PROVIDER=groq</code>).
              </p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* ─── Error Notification ──────────────────────────────────────── */}
      {errorMessage && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ─── Audio notice ────────────────────────────────────────────── */}
      {audioSourceNotice && (
        <div className="mb-2 text-center text-xs text-amber-800 bg-amber-50/80 border border-amber-200 py-1 px-3 rounded-full w-fit mx-auto animate-pulse">
          🔊 {audioSourceNotice}
        </div>
      )}

      {/* ─── Chat Message Feed ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 p-2 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200/80 shadow-inner">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl shadow-sm">
              ನ
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                ನಮಸ್ಕಾರ {initialContext.learnerName}!
              </h2>
              <p className="text-sm text-stone-600">
                I am your Kannada Guru. Ask me anything about Kannada grammar, daily conversations, vocabulary, or culture.
              </p>
            </div>

            <div className="w-full pt-2 space-y-2">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Suggested Topics to Start:
              </p>
              <div className="flex flex-col gap-2">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-3 rounded-xl bg-white border border-stone-200 text-xs text-slate-800 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-xs transition-all flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <span className="text-amber-500 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onPlayAudio={handlePlayAudio}
              isPlayingAudio={playingMessageId === msg.id}
              onReplyChipClick={(reply) => handleSendMessage(reply)}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-start gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-300 flex items-center justify-center text-sm">
              🪔
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>ಕನ್ನಡ ಗುರು is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Chat Input Area ─────────────────────────────────────────── */}
      <footer className="mt-3 bg-white border border-stone-200 rounded-2xl p-2.5 sm:p-3 shadow-sm">
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
          {/* Microphone Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`p-2.5 rounded-xl border transition-all ${
              isRecording
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-stone-50 text-stone-700 hover:bg-amber-50 hover:text-amber-800 border-stone-200'
            }`}
            title={isRecording ? 'Stop Recording' : 'Speak to Guru (Gnani STT)'}
          >
            🎙️
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask Guru anything in English, Kannada, or your native language..."
            disabled={isLoading || isRecording}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Send</span>
            <span>↗</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-Component: Message Item ──────────────────────────────────────────

interface MessageItemProps {
  message: TutorChatMessage;
  onPlayAudio: (text: string, id: string) => void;
  isPlayingAudio: boolean;
  onReplyChipClick: (text: string) => void;
}

function MessageItem({
  message,
  onPlayAudio,
  isPlayingAudio,
  onReplyChipClick,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const structured: TutorStructuredResponse | null = message.structuredResponse ?? null;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-xl bg-slate-900 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant / Guru Message
  return (
    <div className="flex items-start gap-3 max-w-2xl">
      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-sm shrink-0 mt-1 shadow-inner">
        🪔
      </div>

      <div className="flex-1 space-y-3">
        {/* Main Bubble */}
        <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-4 shadow-sm text-slate-800 space-y-3">
          {/* Main Message Content */}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

          {/* Structured Kannada Practice Card */}
          {structured?.kannadaText && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xl font-bold text-slate-900 font-sans tracking-wide">
                    {structured.kannadaText}
                  </div>
                  {structured.transliteration && (
                    <div className="text-xs font-medium text-amber-900/80 italic mt-0.5">
                      {structured.transliteration}
                    </div>
                  )}
                  {structured.translation && (
                    <div className="text-xs text-stone-600 mt-1">
                      Meaning: {structured.translation}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onPlayAudio(structured.kannadaText!, message.id)}
                  className={`p-2 rounded-lg border transition-all shrink-0 ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                      : 'bg-white text-stone-700 hover:text-amber-700 hover:border-amber-300 border-stone-200 shadow-xs'
                  }`}
                  title="Listen with Gnani Timbre TTS"
                >
                  🔊
                </button>
              </div>

              {/* Cultural or Grammatical Explanation */}
              {structured.explanation && (
                <div className="pt-2 border-t border-amber-200/60 text-xs text-stone-700 leading-relaxed">
                  <span className="font-semibold text-amber-900">Grammar Insight: </span>
                  {structured.explanation}
                </div>
              )}
            </div>
          )}

          {/* Grammar Corrections Card */}
          {structured?.corrections && structured.corrections.length > 0 && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 space-y-2 text-xs">
              <div className="font-semibold text-rose-900 flex items-center gap-1.5">
                <span>✍️</span>
                <span>Grammar Feedback & Correction</span>
              </div>
              {structured.corrections.map((corr, idx) => (
                <div key={idx} className="bg-white/90 p-2.5 rounded-lg border border-rose-100 space-y-1">
                  <div className="text-rose-800 line-through">Learner: {corr.original}</div>
                  <div className="text-emerald-800 font-semibold">Correct Kannada: {corr.corrected}</div>
                  <div className="text-stone-600 text-[11px]">{corr.explanation}</div>
                </div>
              ))}
            </div>
          )}

          {/* Micro-exercise */}
          {structured?.exercise && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-2 text-xs">
              <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                <span>🎯</span>
                <span>Quick Practice Challenge</span>
              </div>
              <p className="text-slate-800 font-medium">{structured.exercise.prompt}</p>
              {structured.exercise.options && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {structured.exercise.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => onReplyChipClick(opt)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-900 hover:bg-blue-600 hover:text-white transition-colors text-xs font-medium"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggested Replies Chips */}
        {structured?.suggestedReplies && structured.suggestedReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {structured.suggestedReplies.map((reply, rIdx) => (
              <button
                key={rIdx}
                onClick={() => onReplyChipClick(reply)}
                className="px-3 py-1 rounded-full bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs text-slate-700 hover:text-slate-900 transition-all shadow-2xs"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
