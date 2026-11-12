import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * PratibhaScan Supabase Client Configuration
 * Phase 1: Architectural Preparation
 *
 * NOTE: In Phase 1, we do NOT connect to a live production database.
 * This client is configured with placeholder/environment fallbacks.
 * Live authentication, PostgreSQL queries, and Storage will be activated in Phase 2.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

let supabaseInstance: SupabaseClient | null = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
} catch {
  // Graceful fallback for non-production environments
  supabaseInstance = null;
}

export const supabase = supabaseInstance;

/**
 * Predicate to safely check if valid Supabase credentials have been configured
 */
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    url !== 'https://placeholder-project.supabase.co' &&
    key &&
    key !== 'placeholder-anon-key'
  );
};
