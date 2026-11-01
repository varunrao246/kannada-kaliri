'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Volume2,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  Award,
  Layers,
  Loader2,
  Target,
  Mic,
} from 'lucide-react';
import type { LessonWithProgress } from '@/types/curriculum';
import dynamic from 'next/dynamic';
import type { LearnerProfile } from '@/types/profile';
import type { Exercise } from '@/lib/exercises/types';
import { completeLesson } from '@/lib/services/learning-progress';
import { playKannadaSpeech, stopKannadaSpeech } from '@/lib/ai/speech/audio-player';
import { WordPronunciationControl } from '@/components/speech/WordPronunciationControl';

const AssessmentSession = dynamic(
  () => import('@/components/exercises/AssessmentSession'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12 text-[#D5A64A]">
        <div className="w-6 h-6 border-2 border-[#D5A64A] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

const VoicePractice = dynamic(
  () => import('@/components/speech/VoicePractice'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8 text-[#D5A64A]">
        <div className="w-5 h-5 border-2 border-[#D5A64A] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

interface LessonViewerProps {
  lesson: LessonWithProgress;
  profile: LearnerProfile | null;
  userId: string;
  nextLessonId?: string | null;
  exercises?: Exercise[];
}

export default function LessonViewer({
  lesson,
  profile,
  userId,
  nextLessonId,
  exercises = [],
}: LessonViewerProps) {
  const [activeTab, setActiveTab] = useState<'study' | 'practice'>('study');
  const [completed, setCompleted] = useState(lesson.status === 'completed');
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [audioSourceNotice, setAudioSourceNotice] = useState<string | null>(null);
  const [selectedVocabIndex, setSelectedVocabIndex] = useState(0);

  // Stop audio on unmount or navigation
  useEffect(() => {
    return () => {
      stopKannadaSpeech();
    };
  }, []);

  const nativeLang = profile?.native_language || 'en';

  // Pronounce phrase using Gnani Timbre with browser speech synthesis fallback
  const playAudio = async (text: string, id: string) => {
    setActiveAudioId(id);
    try {
      const res = await playKannadaSpeech(text, 'kn-IN', (st) => {
        if (st === 'fallback') {
          setAudioSourceNotice('Using browser speech fallback');
        } else if (st === 'playing') {
          setAudioSourceNotice('Playing via Gnani Timbre');
        } else if (st === 'idle') {
          setActiveAudioId(null);
          setTimeout(() => setAudioSourceNotice(null), 2500);
        }
      });

      if (res.source === 'browser-fallback') {
        setAudioSourceNotice('Audio: Browser speech fallback');
        setTimeout(() => setAudioSourceNotice(null), 3000);
      }
    } catch {
      setActiveAudioId(null);
    }
  };

  const handleComplete = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await completeLesson(userId, lesson.id, lesson.estimatedMinutes || 10);
      setCompleted(true);
      setShowCelebration(true);
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#EDE5D6]/70 hover:text-[#D5A64A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Curriculum</span>
        </Link>

        <div className="flex items-center gap-3">
          {audioSourceNotice && (
            <span className="text-[11px] font-medium text-[#D5A64A] bg-[#D5A64A]/10 px-2.5 py-1 rounded-full border border-[#D5A64A]/20 animate-pulse">
              {audioSourceNotice}
            </span>
          )}
          <span className="text-xs text-[#EDE5D6]/60 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D5A64A]" />
            {lesson.estimatedMinutes} minutes
          </span>
          {completed && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Lesson Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0A1222] via-[#101D36] to-[#0A1222] border border-[#D5A64A]/30 p-8 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D5A64A] bg-[#D5A64A]/10 px-3 py-1 rounded-full border border-[#D5A64A]/25">
              {lesson.moduleTitle || 'Foundations'}
            </span>
            {lesson.moduleKannadaTitle && (
              <span className="text-xs font-kannada text-[#EDE5D6]/60">
                {lesson.moduleKannadaTitle}
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EE]">
            {lesson.title}
          </h1>

          {lesson.kannadaTitle && (
            <p className="text-base sm:text-lg font-kannada text-[#D5A64A]">
              {lesson.kannadaTitle}
            </p>
          )}

          <p className="text-sm text-[#EDE5D6]/85 leading-relaxed pt-2">
            {lesson.content.introduction}
          </p>

          {/* Objectives */}
          {lesson.content.objectives && lesson.content.objectives.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D5A64A] block">
                Learning Objectives:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#EDE5D6]/80">
                {lesson.content.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D5A64A] mt-1.5 shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#D5A64A]/20 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('study')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'study'
              ? 'bg-[#D5A64A] text-[#101D36] shadow-md shadow-[#D5A64A]/20'
              : 'bg-white/5 text-[#EDE5D6]/70 hover:bg-white/10 hover:text-[#EDE5D6]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Lesson Study</span>
        </button>

        {exercises.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'practice'
                ? 'bg-[#D5A64A] text-[#101D36] shadow-md shadow-[#D5A64A]/20'
                : 'bg-white/5 text-[#EDE5D6]/70 hover:bg-white/10 hover:text-[#EDE5D6]'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Interactive Practice &amp; Assessment</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'practice'
                  ? 'bg-[#101D36]/30 text-[#101D36]'
                  : 'bg-[#D5A64A]/20 text-[#D5A64A]'
              }`}
            >
              {exercises.length}
            </span>
          </button>
        )}
      </div>

      {/* Tab: Interactive Practice & Assessment */}
      {activeTab === 'practice' && exercises.length > 0 && (
        <AssessmentSession
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          exercises={exercises}
          userId={userId}
          nativeLang={nativeLang}
          nextLessonId={nextLessonId}
        />
      )}

      {/* Tab: Study Material */}
      {activeTab === 'study' && (
        <>
          {/* Section 1: Vocabulary Cards */}
          {lesson.content.vocabulary && lesson.content.vocabulary.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#F8F5EE] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#D5A64A]" />
                <span>Core Vocabulary &amp; Phrases</span>
              </h2>
              <p className="text-xs text-[#EDE5D6]/70 mt-1">
                Listen to pronunciation, review transliterations, and understand cultural context.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {lesson.content.vocabulary.map((vocab) => {
              const nativeMeaning = vocab.meaningNative?.[nativeLang];

              return (
                <div
                  key={vocab.id}
                  className="rounded-2xl bg-[#0A1222]/80 border border-[#D5A64A]/25 p-5 shadow-lg flex flex-col justify-between hover:border-[#D5A64A]/50 transition-all duration-200"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="font-kannada text-2xl sm:text-3xl font-bold text-[#F8F5EE] block leading-tight">
                          {vocab.kannada}
                        </span>
                        <span className="font-mono text-sm font-semibold text-[#D5A64A] block">
                          &quot;{vocab.transliteration}&quot;
                        </span>
                      </div>

                      <WordPronunciationControl
                        kannadaText={vocab.kannada}
                        wordId={vocab.id}
                        activeAudioId={activeAudioId}
                        onActiveChange={(id) => setActiveAudioId(id)}
                      />
                    </div>

                    <p className="text-xs sm:text-sm text-[#EDE5D6]/90 font-medium">
                      {vocab.meaningEn}
                    </p>

                    {/* Native Language Translation (Profile-Aware Personalization) */}
                    {nativeMeaning && nativeLang !== 'en' && (
                      <div className="pt-1">
                        <span className="text-[11px] font-medium text-[#D5A64A] bg-[#D5A64A]/10 px-2.5 py-0.5 rounded border border-[#D5A64A]/20">
                          {nativeMeaning}
                        </span>
                      </div>
                    )}

                    {vocab.culturalNote && (
                      <p className="text-[11px] text-[#EDE5D6]/60 italic pt-1 border-t border-white/5">
                        💡 {vocab.culturalNote}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 2: Grammar & Linguistic Insights */}
      {lesson.content.grammarTips && lesson.content.grammarTips.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-[#F8F5EE] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D5A64A]" />
            <span>Grammar &amp; Cultural Notes</span>
          </h2>

          <div className="space-y-4">
            {lesson.content.grammarTips.map((tip, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0A1222]/90 border border-[#D5A64A]/30 shadow-lg space-y-2"
              >
                <h3 className="font-serif text-base font-bold text-[#D5A64A]">
                  {tip.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#EDE5D6]/85 leading-relaxed">
                  {tip.explanation}
                </p>

                {tip.example && (
                  <div className="p-3 rounded-xl bg-[#101D36] border border-white/10 text-xs font-mono text-[#F8F5EE]">
                    Example: {tip.example}
                  </div>
                )}

                {tip.nativeTip?.[nativeLang] && nativeLang !== 'en' && (
                  <p className="text-xs text-[#D5A64A]/90 pt-1">
                    🔍 <strong>Native Explanation:</strong> {tip.nativeTip[nativeLang]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Real Example Sentences */}
      {lesson.content.examples && lesson.content.examples.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-[#F8F5EE] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D5A64A]" />
            <span>Real-World Example Dialogues</span>
          </h2>

          <div className="space-y-3">
            {lesson.content.examples.map((ex) => (
              <div
                key={ex.id}
                className="p-5 rounded-2xl bg-[#101D36]/80 border border-[#D5A64A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="font-kannada text-lg font-bold text-[#F8F5EE]">
                    {ex.kannada}
                  </p>
                  <p className="text-xs font-mono text-[#D5A64A]">
                    &quot;{ex.transliteration}&quot;
                  </p>
                  <p className="text-xs text-[#EDE5D6]/80">
                    {ex.english}
                  </p>
                  {ex.nativeExplanation?.[nativeLang] && nativeLang !== 'en' && (
                    <p className="text-[11px] text-[#D5A64A]/80 italic">
                      {ex.nativeExplanation[nativeLang]}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => playAudio(ex.kannada, ex.id)}
                  className="self-start sm:self-center p-2 rounded-lg bg-[#0A1222] text-[#D5A64A] hover:bg-white/5 border border-[#D5A64A]/30 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Voice & Pronunciation Practice */}
      {lesson.content.vocabulary && lesson.content.vocabulary.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#F8F5EE] flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#D5A64A]" />
              <span>Voice &amp; Speaking Practice</span>
            </h2>
            <span className="text-xs text-[#D5A64A] font-semibold bg-[#D5A64A]/10 px-3 py-1 rounded-full border border-[#D5A64A]/20">
              Gnani Voice Intelligence
            </span>
          </div>

          {lesson.content.vocabulary.length > 1 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {lesson.content.vocabulary.map((v, idx) => (
                <button
                  key={v.id || idx}
                  type="button"
                  onClick={() => setSelectedVocabIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedVocabIndex === idx
                      ? 'bg-[#D5A64A] text-[#101D36] shadow-sm font-bold'
                      : 'bg-[#101D36] text-[#EDE5D6]/80 border border-[#D5A64A]/30 hover:border-[#D5A64A]'
                  }`}
                >
                  <span className="font-kannada font-bold mr-1.5">{v.kannada}</span>
                  <span className="text-[11px] opacity-80">({v.transliteration})</span>
                </button>
              ))}
            </div>
          )}

          <VoicePractice
            key={lesson.content.vocabulary[selectedVocabIndex]?.id || selectedVocabIndex}
            expectedText={lesson.content.vocabulary[selectedVocabIndex]?.kannada || ''}
            expectedTransliteration={lesson.content.vocabulary[selectedVocabIndex]?.transliteration}
            expectedMeaning={lesson.content.vocabulary[selectedVocabIndex]?.meaningEn}
            title={`Speaking Practice: "${lesson.content.vocabulary[selectedVocabIndex]?.transliteration || ''}" (${lesson.content.vocabulary[selectedVocabIndex]?.kannada || ''})`}
          />
        </section>
      )}

      {/* Bottom Action Bar */}
      <div className="pt-8 border-t border-[#D5A64A]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#EDE5D6]/70 text-center sm:text-left">
          <span className="font-semibold text-[#EDE5D6]">Completion Goal: </span>
          {lesson.content.completionCriteria}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {exercises.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#101D36] text-[#D5A64A] border border-[#D5A64A]/40 hover:bg-[#D5A64A]/10 transition-all cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>Practise ({exercises.length} Exercises)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleComplete}
            disabled={loading}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xl cursor-pointer ${
              completed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-[#D5A64A] hover:bg-[#E8C77F] text-[#101D36] shadow-[#D5A64A]/25 hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{completed ? 'Completed • Update Activity' : 'Mark as Complete'}</span>
          </button>
        </div>
      </div>
        </>
      )}

      {/* Celebration Modal on Completion */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl bg-[#0A1222] border border-[#D5A64A] p-8 text-center space-y-6 shadow-2xl relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D5A64A] to-[#B5862B] mx-auto flex items-center justify-center text-[#101D36] shadow-lg shadow-[#D5A64A]/30">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D5A64A]">
                ಅದ್ಭುತ! (Adbhutha! — Excellent!)
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#F8F5EE]">
                Lesson Completed!
              </h3>
              <p className="text-xs text-[#EDE5D6]/80 leading-relaxed">
                You have added {lesson.estimatedMinutes} minutes to your daily learning goal and strengthened your Kannada foundation.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              {nextLessonId ? (
                <Link
                  href={`/learn/${nextLessonId}`}
                  onClick={() => setShowCelebration(false)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-xs uppercase tracking-wider hover:bg-[#E8C77F] transition-all"
                >
                  <span>Continue to Next Lesson</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : null}

              <Link
                href="/dashboard"
                onClick={() => setShowCelebration(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#101D36] text-[#EDE5D6] font-semibold text-xs border border-[#D5A64A]/30 hover:border-[#D5A64A] transition-all"
              >
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
