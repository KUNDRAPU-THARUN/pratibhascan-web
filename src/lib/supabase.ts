import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * PratibhaScan Supabase Client Configuration
 * Phase 2B: Live Supabase Integration (Local Environment)
 *
 * Connects securely to the local Supabase container stack using the public anon key.
 * Service role and secret keys are NEVER exposed to the frontend.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Predicate to safely check if valid Supabase credentials have been configured
 */
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    !url.includes('placeholder') &&
    key &&
    !key.includes('placeholder')
  );
};
