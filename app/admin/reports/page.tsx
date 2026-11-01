'use client';

/**
 * Admin Reports & Data Exports Hub
 * Kannada Kaliri — Milestone 10
 */

import React from 'react';

const REPORTS = [
  {
    id: 'learners',
    title: 'Learner Progress & Profile Report',
    kannadaTitle: 'ಕಲಿಯುವವರ ಸಮಗ್ರ ಪ್ರಗತಿ ವರದಿ',
    description:
      'Exports all registered learner profiles, completed lesson counts, average assessment scores, current streaks, and total XP.',
    icon: '👥',
    columns: ['Learner ID', 'Name', 'Native Language', 'Proficiency', 'Completed Lessons', 'Average Score', 'Streak', 'XP', 'Registration Date', 'Last Active'],
  },
  {
    id: 'curriculum',
    title: 'Curriculum Performance & Drop-Off Report',
    kannadaTitle: 'ಪಠ್ಯಕ್ರಮ ಕಾರ್ಯಕ್ಷಮತೆ ವರದಿ',
    description:
      'Lesson-by-lesson completion volume, completion percentage rates, assessment test averages, and pedagogical drop-off points.',
    icon: '📚',
    columns: ['Lesson ID', 'Title', 'Kannada Title', 'Module #', 'Completions', 'Completion Rate %', 'Avg Score %', 'Sample Size', 'Dropoff Count'],
  },
  {
    id: 'assessments',
    title: 'Assessment Submissions & Score History',
    kannadaTitle: 'ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶಗಳ ಇತಿಹಾಸ',
    description:
      'Granular record of all interactive assessment results submitted across curriculum lessons.',
    icon: '📝',
    columns: ['Result ID', 'User ID', 'Lesson ID', 'Score %', 'Correct Answers', 'Total Questions', 'Completed Timestamp'],
  },
  {
    id: 'gamification',
    title: 'Gamification & XP Transactions Ledger',
    kannadaTitle: 'ಗಳಿಸಿದ XP ಹಾಗೂ ಸಾಧನೆಗಳ ಪಟ್ಟಿ',
    description:
      'Complete ledger of all verified XP transactions awarded for lessons, assessments, scenarios, and daily challenges.',
    icon: '⭐',
    columns: ['Transaction ID', 'User ID', 'Activity Type', 'XP Amount', 'Description', 'Timestamp'],
  },
  {
    id: 'overview',
    title: 'Platform Overview & KPI Summary',
    kannadaTitle: 'ವೇದಿಕೆಯ ಸಮಗ್ರ KPI ಸಾರಾಂಶ',
    description:
      'High-level summary of active learners, completion metrics, and period-over-period percentage comparisons.',
    icon: '📊',
    columns: ['KPI Metric', 'Current Period (30d)', 'Previous Period', '% Change'],
  },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[#D5A64A] font-semibold">
          ವರದಿಗಳು & ರಫ್ತು • Data Exports
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
          Reports & Data Exports
        </h1>
        <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
          Generate and download verified CSV reports based on real Supabase database records
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map((report) => (
          <div
            key={report.id}
            className="glass-panel p-6 rounded-2xl border border-[rgba(213,166,74,0.2)] flex flex-col justify-between space-y-4 hover:border-[rgba(213,166,74,0.4)] transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(213,166,74,0.15)] border border-[rgba(213,166,74,0.3)] flex items-center justify-center text-xl">
                  {report.icon}
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(248,245,238,0.06)] text-[#EDE5D6]/60 font-mono font-semibold">
                  CSV (RFC-4180)
                </span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
                  {report.title}
                </h3>
                <div className="text-xs font-kannada text-[#D5A64A] mt-0.5">
                  {report.kannadaTitle}
                </div>
                <p className="text-xs text-[#EDE5D6]/70 leading-relaxed mt-2">
                  {report.description}
                </p>
              </div>

              <div className="pt-2">
                <div className="text-[10px] uppercase font-semibold text-[#EDE5D6]/50 mb-1.5">
                  Included Columns:
                </div>
                <div className="flex flex-wrap gap-1">
                  {report.columns.slice(0, 6).map((col, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] bg-[rgba(248,245,238,0.04)] border border-[rgba(213,166,74,0.1)] text-[#EDE5D6]/60"
                    >
                      {col}
                    </span>
                  ))}
                  {report.columns.length > 6 && (
                    <span className="text-[10px] text-[#D5A64A] self-center">
                      +{report.columns.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <a
              href={`/api/admin/reports/export?type=${report.id}`}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-[#D5A64A] text-[#101D36] hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[rgba(213,166,74,0.25)]"
            >
              <span>📥</span>
              <span>Download CSV Report</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

