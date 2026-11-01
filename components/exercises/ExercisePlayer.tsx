'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  ChevronRight,
  RotateCcw,
  Eye,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type {
  Exercise,
  ExerciseAnswer,
  ExerciseValidationResult,
  MultipleChoiceExercise,
  WordMatchingExercise,
  SentenceConstructionExercise,
  FillInTheBlankExercise,
  ListeningComprehensionExercise,
  VocabularyRecallExercise,
  WordMatchingAnswer,
} from '@/lib/exercises/types';
import type { NativeLanguage } from '@/types/profile';

interface ExercisePlayerProps {
  exercise: Exercise;
  currentIndex: number;
  total: number;
  nativeLang: NativeLanguage;
  onAnswer: (answer: ExerciseAnswer, validation: ExerciseValidationResult) => void;
}

// ─── TTS helper ────────────────────────────────────────────────────────────────
function speakKannada(text: string) {
  if (typeof window === 'undefined') return;
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'kn-IN';
  utt.rate = 0.82;
  window.speechSynthesis.speak(utt);
}

// ─── Feedback Banner ────────────────────────────────────────────────────────────
function FeedbackBanner({
  validation,
  onContinue,
}: {
  validation: ExerciseValidationResult;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 border ${
        validation.isCorrect
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {validation.isCorrect ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 space-y-1">
          <p className={`text-sm font-bold ${validation.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
            {validation.feedback}
          </p>
          <p className="text-xs text-[#EDE5D6]/80 leading-relaxed">{validation.explanation}</p>
        </div>
        <button
          onClick={onContinue}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D5A64A] text-[#101D36] text-xs font-bold hover:bg-[#E8C77F] transition-colors cursor-pointer"
        >
          Continue <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Multiple Choice ────────────────────────────────────────────────────────────
function MultipleChoicePlayer({
  exercise,
  nativeLang,
  onSubmit,
}: {
  exercise: MultipleChoiceExercise;
  nativeLang: NativeLanguage;
  onSubmit: (answer: ExerciseAnswer) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isQuestion = exercise.question.match(/[A-Za-z]/) && !exercise.question.match(/[ಕ-ೞ]/);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    onSubmit({ type: 'multiple_choice', selectedOption: selected });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-[#D5A64A] font-semibold uppercase tracking-widest">{exercise.instructions}</p>
        {isQuestion ? (
          <p className="text-lg font-semibold text-[#F8F5EE]">{exercise.question}</p>
        ) : (
          <div className="flex items-center gap-3">
            <p className="font-kannada text-4xl font-bold text-[#F8F5EE]">{exercise.question}</p>
            {exercise.questionTransliteration && (
              <span className="text-sm font-mono text-[#D5A64A]/80">({exercise.questionTransliteration})</span>
            )}
            <button
              onClick={() => speakKannada(exercise.question)}
              className="p-2 rounded-lg bg-[#0A1222] text-[#D5A64A] border border-[#D5A64A]/30 hover:bg-white/5 cursor-pointer"
              aria-label="Listen to pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        )}
        {nativeLang !== 'en' && exercise.explanationNative?.[nativeLang] && submitted && (
          <p className="text-xs text-[#D5A64A]/80 italic">{exercise.explanationNative[nativeLang]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exercise.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = submitted && option === exercise.correctAnswer;
          const isWrong = submitted && isSelected && option !== exercise.correctAnswer;
          return (
            <button
              key={option}
              onClick={() => { if (!submitted) setSelected(option); }}
              disabled={submitted}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                isCorrect
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : isWrong
                  ? 'bg-red-500/20 border-red-500 text-red-300'
                  : isSelected
                  ? 'bg-[#D5A64A]/20 border-[#D5A64A] text-[#D5A64A]'
                  : 'bg-white/5 border-white/10 text-[#EDE5D6] hover:border-[#D5A64A]/50 hover:bg-[#D5A64A]/10'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full py-3 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E8C77F] transition-colors cursor-pointer"
        >
          Check Answer
        </button>
      )}
    </div>
  );
}

// ─── Word Matching ────────────────────────────────────────────────────────────
function WordMatchingPlayer({
  exercise,
  onSubmit,
}: {
  exercise: WordMatchingExercise;
  onSubmit: (answer: ExerciseAnswer) => void;
}) {
  const [shuffledMeanings] = useState(() =>
    [...exercise.pairs].sort(() => Math.random() - 0.5).map((p) => p.meaning)
  );
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedKannada, setSelectedKannada] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const matchedMeanings = new Set(Object.values(matches));

  const handleKannadaClick = (pairId: string) => {
    if (submitted) return;
    setSelectedKannada(selectedKannada === pairId ? null : pairId);
  };

  const handleMeaningClick = (meaning: string) => {
    if (submitted || !selectedKannada) return;
    setMatches((prev) => ({ ...prev, [selectedKannada]: meaning }));
    setSelectedKannada(null);
  };

  const handleSubmit = () => {
    if (Object.keys(matches).length < exercise.pairs.length) return;
    setSubmitted(true);
    onSubmit({ type: 'word_matching', matches } as WordMatchingAnswer);
  };

  const correctMap: Record<string, string> = {};
  for (const pair of exercise.pairs) {
    correctMap[pair.id] = pair.meaning;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-[#D5A64A] font-semibold uppercase tracking-widest">{exercise.instructions}</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Kannada column */}
        <div className="space-y-2">
          <p className="text-xs text-[#EDE5D6]/50 font-semibold uppercase tracking-wider text-center">Kannada</p>
          {exercise.pairs.map((pair) => {
            const isSelected = selectedKannada === pair.id;
            const isMatched = pair.id in matches;
            const isCorrect = submitted && matches[pair.id] === correctMap[pair.id];
            const isWrong = submitted && isMatched && matches[pair.id] !== correctMap[pair.id];
            return (
              <button
                key={pair.id}
                onClick={() => handleKannadaClick(pair.id)}
                disabled={submitted}
                className={`w-full text-center py-3 px-3 rounded-xl border text-sm font-kannada transition-all cursor-pointer ${
                  isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : isWrong ? 'bg-red-500/20 border-red-500 text-red-300'
                  : isSelected ? 'bg-[#D5A64A]/20 border-[#D5A64A] text-[#D5A64A] scale-105'
                  : isMatched ? 'bg-white/10 border-white/20 text-[#EDE5D6]/60'
                  : 'bg-white/5 border-white/10 text-[#F8F5EE] hover:border-[#D5A64A]/50'
                }`}
              >
                <span className="block font-bold">{pair.kannada}</span>
                <span className="block text-[10px] font-mono text-[#D5A64A]/70">{pair.transliteration}</span>
              </button>
            );
          })}
        </div>

        {/* Meanings column */}
        <div className="space-y-2">
          <p className="text-xs text-[#EDE5D6]/50 font-semibold uppercase tracking-wider text-center">Meaning</p>
          {shuffledMeanings.map((meaning) => {
            const isUsed = matchedMeanings.has(meaning);
            const selectedPairId = Object.entries(matches).find(([, m]) => m === meaning)?.[0];
            const isCorrectPair = submitted && selectedPairId
              ? correctMap[selectedPairId] === meaning
              : false;
            const isWrongPair = submitted && selectedPairId
              ? correctMap[selectedPairId] !== meaning
              : false;
            return (
              <button
                key={meaning}
                onClick={() => handleMeaningClick(meaning)}
                disabled={submitted || isUsed}
                className={`w-full text-center py-3 px-3 rounded-xl border text-sm transition-all cursor-pointer ${
                  isCorrectPair ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : isWrongPair ? 'bg-red-500/20 border-red-500 text-red-300'
                  : isUsed ? 'bg-white/5 border-white/5 text-[#EDE5D6]/30'
                  : selectedKannada ? 'bg-[#D5A64A]/10 border-[#D5A64A]/40 text-[#EDE5D6] hover:bg-[#D5A64A]/20 cursor-pointer'
                  : 'bg-white/5 border-white/10 text-[#EDE5D6] cursor-not-allowed'
                }`}
              >
                {meaning}
              </button>
            );
          })}
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length < exercise.pairs.length}
          className="w-full py-3 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E8C77F] transition-colors cursor-pointer"
        >
          Check Matches
        </button>
      )}

      {!submitted && Object.keys(matches).length > 0 && (
        <button
          onClick={() => { setMatches({}); setSelectedKannada(null); }}
          className="w-full py-2 rounded-xl text-xs text-[#EDE5D6]/60 hover:text-[#EDE5D6] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Reset matches
        </button>
      )}
    </div>
  );
}

// ─── Sentence Construction ─────────────────────────────────────────────────────
function SentenceConstructionPlayer({
  exercise,
  onSubmit,
}: {
  exercise: SentenceConstructionExercise;
  onSubmit: (answer: ExerciseAnswer) => void;
}) {
  const [available, setAvailable] = useState([...exercise.wordTiles]);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const addWord = (word: string, idx: number) => {
    if (submitted) return;
    setAvailable((prev) => prev.filter((_, i) => i !== idx));
    setSelected((prev) => [...prev, word]);
  };

  const removeWord = (word: string, idx: number) => {
    if (submitted) return;
    setSelected((prev) => prev.filter((_, i) => i !== idx));
    setAvailable((prev) => [...prev, word]);
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    setSubmitted(true);
    onSubmit({ type: 'sentence_construction', constructedSentence: selected.join(' ') });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-[#D5A64A] font-semibold uppercase tracking-widest">{exercise.instructions}</p>
        <p className="text-sm text-[#EDE5D6]/70 italic">Translation: {exercise.translation}</p>
      </div>

      {/* Construction area */}
      <div className="min-h-[60px] rounded-xl bg-white/5 border border-white/10 p-3 flex flex-wrap gap-2 items-center">
        {selected.length === 0 && (
          <span className="text-xs text-[#EDE5D6]/30">Tap words below to build the sentence...</span>
        )}
        {selected.map((word, idx) => (
          <button
            key={`${word}-${idx}`}
            onClick={() => removeWord(word, idx)}
            disabled={submitted}
            className="px-3 py-1.5 rounded-lg bg-[#D5A64A]/20 border border-[#D5A64A]/50 font-kannada text-[#D5A64A] text-sm hover:bg-[#D5A64A]/30 transition-colors cursor-pointer disabled:cursor-default"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Available tiles */}
      <div className="flex flex-wrap gap-2">
        {available.map((word, idx) => (
          <button
            key={`avail-${word}-${idx}`}
            onClick={() => addWord(word, idx)}
            disabled={submitted}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 font-kannada text-[#F8F5EE] text-sm hover:bg-[#D5A64A]/20 hover:border-[#D5A64A]/40 transition-colors cursor-pointer disabled:cursor-default"
          >
            {word}
          </button>
        ))}
      </div>

      {submitted && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
          <p className="text-xs text-[#D5A64A] font-semibold">Correct sentence:</p>
          <p className="font-kannada text-[#F8F5EE] text-lg">{exercise.correctSentence}</p>
          <p className="text-xs font-mono text-[#D5A64A]/70">{exercise.transliteration}</p>
        </div>
      )}

      {!submitted && (
        <div className="flex gap-3">
          <button
            onClick={() => { setSelected([]); setAvailable([...exercise.wordTiles]); }}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-[#EDE5D6]/60 hover:text-[#EDE5D6] flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E8C77F] transition-colors cursor-pointer"
          >
            Check Sentence
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Fill in the Blank ─────────────────────────────────────────────────────────
function FillInTheBlankPlayer({
  exercise,
  onSubmit,
}: {
  exercise: FillInTheBlankExercise;
  onSubmit: (answer: ExerciseAnswer) => void;
}) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    onSubmit({ type: 'fill_in_the_blank', answer: answer.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-[#D5A64A] font-semibold uppercase tracking-widest">{exercise.instructions}</p>
        <p className="font-kannada text-xl text-[#F8F5EE] leading-relaxed">
          {exercise.questionTemplate.replace('______', '_______')}
        </p>
        <p className="text-sm text-[#EDE5D6]/70 italic">{exercise.translation}</p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !submitted) handleSubmit(); }}
          disabled={submitted}
          placeholder="Type your answer in Kannada or transliteration..."
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-[#F8F5EE] text-sm font-kannada placeholder:text-[#EDE5D6]/30 focus:outline-none focus:border-[#D5A64A] transition-colors"
        />
        {exercise.hint && (
          <div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-[#D5A64A]/70 hover:text-[#D5A64A] flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3 h-3" /> {showHint ? 'Hide hint' : 'Show hint'}
            </button>
            {showHint && (
              <p className="text-xs text-[#EDE5D6]/60 mt-1 italic">{exercise.hint}</p>
            )}
          </div>
        )}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="w-full py-3 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E8C77F] transition-colors cursor-pointer"
        >
          Check Answer
        </button>
      )}
    </div>
  );
}

// ─── Listening Comprehension ───────────────────────────────────────────────────
function ListeningComprehensionPlayer({
  exercise,
  nativeLang,
  onSubmit,
}: {
  exercise: ListeningComprehensionExercise;
  nativeLang: NativeLanguage;
  onSubmit: (answer: ExerciseAnswer) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    setIsPlaying(true);
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(exercise.audioText);
    utt.lang = 'kn-IN';
    utt.rate = 0.78;
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utt);
  }, [exercise.audioText]);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    onSubmit({ type: 'listening_comprehension', selectedOption: selected });
  };

  const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="space-y-6">
      <p className="text-xs text-[#D5A64A] font-semibold uppercase tracking-widest">{exercise.instructions}</p>

      {/* Audio Player */}
      <div className="rounded-2xl bg-[#0A1222] border border-[#D5A64A]/30 p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#D5A64A]/15 border border-[#D5A64A]/30 flex items-center justify-center mx-auto">
          <Volume2 className={`w-7 h-7 text-[#D5A64A] ${isPlaying ? 'animate-pulse' : ''}`} />
        </div>
        {hasTTS ? (
          <>
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className="px-6 py-2.5 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-sm hover:bg-[#E8C77F] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isPlaying ? 'Playing...' : '▶ Listen'}
            </button>
            <p className="text-xs text-[#EDE5D6]/50">
              Press Listen then select the correct meaning below.
            </p>
          </>
        ) : (
          <>
            <p className="font-kannada text-xl text-[#F8F5EE]">{exercise.audioText}</p>
            <p className="text-xs font-mono text-[#D5A64A]/70">{exercise.audioTextTransliteration}</p>
            <p className="text-xs text-[#EDE5D6]/50">Audio unavailable in this browser. Read and select the meaning.</p>
          </>
        )}
        {submitted && (
          <p className="text-xs text-[#EDE5D6]/60 font-mono">
            &quot;{exercise.audioTextTransliteration}&quot;
          </p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exercise.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = submitted && option === exercise.correctAnswer;
          const isWrong = submitted && isSelected && option !== exercise.correctAnswer;
          return (
            <button
              key={option}
              onClick={() => { if (!submitted) setSelected(option); }}
              disabled={submitted}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                isCorrect
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : isWrong
                  ? 'bg-red-500/20 border-red-500 text-red-300'
                  : isSelected
                  ? 'bg-[#D5A64A]/20 border-[#D5A64A] text-[#D5A64A]'
                  : 'bg-white/5 border-white/10 text-[#EDE5D6] hover:border-[#D5A64A]/50'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full py-3 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E8C77F] transition-colors cursor-pointer"
        >
          Check Answer
        </button>
      )}

      {nativeLang !== 'en' && submitted && exercise.explanationNative?.[nativeLang] && (
        <p className="text-xs text-[#D5A64A]/80 italic">{exercise.explanationNative[nativeLang]}</p>
      )}
    </div>
  );
}

// ─── Vocabulary Recall ─────────────────────────────────────────────────────────
function VocabularyRecallPlayer({
  exercise,
  nativeLang,
  onSubmit,
}: {
  exercise: VocabularyRecallExercise;
  nativeLang: NativeLanguage;
  onSubmit: (answer: ExerciseAnswer) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSelfAssess = (assessment: 'known' | 'needs_practice') => {
    setSubmitted(true);
    onSubmit({ type: 'vocabulary_recall', selfAssessment: assessment });
  };

  const nativeMeaning = exercise.nativeMeaning?.[nativeLang];

  return (
    <div className="space-y-6">
      <p className="text-xs text-[#D5A64A] font-semibold uppercase tracking-widest">{exercise.instructions}</p>

      {/* Vocabulary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0A1222] to-[#101D36] border border-[#D5A64A]/30 p-8 text-center space-y-3">
        <p className="font-kannada text-5xl font-bold text-[#F8F5EE]">{exercise.kannada}</p>
        <p className="text-sm font-mono text-[#D5A64A]">{exercise.transliteration}</p>
        <button
          onClick={() => speakKannada(exercise.kannada)}
          className="p-2 rounded-lg bg-white/5 border border-[#D5A64A]/30 text-[#D5A64A] hover:bg-white/10 cursor-pointer mx-auto"
          aria-label="Listen to pronunciation"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Reveal answer */}
      {!revealed && !submitted && (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3 rounded-xl border border-[#D5A64A]/40 text-[#D5A64A] font-semibold text-sm hover:bg-[#D5A64A]/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Eye className="w-4 h-4" /> Reveal Meaning
        </button>
      )}

      {revealed && !submitted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-center">
            <p className="text-lg font-semibold text-[#F8F5EE]">{exercise.correctMeaning}</p>
            {nativeMeaning && nativeLang !== 'en' && (
              <p className="text-sm text-[#D5A64A]/80 italic">{nativeMeaning}</p>
            )}
            {exercise.culturalNote && (
              <div className="flex items-start gap-2 text-left mt-2 pt-2 border-t border-white/10">
                <BookOpen className="w-3.5 h-3.5 text-[#D5A64A] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#EDE5D6]/60 italic">{exercise.culturalNote}</p>
              </div>
            )}
          </div>
          <p className="text-center text-xs text-[#EDE5D6]/60">Did you know this word?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSelfAssess('needs_practice')}
              className="py-3 rounded-xl border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/10 cursor-pointer"
            >
              Needs Practice
            </button>
            <button
              onClick={() => handleSelfAssess('known')}
              className="py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 cursor-pointer"
            >
              I Knew It!
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Exercise Player ──────────────────────────────────────────────────────
export default function ExercisePlayer({
  exercise,
  currentIndex,
  total,
  nativeLang,
  onAnswer,
}: ExercisePlayerProps) {
  const [pending, setPending] = useState<{ answer: ExerciseAnswer; validation: ExerciseValidationResult } | null>(null);

  const handleSubmit = useCallback(async (answer: ExerciseAnswer) => {
    // Call the API route to validate server-side
    try {
      const res = await fetch('/api/exercises/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: exercise.id, answer }),
      });
      const data = await res.json() as { validation: ExerciseValidationResult };
      if (data.validation) {
        setPending({ answer, validation: data.validation });
      }
    } catch {
      // Client-side fallback if API unavailable
      const { validateExerciseAnswer } = await import('@/lib/services/exercise-validator');
      const validation = validateExerciseAnswer(exercise, answer);
      setPending({ answer, validation });
    }
  }, [exercise]);

  const handleContinue = () => {
    if (pending) {
      onAnswer(pending.answer, pending.validation);
      setPending(null);
    }
  };

  const exerciseTypeLabel: Record<Exercise['type'], string> = {
    multiple_choice: 'Multiple Choice',
    word_matching: 'Word Matching',
    sentence_construction: 'Build a Sentence',
    fill_in_the_blank: 'Fill in the Blank',
    listening_comprehension: 'Listening',
    vocabulary_recall: 'Vocabulary Recall',
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#EDE5D6]/60">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D5A64A]" />
            <span className="font-semibold text-[#D5A64A] uppercase tracking-wider">
              {exerciseTypeLabel[exercise.type]}
            </span>
          </span>
          <span>{currentIndex + 1} of {total}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#D5A64A] rounded-full"
            initial={{ width: `${(currentIndex / total) * 100}%` }}
            animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={exercise.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8"
        >
          {exercise.type === 'multiple_choice' && (
            <MultipleChoicePlayer
              exercise={exercise as MultipleChoiceExercise}
              nativeLang={nativeLang}
              onSubmit={handleSubmit}
            />
          )}
          {exercise.type === 'word_matching' && (
            <WordMatchingPlayer
              exercise={exercise as WordMatchingExercise}
              onSubmit={handleSubmit}
            />
          )}
          {exercise.type === 'sentence_construction' && (
            <SentenceConstructionPlayer
              exercise={exercise as SentenceConstructionExercise}
              onSubmit={handleSubmit}
            />
          )}
          {exercise.type === 'fill_in_the_blank' && (
            <FillInTheBlankPlayer
              exercise={exercise as FillInTheBlankExercise}
              onSubmit={handleSubmit}
            />
          )}
          {exercise.type === 'listening_comprehension' && (
            <ListeningComprehensionPlayer
              exercise={exercise as ListeningComprehensionExercise}
              nativeLang={nativeLang}
              onSubmit={handleSubmit}
            />
          )}
          {exercise.type === 'vocabulary_recall' && (
            <VocabularyRecallPlayer
              exercise={exercise as VocabularyRecallExercise}
              nativeLang={nativeLang}
              onSubmit={handleSubmit}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {pending && (
          <FeedbackBanner validation={pending.validation} onContinue={handleContinue} />
        )}
      </AnimatePresence>
    </div>
  );
}

