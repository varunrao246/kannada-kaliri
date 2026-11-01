/**
 * AI Conversation Simulator — Roleplay Execution Engine
 * Kannada Kaliri — Milestone 07
 */

import type {
  ScenarioDefinition,
  ScenarioCompletionFeedback,
} from './types';
import type { LearnerTutoringContext } from '@/lib/ai/tutor/types';
import {
  getTutorAIProvider,
  TutorAIError,
} from '@/lib/ai/tutor/provider';
import { isTutorAIConfigured, getTutorAIConfig } from '@/lib/ai/tutor/config';
import {
  buildScenarioRoleplayPrompt,
  buildScenarioEvaluationPrompt,
} from './prompts';

export interface ScenarioTurnResult {
  kannadaText: string;
  transliteration: string;
  englishTranslation: string;
  grammarExplanation?: string;
  suggestedReplies: string[];
  isObjectiveCompleted: boolean;
  provider: string;
  model: string;
}

function parseScenarioTurnResponse(rawText: string, scenario: ScenarioDefinition): ScenarioTurnResult {
  let text = rawText.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  } else {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      text = text.slice(first, last + 1);
    }
  }

  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object') {
      const kannadaText =
        typeof data.kannadaText === 'string' && data.kannadaText.trim().length > 0
          ? data.kannadaText.trim()
          : scenario.initialMessage.kannadaText;

      const transliteration =
        typeof data.transliteration === 'string' && data.transliteration.trim().length > 0
          ? data.transliteration.trim()
          : scenario.initialMessage.transliteration;

      const englishTranslation =
        typeof data.englishTranslation === 'string' && data.englishTranslation.trim().length > 0
          ? data.englishTranslation.trim()
          : scenario.initialMessage.englishTranslation;

      const grammarExplanation =
        typeof data.grammarExplanation === 'string' && data.grammarExplanation.trim().length > 0
          ? data.grammarExplanation.trim()
          : undefined;

      const suggestedReplies = Array.isArray(data.suggestedReplies)
        ? data.suggestedReplies.map(String).filter((s: string) => s.trim().length > 0).slice(0, 3)
        : scenario.initialMessage.suggestedReplies;

      const isObjectiveCompleted = Boolean(data.isObjectiveCompleted);

      return {
        kannadaText,
        transliteration,
        englishTranslation,
        grammarExplanation,
        suggestedReplies,
        isObjectiveCompleted,
        provider: 'ai',
        model: 'dynamic',
      };
    }
  } catch {
    // Fallback if parsing fails
  }

  // Safe fallback if JSON parsing failed
  return {
    kannadaText: rawText.replace(/```[a-z]*|```/g, '').trim().slice(0, 300),
    transliteration: 'Kannada conversation turn',
    englishTranslation: 'Understanding your response in context...',
    suggestedReplies: scenario.initialMessage.suggestedReplies,
    isObjectiveCompleted: false,
    provider: 'fallback',
    model: 'rule-based',
  };
}

/**
 * Execute a conversation turn with the AI character
 */
export async function executeScenarioTurn(
  scenario: ScenarioDefinition,
  learnerContext: LearnerTutoringContext,
  transcript: Array<{ role: 'character' | 'user' | 'system'; content: string }>
): Promise<ScenarioTurnResult> {
  const config = getTutorAIConfig();

  // If unconfigured and not in mock mode, throw structured error
  if (!isTutorAIConfigured() && config.provider !== 'mock') {
    throw new TutorAIError(
      'AI Provider is not configured. Please set AI_API_KEY in server environment to enable live roleplay.',
      'AI_PROVIDER_NOT_CONFIGURED',
      503
    );
  }

  // If mock mode requested
  if (config.provider === 'mock') {
    return generateMockScenarioTurn(scenario, transcript);
  }

  const systemPrompt = buildScenarioRoleplayPrompt(scenario, learnerContext);
  const provider = getTutorAIProvider();

  const providerMessages = transcript.map((m) => ({
    role: (m.role === 'character' ? 'assistant' : m.role === 'system' ? 'system' : 'user') as
      | 'user'
      | 'assistant'
      | 'system',
    content: m.content,
  }));

  const res = await provider.generateTutoringResponse({
    messages: providerMessages,
    learnerContext,
    customSystemPrompt: systemPrompt,
    temperature: 0.6,
  });

  const parsed = parseScenarioTurnResponse(res.rawText, scenario);
  parsed.provider = res.provider;
  parsed.model = res.model;

  return parsed;
}

