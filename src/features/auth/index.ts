/**
 * Auth Feature Module
 * Company: KAARYAN LABS
 * Phase 1 Architecture: Ready for Supabase Auth integration in Phase 2
 */

export interface AuthFeatureState {
  isConfigured: boolean;
  activeProvider: 'supabase' | 'none';
  phase: 'phase-1-foundation' | 'phase-2-live';
}

export const AUTH_FEATURE_META: AuthFeatureState = {
  isConfigured: false,
  activeProvider: 'none',
  phase: 'phase-1-foundation',
};
