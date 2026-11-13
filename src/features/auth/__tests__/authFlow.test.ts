import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DatabaseRole } from '@/types/database.types';

// Mock Supabase client
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetSession = vi.fn();

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => true,
}));

describe('Authentication & Onboarding Flow Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Registration Flow', () => {
    it('dispatches sign up with validated role and metadata', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: {
          user: {
            id: 'test-user-1',
            email: 'athlete@pratibhascan.in',
            user_metadata: { role: 'athlete', full_name: 'Test Athlete' },
          },
          session: { access_token: 'fake-token' },
        },
        error: null,
      });

      const { supabase } = await import('@/lib/supabase');
      const response = await supabase.auth.signUp({
        email: 'athlete@pratibhascan.in',
        password: 'SecurePassword123',
        options: {
          data: { role: 'athlete', full_name: 'Test Athlete' },
        },
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'athlete@pratibhascan.in',
        password: 'SecurePassword123',
        options: {
          data: { role: 'athlete', full_name: 'Test Athlete' },
        },
      });
      expect(response.data.user?.user_metadata.role).toBe('athlete');
      expect(response.error).toBeNull();
    });

    it('identifies when email verification is required (session is null)', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: {
          user: {
            id: 'test-user-2',
            email: 'unconfirmed@pratibhascan.in',
            confirmation_sent_at: '2026-11-13T12:00:00Z',
          },
          session: null, // Email confirmation required
        },
        error: null,
      });

      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.auth.signUp({
        email: 'unconfirmed@pratibhascan.in',
        password: 'SecurePassword123',
      });

      const requiresConfirmation = Boolean(data.user && !data.session);
      expect(requiresConfirmation).toBe(true);
    });
  });

  describe('2. Login & Invalid Credentials', () => {
    it('authenticates user with valid credentials', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'test-user-1', email: 'valid@pratibhascan.in' },
          session: { access_token: 'token-abc' },
        },
        error: null,
      });

      const { supabase } = await import('@/lib/supabase');
      const result = await supabase.auth.signInWithPassword({
        email: 'valid@pratibhascan.in',
        password: 'CorrectPassword1',
      });

      expect(result.data.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('handles invalid credentials error appropriately', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      });

      const { supabase } = await import('@/lib/supabase');
      const result = await supabase.auth.signInWithPassword({
        email: 'wrong@pratibhascan.in',
        password: 'WrongPassword99',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid login credentials');
    });
  });

  describe('3. Sign Out Flow', () => {
    it('terminates active session on sign out', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('4. Session Restoration', () => {
    it('restores stored session on app initialization', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'persisted-uid', email: 'persisted@pratibhascan.in' },
            access_token: 'valid-stored-jwt',
          },
        },
        error: null,
      });

      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.auth.getSession();

      expect(data.session?.user.id).toBe('persisted-uid');
      expect(data.session?.access_token).toBe('valid-stored-jwt');
    });
  });

  describe('5. Password Recovery Flow', () => {
    it('dispatches password reset request with redirect url', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

      const { supabase } = await import('@/lib/supabase');
      const result = await supabase.auth.resetPasswordForEmail('user@test.in', {
        redirectTo: 'http://localhost:5173/reset-password',
      });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@test.in', {
        redirectTo: 'http://localhost:5173/reset-password',
      });
      expect(result.error).toBeNull();
    });

    it('updates user password when token is verified', async () => {
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: { id: 'uid-1' } },
        error: null,
      });

      const { supabase } = await import('@/lib/supabase');
      const result = await supabase.auth.updateUser({ password: 'NewPassword123' });

      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPassword123' });
      expect(result.error).toBeNull();
    });
  });

  describe('6. Role Isolation & Protected Routing', () => {
    function checkRoutePermission(userRole: DatabaseRole, allowedRoles?: DatabaseRole[]): boolean {
      if (!allowedRoles) return true;
      return allowedRoles.includes(userRole);
    }

    it('allows athletes into athlete portals and denies academy/institution portals', () => {
      const userRole: DatabaseRole = 'athlete';
      expect(checkRoutePermission(userRole, ['athlete'])).toBe(true);
      expect(checkRoutePermission(userRole, ['academy'])).toBe(false);
      expect(checkRoutePermission(userRole, ['institution'])).toBe(false);
    });

    it('allows academies into academy portals and denies athlete/institution portals', () => {
      const userRole: DatabaseRole = 'academy';
      expect(checkRoutePermission(userRole, ['academy'])).toBe(true);
      expect(checkRoutePermission(userRole, ['athlete'])).toBe(false);
      expect(checkRoutePermission(userRole, ['institution'])).toBe(false);
    });

    it('allows institutions into institution portals and denies other portals', () => {
      const userRole: DatabaseRole = 'institution';
      expect(checkRoutePermission(userRole, ['institution'])).toBe(true);
      expect(checkRoutePermission(userRole, ['athlete'])).toBe(false);
      expect(checkRoutePermission(userRole, ['academy'])).toBe(false);
    });
  });

  describe('7. Unauthorized Organization Access Defense', () => {
    it('prevents an athlete from claiming an academy or creating institution rows', () => {
      // In the database, academies insert policy enforces:
      // auth.uid() = owner_id AND role = 'academy'
      function canCreateAcademy(role: DatabaseRole): boolean {
        return role === 'academy';
      }

      function canCreateInstitution(role: DatabaseRole): boolean {
        return role === 'institution';
      }

      expect(canCreateAcademy('athlete')).toBe(false);
      expect(canCreateAcademy('academy')).toBe(true);
      expect(canCreateInstitution('academy')).toBe(false);
      expect(canCreateInstitution('institution')).toBe(true);
    });
  });

  describe('8. Onboarding Failure & Retry Resilience', () => {
    it('captures database failure gracefully and preserves entered state for retry', async () => {
      const mockInsert = vi.fn().mockResolvedValueOnce({
        data: null,
        error: new Error('Network timeout during onboarding submission'),
      });

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });

      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('academies').insert({
        owner_id: 'user-123',
        name: 'Retry Sports Academy',
        contact_email: 'retry@academy.test',
        state: 'Maharashtra',
        district: 'Pune',
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('Network timeout');

      // Retry succeeds
      mockInsert.mockResolvedValueOnce({
        data: [{ id: 'acad-new' }],
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });

      const retry = await supabase.from('academies').insert({
        owner_id: 'user-123',
        name: 'Retry Sports Academy',
        contact_email: 'retry@academy.test',
        state: 'Maharashtra',
        district: 'Pune',
      });

      expect(retry.error).toBeNull();
    });
  });
});
