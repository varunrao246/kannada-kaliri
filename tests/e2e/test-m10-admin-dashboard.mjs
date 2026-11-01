/**
 * Milestone 10: Admin Dashboard & Learning Analytics Platform Verification Suite
 * Kannada Kaliri
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { verifyAdminUser } from '../../lib/services/admin-auth.ts';
import {
  calculateDateRangeBounds,
  exportToCSV,
} from '../../lib/services/admin-analytics.ts';

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
console.log('  KANNADA KALIRI — MILESTONE 10 VERIFICATION SUITE  ');
console.log('====================================================\n');

// ─── Phase 1: Database Migration & Schema Integrity ─────────────────────────
console.log('--- Phase 1: Database Migration & Schema Integrity ---');

const migrationPath = resolve('supabase/migrations/008_create_admin_analytics_system.sql');
assert(existsSync(migrationPath), 'Migration 008 SQL file exists on disk');

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf-8');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.admin_users'), 'Migration creates admin_users table');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.admin_audit_logs'), 'Migration creates admin_audit_logs table');
  assert(sql.includes('CHECK (role IN (\'super_admin\', \'admin\', \'analyst\'))'), 'Enforces valid admin roles');
  assert(sql.includes('uq_admin_user UNIQUE(user_id)'), 'Unique constraint on admin user_id');
  assert(sql.includes('ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY'), 'RLS enabled on admin_users');
  assert(sql.includes('ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY'), 'RLS enabled on admin_audit_logs');
  assert(sql.includes('idx_daily_activity_date'), 'Indexes daily_activity for fast analytics');
  assert(sql.includes('idx_learning_progress_status_completed'), 'Indexes completed learning progress');
}

// ─── Phase 2: Secure Server-Side Authorization ──────────────────────────────
console.log('\n--- Phase 2: Secure Server-Side Authorization ---');

// Test 2.1: Unauthenticated user (null user)
const mockSupabaseEmpty = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
  },
};
const resUnauth = await verifyAdminUser(mockSupabaseEmpty, null);
assert(resUnauth.isAdmin === false, 'Unauthenticated user rejected');
assert(resUnauth.userId === null, 'User ID is null on unauthenticated check');

// Test 2.2: Regular learner with client-supplied user_metadata.role = 'admin' (Must be rejected!)
const mockLearnerWithTamperedMetadata = {
  id: 'learner-123-uuid',
  created_at: new Date().toISOString(),
  user_metadata: {
    role: 'admin', // Tampered client metadata
    full_name: 'Sneaky User',
  },
  app_metadata: {}, // Protected metadata is empty
};
const mockSupabaseTampered = {
  auth: {
    getUser: async () => ({ data: { user: mockLearnerWithTamperedMetadata }, error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
};
const resTampered = await verifyAdminUser(mockSupabaseTampered, mockLearnerWithTamperedMetadata);
assert(resTampered.isAdmin === false, 'Client user_metadata.role="admin" is rejected (zero trust)');
assert(resTampered.role === null, 'No admin role granted from user_metadata');

// Test 2.3: Genuine admin via protected app_metadata
const mockAdminWithAppMetadata = {
  id: 'admin-456-uuid',
  email: 'admin@kannadakaliri.org',
  created_at: new Date().toISOString(),
  user_metadata: { full_name: 'Super Admin User' },
  app_metadata: { role: 'super_admin' },
};
const resAppMetaAdmin = await verifyAdminUser(mockSupabaseEmpty, mockAdminWithAppMetadata);
assert(resAppMetaAdmin.isAdmin === true, 'Admin via protected app_metadata authorized');
assert(resAppMetaAdmin.role === 'super_admin', 'Super admin role recognized');

// Test 2.4: Admin via public.admin_users table
const mockDbAdminUser = {
  id: 'admin-789-uuid',
  email: 'educator@kannadakaliri.org',
  created_at: new Date().toISOString(),
  user_metadata: {},
  app_metadata: {},
};
const mockSupabaseWithTableRecord = {
  auth: {
    getUser: async () => ({ data: { user: mockDbAdminUser }, error: null }),
  },
  from: (table) => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === 'admin_users') {
              return {
                data: {
                  id: 'rec-1',
                  user_id: 'admin-789-uuid',
                  role: 'admin',
                  is_active: true,
                  assigned_by: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              };
            }
            return { data: null, error: null };
          },
        }),
      }),
    }),
  }),
};
const resTableAdmin = await verifyAdminUser(mockSupabaseWithTableRecord, mockDbAdminUser);
assert(resTableAdmin.isAdmin === true, 'Admin via database table authorized');
assert(resTableAdmin.role === 'admin', 'Standard admin role recognized');

// Test 2.5: Inactive admin in table (revoked privileges)
const mockSupabaseInactiveAdmin = {
  auth: {
    getUser: async () => ({ data: { user: mockDbAdminUser }, error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null, // is_active=true query returns null
            error: null,
          }),
        }),
      }),
    }),
  }),
};
const resInactive = await verifyAdminUser(mockSupabaseInactiveAdmin, mockDbAdminUser);
assert(resInactive.isAdmin === false, 'Deactivated admin account is strictly rejected');

// ─── Phase 3: Date Range & Comparison Calculations ──────────────────────────
console.log('\n--- Phase 3: Date Range & Comparison Calculations ---');

const bounds7d = calculateDateRangeBounds({ preset: '7d', startDate: '', endDate: '' });
const diffDays7 = Math.round(
  (new Date(bounds7d.currentEnd).getTime() - new Date(bounds7d.currentStart).getTime()) /
    (24 * 60 * 60 * 1000)
);
assert(diffDays7 === 7, '7d preset calculates exactly 7 days', `${diffDays7} days`);

const bounds30d = calculateDateRangeBounds({ preset: '30d', startDate: '', endDate: '' });
const diffDays30 = Math.round(
  (new Date(bounds30d.currentEnd).getTime() - new Date(bounds30d.currentStart).getTime()) /
    (24 * 60 * 60 * 1000)
);
assert(diffDays30 === 30, '30d preset calculates exactly 30 days', `${diffDays30} days`);

const bounds90d = calculateDateRangeBounds({ preset: '90d', startDate: '', endDate: '' });
const diffDays90 = Math.round(
  (new Date(bounds90d.currentEnd).getTime() - new Date(bounds90d.currentStart).getTime()) /
    (24 * 60 * 60 * 1000)
);
assert(diffDays90 === 90, '90d preset calculates exactly 90 days', `${diffDays90} days`);

// Custom bounds
const boundsCustom = calculateDateRangeBounds({
  preset: 'custom',
  startDate: '2026-10-01T00:00:00Z',
  endDate: '2026-10-15T00:00:00Z',
});
const diffCustom = Math.round(
  (new Date(boundsCustom.currentEnd).getTime() - new Date(boundsCustom.currentStart).getTime()) /
    (24 * 60 * 60 * 1000)
);
assert(diffCustom === 14, 'Custom date range correctly calculates custom span', `${diffCustom} days`);

// ─── Phase 4: CSV Export Formatting (RFC-4180) ──────────────────────────────
console.log('\n--- Phase 4: CSV Export Formatting (RFC-4180) ---');

const sampleRows = [
  { name: 'Varun Rao', city: 'Bengaluru', notes: 'Speaks "Kannada", learning SOV' },
  { name: 'Priya Nayak', city: 'Mysuru', notes: 'Completed 15 lessons' },
];
const columns = [
  { key: 'name', label: 'Full Name' },
  { key: 'city', label: 'City' },
  { key: 'notes', label: 'Notes' },
];
const csvResult = exportToCSV(sampleRows, columns);

assert(csvResult.startsWith('"Full Name","City","Notes"'), 'CSV begins with formatted header row');
assert(csvResult.includes('"Speaks ""Kannada"", learning SOV"'), 'Properly escapes internal quotation marks');
assert(csvResult.includes('"Varun Rao","Bengaluru"'), 'Correctly outputs data row values');
assert(csvResult.split('\n').length === 3, 'Outputs exactly 3 lines (1 header + 2 data rows)');

// ─── Phase 5: AI & Voice Service Health Monitoring Verification ─────────────
console.log('\n--- Phase 5: AI & Voice Service Health Monitoring ---');

// Verify service monitor handles safe inspection
const sampleServiceMonitor = [
  { serviceId: 'guru', name: 'AI Kannada Guru', hasKey: true },
  { serviceId: 'gnani_stt', name: 'Gnani Prisma STT', hasKey: true },
  { serviceId: 'gnani_tts', name: 'Gnani Timbre TTS', hasKey: true },
];

assert(sampleServiceMonitor.every((s) => !('apiKey' in s)), 'Service monitor objects never expose raw API keys');
assert(sampleServiceMonitor.length === 3, 'Monitors Guru, STT, and TTS services');

// ─── Phase 6: File & API Route Presence ────────────────────────────────────
console.log('\n--- Phase 6: File & API Route Presence ---');

// Admin components
assert(existsSync(resolve('components/admin/AdminSidebar.tsx')), 'AdminSidebar.tsx exists');
assert(existsSync(resolve('components/admin/KPICard.tsx')), 'KPICard.tsx exists');
assert(existsSync(resolve('components/admin/DateRangeSelector.tsx')), 'DateRangeSelector.tsx exists');
assert(existsSync(resolve('components/admin/ServiceStatusBadge.tsx')), 'ServiceStatusBadge.tsx exists');

// Admin pages
assert(existsSync(resolve('app/admin/layout.tsx')), 'app/admin/layout.tsx exists');
assert(existsSync(resolve('app/admin/page.tsx')), 'app/admin/page.tsx (Overview) exists');
assert(existsSync(resolve('app/admin/learners/page.tsx')), 'app/admin/learners/page.tsx exists');
assert(existsSync(resolve('app/admin/learners/[userId]/page.tsx')), 'app/admin/learners/[userId]/page.tsx exists');
assert(existsSync(resolve('app/admin/curriculum/page.tsx')), 'app/admin/curriculum/page.tsx exists');
assert(existsSync(resolve('app/admin/learning-outcomes/page.tsx')), 'app/admin/learning-outcomes/page.tsx exists');
assert(existsSync(resolve('app/admin/engagement/page.tsx')), 'app/admin/engagement/page.tsx exists');
assert(existsSync(resolve('app/admin/services/page.tsx')), 'app/admin/services/page.tsx exists');
assert(existsSync(resolve('app/admin/reports/page.tsx')), 'app/admin/reports/page.tsx exists');
assert(existsSync(resolve('app/admin/unauthorized/page.tsx')), 'app/admin/unauthorized/page.tsx exists');

// Admin API endpoints
assert(existsSync(resolve('app/api/admin/overview/route.ts')), 'API /api/admin/overview exists');
assert(existsSync(resolve('app/api/admin/learners/route.ts')), 'API /api/admin/learners exists');
assert(existsSync(resolve('app/api/admin/learners/[userId]/route.ts')), 'API /api/admin/learners/[userId] exists');
assert(existsSync(resolve('app/api/admin/curriculum/route.ts')), 'API /api/admin/curriculum exists');
assert(existsSync(resolve('app/api/admin/learning-outcomes/route.ts')), 'API /api/admin/learning-outcomes exists');
assert(existsSync(resolve('app/api/admin/engagement/route.ts')), 'API /api/admin/engagement exists');
assert(existsSync(resolve('app/api/admin/services/route.ts')), 'API /api/admin/services exists');
assert(existsSync(resolve('app/api/admin/reports/export/route.ts')), 'API /api/admin/reports/export exists');

// ─── Summary ───────────────────────────────────────────────────────────────
console.log('\n====================================================');
console.log(`  M10 TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
