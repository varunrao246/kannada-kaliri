/**
 * In-Memory Mock Supabase Client for Milestone 02 E2E Testing
 * Faithfully simulates Supabase Auth, PostgreSQL Table CRUD,
 * Check Constraints, Upsert with onConflict, Fluent Chaining, and Row Level Security.
 */

import {
  LearnerProfile,
  CreateLearnerProfileDTO,
  UpdateLearnerProfileDTO,
  MockUser,
  MockSession,
} from './types';
import { SPEC_ORACLE } from './spec-oracle';

export class MockSupabaseClient {
  private currentUser: MockUser | null = null;
  private profilesTable: Map<string, LearnerProfile> = new Map(); // keyed by user_id
  public networkErrorNext: boolean = false;
  public rlsEnforced: boolean = true;

  constructor(initialUser: MockUser | null = null) {
    this.currentUser = initialUser;
  }

  // --- Auth API ---
  public auth = {
    getUser: async () => {
      if (this.networkErrorNext) {
        this.networkErrorNext = false;
        return { data: { user: null }, error: new Error('Network error: connection refused') };
      }
      return { data: { user: this.currentUser }, error: null };
    },
    getSession: async () => {
      if (!this.currentUser) return { data: { session: null }, error: null };
      const session: MockSession = {
        user: this.currentUser,
        access_token: `mock-token-${this.currentUser.id}`,
        refresh_token: `mock-refresh-${this.currentUser.id}`,
        expires_at: Date.now() + 3600000,
      };
      return { data: { session }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      if (!email || !password) {
        return { data: { user: null, session: null }, error: new Error('Email and password required') };
      }
      this.currentUser = { id: `user-${Date.now()}`, email, user_metadata: { name: email.split('@')[0] } };
      return { data: { user: this.currentUser, session: {} }, error: null };
    },
    signUp: async ({ email, options }: { email: string; password?: string; options?: { data?: Record<string, unknown> } }) => {
      this.currentUser = {
        id: `user-${Date.now()}`,
        email,
        user_metadata: options?.data || { name: email.split('@')[0] },
      };
      return { data: { user: this.currentUser, session: {} }, error: null };
    },
    signOut: async () => {
      this.currentUser = null;
      return { error: null };
    },
  };

  public setAuthenticatedUser(user: MockUser | null) {
    this.currentUser = user;
  }

  public getAuthenticatedUser(): MockUser | null {
    return this.currentUser;
  }

  public seedProfile(profile: LearnerProfile) {
    this.profilesTable.set(profile.user_id, { ...profile });
  }

  public clearDatabase() {
    this.profilesTable.clear();
    this.currentUser = null;
    this.networkErrorNext = false;
  }

  // --- Table Query Builder API ---
  public from(tableName: string) {
    if (tableName !== 'learner_profiles') {
      throw new Error(`Mock table '${tableName}' not supported in this test suite.`);
    }

    return new QueryBuilder(this.profilesTable, this.currentUser, this.rlsEnforced, () => this.networkErrorNext);
  }
}

export class QueryResult<T> implements PromiseLike<{ data: T | null; error: Error | null }> {
  constructor(private promise: Promise<{ data: T | null; error: Error | null }>) {}

  then<TResult1 = { data: T | null; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  public select(..._args: unknown[]) {
    void _args;
    return {
      single: () => this.promise,
      maybeSingle: () => this.promise,
    };
  }

  public eq(..._args: unknown[]) {
    void _args;
    return this;
  }
}

class QueryBuilder implements PromiseLike<{ data: LearnerProfile | null; error: Error | null }> {
  private filters: Array<{ column: string; value: unknown }> = [];
  public selectedFields: string = '*';
  private pendingUpdates?: UpdateLearnerProfileDTO;

  constructor(
    private table: Map<string, LearnerProfile>,
    private currentUser: MockUser | null,
    private rlsEnforced: boolean,
    private shouldFailNetwork: () => boolean
  ) {}

  public select(fields: string = '*') {
    this.selectedFields = fields;
    return this;
  }

  public eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  public async maybeSingle(): Promise<{ data: LearnerProfile | null; error: Error | null }> {
    if (this.shouldFailNetwork()) {
      return { data: null, error: new Error('Network error: query timed out') };
    }

    if (this.pendingUpdates) {
      return this.executePendingUpdate();
    }

    const matches = this.executeFilters();
    if (matches.length === 0) {
      return { data: null, error: null };
    }
    return { data: { ...matches[0] }, error: null };
  }

  public async single(): Promise<{ data: LearnerProfile | null; error: Error | null }> {
    if (this.shouldFailNetwork()) {
      return { data: null, error: new Error('Network error: query timed out') };
    }

    if (this.pendingUpdates) {
      return this.executePendingUpdate();
    }

    const matches = this.executeFilters();
    if (matches.length === 0) {
      return { data: null, error: new Error('Row not found (PGRST116)') };
    }
    if (matches.length > 1) {
      return { data: null, error: new Error('Multiple rows found (PGRST116)') };
    }
    return { data: { ...matches[0] }, error: null };
  }

