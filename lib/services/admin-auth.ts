/**
 * Secure Admin Authorization Service
 * Kannada Kaliri — Milestone 10
 *
 * Implements strict server-side role validation for administrative access.
 * Does NOT trust user-editable metadata (user_metadata) or auto-promote users.
 * Validates either protected Supabase app_metadata OR verified records in public.admin_users.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import type { AdminAuthResult, AdminRole } from '@/lib/admin/types';

export type AdminSupabaseClient = SupabaseClient<Database>;

/**
 * Verify administrator permissions for an authenticated user.
 *
 * Security Rules:
 * 1. Checks user presence and active session.
 * 2. Checks protected `app_metadata.role` (which only the service-role or Supabase dashboard can mutate).
 * 3. Checks `public.admin_users` table where `user_id = user.id AND is_active = true`.
 * 4. Never reads or trusts `user_metadata` (which is client-editable).
 * 5. Does NOT promote the first registered user.
 */
export async function verifyAdminUser(
  supabase: AdminSupabaseClient,
  user?: User | null
): Promise<AdminAuthResult> {
  if (!user) {
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
  }

  if (!user) {
    return {
      isAdmin: false,
      role: null,
      userId: null,
      error: 'Unauthenticated. Sign in required.',
    };
  }

  // 1. Check protected app_metadata (server-managed only)
  const appRole = user.app_metadata?.role as string | undefined;
  if (appRole === 'admin' || appRole === 'super_admin' || appRole === 'analyst') {
    return {
      isAdmin: true,
      role: appRole as AdminRole,
      userId: user.id,
      adminRecord: {
        id: `meta-${user.id}`,
        userId: user.id,
        role: appRole as AdminRole,
        isActive: true,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at,
        email: user.email,
        fullName: (user.user_metadata?.full_name as string) || undefined,
      },
    };
  }

  // 2. Check public.admin_users table (protected by Row Level Security)
  try {
    const { data: adminRecord, error } = await supabase
      .from('admin_users')
      .select('id, user_id, role, is_active, assigned_by, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.warn('[AdminAuth] Error checking admin_users table:', error.message);
      return {
        isAdmin: false,
        role: null,
        userId: user.id,
        error: 'Forbidden. User does not possess administrative privileges.',
      };
    }

    if (adminRecord && adminRecord.is_active) {
      return {
        isAdmin: true,
        role: adminRecord.role as AdminRole,
        userId: user.id,
        adminRecord: {
          id: adminRecord.id,
          userId: adminRecord.user_id,
          role: adminRecord.role as AdminRole,
          isActive: adminRecord.is_active,
          assignedBy: adminRecord.assigned_by,
          createdAt: adminRecord.created_at,
          updatedAt: adminRecord.updated_at,
          email: user.email,
          fullName: (user.user_metadata?.full_name as string) || undefined,
        },
      };
    }
  } catch (err) {
    console.error('[AdminAuth] Unexpected error during verification:', err);
  }

  return {
    isAdmin: false,
    role: null,
    userId: user.id,
    error: 'Forbidden. User does not possess administrative privileges.',
  };
}

/**
 * Log sensitive administrative actions to public.admin_audit_logs
 */
export async function recordAdminAuditLog(
  supabase: AdminSupabaseClient,
  params: {
    adminUserId: string;
    action: string;
    targetResource?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }
): Promise<void> {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: params.adminUserId,
      action: params.action,
      target_resource: params.targetResource || null,
      metadata: (params.metadata as unknown as Json) || null,
      ip_address: params.ipAddress || null,
    });
  } catch (err) {
    console.error('[AdminAudit] Failed to record audit log:', err);
  }
}
