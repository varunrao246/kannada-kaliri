/**
 * Supabase PostgreSQL Database Schema Interface
 * Kannada Kaliri — Milestone 02, 03 & 04
 */

import type { NativeLanguage, ProficiencyLevel, DailyGoalMinutes } from './profile';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      learner_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          native_language: NativeLanguage;
          target_language: string;
          proficiency_level: ProficiencyLevel;
          learning_goals: string[];
          daily_goal_minutes: DailyGoalMinutes;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          native_language: NativeLanguage;
          target_language?: string;
          proficiency_level: ProficiencyLevel;
          learning_goals?: string[];
          daily_goal_minutes: DailyGoalMinutes;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          native_language?: NativeLanguage;
          target_language?: string;
          proficiency_level?: ProficiencyLevel;
          learning_goals?: string[];
          daily_goal_minutes?: DailyGoalMinutes;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learner_profiles_user_id_key';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      courses: {
        Row: {
          id: string;
          title: string;
          kannada_title: string | null;
          description: string | null;
          language_code: string;
          level: string;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          kannada_title?: string | null;
          description?: string | null;
          language_code?: string;
          level: string;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          kannada_title?: string | null;
          description?: string | null;
          language_code?: string;
          level?: string;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          kannada_title: string | null;
          description: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          kannada_title?: string | null;
          description?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          kannada_title?: string | null;
          description?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'modules_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          }
        ];
      };

      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          kannada_title: string | null;
          description: string | null;
          estimated_minutes: number;
          display_order: number;
          lesson_content: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          kannada_title?: string | null;
          description?: string | null;
          estimated_minutes?: number;
          display_order?: number;
          lesson_content?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string;
          kannada_title?: string | null;
          description?: string | null;
          estimated_minutes?: number;
          display_order?: number;
          lesson_content?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lessons_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          }
        ];
      };

      learning_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          status: string;
          completion_percentage: number;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          status?: string;
          completion_percentage?: number;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          status?: string;
          completion_percentage?: number;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_progress_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          }
        ];
      };

      daily_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          minutes_spent: number;
          lessons_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date?: string;
          minutes_spent?: number;
          lessons_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_date?: string;
          minutes_spent?: number;
          lessons_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      assessment_results: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          total_questions: number;
          correct_answers: number;
          score_percentage: number;
          total_points: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          total_questions: number;
          correct_answers: number;
          score_percentage: number;
          total_points: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          total_questions?: number;
          correct_answers?: number;
          score_percentage?: number;
          total_points?: number;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      exercise_attempts: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          exercise_id: string;
          submitted_answer: Record<string, unknown>;
          is_correct: boolean;
          points_awarded: number;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          exercise_id: string;
          submitted_answer: Record<string, unknown>;
          is_correct: boolean;
          points_awarded: number;
          attempted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          exercise_id?: string;
          submitted_answer?: Record<string, unknown>;
          is_correct?: boolean;
          points_awarded?: number;
          attempted_at?: string;
        };
        Relationships: [];
      };

      vocabulary_progress: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_id: string;
          times_seen: number;
          times_correct: number;
          times_incorrect: number;
          mastery_status: string;
          last_reviewed_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocabulary_id: string;
          times_seen?: number;
          times_correct?: number;
          times_incorrect?: number;
          mastery_status?: string;
          last_reviewed_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocabulary_id?: string;
          times_seen?: number;
          times_correct?: number;
          times_incorrect?: number;
          mastery_status?: string;
          last_reviewed_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guru_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guru_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          structured_response: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          structured_response?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          structured_response?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scenario_attempts: {
        Row: {
          id: string;
          user_id: string;
          scenario_id: string;
          status: 'in_progress' | 'completed' | 'abandoned';
          turns_completed: number;
          confidence_score: number | null;
          feedback: Json | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          scenario_id: string;
          status?: 'in_progress' | 'completed' | 'abandoned';
          turns_completed?: number;
          confidence_score?: number | null;
          feedback?: Json | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          scenario_id?: string;
          status?: 'in_progress' | 'completed' | 'abandoned';
          turns_completed?: number;
          confidence_score?: number | null;
          feedback?: Json | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      scenario_messages: {
        Row: {
          id: string;
          attempt_id: string;
          user_id: string;
          role: 'character' | 'user' | 'system';
          kannada_text: string;
          transliteration: string | null;
          english_translation: string | null;
          grammar_explanation: string | null;
          suggested_replies: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          user_id: string;
          role: 'character' | 'user' | 'system';
          kannada_text: string;
          transliteration?: string | null;
          english_translation?: string | null;
          grammar_explanation?: string | null;
          suggested_replies?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          user_id?: string;
          role?: 'character' | 'user' | 'system';
          kannada_text?: string;
          transliteration?: string | null;
          english_translation?: string | null;
          grammar_explanation?: string | null;
          suggested_replies?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      xp_transactions: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          idempotency_key: string;
          xp_amount: number;
          description: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          idempotency_key: string;
          xp_amount: number;
          description: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          idempotency_key?: string;
          xp_amount?: number;
          description?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      learner_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_challenge_progress: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          challenge_date: string;
          target_count: number;
          current_count: number;
          is_completed: boolean;
          is_claimed: boolean;
          claimed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          challenge_date: string;
          target_count?: number;
          current_count?: number;
          is_completed?: boolean;
          is_claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_id?: string;
          challenge_date?: string;
          target_count?: number;
          current_count?: number;
          is_completed?: boolean;
          is_claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leaderboard_preferences: {
        Row: {
          id: string;
          user_id: string;
          opt_in: boolean;
          is_anonymous: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          opt_in?: boolean;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          opt_in?: boolean;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          role: 'super_admin' | 'admin' | 'analyst';
          is_active: boolean;
          assigned_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'super_admin' | 'admin' | 'analyst';
          is_active?: boolean;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'super_admin' | 'admin' | 'analyst';
          is_active?: boolean;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_resource: string | null;
          metadata: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action: string;
          target_resource?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action?: string;
          target_resource?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      handle_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type CourseRow = Tables<'courses'>;
export type ModuleRow = Tables<'modules'>;
export type LessonRow = Tables<'lessons'>;
export type LearningProgressRow = Tables<'learning_progress'>;
export type DailyActivityRow = Tables<'daily_activity'>;
export type AssessmentResultRow = Tables<'assessment_results'>;
export type ExerciseAttemptRow = Tables<'exercise_attempts'>;
export type VocabularyProgressRow = Tables<'vocabulary_progress'>;
export type GuruConversationRow = Tables<'guru_conversations'>;
export type GuruMessageRow = Tables<'guru_messages'>;
export type ScenarioAttemptRow = Tables<'scenario_attempts'>;
export type ScenarioMessageRow = Tables<'scenario_messages'>;
export type XPTransactionRow = Tables<'xp_transactions'>;
export type LearnerAchievementRow = Tables<'learner_achievements'>;
export type DailyChallengeProgressRow = Tables<'daily_challenge_progress'>;
export type LeaderboardPreferenceRow = Tables<'leaderboard_preferences'>;
export type AdminUserRow = Tables<'admin_users'>;
export type AdminAuditLogRow = Tables<'admin_audit_logs'>;
