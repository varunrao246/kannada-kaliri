/**
 * AI Kannada Guru — Type Definitions
 * Kannada Kaliri — Milestone 06
 *
 * Provider-agnostic domain models for personalized intelligent tutoring.
 */

import type { NativeLanguage, ProficiencyLevel } from '@/types/profile';

export type TutorMessageRole = 'user' | 'assistant' | 'system';

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface TutorQuickExercise {
  prompt: string;
  expectedKannada?: string;
  options?: string[];
  hint?: string;
}

/**
 * Validated structured response from the Kannada Guru
 */
export interface TutorStructuredResponse {
  /** Conversational pedagogical response */
  message: string;
  /** Focused Kannada phrase or dialogue (Kannada script) */
  kannadaText?: string;
  /** Romanized transliteration for pronunciation aid */
  transliteration?: string;
  /** Meaning in English */
  translation?: string;
  /** Grammar or cultural explanation in learner's native explanation language */
  explanation?: string;
  /** Corrections if the learner asked for grammar review or made a mistake */
  corrections?: GrammarCorrection[];
  /** 2-3 quick follow-up prompt suggestions */
  suggestedReplies?: string[];
  /** Optional micro-quiz challenge */
  exercise?: TutorQuickExercise;
}

/**
 * Concise server-generated learner context passed to the LLM
 */
export interface LearnerTutoringContext {
  learnerName: string;
  nativeLanguage: NativeLanguage;
  nativeLanguageName: string;
  proficiencyLevel: ProficiencyLevel;
  learningGoals: string[];
  dailyGoalMinutes: number;
  currentLessonTitle?: string;
  completedLessonsCount: number;
  recentAssessmentScore?: number | null;
  strugglingConcepts: string[];
  wordsNeedingRevision: string[];
  overallMastery?: number;
  masteryState?: string;
  topKnowledgeGaps?: string[];
  adaptiveRecommendationsSummary?: string[];
}

export interface TutorChatMessage {
  id: string;
  conversationId: string;
  role: TutorMessageRole;
  content: string;
  structuredResponse?: TutorStructuredResponse | null;
  createdAt: string;
}

export interface TutorConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export type AIProviderName = 'google' | 'openai' | 'groq' | 'anthropic' | 'mock';

export interface TutorProviderRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  learnerContext: LearnerTutoringContext;
  customSystemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TutorProviderResponse {
  rawText: string;
  structured: TutorStructuredResponse;
  provider: string;
  model: string;
}

