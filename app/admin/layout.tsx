/**
 * Protected Admin Root Layout
 * Kannada Kaliri — Milestone 10
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/services/admin-auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Admin Console | Kannada Kaliri',
  description: 'Administrative learning analytics and platform management dashboard.',
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/admin');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Strict server-side verification: reject regular learners
  const adminAuth = await verifyAdminUser(supabase, user);

  if (!adminAuth.isAdmin) {
    redirect('/admin/unauthorized');
  }

  return (
    <div className="min-h-screen bg-[#101D36] text-[#F8F5EE] flex flex-col md:flex-row">
      {/* Sidebar */}
      <AdminSidebar
        role={adminAuth.role}
        adminEmail={user.email}
        className="hidden md:flex flex-shrink-0 sticky top-0 h-screen"
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Nav Top Bar */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#0A1222] border-b border-[rgba(213,166,74,0.2)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D5A64A] text-[#101D36] flex items-center justify-center font-bold text-sm">
              ಕ
            </div>
            <span className="font-serif font-bold text-sm text-[#F8F5EE]">
              Admin Console
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#D5A64A] px-2 py-0.5 rounded bg-[#D5A64A]/10 border border-[#D5A64A]/20">
            {adminAuth.role || 'admin'}
          </span>
        </header>

        {/* Child Pages */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

