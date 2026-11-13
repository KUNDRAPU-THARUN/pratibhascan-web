/**
 * PratibhaScan Supabase Database Type Definitions
 * Company: KAARYAN LABS
 * Aligned with migration: 20261112000000_initial_schema.sql (Phase 2A Hardened Schema)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DatabaseRole = 'athlete' | 'academy' | 'institution';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: DatabaseRole;
          phone_number: string | null;
          avatar_url: string | null;
          state: string | null;
          district: string | null;
          is_suspended: boolean;
          suspended_at: string | null;
          suspension_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: DatabaseRole;
          phone_number?: string | null;
          avatar_url?: string | null;
          state?: string | null;
          district?: string | null;
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: DatabaseRole;
          phone_number?: string | null;
          avatar_url?: string | null;
          state?: string | null;
          district?: string | null;
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      academies: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          registration_number: string | null;
          contact_email: string;
          contact_phone: string | null;
          state: string;
          district: string;
          address: string | null;
          sports_offered: string[];
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          registration_number?: string | null;
          contact_email: string;
          contact_phone?: string | null;
          state: string;
          district: string;
          address?: string | null;
          sports_offered?: string[];
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          registration_number?: string | null;
          contact_email?: string;
          contact_phone?: string | null;
          state?: string;
          district?: string;
          address?: string | null;
          sports_offered?: string[];
          verified?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      institutions: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          type: 'school' | 'college' | 'university' | 'sports_board' | 'federation';
          contact_email: string;
          contact_phone: string | null;
          state: string;
          district: string;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          type: 'school' | 'college' | 'university' | 'sports_board' | 'federation';
          contact_email: string;
          contact_phone?: string | null;
          state: string;
          district: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          type?: 'school' | 'college' | 'university' | 'sports_board' | 'federation';
          contact_email?: string;
          contact_phone?: string | null;
          state?: string;
          district?: string;
          verified?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      athletes: {
        Row: {
          id: string;
          date_of_birth: string;
          gender: 'male' | 'female' | 'other';
          primary_sport: string;
          secondary_sport: string | null;
          height_cm: number;
          weight_kg: number;
          wingspan_cm: number | null;
          composite_talent_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          date_of_birth: string;
          gender: 'male' | 'female' | 'other';
          primary_sport: string;
          secondary_sport?: string | null;
          height_cm: number;
          weight_kg: number;
          wingspan_cm?: number | null;
          composite_talent_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date_of_birth?: string;
          gender?: 'male' | 'female' | 'other';
          primary_sport?: string;
          secondary_sport?: string | null;
          height_cm?: number;
          weight_kg?: number;
          wingspan_cm?: number | null;
          composite_talent_score?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      athlete_affiliations: {
        Row: {
          id: string;
          athlete_id: string;
          organization_type: 'academy' | 'institution';
          academy_id: string | null;
          institution_id: string | null;
          status: 'pending' | 'active' | 'rejected' | 'revoked';
          requested_by: string;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          organization_type: 'academy' | 'institution';
          academy_id?: string | null;
          institution_id?: string | null;
          status?: 'pending' | 'active' | 'rejected' | 'revoked';
          requested_by: string;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          organization_type?: 'academy' | 'institution';
          academy_id?: string | null;
          institution_id?: string | null;
          status?: 'pending' | 'active' | 'rejected' | 'revoked';
          requested_by?: string;
          approved_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      evaluator_authorizations: {
        Row: {
          id: string;
          evaluator_id: string;
          organization_type: 'academy' | 'institution';
          academy_id: string | null;
          institution_id: string | null;
          accreditation_number: string | null;
          status: 'active' | 'suspended' | 'revoked';
          created_at: string;
        };
        Insert: {
          id?: string;
          evaluator_id: string;
          organization_type: 'academy' | 'institution';
          academy_id?: string | null;
          institution_id?: string | null;
          accreditation_number?: string | null;
          status?: 'active' | 'suspended' | 'revoked';
          created_at?: string;
        };
        Update: {
          id?: string;
          evaluator_id?: string;
          organization_type?: 'academy' | 'institution';
          academy_id?: string | null;
          institution_id?: string | null;
          accreditation_number?: string | null;
          status?: 'active' | 'suspended' | 'revoked';
        };
        Relationships: [];
      };
      assessment_protocols: {
        Row: {
          id: string;
          code: string;
          title: string;
          category: 'anthropometric' | 'speed' | 'endurance' | 'power' | 'agility' | 'flexibility';
          unit: string;
          lower_is_better: boolean;
          description: string | null;
          methodology: string | null;
          equipment_required: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          category: 'anthropometric' | 'speed' | 'endurance' | 'power' | 'agility' | 'flexibility';
          unit: string;
          lower_is_better?: boolean;
          description?: string | null;
          methodology?: string | null;
          equipment_required?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          category?: 'anthropometric' | 'speed' | 'endurance' | 'power' | 'agility' | 'flexibility';
          unit?: string;
          lower_is_better?: boolean;
          description?: string | null;
          methodology?: string | null;
          equipment_required?: string[];
        };
        Relationships: [];
      };
      assessment_sessions: {
        Row: {
          id: string;
          athlete_id: string;
          evaluator_id: string;
          academy_id: string | null;
          institution_id: string | null;
          assessment_date: string;
          venue: string | null;
          verified: boolean;
          verified_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          evaluator_id: string;
          academy_id?: string | null;
          institution_id?: string | null;
          assessment_date: string;
          venue?: string | null;
          verified?: boolean;
          verified_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          evaluator_id?: string;
          academy_id?: string | null;
          institution_id?: string | null;
          assessment_date?: string;
          venue?: string | null;
          verified?: boolean;
          verified_by?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      assessment_results: {
        Row: {
          id: string;
          session_id: string;
          protocol_id: string;
          trial_1: number | null;
          trial_2: number | null;
          trial_3: number | null;
          best_score: number;
          percentile_rank: number | null;
          status: 'pending' | 'verified' | 'flagged';
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          protocol_id: string;
          trial_1?: number | null;
          trial_2?: number | null;
          trial_3?: number | null;
          best_score: number;
          percentile_rank?: number | null;
          status?: 'pending' | 'verified' | 'flagged';
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          protocol_id?: string;
          trial_1?: number | null;
          trial_2?: number | null;
          trial_3?: number | null;
          best_score?: number;
          percentile_rank?: number | null;
          status?: 'pending' | 'verified' | 'flagged';
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