/**
 * Deterministic, realistic mock roleplay responses for testing & offline demonstration
 */
export function generateMockScenarioTurn(
  scenario: ScenarioDefinition,
  transcript: Array<{ role: string; content: string }>
): ScenarioTurnResult {
  const userMessages = transcript.filter((t) => t.role === 'user');
  const userTurnsCount = userMessages.length;
  const lastUserText = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';

  if (scenario.id === 'local-shop') {
    if (lastUserText.includes('ಹಾಲು') || lastUserText.includes('milk')) {
      return {
        kannadaText: 'ತಗೊಳ್ಳಿ ಸ್ವಾಮಿ, ನಂದಿನಿ ನೀಲಿ ಹಾಲು ಪ್ಯಾಕೆಟ್. ಇಪ್ಪತ್ತೈದು ರೂಪಾಯಿ. ಬೇರೆ ಏನಾದರೂ ಬೇಕಾ?',
        transliteration: 'Tagolli swāmi, Nandini neeli hālu pyākeṭ. Ippattaidu roopāyi. Bēre ēnādarū bēkā?',
        englishTranslation: 'Take it sir, Nandini blue milk packet. 25 Rupees. Do you need anything else?',
        grammarExplanation: '"ತಗೊಳ್ಳಿ" (tagolli) is the polite imperative for "please take".',
        suggestedReplies: [
          'ಒಂದು ಕೆಜಿ ಸಕ್ಕರೆ ಕೊಡಿ (Give 1 kg sugar please)',
          'ಎಷ್ಟು ಆಯ್ತು ಒಟ್ಟು? (How much is the total?)',
          'ಯುಪಿಐ (UPI) ಮಾಡ್ತೀನಿ (I will pay by UPI)',
        ],
        isObjectiveCompleted: false,
        provider: 'mock',
        model: 'mock-simulator-v1',
      };
    }

    if (userTurnsCount >= scenario.targetTurns || lastUserText.includes('upi') || lastUserText.includes('ಧನ್ಯವಾದ')) {
      return {
        kannadaText: 'ತುಂಬಾ ಧನ್ಯವಾದಗಳು ಸ್ವಾಮಿ! ಮತ್ತೆ ಬನ್ನಿ. ನಿಮ್ಮ ಕನ್ನಡ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ!',
        transliteration: 'Tumbā dhanyavādagalu swāmi! Matte banni. Nimma kannaḍa tumbā chennāgide!',
        englishTranslation: 'Thank you very much sir! Come again. Your Kannada is very good!',
        grammarExplanation: '"ಮತ್ತೆ ಬನ್ನಿ" (matte banni) means "visit again / come again".',
        suggestedReplies: ['ಧನ್ಯವಾದಗಳು! (Thank you!)'],
        isObjectiveCompleted: true,
        provider: 'mock',
        model: 'mock-simulator-v1',
      };
    }
  }

  // Default turn response
  const isCompleted = userTurnsCount >= scenario.targetTurns;
  return {
    kannadaText: isCompleted
      ? `ಸರಿ ಸ್ವಾಮಿ! ನಿಮ್ಮ ಜೊತೆ ಮಾತನಾಡಿ ತುಂಬಾ ಸಂತೋಷವಾಯಿತು.`
      : `ಹೌದು, ಅರ್ಥವಾಯಿತು. ಮುಂದೆ ಏನು ಮಾಡೋಣ?`,
    transliteration: isCompleted
      ? 'Sari swāmi! Nimma jote mātanāḍi tumbā santōshavāyitu.'
      : 'Haudu, arthavāyitu. Munde ēnu māḍōṇa?',
    englishTranslation: isCompleted
      ? 'Alright sir! It was very pleasant speaking with you.'
      : 'Yes, understood. What shall we do next?',
    suggestedReplies: scenario.initialMessage.suggestedReplies,
    isObjectiveCompleted: isCompleted,
    provider: 'mock',
    model: 'mock-simulator-v1',
  };
}

