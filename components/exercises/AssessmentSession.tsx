'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  BookOpen,
  ChevronRight,
  Loader2,
  Target,
  Zap,
} from 'lucide-react';
import ExercisePlayer from './ExercisePlayer';
import type { Exercise, ExerciseAnswer, ExerciseValidationResult, ExerciseAttempt, AssessmentScore } from '@/lib/exercises/types';
import type { NativeLanguage } from '@/types/profile';

interface AssessmentSessionProps {
  lessonId: string;
  lessonTitle: string;
  exercises: Exercise[];
  userId: string;
  nativeLang: NativeLanguage;
  nextLessonId?: string | null;
}

type Phase = 'intro' | 'exercises' | 'results';

export default function AssessmentSession({
  lessonId,
  lessonTitle,
  exercises,
  userId,
  nativeLang,
  nextLessonId,
}: AssessmentSessionProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<Map<string, ExerciseAttempt>>(new Map());
  const [score, setScore] = useState<AssessmentScore | null>(null);
  const [saving, setSaving] = useState(false);
  const startedAtRef = useRef<string>(new Date().toISOString());

  const currentExercise = exercises[currentIndex];

  const handleAnswer = useCallback(async (answer: ExerciseAnswer, validation: ExerciseValidationResult) => {
    const attempt: ExerciseAttempt = {
      exerciseId: currentExercise.id,
      exerciseType: currentExercise.type,
      answer,
      validation,
      attemptedAt: new Date().toISOString(),
    };

    const updatedAttempts = new Map(attempts);
    updatedAttempts.set(currentExercise.id, attempt);
    setAttempts(updatedAttempts);

    // Persist attempt in background
    try {
      await fetch('/api/exercises/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lessonId, attempt }),
      });
    } catch {
      // Non-blocking: persist fails gracefully
    }

    // Move to next exercise or results
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate score
      setSaving(true);
      try {
        const res = await fetch('/api/exercises/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            lessonId,
            attempts: Object.fromEntries(updatedAttempts),
            startedAt: startedAtRef.current,
          }),
        });
        const data = await res.json() as { score: AssessmentScore };
        if (data.score) {
          setScore(data.score);
        }
      } catch {
        // Calculate locally as fallback
        const { calculateAssessmentScore } = await import('@/lib/services/assessment');
        const localScore = calculateAssessmentScore(lessonId, updatedAttempts, startedAtRef.current);
        setScore(localScore);
      } finally {
        setSaving(false);
        setPhase('results');
      }
    }
  }, [attempts, currentExercise, currentIndex, exercises.length, lessonId, userId]);

  const handleRetake = () => {
    setPhase('intro');
    setCurrentIndex(0);
    setAttempts(new Map());
    setScore(null);
    startedAtRef.current = new Date().toISOString();
  };

  if (exercises.length === 0) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center space-y-4">
        <BookOpen className="w-10 h-10 text-[#D5A64A] mx-auto" />
        <p className="text-[#EDE5D6]/70 text-sm">No exercises yet for this lesson. Check back soon!</p>
      </div>
    );
  }

  // ─── Intro screen ────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-[#0A1222] to-[#101D36] border border-[#D5A64A]/30 p-8 sm:p-10 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#D5A64A]/15 border border-[#D5A64A]/30 flex items-center justify-center mx-auto">
          <Target className="w-8 h-8 text-[#D5A64A]" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D5A64A]">Practice Session</p>
          <h2 className="font-serif text-2xl font-bold text-[#F8F5EE]">{lessonTitle}</h2>
          <p className="text-sm text-[#EDE5D6]/70 max-w-sm mx-auto">
            Complete {exercises.length} exercises to practise and reinforce your Kannada learning.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xl font-bold text-[#D5A64A]">{exercises.length}</p>
            <p className="text-xs text-[#EDE5D6]/60">Exercises</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xl font-bold text-[#D5A64A]">
              {exercises.reduce((s, e) => s + e.points, 0)}
            </p>
            <p className="text-xs text-[#EDE5D6]/60">Max Points</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xl font-bold text-[#D5A64A]">~{Math.ceil(exercises.length * 1.5)}</p>
            <p className="text-xs text-[#EDE5D6]/60">Minutes</p>
          </div>
        </div>
        <button
          onClick={() => { startedAtRef.current = new Date().toISOString(); setPhase('exercises'); }}
          className="w-full py-3.5 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-sm hover:bg-[#E8C77F] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-4 h-4" /> Start Exercises
        </button>
      </motion.div>
    );
  }

  // ─── Exercise phase ──────────────────────────────────────────────────────────
  if (phase === 'exercises') {
    if (saving) {
      return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#D5A64A] animate-spin mx-auto" />
          <p className="text-[#EDE5D6]/70 text-sm">Saving your results...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('intro')}
            className="p-2 rounded-lg text-[#EDE5D6]/60 hover:text-[#D5A64A] hover:bg-white/5 cursor-pointer"
            aria-label="Back to intro"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-xs text-[#EDE5D6]/60">{lessonTitle} — Practice</p>
        </div>
        <ExercisePlayer
          exercise={currentExercise}
          currentIndex={currentIndex}
          total={exercises.length}
          nativeLang={nativeLang}
          onAnswer={handleAnswer}
        />
      </div>
    );
  }

  // ─── Results screen ──────────────────────────────────────────────────────────
  if (phase === 'results' && score) {
    const isPerfect = score.scorePercentage === 100;
    const isGood = score.scorePercentage >= 70;

    const emoji = isPerfect ? '🏆' : isGood ? '⭐' : '📚';
    const headline = isPerfect
      ? 'ಅದ್ಭುತ! Perfect Score!'
      : isGood
      ? 'ಚೆನ್ನಾಗಿದೆ! Great Work!'
      : 'ಪ್ರಯತ್ನಿಸಿ! Keep Practising!';

    const mins = Math.floor(score.timeTakenSeconds / 60);
    const secs = score.timeTakenSeconds % 60;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Score Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0A1222] to-[#101D36] border border-[#D5A64A]/30 p-8 text-center space-y-4">
          <div className="text-4xl">{emoji}</div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D5A64A]">Assessment Complete</p>
            <h2 className="font-serif text-2xl font-bold text-[#F8F5EE]">{headline}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-2xl font-bold text-[#D5A64A]">{score.scorePercentage}%</p>
              <p className="text-xs text-[#EDE5D6]/60">Score</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-2xl font-bold text-emerald-400">{score.correctAnswers}</p>
              <p className="text-xs text-[#EDE5D6]/60">Correct</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-2xl font-bold text-red-400">{score.totalQuestions - score.correctAnswers}</p>
              <p className="text-xs text-[#EDE5D6]/60">Incorrect</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-2xl font-bold text-[#D5A64A]">
                {mins > 0 ? `${mins}m ` : ''}{secs}s
              </p>
              <p className="text-xs text-[#EDE5D6]/60">Time</p>
            </div>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score.scorePercentage}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className={`h-full rounded-full ${
                isPerfect ? 'bg-[#D5A64A]' : isGood ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Incorrect exercises review */}
        {score.incorrectExercises.length > 0 && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm font-semibold text-[#F8F5EE]">Review Incorrect Answers</p>
            </div>
            <div className="space-y-3">
              {score.incorrectExercises.map((ex) => {
                const attempt = attempts.get(ex.id);
                return (
                  <div key={ex.id} className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 space-y-2">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">{ex.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[#EDE5D6]/80">{attempt?.validation.explanation}</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <p className="text-xs text-emerald-400">
                        Correct: {
                          typeof attempt?.validation.correctAnswer === 'string'
                            ? attempt.validation.correctAnswer
                            : typeof attempt?.validation.correctAnswer === 'object'
                            ? JSON.stringify(attempt.validation.correctAnswer)
                            : ''
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vocabulary needing practice */}
        {score.vocabularyNeedingPractice.length > 0 && (
          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-semibold text-amber-400">Words to Review</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {score.vocabularyNeedingPractice.map((word) => (
                <span key={word} className="font-kannada px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleRetake}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-[#EDE5D6]/70 text-sm font-semibold hover:border-[#D5A64A]/40 hover:text-[#EDE5D6] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#D5A64A]/30 text-[#D5A64A] text-sm font-semibold hover:bg-[#D5A64A]/10 transition-all"
          >
            <Trophy className="w-4 h-4" /> Dashboard
          </Link>
          {nextLessonId ? (
            <Link
              href={`/learn/${nextLessonId}`}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D5A64A] text-[#101D36] text-sm font-bold hover:bg-[#E8C77F] transition-all"
            >
              Next Lesson <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/learn"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D5A64A] text-[#101D36] text-sm font-bold hover:bg-[#E8C77F] transition-all"
            >
              All Lessons <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}

