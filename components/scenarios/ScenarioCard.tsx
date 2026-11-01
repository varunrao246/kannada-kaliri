'use client';

import React from 'react';
import Link from 'next/link';
import type { ScenarioDefinition } from '@/lib/scenarios/types';

interface ScenarioCardProps {
  scenario: ScenarioDefinition;
  isCompleted?: boolean;
  confidenceScore?: number | null;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  elementary: 'bg-amber-100 text-amber-800 border-amber-200',
  intermediate: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function ScenarioCard({ scenario, isCompleted, confidenceScore }: ScenarioCardProps) {
  const diffClass = DIFFICULTY_COLORS[scenario.difficulty] || 'bg-stone-100 text-stone-800';

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
            {scenario.character.avatar}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${diffClass}`}>
              {scenario.difficulty}
            </span>
            {isCompleted && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                ✓ {confidenceScore ? `${confidenceScore}%` : 'Done'}
              </span>
            )}
          </div>
        </div>

        {/* Title and Kannada Title */}
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
            {scenario.title}
          </h3>
          <p className="text-xs font-semibold text-amber-900 font-sans mt-0.5">
            {scenario.kannadaTitle}
          </p>
        </div>

        {/* Character Role & Location */}
        <div className="text-xs text-stone-500 space-y-0.5">
          <p>
            Character: <strong className="text-slate-800">{scenario.character.name}</strong> ({scenario.character.role})
          </p>
          <p className="text-[11px] text-stone-400">📍 {scenario.location}</p>
        </div>

        {/* Description */}
        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
          {scenario.description}
        </p>

        {/* Sample Vocab Badges */}
        <div className="flex flex-wrap gap-1 pt-1">
          {scenario.usefulVocabulary.slice(0, 3).map((v, i) => (
            <span key={i} className="text-[11px] bg-stone-100 text-slate-700 px-2 py-0.5 rounded-md font-sans">
              {v.kannada}
            </span>
          ))}
          {scenario.usefulVocabulary.length > 3 && (
            <span className="text-[10px] text-stone-400 self-center">
              +{scenario.usefulVocabulary.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs">
        <span className="text-stone-400 font-medium">
          ⏱ ~{scenario.estimatedMinutes} mins · {scenario.targetTurns} turns
        </span>
        <Link
          href={`/scenarios/${scenario.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all group-hover:bg-amber-600 shadow-2xs"
        >
          <span>{isCompleted ? 'Practise Again' : 'Enter Roleplay'}</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