/**
 * Generate comprehensive end-of-scenario feedback and score
 */
export async function evaluateScenarioCompletion(
  scenario: ScenarioDefinition,
  learnerContext: LearnerTutoringContext,
  transcript: Array<{ role: string; content: string }>
): Promise<ScenarioCompletionFeedback> {
  // If live provider configured, attempt real evaluation
  if (isTutorAIConfigured()) {
    try {
      const evaluationPrompt = buildScenarioEvaluationPrompt(scenario, learnerContext, transcript);
      const provider = getTutorAIProvider();
      const res = await provider.generateTutoringResponse({
        messages: [{ role: 'user', content: 'Generate complete evaluation report.' }],
        learnerContext,
        customSystemPrompt: evaluationPrompt,
        temperature: 0.3,
      });

      const parsed = parseEvaluationResponse(res.rawText, scenario, transcript);
      if (parsed) return parsed;
    } catch (err) {
      console.warn('[ScenarioEngine] Live evaluation failed, falling back to algorithmic report:', err);
    }
  }

  // Algorithmic evaluation fallback
  return generateAlgorithmicFeedback(scenario, transcript);
}

function parseEvaluationResponse(
  rawText: string,
  scenario: ScenarioDefinition,
  transcript: Array<{ role: string; content: string }>
): ScenarioCompletionFeedback | null {
  let text = rawText.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) text = fence[1].trim();

  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object') {
      return {
        completedObjective: Boolean(data.completedObjective ?? true),
        confidenceScore: Math.min(100, Math.max(10, Number(data.confidenceScore) || 82)),
        confidenceMethodology:
          data.confidenceMethodology ||
          'Weighted evaluation based on communicative goal completion (40%), Kannada vocabulary breadth (30%), and polite grammatical construction (30%).',
        turnsCompleted: transcript.filter((t) => t.role === 'user').length,
        targetTurns: scenario.targetTurns,
        metrics: Array.isArray(data.metrics) ? data.metrics : generateDefaultMetrics(82),
        vocabularyUsed: Array.isArray(data.vocabularyUsed) ? data.vocabularyUsed : ['ಹಾಲು', 'ಕೊಡಿ', 'ಧನ್ಯವಾದಗಳು'],
        grammarCorrections: Array.isArray(data.grammarCorrections) ? data.grammarCorrections : [],
        strengths: Array.isArray(data.strengths) ? data.strengths : ['Polite interaction form used consistently'],
        improvements: Array.isArray(data.improvements) ? data.improvements : ['Practise numbers and quantity suffixes'],
        recommendedScenarioId: data.recommendedScenarioId || 'restaurant-darshini',
        recommendedScenarioTitle: data.recommendedScenarioTitle || 'Ordering at a Darshini',
        suggestedPracticeExercises: Array.isArray(data.suggestedPracticeExercises)
          ? data.suggestedPracticeExercises
          : [{ title: 'Everyday Vocabulary', lessonId: 'm02-l01' }],
      };
    }
  } catch {
    // Return null to trigger algorithmic calculation
  }
  return null;
}

function generateDefaultMetrics(baseScore: number) {
  return [
    {
      name: 'Task Completion',
      score: Math.min(100, baseScore + 4),
      weight: 40,
      description: 'Communicative intent fulfilled in Karnataka cultural context',
    },
    {
      name: 'Vocabulary Relevance',
      score: Math.min(100, baseScore - 2),
      weight: 30,
      description: 'Usage of appropriate everyday Kannada vocabulary',
    },
    {
      name: 'Politeness & SOV Grammar',
      score: Math.min(100, baseScore),
      weight: 30,
      description: 'Proper honorific suffixes (ಕೊಡಿ / ನೀವು) and sentence structure',
    },
  ];
}

