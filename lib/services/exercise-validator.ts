/**
 * Exercise Validator
 * Kannada Kaliri — Milestone 04
 *
 * Authoritative server-side validation for all exercise types.
 * Never trust a client-supplied score.
 */

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
  MultipleChoiceAnswer,
  WordMatchingAnswer,
  SentenceConstructionAnswer,
  FillInTheBlankAnswer,
  ListeningComprehensionAnswer,
  VocabularyRecallAnswer,
} from '@/lib/exercises/types';

// ─── Normalisation helpers ────────────────────────────────────────────────────
function normalise(s: string): string {
  return s
    .replace(/[.,!?।]/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// ─── Validators per type ──────────────────────────────────────────────────────
function validateMultipleChoice(
  exercise: MultipleChoiceExercise,
  answer: MultipleChoiceAnswer
): ExerciseValidationResult {
  const isCorrect = answer.selectedOption === exercise.correctAnswer;
  return {
    exerciseId: exercise.id,
    isCorrect,
    pointsAwarded: isCorrect ? exercise.points : 0,
    correctAnswer: exercise.correctAnswer,
    feedback: isCorrect
      ? '✓ Correct!'
      : `✗ The correct answer is: ${exercise.correctAnswer}`,
    explanation: exercise.explanation,
  };
}

function validateWordMatching(
  exercise: WordMatchingExercise,
  answer: WordMatchingAnswer
): ExerciseValidationResult {
  let correctCount = 0;
  const correctMap: Record<string, string> = {};

  for (const pair of exercise.pairs) {
    correctMap[pair.id] = pair.meaning;
    if (answer.matches[pair.id] === pair.meaning) {
      correctCount++;
    }
  }

  const total = exercise.pairs.length;
  const isCorrect = correctCount === total;
  // Partial credit: proportional points
  const pointsAwarded = Math.round((correctCount / total) * exercise.points);

  return {
    exerciseId: exercise.id,
    isCorrect,
    pointsAwarded,
    correctAnswer: correctMap,
    feedback: isCorrect
      ? `✓ Perfect! All ${total} pairs matched correctly.`
      : `${correctCount} of ${total} pairs matched correctly.`,
    explanation: `Correct pairs: ${exercise.pairs.map((p) => `${p.kannada} → ${p.meaning}`).join(', ')}`,
  };
}

function validateSentenceConstruction(
  exercise: SentenceConstructionExercise,
  answer: SentenceConstructionAnswer
): ExerciseValidationResult {
  const submitted = normalise(answer.constructedSentence);
  const correct = normalise(exercise.correctSentence);
  const variants = (exercise.acceptedVariants ?? []).map(normalise);

  const isCorrect = submitted === correct || variants.includes(submitted);

  return {
    exerciseId: exercise.id,
    isCorrect,
    pointsAwarded: isCorrect ? exercise.points : 0,
    correctAnswer: exercise.correctSentence,
    feedback: isCorrect
      ? '✓ Correct sentence!'
      : `✗ The correct sentence is: ${exercise.correctSentence}`,
    explanation: exercise.explanation,
  };
}

function validateFillInTheBlank(
  exercise: FillInTheBlankExercise,
  answer: FillInTheBlankAnswer
): ExerciseValidationResult {
  const submitted = normalise(answer.answer);
  const accepted = exercise.acceptedAnswers.map(normalise);
  const isCorrect = accepted.includes(submitted);

  return {
    exerciseId: exercise.id,
    isCorrect,
    pointsAwarded: isCorrect ? exercise.points : 0,
    correctAnswer: exercise.acceptedAnswers[0],
    feedback: isCorrect
      ? '✓ Correct!'
      : `✗ Accepted answers: ${exercise.acceptedAnswers.join(' / ')}`,
    explanation: exercise.explanation,
  };
}

function validateListeningComprehension(
  exercise: ListeningComprehensionExercise,
  answer: ListeningComprehensionAnswer
): ExerciseValidationResult {
  const isCorrect = answer.selectedOption === exercise.correctAnswer;
  return {
    exerciseId: exercise.id,
    isCorrect,
    pointsAwarded: isCorrect ? exercise.points : 0,
    correctAnswer: exercise.correctAnswer,
    feedback: isCorrect
      ? '✓ Correct! Good listening!'
      : `✗ The correct meaning is: ${exercise.correctAnswer}`,
    explanation: exercise.explanation,
  };
}

function validateVocabularyRecall(
  exercise: VocabularyRecallExercise,
  answer: VocabularyRecallAnswer
): ExerciseValidationResult {
  // Vocabulary recall is self-assessed: "known" = correct, "needs_practice" = not counted as failure
  const isCorrect = answer.selfAssessment === 'known';
  return {
    exerciseId: exercise.id,
    isCorrect,
    pointsAwarded: isCorrect ? exercise.points : 0,
    correctAnswer: exercise.correctMeaning,
    feedback: isCorrect
      ? '✓ Great! You knew this word.'
      : 'Added to your practice list. Review it again soon.',
    explanation: `"${exercise.kannada}" (${exercise.transliteration}) means: ${exercise.correctMeaning}`,
  };
}

// ─── Master validator ─────────────────────────────────────────────────────────
export function validateExerciseAnswer(
  exercise: Exercise,
  answer: ExerciseAnswer
): ExerciseValidationResult {
  switch (exercise.type) {
    case 'multiple_choice':
      return validateMultipleChoice(exercise, answer as MultipleChoiceAnswer);
    case 'word_matching':
      return validateWordMatching(exercise, answer as WordMatchingAnswer);
    case 'sentence_construction':
      return validateSentenceConstruction(exercise, answer as SentenceConstructionAnswer);
    case 'fill_in_the_blank':
      return validateFillInTheBlank(exercise, answer as FillInTheBlankAnswer);
    case 'listening_comprehension':
      return validateListeningComprehension(exercise, answer as ListeningComprehensionAnswer);
    case 'vocabulary_recall':
      return validateVocabularyRecall(exercise, answer as VocabularyRecallAnswer);
    default:
      return {
        exerciseId: (exercise as Exercise).id,
        isCorrect: false,
        pointsAwarded: 0,
        correctAnswer: '',
        feedback: 'Unknown exercise type.',
        explanation: '',
      };
  }
}

