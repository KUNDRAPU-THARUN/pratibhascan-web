import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * PratibhaScan Supabase Client Configuration
 * Supports both local development (Docker stack) and production Vercel deployments.
 *
 * In local dev, falls back to the local Supabase container.
 * In production builds where environment variables are not yet configured in Vercel,
 * safe fallback placeholders are used to prevent top-level runtime exceptions (e.g. "supabaseKey is required").
 */

const fallbackUrl = import.meta.env.DEV
  ? 'http://127.0.0.1:54321'
  : 'https://placeholder-project.supabase.co';

const fallbackAnonKey = import.meta.env.DEV
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  : 'placeholder-anon-key-configure-in-vercel';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey;

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
