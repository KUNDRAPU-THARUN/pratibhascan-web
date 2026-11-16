import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DatabaseRole } from '@/types/database.types';
import type { RegisterFormData, LoginFormData } from './authSchemas';
import { DEMO_ACCOUNTS } from './demoAccounts';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: DatabaseRole;
  phone_number: string | null;
  avatar_url: string | null;
  state: string | null;
  district: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  created_at: string;
}

export interface AcademyOrg {
  id: string;
  owner_id: string;
  name: string;
  registration_number: string | null;
  contact_email: string;
  contact_phone: string | null;
  state: string;
  district: string;
  sports_offered: string[];
  verified: boolean;
}

export interface InstitutionOrg {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  contact_email: string;
  contact_phone: string | null;
  state: string;
  district: string;
  verified: boolean;
}

export interface AthleteData {
  id: string;
  date_of_birth: string;
  gender: string;
  primary_sport: string;
  secondary_sport: string | null;
  height_cm: number;
  weight_kg: number;
  wingspan_cm: number | null;
  composite_talent_score: number;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: DatabaseRole | null;
  organization: AcademyOrg | InstitutionOrg | null;
  athleteData: AthleteData | null;
  isLoading: boolean;
  isOnboarded: boolean;
  isSuspended: boolean;
  emailPendingVerification: boolean;
  isDemoMode: boolean;
  signUp: (data: RegisterFormData) => Promise<{ error: Error | null; requiresEmailConfirmation: boolean }>;
  signIn: (data: LoginFormData) => Promise<{ error: Error | null }>;
  loginAsDemo: (role: 'athlete' | 'academy' | 'institution', customEmail?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<AcademyOrg | InstitutionOrg | null>(null);
  const [athleteData, setAthleteData] = useState<AthleteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [emailPendingVerification, setEmailPendingVerification] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Fetch domain profile and onboarding state
  const loadProfile = useCallback(async (userId: string, userMetaRole?: DatabaseRole) => {
    try {
      if (!supabase) return;

      // 1. Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading user profile:', profileError);
        return;
      }

      if (!profileData) {
        // Fallback: If profile row was not yet committed by trigger, use metadata
        const fallbackRole = userMetaRole || 'athlete';
        setProfile({
          id: userId,
          email: '',
          full_name: 'User',
          role: fallbackRole,
          phone_number: null,
          avatar_url: null,
          state: null,
          district: null,
          is_suspended: false,
          suspension_reason: null,
          created_at: new Date().toISOString(),
        });
        setIsOnboarded(false);
        return;
      }

      setProfile(profileData as UserProfile);
      setIsSuspended(profileData.is_suspended);

      if (profileData.is_suspended) {
        setIsOnboarded(false);
        return;
      }

      const userRole = profileData.role;

      // 2. Check role-specific domain record to evaluate onboarding completion
      if (userRole === 'athlete') {
        const { data: aData } = await supabase
          .from('athletes')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (aData) {
          setAthleteData(aData as unknown as AthleteData);
          // An athlete is onboarded once their primary sport and physical baseline are completed
          const hasCompletedBio = Boolean(
            aData.primary_sport &&
            aData.height_cm > 0 &&
            aData.weight_kg > 0 &&
            profileData.state &&
            profileData.district
          );
          setIsOnboarded(hasCompletedBio);
        } else {
          setIsOnboarded(false);
        }
      } else if (userRole === 'academy') {
        const { data: acadData } = await supabase
          .from('academies')
          .select('*')
          .eq('owner_id', userId)
          .maybeSingle();

        if (acadData) {
          setOrganization(acadData as unknown as AcademyOrg);
          setIsOnboarded(true);
        } else {
          // Check if user is an accredited staff evaluator for an academy
          const { data: authRecord } = await supabase
            .from('evaluator_authorizations')
            .select('academy_id, academies(*)')
            .eq('evaluator_id', userId)
            .eq('status', 'active')
            .maybeSingle();

          const record = authRecord as any;
          if (record?.academies) {
            setOrganization(record.academies as unknown as AcademyOrg);
            setIsOnboarded(true);
          } else {
            setOrganization(null);
            setIsOnboarded(false);
          }
        }
      } else if (userRole === 'institution') {
        const { data: instData } = await supabase
          .from('institutions')
          .select('*')
          .eq('owner_id', userId)
          .maybeSingle();

        if (instData) {
          setOrganization(instData as unknown as InstitutionOrg);
          setIsOnboarded(true);
        } else {
          // Check if user is an accredited staff evaluator for an institution
          const { data: authRecord } = await supabase
            .from('evaluator_authorizations')
            .select('institution_id, institutions(*)')
            .eq('evaluator_id', userId)
            .eq('status', 'active')
            .maybeSingle();

          const record = authRecord as any;
          if (record?.institutions) {
            setOrganization(record.institutions as unknown as InstitutionOrg);
            setIsOnboarded(true);
          } else {
            setOrganization(null);
            setIsOnboarded(false);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  }, []);

  // Initialize and observe auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const savedDemo = typeof localStorage !== 'undefined' ? localStorage.getItem('pratibhascan_demo_session') : null;

        if (!supabase || !isSupabaseConfigured()) {
          if (savedDemo && mounted) {
            try {
              const { role: targetRole, email } = JSON.parse(savedDemo);
              const defaultEmail = `${targetRole}.e2e@kaaryan.test`;
              const demo = DEMO_ACCOUNTS[email] || DEMO_ACCOUNTS[defaultEmail] || DEMO_ACCOUNTS['athlete.e2e@kaaryan.test'];
              setIsDemoMode(true);
              setSession({
                access_token: `demo-token-${targetRole}`,
                token_type: 'bearer',
                expires_in: 86400,
                refresh_token: `demo-refresh-${targetRole}`,
                user: demo.user,
              } as Session);
              setUser(demo.user);
              setProfile(demo.profile);
              setAthleteData(demo.athleteData || null);
              setOrganization(demo.organization || null);
              setIsOnboarded(true);
              setIsSuspended(false);
              setIsLoading(false);
              return;
            } catch {
              localStorage.removeItem('pratibhascan_demo_session');
            }
          }

          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching initial session:', error);
        }

        if (mounted) {
          if (initialSession) {
            setIsDemoMode(false);
            setSession(initialSession);
            setUser(initialSession.user);
            const metaRole = initialSession.user.user_metadata?.role as DatabaseRole | undefined;
            await loadProfile(initialSession.user.id, metaRole);
          } else if (savedDemo) {
            try {
              const { role: targetRole, email } = JSON.parse(savedDemo);
              const defaultEmail = `${targetRole}.e2e@kaaryan.test`;
              const demo = DEMO_ACCOUNTS[email] || DEMO_ACCOUNTS[defaultEmail] || DEMO_ACCOUNTS['athlete.e2e@kaaryan.test'];
              setIsDemoMode(true);
              setSession({
                access_token: `demo-token-${targetRole}`,
                token_type: 'bearer',
                expires_in: 86400,
                refresh_token: `demo-refresh-${targetRole}`,
                user: demo.user,
              } as Session);
              setUser(demo.user);
              setProfile(demo.profile);
              setAthleteData(demo.athleteData || null);
              setOrganization(demo.organization || null);
              setIsOnboarded(true);
              setIsSuspended(false);
              setIsLoading(false);
              return;
            } catch {
              localStorage.removeItem('pratibhascan_demo_session');
            }
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsOnboarded(false);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    if (!supabase || !isSupabaseConfigured()) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const metaRole = currentSession.user.user_metadata?.role as DatabaseRole | undefined;
        await loadProfile(currentSession.user.id, metaRole);
      } else {
        setProfile(null);
        setOrganization(null);
        setAthleteData(null);
        setIsOnboarded(false);
        setIsSuspended(false);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  // Quick 1-click demo login for development and Vercel preview environments
  const loginAsDemo = useCallback(async (targetRole: 'athlete' | 'academy' | 'institution', customEmail?: string) => {
    const defaultEmail = `${targetRole}.e2e@kaaryan.test`;
    const emailKey = customEmail && DEMO_ACCOUNTS[customEmail.toLowerCase()] ? customEmail.toLowerCase() : defaultEmail;
    const demo = DEMO_ACCOUNTS[emailKey] || DEMO_ACCOUNTS[defaultEmail];

    setIsDemoMode(true);
    const demoSession = {
      access_token: `demo-token-${targetRole}`,
      token_type: 'bearer',
      expires_in: 86400,
      refresh_token: `demo-refresh-${targetRole}`,
      user: demo.user,
    } as Session;

    setSession(demoSession);
    setUser(demo.user);
    setProfile(demo.profile);
    setAthleteData(demo.athleteData || null);
    setOrganization(demo.organization || null);
    setIsOnboarded(true);
    setIsSuspended(false);

    try {
      localStorage.setItem(
        'pratibhascan_demo_session',
        JSON.stringify({
          role: targetRole,
          email: customEmail || demo.user.email,
        })
      );
    } catch {
      // Storage error ignored
    }
  }, []);

  // Sign up with role and full name metadata
  const signUp = async (data: RegisterFormData): Promise<{ error: Error | null; requiresEmailConfirmation: boolean }> => {
    try {
      if (!supabase || !isSupabaseConfigured()) {
        await loginAsDemo(data.role, data.email);
        return { error: null, requiresEmailConfirmation: false };
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error, requiresEmailConfirmation: false };
      }

      // Check if session was returned or email confirmation is required
      const requiresEmail = !authData.session && Boolean(authData.user);
      setEmailPendingVerification(requiresEmail);

      if (authData.session && authData.user) {
        setIsDemoMode(false);
        setSession(authData.session);
        setUser(authData.user);
        await loadProfile(authData.user.id, data.role);
      }

      return { error: null, requiresEmailConfirmation: requiresEmail };
    } catch (err) {
      return { error: err as Error, requiresEmailConfirmation: false };
    }
  };

  // Sign in with email and password
  const signIn = async (data: LoginFormData): Promise<{ error: Error | null }> => {
    try {
      const emailLower = data.email.toLowerCase().trim();

      // If Supabase is configured, attempt live Supabase authentication
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });

          if (!error && authData.session && authData.user) {
            setIsDemoMode(false);
            setSession(authData.session);
            setUser(authData.user);
            await loadProfile(authData.user.id);
            try {
              localStorage.removeItem('pratibhascan_demo_session');
            } catch {
              // Ignore
            }
            return { error: null };
          }

          // If Supabase returned an error, check if this is a known demo account intended for offline testing
          const isKnownDemo = Boolean(DEMO_ACCOUNTS[emailLower]);
          if (!isKnownDemo) {
            return { error };
          }
        } catch (netErr) {
          const isKnownDemo = Boolean(DEMO_ACCOUNTS[emailLower]);
          if (!isKnownDemo) {
            throw netErr;
          }
        }
      }

      // Offline / Unconfigured Demo Fallback Mode
      let targetRole: 'athlete' | 'academy' | 'institution' = 'athlete';
      if (emailLower.includes('academy') || emailLower.includes('coach')) {
        targetRole = 'academy';
      } else if (emailLower.includes('institution') || emailLower.includes('officer')) {
        targetRole = 'institution';
      }

      await loginAsDemo(targetRole, data.email);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      if (supabase && isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setOrganization(null);
      setAthleteData(null);
      setIsOnboarded(false);
      setIsSuspended(false);
      setEmailPendingVerification(false);
      setIsDemoMode(false);
      try {
        localStorage.removeItem('pratibhascan_demo_session');
      } catch {
        // Storage error ignored
      }
    }
  };

  // Send password reset email
  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    try {
      if (!supabase || !isSupabaseConfigured()) {
        throw new Error(
          'Supabase backend authentication is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project environment variables.'
        );
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Update password (used on /reset-password)
  const updatePassword = async (password: string): Promise<{ error: Error | null }> => {
    try {
      if (!supabase || !isSupabaseConfigured()) {
        throw new Error(
          'Supabase backend authentication is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project environment variables.'
        );
      }

      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const role = profile?.role || (user?.user_metadata?.role as DatabaseRole | null) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        organization,
        athleteData,
        isLoading,
        isOnboarded,
        isSuspended,
        emailPendingVerification,
        isDemoMode,
        signUp,
        signIn,
        loginAsDemo,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