  public upsert(
    row: CreateLearnerProfileDTO,
    options?: { onConflict?: string }
  ): QueryResult<LearnerProfile> {
    const exec = async (): Promise<{ data: LearnerProfile | null; error: Error | null }> => {
      if (this.shouldFailNetwork()) {
        return { data: null, error: new Error('Network error: upsert failed') };
      }

      if (options?.onConflict && options.onConflict !== 'user_id') {
        return { data: null, error: new Error(`Unsupported conflict target '${options.onConflict}'`) };
      }

      const targetUserId = row.user_id || this.currentUser?.id;
      if (!targetUserId) {
        return { data: null, error: new Error('Cannot upsert without user_id or active session') };
      }

      // RLS Enforcement: auth.uid() = user_id
      if (this.rlsEnforced) {
        if (!this.currentUser || this.currentUser.id !== targetUserId) {
          return { data: null, error: new Error('RLS policy violation: permission denied for table learner_profiles') };
        }
      }

      // Check constraints validation according to SPEC_ORACLE
      const validLanguages = SPEC_ORACLE.onboarding.step2.languages.map((l) => l.code);
      if (!validLanguages.includes(row.native_language)) {
        return {
          data: null,
          error: new Error(
            `Check constraint violation: native_language '${row.native_language}' must be in (${validLanguages.join(', ')})`
          ),
        };
      }

      const validLevels = SPEC_ORACLE.onboarding.step3.levels.map((l) => l.code);
      if (!validLevels.includes(row.proficiency_level)) {
        return {
          data: null,
          error: new Error(
            `Check constraint violation: proficiency_level '${row.proficiency_level}' must be in (${validLevels.join(', ')})`
          ),
        };
      }

      const validCommitments = SPEC_ORACLE.onboarding.step5.commitments;
      if (!validCommitments.includes(row.daily_goal_minutes)) {
        return {
          data: null,
          error: new Error(
            `Check constraint violation: daily_goal_minutes '${row.daily_goal_minutes}' must be in (${validCommitments.join(', ')})`
          ),
        };
      }

      const now = new Date().toISOString();
      const existing = this.table.get(targetUserId);

      if (existing) {
        // Upsert: preserve id, user_id, created_at, update updated_at (trigger simulation)
        const updated: LearnerProfile = {
          ...existing,
          full_name: row.full_name !== undefined ? row.full_name : existing.full_name,
          avatar_url: row.avatar_url !== undefined ? row.avatar_url : existing.avatar_url,
          native_language: row.native_language,
          target_language: row.target_language || existing.target_language || 'kn',
          proficiency_level: row.proficiency_level,
          learning_goals: row.learning_goals || existing.learning_goals,
          daily_goal_minutes: row.daily_goal_minutes,
          onboarding_completed: row.onboarding_completed !== undefined ? row.onboarding_completed : true,
          updated_at: now,
        };
        this.table.set(targetUserId, updated);
        return { data: { ...updated }, error: null };
      } else {
        // Insert new profile
        const newProfile: LearnerProfile = {
          id: `lp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          user_id: targetUserId,
          full_name: row.full_name ?? null,
          avatar_url: row.avatar_url ?? null,
          native_language: row.native_language,
          target_language: row.target_language || 'kn',
          proficiency_level: row.proficiency_level,
          learning_goals: row.learning_goals || [],
          daily_goal_minutes: row.daily_goal_minutes,
          onboarding_completed: row.onboarding_completed ?? false,
          created_at: now,
          updated_at: now,
        };
        this.table.set(targetUserId, newProfile);
        return { data: { ...newProfile }, error: null };
      }
    };

    return new QueryResult(exec());
  }

  public update(updates: UpdateLearnerProfileDTO): this {
    this.pendingUpdates = updates;
    return this;
  }

  private async executePendingUpdate(): Promise<{ data: LearnerProfile | null; error: Error | null }> {
    if (this.shouldFailNetwork()) {
      return { data: null, error: new Error('Network error: update failed') };
    }

    const matches = this.executeFilters();
    if (matches.length === 0) {
      return { data: null, error: new Error('No profile matching filter found') };
    }

    const targetProfile = matches[0];
    if (this.rlsEnforced) {
      if (!this.currentUser || this.currentUser.id !== targetProfile.user_id) {
        return { data: null, error: new Error('RLS policy violation: unauthorized update') };
      }
    }

    const updates = this.pendingUpdates || {};
    const now = new Date().toISOString();
    const updated: LearnerProfile = {
      ...targetProfile,
      ...(updates.full_name !== undefined ? { full_name: updates.full_name } : {}),
      ...(updates.avatar_url !== undefined ? { avatar_url: updates.avatar_url } : {}),
      ...(updates.native_language ? { native_language: updates.native_language } : {}),
      ...(updates.proficiency_level ? { proficiency_level: updates.proficiency_level } : {}),
      ...(updates.learning_goals ? { learning_goals: updates.learning_goals } : {}),
      ...(updates.daily_goal_minutes ? { daily_goal_minutes: updates.daily_goal_minutes } : {}),
      ...(updates.onboarding_completed !== undefined ? { onboarding_completed: updates.onboarding_completed } : {}),
      updated_at: now, // trigger simulation
    };

    this.table.set(targetProfile.user_id, updated);
    return { data: { ...updated }, error: null };
  }

  then<TResult1 = { data: LearnerProfile | null; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: LearnerProfile | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const promise = this.pendingUpdates ? this.executePendingUpdate() : this.maybeSingle();
    return promise.then(onfulfilled, onrejected);
  }

  private executeFilters(): LearnerProfile[] {
    let items = Array.from(this.table.values());

    // Apply RLS: If RLS is enabled, user can only see their own row
    if (this.rlsEnforced) {
      if (!this.currentUser) return [];
      items = items.filter((p) => p.user_id === this.currentUser?.id);
    }

    for (const f of this.filters) {
      items = items.filter((p) => (p as unknown as Record<string, unknown>)[f.column] === f.value);
    }

    return items;
  }
}
