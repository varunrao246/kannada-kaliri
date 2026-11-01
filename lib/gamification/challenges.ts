/**
 * Gamification & Learner Motivation Engine — Adaptive Daily Challenges
 * Kannada Kaliri — Milestone 09
 *
 * Generates 3 personalized daily challenges calibrated by Milestone 08 insights.
 */

import type { DailyChallenge } from './types';
import type { LearnerAnalyticsSnapshot } from '@/lib/adaptive/types';
import { XP_REWARDS } from './constants';

export interface ChallengeGenerationInput {
  userId?: string;
  todayDate?: string;
  dateString?: string;
  adaptiveAnalytics?: LearnerAnalyticsSnapshot | null;
  progressMap?: Map<string, { currentCount: number; isCompleted: boolean; isClaimed: boolean }>;
}

export function generateDailyChallenges(input: ChallengeGenerationInput): DailyChallenge[] {
  const { todayDate, dateString, adaptiveAnalytics, progressMap = new Map() } = input;
  const effectiveDate = todayDate || dateString || new Date().toISOString().slice(0, 10);
  const expiresAt = `${effectiveDate}T23:59:59Z`;

  const topGap = adaptiveAnalytics?.knowledgeGaps?.[0];
  const hasVocabGap = topGap?.category === 'vocabulary';
  const hasSentenceGap = topGap?.category === 'sentence_construction';

  // Challenge 1: Vocabulary or Lesson Focus
  const ch1Id = `ch-${effectiveDate}-vocab`;
  const ch1Prog = progressMap.get(ch1Id);
  const ch1: DailyChallenge = hasVocabGap
    ? {
        id: ch1Id,
        title: 'Daily Vocabulary Mastery',
        kannadaTitle: 'ದೈನಂದಿನ ಪದ ಸಂಪತ್ತು',
        description: 'Review and practise 5 vocabulary flashcards to reinforce retention.',
        type: 'learn_words',
        targetCount: 5,
        currentCount: ch1Prog?.currentCount || 0,
        xpReward: XP_REWARDS.DAILY_CHALLENGE,
        isCompleted: ch1Prog?.isCompleted || (ch1Prog?.currentCount || 0) >= 5,
        isClaimed: Boolean(ch1Prog?.isClaimed),
        actionUrl: '/learn#vocab',
        expiresAt,
      }
    : {
        id: ch1Id,
        title: 'Daily Lesson Milestone',
        kannadaTitle: 'ದೈನಂದಿನ ಪಾಠ ಸಾಧನೆ',
        description: 'Complete 1 structured Kannada lesson from your curriculum.',
        type: 'complete_lesson',
        targetCount: 1,
        currentCount: ch1Prog?.currentCount || 0,
        xpReward: XP_REWARDS.DAILY_CHALLENGE,
        isCompleted: ch1Prog?.isCompleted || (ch1Prog?.currentCount || 0) >= 1,
        isClaimed: Boolean(ch1Prog?.isClaimed),
        actionUrl: '/learn',
        expiresAt,
      };

  // Challenge 2: Grammar or Sentence Construction
  const ch2Id = `ch-${effectiveDate}-grammar`;
  const ch2Prog = progressMap.get(ch2Id);
  const ch2: DailyChallenge = hasSentenceGap
    ? {
        id: ch2Id,
        title: 'Build 3 Kannada Sentences',
        kannadaTitle: '೩ ಕನ್ನಡ ವಾಕ್ಯಗಳನ್ನು ರಚಿಸಿ',
        description: 'Practise constructing 3 sentences with correct Subject-Object-Verb (SOV) order.',
        type: 'build_sentences',
        targetCount: 3,
        currentCount: ch2Prog?.currentCount || 0,
        xpReward: XP_REWARDS.DAILY_CHALLENGE,
        isCompleted: ch2Prog?.isCompleted || (ch2Prog?.currentCount || 0) >= 3,
        isClaimed: Boolean(ch2Prog?.isClaimed),
        actionUrl: topGap?.actionUrl || '/learn',
        expiresAt,
      }
    : {
        id: ch2Id,
        title: 'Consult Kannada Guru',
        kannadaTitle: 'ಗುರುವಿನ ಜೊತೆ ಸಂವಾದ',
        description: 'Ask your AI Kannada Guru about grammar, polite forms, or local culture.',
        type: 'revise_weak_topic',
        targetCount: 1,
        currentCount: ch2Prog?.currentCount || 0,
        xpReward: XP_REWARDS.DAILY_CHALLENGE,
        isCompleted: ch2Prog?.isCompleted || (ch2Prog?.currentCount || 0) >= 1,
        isClaimed: Boolean(ch2Prog?.isClaimed),
        actionUrl: '/guru',
        expiresAt,
      };

  // Challenge 3: Real-World Conversation Simulator
  const ch3Id = `ch-${effectiveDate}-scenario`;
  const ch3Prog = progressMap.get(ch3Id);
  const ch3: DailyChallenge = {
    id: ch3Id,
    title: 'Real-World Roleplay',
    kannadaTitle: 'ನೈಜ ಸಂಭಾಷಣಾ ಸವಾಲು',
    description: 'Complete 1 spoken conversation scenario with an AI character.',
    type: 'complete_scenario',
    targetCount: 1,
    currentCount: ch3Prog?.currentCount || 0,
    xpReward: XP_REWARDS.DAILY_CHALLENGE,
    isCompleted: ch3Prog?.isCompleted || (ch3Prog?.currentCount || 0) >= 1,
    isClaimed: Boolean(ch3Prog?.isClaimed),
    actionUrl: '/scenarios',
    expiresAt,
  };

  return [ch1, ch2, ch3];
}
