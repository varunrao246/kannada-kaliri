/**
 * AI Conversation Simulator — Types & Domain Models
 * Kannada Kaliri — Milestone 07
 */

import type { ProficiencyLevel } from '@/types/profile';

export type ScenarioCategory =
  | 'daily_life'
  | 'dining'
  | 'social'
  | 'travel'
  | 'workplace'
  | 'health';

export interface ScenarioVocabularyItem {
  kannada: string;
  transliteration: string;
  english: string;
}

export interface ScenarioCharacter {
  name: string;
  kannadaName: string;
  role: string;
  avatar: string;
  persona: string;
  tone: string;
  voiceGender: 'female' | 'male';
}

export interface ScenarioInitialMessage {
  kannadaText: string;
  transliteration: string;
  englishTranslation: string;
  suggestedReplies: string[];
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  kannadaTitle: string;
  category: ScenarioCategory;
  difficulty: ProficiencyLevel;
  description: string;
  location: string;
  estimatedMinutes: number;
  targetTurns: number;
  character: ScenarioCharacter;
  objective: string;
  culturalContext: string;
  usefulVocabulary: ScenarioVocabularyItem[];
  expectedOutcomes: string[];
  initialMessage: ScenarioInitialMessage;
}

export interface ScenarioAssistanceOptions {
  showTransliteration: boolean;
  showTranslation: boolean;
  showGrammarTips: boolean;
}

export interface ScenarioChatMessage {
  id: string;
  attemptId: string;
  role: 'character' | 'user' | 'system';
  kannadaText: string;
  transliteration?: string;
  englishTranslation?: string;
  grammarExplanation?: string;
  suggestedReplies?: string[];
  audioSource?: 'gnani-timbre' | 'browser-fallback' | null;
  createdAt: string;
}

export interface ScenarioFeedbackMetric {
  name: string;
  score: number; // 0 to 100
  weight: number;
  description: string;
}

export interface ScenarioCompletionFeedback {
  completedObjective: boolean;
  confidenceScore: number; // 0 to 100
  confidenceMethodology: string;
  turnsCompleted: number;
  targetTurns: number;
  metrics: ScenarioFeedbackMetric[];
  vocabularyUsed: string[];
  grammarCorrections: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
  strengths: string[];
  improvements: string[];
  recommendedScenarioId?: string;
  recommendedScenarioTitle?: string;
  suggestedPracticeExercises: Array<{
    title: string;
    lessonId: string;
  }>;
}

export interface ScenarioAttempt {
  id: string;
  userId: string;
  scenarioId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  turnsCompleted: number;
  confidenceScore?: number | null;
  feedback?: ScenarioCompletionFeedback | null;
  startedAt: string;
  completedAt?: string | null;
}

