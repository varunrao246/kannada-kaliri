/**
 * Milestone 07: AI Conversation Simulator Verification Suite
 * Kannada Kaliri
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getScenarioById,
  getAllScenarios,
} from '../../lib/scenarios/data.ts';

import {
  buildScenarioRoleplayPrompt,
  buildScenarioEvaluationPrompt,
} from '../../lib/scenarios/prompts.ts';

import {
  generateMockScenarioTurn,
  generateAlgorithmicFeedback,
} from '../../lib/scenarios/engine.ts';

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
    if (details) console.log(`   └─ ${details}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
    if (details) console.error(`   └─ ${details}`);
  }
}

console.log('====================================================');
console.log('  KANNADA KALIRI — MILESTONE 07 VERIFICATION SUITE  ');
console.log('====================================================\n');

// ─── Suite 1: Scenario Library Completeness ──────────────────────────────────
console.log('--- Suite 1: Scenario Library Completeness ---');

const allScenarios = getAllScenarios();
assert(allScenarios.length === 8, 'Exactly 8 real-world scenarios seeded', `Found ${allScenarios.length}`);

const EXPECTED_SCENARIO_IDS = [
  'local-shop',
  'restaurant-darshini',
  'college-introduction',
  'asking-directions',
  'travel-auto',
  'neighbour-chat',
  'hospital-reception',
  'workplace-conversation',
];

for (const id of EXPECTED_SCENARIO_IDS) {
  const scenario = getScenarioById(id);
  assert(Boolean(scenario), `Scenario found: ${id}`, scenario?.title);
  assert(Boolean(scenario?.kannadaTitle), `Has authentic Kannada title: ${scenario?.kannadaTitle}`);
  assert(Boolean(scenario?.character?.name), `Has character: ${scenario?.character?.name} (${scenario?.character?.role})`);
  assert(Boolean(scenario?.character?.avatar), `Has character avatar: ${scenario?.character?.avatar}`);
  assert(Boolean(scenario?.character?.persona), `Has rich character persona`);
  assert(Boolean(scenario?.objective), `Has realistic conversation objective`);
  assert(Array.isArray(scenario?.usefulVocabulary) && scenario.usefulVocabulary.length >= 5, `Has >= 5 vocabulary items (${scenario?.usefulVocabulary.length})`);
  assert(Array.isArray(scenario?.expectedOutcomes) && scenario.expectedOutcomes.length >= 3, `Has >= 3 learning outcomes`);
  assert(Boolean(scenario?.initialMessage?.kannadaText), `Has initial character greeting`);
  assert(Boolean(scenario?.initialMessage?.suggestedReplies?.length), `Has initial suggested replies for learners`);
}

// ─── Suite 2: Roleplay System Prompts & Adaptive Difficulty ──────────────────
console.log('\n--- Suite 2: Roleplay System Prompts & Adaptive Difficulty ---');

const localShop = getScenarioById('local-shop');
const sampleLearnerBeginner = {
  learnerName: 'Rahul',
  nativeLanguage: 'en',
  nativeLanguageName: 'English',
  proficiencyLevel: 'beginner',
  learningGoals: ['Daily Life'],
  dailyGoalMinutes: 10,
  completedLessonsCount: 2,
  strugglingConcepts: [],
  wordsNeedingRevision: [],
};

const beginnerPrompt = buildScenarioRoleplayPrompt(localShop, sampleLearnerBeginner);
assert(beginnerPrompt.includes('Manjunath'), 'Prompt configures character name Manjunath');
assert(beginnerPrompt.includes('Malleshwaram'), 'Prompt configures Malleshwaram location');
assert(beginnerPrompt.includes('BEGINNER'), 'Prompt includes BEGINNER adaptive language constraints');
assert(beginnerPrompt.includes('suggestedReplies'), 'Prompt enforces suggested replies array');

const sampleLearnerIntermediate = {
  ...sampleLearnerBeginner,
  proficiencyLevel: 'intermediate',
};
const intermediatePrompt = buildScenarioRoleplayPrompt(localShop, sampleLearnerIntermediate);
assert(intermediatePrompt.includes('INTERMEDIATE'), 'Prompt includes INTERMEDIATE natural language constraints');

// ─── Suite 3: Evaluation Prompt Synthesis ────────────────────────────────────
console.log('\n--- Suite 3: Evaluation Prompt Synthesis ---');

const sampleTranscript = [
  { role: 'character', content: 'ನಮಸ್ಕಾರ ಸ್ವಾಮಿ! ಏನು ಬೇಕಾಗಿತ್ತು ಇಂದು?' },
  { role: 'user', content: 'ಒಂದು ಪ್ಯಾಕೆಟ್ ಹಾಲು ಕೊಡಿ' },
  { role: 'character', content: 'ತಗೊಳ್ಳಿ ಸ್ವಾಮಿ, ಇಪ್ಪತ್ತೈದು ರೂಪಾಯಿ.' },
  { role: 'user', content: 'ಧನ್ಯವಾದಗಳು! ಎಷ್ಟು ಆಯ್ತು?' },
];

const evalPrompt = buildScenarioEvaluationPrompt(localShop, sampleLearnerBeginner, sampleTranscript);
assert(evalPrompt.includes('Lead Kannada Language Assessment Evaluator'), 'Evaluation prompt sets assessment persona');
assert(evalPrompt.includes('Task completion & communicative intent (40%)'), 'Includes 40% task completion weight');
assert(evalPrompt.includes('Vocabulary appropriateness (30%)'), 'Includes 30% vocabulary weight');
assert(evalPrompt.includes('Grammar & word order accuracy (30%)'), 'Includes 30% grammar weight');
assert(evalPrompt.includes('confidenceScore'), 'Includes confidenceScore output requirement');

// ─── Suite 4: Roleplay Engine Execution & Mock Turn Verification ─────────────
console.log('\n--- Suite 4: Roleplay Engine Execution & Mock Turn Verification ---');

// Turn 1: User asks for milk
const turn1 = generateMockScenarioTurn(localShop, [
  { role: 'character', content: localShop.initialMessage.kannadaText },
  { role: 'user', content: 'ನನಗೆ ಒಂದು ಪ್ಯಾಕೆಟ್ ಹಾಲು ಕೊಡಿ' },
]);

assert(turn1.kannadaText.includes('ಹಾಲು') || turn1.kannadaText.includes('ನಂದಿನಿ'), 'Mock engine responds contextually to milk query');
assert(turn1.grammarExplanation !== undefined, 'Turn includes helpful grammar note');
assert(turn1.suggestedReplies.length >= 2, 'Turn provides suggested replies for learner');
assert(turn1.isObjectiveCompleted === false, 'Objective is not prematurely completed on turn 1');

// Final Turn: User completes payment
const turnFinal = generateMockScenarioTurn(localShop, [
  { role: 'character', content: localShop.initialMessage.kannadaText },
  { role: 'user', content: 'ಹಾಲು ಕೊಡಿ' },
  { role: 'character', content: turn1.kannadaText },
  { role: 'user', content: 'ಯುಪಿಐ (UPI) ಮಾಡ್ತೀನಿ, ಧನ್ಯವಾದಗಳು!' },
]);

assert(turnFinal.isObjectiveCompleted === true, 'Final turn detects objective completion');
assert(turnFinal.kannadaText.includes('ಧನ್ಯವಾದಗಳು') || turnFinal.kannadaText.includes('ಸಂತೋಷ'), 'Final turn wraps up warmly');

// ─── Suite 5: Algorithmic Evaluation & Confidence Methodology ───────────────
console.log('\n--- Suite 5: Algorithmic Evaluation & Confidence Methodology ---');

const feedback = generateAlgorithmicFeedback(localShop, sampleTranscript);
assert(typeof feedback.confidenceScore === 'number', 'Calculates numerical confidence score', `${feedback.confidenceScore}%`);
assert(feedback.confidenceScore >= 50 && feedback.confidenceScore <= 100, 'Score is within valid 0-100 bounds');
assert(feedback.confidenceMethodology.includes('Pronunciation accuracy is not simulated'), 'Clearly explains that pronunciation is not falsely claimed');
assert(feedback.metrics.length === 3, 'Breaks down feedback into 3 weighted dimensions');
assert(feedback.metrics[0].weight === 40, 'Task completion weight is 40%');
assert(feedback.metrics[1].weight === 30, 'Vocabulary weight is 30%');
assert(feedback.metrics[2].weight === 30, 'Grammar weight is 30%');
assert(feedback.vocabularyUsed.length > 0, 'Lists recognized vocabulary items');
assert(feedback.grammarCorrections.length > 0, 'Provides sentence construction feedback');
assert(Boolean(feedback.recommendedScenarioId), 'Recommends next scenario', feedback.recommendedScenarioId);

// ─── Suite 6: Database Schema & Migration SQL ────────────────────────────────
console.log('\n--- Suite 6: Database Schema & Migration SQL ---');

const migrationPath = resolve(process.cwd(), 'supabase/migrations/006_create_scenario_simulators.sql');
assert(existsSync(migrationPath), 'Migration 006 file exists on disk', migrationPath);

const migrationSql = readFileSync(migrationPath, 'utf-8');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.scenario_attempts'), 'Defines scenario_attempts table');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.scenario_messages'), 'Defines scenario_messages table');
assert(migrationSql.includes('ALTER TABLE public.scenario_attempts ENABLE ROW LEVEL SECURITY'), 'RLS enabled on scenario_attempts');
assert(migrationSql.includes('ALTER TABLE public.scenario_messages ENABLE ROW LEVEL SECURITY'), 'RLS enabled on scenario_messages');
assert(migrationSql.includes('auth.uid() = user_id'), 'Strict user isolation enforced via auth.uid()');

// ─── Suite 7: Architectural File Presence ────────────────────────────────────
console.log('\n--- Suite 7: Architectural File Presence ---');

const requiredFiles = [
  'lib/scenarios/types.ts',
  'lib/scenarios/data.ts',
  'lib/scenarios/prompts.ts',
  'lib/scenarios/engine.ts',
  'lib/services/scenarios.ts',
  'app/api/scenarios/chat/route.ts',
  'app/api/scenarios/complete/route.ts',
  'components/scenarios/ScenarioCard.tsx',
  'components/scenarios/ScenarioLibraryView.tsx',
  'components/scenarios/ScenarioFeedbackModal.tsx',
  'components/scenarios/ScenarioSimulatorView.tsx',
  'app/scenarios/page.tsx',
  'app/scenarios/[scenarioId]/page.tsx',
];

for (const rel of requiredFiles) {
  const full = resolve(process.cwd(), rel);
  assert(existsSync(full), `Verified module exists: ${rel}`);
}

// ─── Final Summary ───────────────────────────────────────────────────────────
console.log('\n====================================================');
console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}

