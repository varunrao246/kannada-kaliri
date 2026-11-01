/**
 * Exercise & Assessment Type Definitions
 * Kannada Kaliri — Milestone 04
 *
 * Strongly typed exercise structures for the interactive learning engine.
 */

import type { NativeLanguage } from '@/types/profile';

// ─── Exercise Types ────────────────────────────────────────────────────────
export type ExerciseType =
  | 'multiple_choice'
  | 'word_matching'
  | 'sentence_construction'
  | 'fill_in_the_blank'
  | 'listening_comprehension'
  | 'vocabulary_recall';

export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';

// ─── Multiple Choice ────────────────────────────────────────────────────────
export interface MultipleChoiceExercise {
  id: string;
  lessonId: string;
  type: 'multiple_choice';
  order: number;
  difficulty: ExerciseDifficulty;
  points: number;
  instructions: string;
  /** The Kannada word / phrase / sentence being tested */
  question: string;
  /** Kannada transliteration for accessibility */
  questionTransliteration?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  explanationNative?: Partial<Record<NativeLanguage, string>>;
}

// ─── Word Matching ───────────────────────────────────────────────────────────
export interface MatchPair {
  id: string;
  kannada: string;
  transliteration: string;
  meaning: string;
}

export interface WordMatchingExercise {
  id: string;
  lessonId: string;
  type: 'word_matching';
  order: number;
  difficulty: ExerciseDifficulty;
  points: number;
  instructions: string;
  pairs: MatchPair[];
  /** Each pair counts equally towards the total score */
}

// ─── Sentence Construction ───────────────────────────────────────────────────
export interface SentenceConstructionExercise {
  id: string;
  lessonId: string;
  type: 'sentence_construction';
  order: number;
  difficulty: ExerciseDifficulty;
  points: number;
  instructions: string;
  /** Scrambled word tiles shown to the learner */
  wordTiles: string[];
  /** The one accepted correct sentence */
  correctSentence: string;
  /** Optional alternative accepted forms (normalised) */
  acceptedVariants?: string[];
  translation: string;
  transliteration: string;
  explanation: string;
  explanationNative?: Partial<Record<NativeLanguage, string>>;
}

// ─── Fill in the Blank ────────────────────────────────────────────────────────
export interface FillInTheBlankExercise {
  id: string;
  lessonId: string;
  type: 'fill_in_the_blank';
  order: number;
  difficulty: ExerciseDifficulty;
  points: number;
  instructions: string;
  /** Sentence with "______" as placeholder */
  questionTemplate: string;
  translation: string;
  acceptedAnswers: string[];   // case-insensitive exact matches
  hint?: string;
  explanation: string;
  explanationNative?: Partial<Record<NativeLanguage, string>>;
}

// ─── Listening Comprehension ──────────────────────────────────────────────────
export interface ListeningComprehensionExercise {
  id: string;
  lessonId: string;
  type: 'listening_comprehension';
  order: number;
  difficulty: ExerciseDifficulty;
  points: number;
  instructions: string;
  /** Text to be spoken by the TTS engine */
  audioText: string;
  audioTextTransliteration: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  explanationNative?: Partial<Record<NativeLanguage, string>>;
}

// ─── Vocabulary Recall ────────────────────────────────────────────────────────
export interface VocabularyRecallExercise {
  id: string;
  lessonId: string;
  type: 'vocabulary_recall';
  order: number;
  difficulty: ExerciseDifficulty;
  points: number;
  instructions: string;
  vocabularyId: string;
  kannada: string;
  transliteration: string;
  correctMeaning: string;
  nativeMeaning?: Partial<Record<NativeLanguage, string>>;
  culturalNote?: string;
}

// ─── Union Type ───────────────────────────────────────────────────────────────
export type Exercise =
  | MultipleChoiceExercise
  | WordMatchingExercise
  | SentenceConstructionExercise
  | FillInTheBlankExercise
  | ListeningComprehensionExercise
  | VocabularyRecallExercise;

// ─── Exercise Set (per lesson) ────────────────────────────────────────────────
export interface LessonExerciseSet {
  lessonId: string;
  exercises: Exercise[];
}

// ─── Submitted Answers ────────────────────────────────────────────────────────
export interface MultipleChoiceAnswer {
  type: 'multiple_choice';
  selectedOption: string;
}

export interface WordMatchingAnswer {
  type: 'word_matching';
  /** Map of pair.id -> learner's selected meaning */
  matches: Record<string, string>;
}

export interface SentenceConstructionAnswer {
  type: 'sentence_construction';
  constructedSentence: string;
}

export interface FillInTheBlankAnswer {
  type: 'fill_in_the_blank';
  answer: string;
}

export interface ListeningComprehensionAnswer {
  type: 'listening_comprehension';
  selectedOption: string;
}

export interface VocabularyRecallAnswer {
  type: 'vocabulary_recall';
  selfAssessment: 'known' | 'needs_practice';
}

export type ExerciseAnswer =
  | MultipleChoiceAnswer
  | WordMatchingAnswer
  | SentenceConstructionAnswer
  | FillInTheBlankAnswer
  | ListeningComprehensionAnswer
  | VocabularyRecallAnswer;

// ─── Validation Result ────────────────────────────────────────────────────────
export interface ExerciseValidationResult {
  exerciseId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: string | string[] | Record<string, string>;
  feedback: string;
  explanation: string;
}

// ─── Assessment State ─────────────────────────────────────────────────────────
export interface ExerciseAttempt {
  exerciseId: string;
  exerciseType: ExerciseType;
  answer: ExerciseAnswer;
  validation: ExerciseValidationResult;
  attemptedAt: string;
}

export interface AssessmentSession {
  lessonId: string;
  exercises: Exercise[];
  currentIndex: number;
  attempts: Map<string, ExerciseAttempt>;
  startedAt: string;
  completedAt?: string;
}

export interface AssessmentScore {
  lessonId: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  totalPoints: number;
  maxPoints: number;
  timeTakenSeconds: number;
  exerciseBreakdown: ExerciseAttempt[];
  incorrectExercises: Exercise[];
  vocabularyNeedingPractice: string[];
}

// ─── Vocabulary Progress ──────────────────────────────────────────────────────
export interface VocabularyProgressEntry {
  vocabularyId: string;
  timesSeen: number;
  timesCorrect: number;
  timesIncorrect: number;
  masteryStatus: 'new' | 'learning' | 'familiar' | 'mastered';
  lastReviewedAt: string;
}

// ─── Adaptive Recommendation ──────────────────────────────────────────────────
export type RecommendationType =
  | 'vocabulary_revision'
  | 'sentence_practice'
  | 'listening_exercises'
  | 'all_good';

export interface AdaptiveRecommendation {
  type: RecommendationType;
  reason: string;
  exerciseType?: ExerciseType;
}

