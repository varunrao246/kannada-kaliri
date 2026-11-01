/**
 * Admin Unauthorized Access Page
 * Kannada Kaliri — Milestone 10
 */

import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Access Restricted | Kannada Kaliri',
  description: 'Administrator authorization required to view this area.',
};

export default function AdminUnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#101D36] text-[#F8F5EE] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-[rgba(213,166,74,0.3)] text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(213,166,74,0.08)] rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-[rgba(226,88,34,0.15)] border border-[rgba(226,88,34,0.3)] text-[#E25822] flex items-center justify-center text-3xl mx-auto mb-5">
          🔒
        </div>

        <div className="text-xs uppercase tracking-widest text-[#D5A64A] font-bold mb-1">
          ಕನ್ನಡ ಕಲಿರಿ • Kannada Kaliri
        </div>

        <h1 className="font-serif text-2xl font-bold text-[#F8F5EE] mb-2">
          ನಿರ್ವಾಹಕ ಪ್ರವೇಶ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ
        </h1>
        <h2 className="text-sm font-medium text-[#EDE5D6]/80 mb-4">
          Administrative Privileges Required
        </h2>

        <p className="text-xs text-[#EDE5D6]/70 leading-relaxed mb-6">
          This portal is reserved for verified platform administrators and educators.
          Regular learner accounts cannot view learning analytics or administrative controls.
        </p>

        <div className="p-3.5 rounded-xl bg-[rgba(248,245,238,0.04)] border border-[rgba(213,166,74,0.15)] text-[11px] text-[#EDE5D6]/60 text-left mb-6 space-y-1">
          <div className="font-semibold text-[#D5A64A]">Assigning an Administrator:</div>
          <div>
            Admins must be provisioned manually in the database table <code className="text-[#EDE5D6] bg-black/30 px-1 py-0.5 rounded">public.admin_users</code> or via Supabase <code className="text-[#EDE5D6] bg-black/30 px-1 py-0.5 rounded">app_metadata.role = &apos;admin&apos;</code>.
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#D5A64A] text-[#101D36] hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[rgba(213,166,74,0.25)]"
        >
          ಕಲಿಯುವವರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ • Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

