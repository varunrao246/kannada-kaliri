'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { ScenarioDefinition, ScenarioCategory } from '@/lib/scenarios/types';
import type { ProficiencyLevel } from '@/types/profile';
import { ScenarioCard } from './ScenarioCard';

interface ScenarioLibraryViewProps {
  scenarios: ScenarioDefinition[];
  completedMap: Record<string, number | null>;
}

export function ScenarioLibraryView({ scenarios, completedMap }: ScenarioLibraryViewProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<ProficiencyLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScenarios = scenarios.filter((s) => {
    if (selectedDifficulty !== 'all' && s.difficulty !== selectedDifficulty) return false;
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        s.title.toLowerCase().includes(q) ||
        s.kannadaTitle.includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.character.name.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* ─── Hero Header ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
              ರಿಯಲ್-ವರ್ಲ್ಡ್ ಸಂಭಾಷಣೆ
            </span>
            <span className="text-xs text-stone-300">Milestone 07</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Conversation Simulator
          </h1>
          <p className="text-sm text-stone-200/90 leading-relaxed">
            Practise speaking Kannada in realistic Karnataka scenarios. From ordering filter coffee in a Darshini to hailing an auto in Indiranagar, immerse yourself with adaptive AI characters.
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs text-amber-300/90">
            <span>🎙️ Spoken Kannada Voice Support</span>
            <span>·</span>
            <span>💡 Real-time Learning Assistance</span>
            <span>·</span>
            <span>📊 Feedback &amp; Confidence Scoring</span>
          </div>
        </div>
      </div>

      {/* ─── Filters & Search ──────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-2.5 text-stone-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scenarios by title, character, or keyword..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-xl text-stone-600 hover:text-slate-900 hover:bg-stone-100 transition-colors"
            >
              ← Dashboard
            </Link>
            <Link
              href="/guru"
              className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>🪔 Consult Guru</span>
            </Link>
          </div>
        </div>

        {/* Difficulty pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100">
          <span className="text-xs text-stone-400 mr-1 font-medium">Difficulty:</span>
          {(['all', 'beginner', 'elementary', 'intermediate'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedDifficulty(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                selectedDifficulty === lvl
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {lvl === 'all' ? 'All Levels' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Scenario Cards Grid ───────────────────────────────────── */}
      {filteredScenarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
          <p className="text-3xl">🔍</p>
          <h3 className="text-base font-bold text-slate-800">No scenarios match your filter</h3>
          <p className="text-xs text-stone-500">Try adjusting your difficulty level or search term.</p>
          <button
            onClick={() => {
              setSelectedDifficulty('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScenarios.map((scenario) => {
            const hasScore = completedMap[scenario.id];
            return (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isCompleted={hasScore !== undefined}
                confidenceScore={hasScore}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