export function generateAlgorithmicFeedback(
  scenario: ScenarioDefinition,
  transcript: Array<{ role: string; content: string }>
): ScenarioCompletionFeedback {
  const userTurns = transcript.filter((t) => t.role === 'user');
  const turnsCount = userTurns.length;

  // Turn progress factor: up to 40 pts
  const turnScore = Math.min(40, (turnsCount / Math.max(1, scenario.targetTurns)) * 40);

  // Vocabulary overlap factor: up to 30 pts
  const allUserText = userTurns.map((u) => u.content).join(' ');
  const detectedVocab: string[] = [];

  for (const v of scenario.usefulVocabulary) {
    if (allUserText.includes(v.kannada) || allUserText.toLowerCase().includes(v.transliteration.toLowerCase())) {
      detectedVocab.push(`${v.kannada} (${v.transliteration} - ${v.english})`);
    }
  }

  const vocabRatio = scenario.usefulVocabulary.length > 0 ? detectedVocab.length / scenario.usefulVocabulary.length : 1;
  const vocabScore = Math.min(30, Math.max(15, Math.round(vocabRatio * 30)));

  // Grammar & Politeness score: 25-30 pts
  let grammarScore = 26;
  if (allUserText.includes('ಕೊಡಿ') || allUserText.includes('ಧನ್ಯವಾದ') || allUserText.includes('ನೀವು')) {
    grammarScore = 30;
  }

  const totalConfidence = Math.min(100, Math.max(25, Math.round(turnScore + vocabScore + grammarScore)));

  return {
    completedObjective: turnsCount >= Math.max(3, scenario.targetTurns - 1),
    confidenceScore: totalConfidence,
    confidenceMethodology:
      'Confidence score computed via 3 transparent dimensions: (1) Scenario conversation depth and turn completion (40%), (2) Relevant Kannada vocabulary usage (30%), and (3) Respectful grammatical registers like "ಕೊಡಿ" and Subject-Object-Verb phrasing (30%). Pronunciation accuracy is not simulated.',
    turnsCompleted: turnsCount,
    targetTurns: scenario.targetTurns,
    metrics: [
      {
        name: 'Task Completion',
        score: Math.round((turnScore / 40) * 100),
        weight: 40,
        description: `${turnsCount} of ${scenario.targetTurns} conversational exchanges completed.`,
      },
      {
        name: 'Vocabulary Relevance',
        score: Math.round((vocabScore / 30) * 100),
        weight: 30,
        description: `Recognized ${detectedVocab.length} scenario-specific Kannada words.`,
      },
      {
        name: 'Politeness & Grammar',
        score: Math.round((grammarScore / 30) * 100),
        weight: 30,
        description: 'Applied respectful honorific forms and functional sentence endings.',
      },
    ],
    vocabularyUsed: detectedVocab.length > 0 ? detectedVocab : ['ಹಾಲು (Hālu)', 'ಕೊಡಿ (Kodi)'],
    grammarCorrections: [
      {
        original: 'Remember to keep verbs at the end (SOV)',
        corrected: 'ಉದಾಹರಣೆ: "ನನಗೆ ಹಾಲು ಕೊಡಿ" (Subject / Object + Verb at the end)',
        reason: 'Kannada sentence structure places verbs like "ಕೊಡಿ" (kodi) or "ಆಯ್ತು" (aaytu) at the end.',
      },
    ],
    strengths: [
      'Courageously initiated real-world spoken interaction in Kannada',
      'Understood character prompts and replied contextually',
    ],
    improvements: [
      'Continue practising Kannada numbers for shopping and fare negotiation',
    ],
    recommendedScenarioId: scenario.id === 'local-shop' ? 'restaurant-darshini' : 'asking-directions',
    recommendedScenarioTitle:
      scenario.id === 'local-shop' ? 'Ordering at a Darshini' : 'Asking for Directions',
    suggestedPracticeExercises: [
      { title: 'Everyday Greetings', lessonId: 'm01-l01' },
      { title: 'Everyday Vocabulary', lessonId: 'm02-l01' },
    ],
  };
}
