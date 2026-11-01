'use client';

/**
 * Admin Date Range Preset Selector Component
 * Kannada Kaliri — Milestone 10
 */

import React from 'react';
import type { DateRangePreset } from '@/lib/admin/types';

interface DateRangeSelectorProps {
  currentPreset: DateRangePreset;
  onSelectPreset: (preset: DateRangePreset) => void;
  className?: string;
}

const PRESETS: Array<{ id: DateRangePreset; label: string; kannadaLabel: string }> = [
  { id: '7d', label: 'Last 7 Days', kannadaLabel: 'ಕಳೆದ ೭ ದಿನ' },
  { id: '30d', label: 'Last 30 Days', kannadaLabel: 'ಕಳೆದ ೩೦ ದಿನ' },
  { id: '90d', label: 'Last 90 Days', kannadaLabel: 'ಕಳೆದ ೯೦ ದಿನ' },
];

export function DateRangeSelector({
  currentPreset,
  onSelectPreset,
  className = '',
}: DateRangeSelectorProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-[rgba(16,29,54,0.6)] border border-[rgba(213,166,74,0.2)] ${className}`}
    >
      {PRESETS.map((p) => {
        const isActive = currentPreset === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPreset(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'bg-[#D5A64A] text-[#101D36] shadow-sm shadow-[rgba(213,166,74,0.3)]'
                : 'text-[#EDE5D6]/70 hover:text-[#F8F5EE] hover:bg-white/5'
            }`}
          >
            <span>{p.label}</span>
            <span className="hidden sm:inline-block ml-1 opacity-70 font-kannada text-[11px]">
              ({p.kannadaLabel})
            </span>
          </button>
        );
      })}
    </div>
  );
}

