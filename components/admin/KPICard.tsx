'use client';

/**
 * Admin KPI Metric Card Component
 * Kannada Kaliri — Milestone 10
 */

import React from 'react';
import type { MetricComparison } from '@/lib/admin/types';

interface KPICardProps {
  title: string;
  kannadaTitle: string;
  comparison: MetricComparison;
  icon: string;
  suffix?: string;
  className?: string;
}

export function KPICard({
  title,
  kannadaTitle,
  comparison,
  icon,
  suffix = '',
  className = '',
}: KPICardProps) {
  const { current, previous, percentageChange } = comparison;
  const isPositive = percentageChange !== null && percentageChange > 0;
  const isNegative = percentageChange !== null && percentageChange < 0;

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border border-[rgba(213,166,74,0.2)] relative overflow-hidden transition-all hover:border-[rgba(213,166,74,0.4)] ${className}`}
    >
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(213,166,74,0.05)] rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h4 className="text-xs font-semibold text-[#EDE5D6]/70 uppercase tracking-wider">
            {title}
          </h4>
          <span className="text-[11px] font-kannada text-[#D5A64A]">
            {kannadaTitle}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[rgba(248,245,238,0.06)] border border-[rgba(213,166,74,0.2)] flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
          {current.toLocaleString()}
        </span>
        {suffix && (
          <span className="text-xs font-semibold text-[#EDE5D6]/60">
            {suffix}
          </span>
        )}
      </div>

      {/* Comparison Pill / Footer */}
      <div className="mt-3 pt-2.5 border-t border-[rgba(213,166,74,0.1)] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          {percentageChange !== null ? (
            <span
              className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-0.5 ${
                isPositive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isNegative
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-[rgba(248,245,238,0.08)] text-[#EDE5D6]/60'
              }`}
            >
              <span>{isPositive ? '↑' : isNegative ? '↓' : '•'}</span>
              <span>{Math.abs(percentageChange)}%</span>
            </span>
          ) : (
            <span className="text-[#EDE5D6]/40">—</span>
          )}
          <span className="text-[#EDE5D6]/50">vs previous</span>
        </div>

        <span className="text-[#EDE5D6]/40 text-[10px]">
          Prev: {previous.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

