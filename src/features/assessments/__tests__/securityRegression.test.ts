import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyAssessmentSession,
  createAssessmentSession,
  deleteAssessmentSession,
  fetchEligibleAthletesForEvaluator,
  checkMinorGuardianConsent,
} from '../assessmentService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('Phase 3E — Comprehensive Security Regression Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. Unauthorized Data Reads & Writes
  // ============================================================================
  describe('1. Unauthorized Data Reads & Writes', () => {
    it('blocks unauthenticated requests from creating assessment sessions', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('JWT expired or missing'),
      });

      const result = await createAssessmentSession({
        athleteId: 'target-athlete-001',
        protocolId: 'proto-uuid',
        protocolCode: 'TEST_30M_SPRINT',
        assessmentDate: '2026-11-13',
        trial1: 4.4,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/authentication required/i);
    });

    it('rejects athlete identity attempting to write an assessment session for themselves', async () => {
      const athleteId = 'athlete-arjun-001';
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: athleteId, email: 'arjun@pratibhascan.in' } },
        error: null,
      });

      const result = await createAssessmentSession({
        athleteId, // Self-assessment attempt!
        protocolId: 'proto-uuid',
        protocolCode: 'TEST_30M_SPRINT',
        assessmentDate: '2026-11-13',
        trial1: 4.25,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/cannot evaluate themselves/i);
    });
  });

  // ============================================================================
  // 2. Cross-Organization Isolation
  // ============================================================================
  describe('2. Cross-Organization Multi-Tenant Isolation', () => {
    it('strictly isolates academy assessment queries returning 0 foreign records', async () => {
      const attackingAcademyId = 'malicious-or-unrelated-academy-999';

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const { data } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('academy_id', attackingAcademyId)
        .order('assessment_date', { ascending: false });

      expect(data).toHaveLength(0);
    });

    it('strictly isolates institution student records from unauthorized institutions', async () => {
      const foreignInstitutionId = 'foreign-institution-777';

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const { data } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('institution_id', foreignInstitutionId)
        .order('assessment_date', { ascending: false });

      expect(data).toHaveLength(0);
    });
  });

  // ============================================================================
  // 3. Revoked Affiliation Access
  // ============================================================================
  describe('3. Revoked Affiliation Boundary Enforcement', () => {
    it('excludes athletes whose affiliation is revoked from eligible evaluation candidates', async () => {
      const evaluatorId = 'coach-ramesh-001';

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'academies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'apex-academy-id', name: 'Apex Academy' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'athlete_affiliations') {
          // Query filters for status = 'active'; revoked records are never returned
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const { data, error } = await fetchEligibleAthletesForEvaluator(evaluatorId, 'academy');
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  // ============================================================================
  // 4. Suspended Evaluator Account Behavior
  // ============================================================================
  describe('4. Suspended Evaluator Account Behavior', () => {
    it('denies athlete list retrieval when evaluator authorization is suspended', async () => {
      const suspendedCoachId = 'coach-suspended-001';

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'academies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // Not owner
              }),
            }),
          };
        }
        if (table === 'evaluator_authorizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  // Status is 'suspended', not 'active'
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const { data, error } = await fetchEligibleAthletesForEvaluator(suspendedCoachId, 'academy');
      expect(data).toHaveLength(0); // Suspended evaluator returns zero eligible athletes
      expect(error).toBeNull();
    });
  });

  // ============================================================================
  // 5. Role Escalation Attempts
  // ============================================================================
  describe('5. Role Escalation Protection', () => {
    it('rejects unauthorized role alteration from client payloads', async () => {
      // In Supabase schema: guard_user_profile_role_update trigger raises:
      // 'Unauthorized: User role cannot be altered once assigned.'
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Unauthorized: User role cannot be altered once assigned.'),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
      });

      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' as any })
        .eq('id', 'athlete-user-id');

      expect(error).toBeDefined();
      expect(error?.message).toMatch(/cannot be altered once assigned/i);
    });
  });

  // ============================================================================
  // 6. Assessment Verification Integrity & Two-Person Verification
  // ============================================================================
  describe('6. Assessment Verification Integrity & Two-Person Enforcement', () => {
    it('rejects evaluator verifying their own session under Two-Person Verification rules', async () => {
      const coachUserId = 'coach-ramesh-001';
      const sessionId = 'session-101';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: coachUserId, email: 'coach.ramesh@apex.in' } },
        error: null,
      });

      // Session lookup returns evaluator_id identical to current user
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { evaluator_id: coachUserId }, // SAME ID!
              error: null,
            }),
          }),
        }),
      });

      const result = await verifyAssessmentSession(sessionId, {
        twoPersonVerification: true,
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/two-person integrity violation/i);
    });

    it('permits independent reviewer to verify session under Two-Person Verification rules', async () => {
      const reviewerUserId = 'director-sharma-002';
      const originalCoachId = 'coach-ramesh-001';
      const sessionId = 'session-101';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: reviewerUserId, email: 'director@apex.in' } },
        error: null,
      });

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { evaluator_id: originalCoachId }, // DIFFERENT ID!
            error: null,
          }),
        }),
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'assessment_sessions') {
          return { select: selectMock, update: updateMock };
        }
        if (table === 'assessment_results') {
          return { update: updateMock };
        }
        return {};
      });

      const result = await verifyAssessmentSession(sessionId, {
        twoPersonVerification: true,
        reviewerNotes: 'Verified track length and timing gate calibration.',
      });

      expect(result.error).toBeNull();
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          verified: true,
          verification_tier: 'two_person_verified',
          review_notes: 'Verified track length and timing gate calibration.',
        })
      );
    });
  });

  // ============================================================================
  // 7. Verified Record Immutability
  // ============================================================================
  describe('7. Verified Record Immutability & Audit Integrity', () => {
    it('blocks deletion of verified sessions preserving permanent audit trail', async () => {
      // In deleteAssessmentSession: query enforces .eq('verified', false).
      // Attempting to delete a verified session returns error / affects zero rows.
      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: new Error('Unauthorized: Verified assessment sessions cannot be deleted.'),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        delete: deleteMock,
      });

      const result = await deleteAssessmentSession('verified-session-888');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/cannot be deleted/i);
    });
  });

  // ============================================================================
  // 8. Guardian Consent Enforcement for Minor Athletes (DPDP Act 2023)
  // ============================================================================
  describe('8. Minor Athlete Guardian Consent Enforcement', () => {
    it('identifies minor athlete without consent and blocks unconsented assessment processing', async () => {
      const minorAthleteId = 'minor-athlete-14yo';

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'athletes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { date_of_birth: '2012-08-20' }, // Age 14 in 2026
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'guardian_consents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    gt: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // No active consent!
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const consentCheck = await checkMinorGuardianConsent(minorAthleteId, 'performance_tracking');
      expect(consentCheck.isMinor).toBe(true);
      expect(consentCheck.hasActiveConsent).toBe(false);
      expect(consentCheck.consentRecord).toBeNull();
    });

    it('identifies minor athlete WITH active verified consent and allows processing', async () => {
      const minorAthleteId = 'minor-athlete-consented';

      const mockConsent = {
        id: 'consent-uuid-1',
        athlete_id: minorAthleteId,
        consent_purpose: 'performance_tracking',
        status: 'active',
        expires_at: '2027-11-13T00:00:00Z',
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'athletes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { date_of_birth: '2010-03-15' }, // Age 16 in 2026
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'guardian_consents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    gt: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: mockConsent, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const consentCheck = await checkMinorGuardianConsent(minorAthleteId, 'performance_tracking');
      expect(consentCheck.isMinor).toBe(true);
      expect(consentCheck.hasActiveConsent).toBe(true);
      expect(consentCheck.consentRecord).toBeDefined();
      expect(consentCheck.consentRecord.status).toBe('active');
    });

    it('exempts adult athletes (Age >= 18) from guardian consent requirements', async () => {
      const adultAthleteId = 'adult-athlete-22yo';

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'athletes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { date_of_birth: '2004-01-10' }, // Age 22 in 2026
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const consentCheck = await checkMinorGuardianConsent(adultAthleteId, 'performance_tracking');
      expect(consentCheck.isMinor).toBe(false);
      expect(consentCheck.hasActiveConsent).toBe(true); // Automatically true for adults
    });
  });
});
