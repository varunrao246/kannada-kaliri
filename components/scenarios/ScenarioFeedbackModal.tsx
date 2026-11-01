'use client';

import React from 'react';
import Link from 'next/link';
import type { ScenarioCompletionFeedback, ScenarioDefinition } from '@/lib/scenarios/types';

interface ScenarioFeedbackModalProps {
  feedback: ScenarioCompletionFeedback;
  scenario: ScenarioDefinition;
  onRestart: () => void;
  onClose: () => void;
}

export function ScenarioFeedbackModal({
  feedback,
  scenario,
  onRestart,
  onClose,
}: ScenarioFeedbackModalProps) {
  const isHighConfidence = feedback.confidenceScore >= 75;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-300 flex items-center justify-center text-2xl shadow-inner">
              {feedback.completedObjective ? '🎉' : '💬'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {feedback.completedObjective ? 'Scenario Completed!' : 'Scenario Summary'}
              </h2>
              <p className="text-xs text-stone-500">
                {scenario.title} · {scenario.character.name} ({scenario.character.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-slate-700 text-lg p-1 rounded-lg hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {/* Overall Score & Methodology */}
        <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Roleplay Confidence Rating
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-white">
                  {feedback.confidenceScore}%
                </span>
                <span className="text-xs text-amber-200/90 font-medium">
                  {isHighConfidence ? 'Fluent Communicator' : 'Good Progress'}
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right text-xs text-stone-300">
              <p>Turns Completed: <strong className="text-white">{feedback.turnsCompleted}</strong> / {feedback.targetTurns}</p>
              <p>Objective: <strong className="text-amber-300">{feedback.completedObjective ? 'Achieved ✓' : 'Partial'}</strong></p>
            </div>
          </div>

          {/* Methodology Explanation */}
          <div className="pt-3 border-t border-white/10 text-xs text-stone-300/90 leading-relaxed space-y-1">
            <p className="font-semibold text-amber-300 flex items-center gap-1.5">
              <span>ℹ️</span>
              <span>Methodology &amp; Evaluation Integrity:</span>
            </p>
            <p className="text-[11px] text-stone-300">
              {feedback.confidenceMethodology}
            </p>
          </div>
        </div>

        {/* 3 Weighted Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {feedback.metrics.map((m, idx) => (
            <div key={idx} className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{m.name}</span>
                <span className="text-xs font-extrabold text-amber-700">{m.score}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${m.score}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-500 leading-tight">{m.description}</p>
            </div>
          ))}
        </div>

        {/* Vocabulary Used */}
        {feedback.vocabularyUsed.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Kannada Vocabulary Practised
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {feedback.vocabularyUsed.map((w, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg font-sans"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Grammar & SOV Corrections */}
        {feedback.grammarCorrections.length > 0 && (
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-2 text-xs">
            <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
              <span>✍️</span>
              <span>Sentence Construction &amp; Grammar Insights</span>
            </h4>
            <div className="space-y-2 pt-1">
              {feedback.grammarCorrections.map((corr, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-rose-100 space-y-1">
                  <p className="text-rose-800 line-through">Learner: {corr.original}</p>
                  <p className="text-emerald-800 font-semibold">Recommended: {corr.corrected}</p>
                  <p className="text-[11px] text-stone-600">{corr.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1">
              <span>✓</span>
              <span>Strengths</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-emerald-950">
              {feedback.strengths.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-1.5">
            <h4 className="font-bold text-blue-900 flex items-center gap-1">
              <span>💡</span>
              <span>Next Steps</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-blue-950">
              {feedback.improvements.map((imp, idx) => (
                <li key={idx}>{imp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended Next Scenario */}
        {feedback.recommendedScenarioId && (
          <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Recommended Next Scenario
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {feedback.recommendedScenarioTitle || feedback.recommendedScenarioId}
              </p>
            </div>
            <Link
              href={`/scenarios/${feedback.recommendedScenarioId}`}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors shrink-0 shadow-2xs"
            >
              Start Next Scenario →
            </Link>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          <button
            onClick={onRestart}
            className="px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl font-medium transition-colors"
          >
            Restart Scenario
          </button>
          <Link
            href="/scenarios"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            Explore All Scenarios
          </Link>
        </div>
      </div>
    </div>
  );
}

