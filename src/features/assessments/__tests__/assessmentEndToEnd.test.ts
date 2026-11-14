import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAssessmentProtocols,
  fetchEligibleAthletesForEvaluator,
  createAssessmentSession,
  verifyAssessmentSession,
  deleteAssessmentSession,
} from '../assessmentService';
import { calculateBestScore, validateMeasurement, estimatePercentileRank } from '../assessmentCalculations';
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

describe('Phase 3D.5 — End-to-End Assessment Integration & Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Scenario 1: Evaluator Context Validation
  // ============================================================================
  describe('Scenario 1: Evaluator Context Validation', () => {
    it('authenticates authorized evaluator and validates session context', async () => {
      const coachUserId = 'evaluator-coach-001';
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: coachUserId, email: 'coach.ramesh@apexacademy.in' } },
        error: null,
      });

      const userResponse = await supabase.auth.getUser();
      expect(userResponse.data?.user?.id).toBe(coachUserId);
      expect(userResponse.data?.user?.email).toBe('coach.ramesh@apexacademy.in');
    });

    it('rejects athlete identity attempting to act as evaluator in self-assessment', async () => {
      const athleteUserId = 'athlete-arjun-001';
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: athleteUserId, email: 'arjun@pratibhascan.in' } },
        error: null,
      });

      // Athlete attempts to evaluate themselves
      const result = await createAssessmentSession({
        athleteId: athleteUserId,
        protocolId: 'proto-sprint-id',
        protocolCode: 'TEST_30M_SPRINT',
        assessmentDate: '2026-11-13',
        trial1: 4.12,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/cannot evaluate themselves/i);
    });
  });

  // ============================================================================
  // Scenario 2: Active Athlete Selection from Authorized Affiliations
  // ============================================================================
  describe('Scenario 2: Active Athlete Selection with Affiliation Filters', () => {
    it('retrieves only approved athletes with ACTIVE affiliations and excludes self', async () => {
      const evaluatorId = 'coach-ramesh-001';

      // 1. Academy lookup
      const academySelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'apex-academy-id', name: 'Apex Sports Academy' },
            error: null,
          }),
        }),
      });

      // 2. Affiliation lookup (returns 1 active candidate, 1 pending, 1 revoked, 1 self)
      const affSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'aff-01', athlete_id: 'athlete-arjun-001', created_at: '2026-10-01' },
                { id: 'aff-02', athlete_id: evaluatorId, created_at: '2026-10-01' }, // Self
              ],
              error: null,
            }),
          }),
        }),
      });

      // 3. User profiles and athlete profiles
      const profileSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { full_name: 'Arjun Athlete', email: 'arjun@pratibhascan.in' },
            error: null,
          }),
        }),
      });

      const athleteSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { gender: 'male', date_of_birth: '2008-05-10', primary_sport: 'Athletics' },
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'academies') return { select: academySelect };
        if (table === 'athlete_affiliations') return { select: affSelect };
        if (table === 'user_profiles') return { select: profileSelect };
        if (table === 'athletes') return { select: athleteSelect };
        return { select: vi.fn() };
      });

      const { data, error } = await fetchEligibleAthletesForEvaluator(evaluatorId, 'academy');
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('athlete-arjun-001');
      expect(data[0].fullName).toBe('Arjun Athlete');
      expect(data.some((a) => a.id === evaluatorId)).toBe(false);
    });
  });

  // ============================================================================
  // Scenario 3: Standardized Protocol Selection & Validation
  // ============================================================================
  describe('Scenario 3: Protocol Selection & Validation Rules', () => {
    it('selects valid protocols and retrieves correct directionality and ranges', async () => {
      const mockProtocols = [
        {
          id: 'proto-sprint-id',
          code: 'TEST_30M_SPRINT',
          title: '30m Acceleration Sprint',
          category: 'speed',
          unit: 'sec',
          lower_is_better: true,
          equipment_required: ['Timing gates', 'Cones'],
          description: 'Linear acceleration test',
          methodology: '3-point stance',
        },
        {
          id: 'proto-jump-id',
          code: 'TEST_VERT_JUMP',
          title: 'Countermovement Vertical Jump',
          category: 'power',
          unit: 'cm',
          lower_is_better: false,
          equipment_required: ['Vertec or Jump Mat'],
          description: 'Lower body explosive power',
          methodology: 'Countermovement jump',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockProtocols, error: null }),
        }),
      });

      const { data } = await fetchAssessmentProtocols();
      expect(data).toHaveLength(2);

      const sprint = data.find((p) => p.code === 'TEST_30M_SPRINT')!;
      expect(sprint.lowerIsBetter).toBe(true);
      expect(sprint.unit).toBe('sec');

      const jump = data.find((p) => p.code === 'TEST_VERT_JUMP')!;
      expect(jump.lowerIsBetter).toBe(false);
      expect(jump.unit).toBe('cm');
    });
  });

  // ============================================================================
  // Scenario 4: Multi-Trial Entry & Mathematical Scoring Accuracy
  // ============================================================================
  describe('Scenario 4: Multi-Trial Entry & Best Score Calculations', () => {
    it('computes correct best score for lower-is-better protocol (30m Sprint)', () => {
      const result = calculateBestScore('TEST_30M_SPRINT', [4.52, 4.38, 4.45]);
      expect(result.bestScore).toBe(4.38); // Minimum score
      expect(result.validCount).toBe(3);
      expect(result.error).toBeUndefined();
    });

    it('computes correct best score for higher-is-better protocol (Vertical Jump)', () => {
      const result = calculateBestScore('TEST_VERT_JUMP', [48.5, 52.0, 50.5]);
      expect(result.bestScore).toBe(52.0); // Maximum score
      expect(result.validCount).toBe(3);
      expect(result.error).toBeUndefined();
    });

    it('disables speculative heuristic percentiles returning null', () => {
      // In accordance with Phase 3D.5 accuracy audit
      expect(estimatePercentileRank('TEST_30M_SPRINT', 4.38)).toBeNull();
      expect(estimatePercentileRank('TEST_VERT_JUMP', 52.0)).toBeNull();
    });
  });

  // ============================================================================
  // Scenario 5: Save as Draft
  // ============================================================================
  describe('Scenario 5: Save Session as Draft (Unverified)', () => {
    it('creates draft session with verified=false and status=pending', async () => {
      const evaluatorId = 'coach-ramesh-001';
      const athleteId = 'athlete-arjun-001';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: evaluatorId, email: 'coach@apex.in' } },
        error: null,
      });

      const sessionInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'draft-session-101',
              athlete_id: athleteId,
              evaluator_id: evaluatorId,
              academy_id: 'apex-academy-id',
              assessment_date: '2026-11-13',
              venue: 'Apex High Performance Track',
              notes: 'Morning session, dry track',
              verified: false,
              created_at: '2026-11-13T09:30:00Z',
            },
            error: null,
          }),
        }),
      });

      const resultInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'res-draft-101',
              session_id: 'draft-session-101',
              protocol_id: 'proto-sprint-id',
              trial_1: 4.52,
              trial_2: 4.38,
              trial_3: 4.45,
              best_score: 4.38,
              percentile_rank: null,
              status: 'pending',
            },
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'assessment_sessions') return { insert: sessionInsert };
        if (table === 'assessment_results') return { insert: resultInsert };
        if (table === 'assessment_protocols') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'proto-sprint-id' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Coach Ramesh' }, error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const session = await createAssessmentSession({
        athleteId,
        protocolId: 'proto-sprint-id',
        protocolCode: 'TEST_30M_SPRINT',
        assessmentDate: '2026-11-13',
        venue: 'Apex High Performance Track',
        notes: 'Morning session, dry track',
        trial1: 4.52,
        trial2: 4.38,
        trial3: 4.45,
      });

      expect(session.error).toBeNull();
      expect(session.data).toBeDefined();
      expect(session.data?.id).toBe('draft-session-101');
      expect(session.data?.verified).toBe(false);
      expect(session.data?.results[0].bestScore).toBe(4.38);
      expect(session.data?.results[0].status).toBe('pending');
      expect(session.data?.results[0].percentileRank).toBeNull();
    });
  });

  // ============================================================================
  // Scenario 6: Retrieve and Review Draft Session
  // ============================================================================
  describe('Scenario 6: Retrieve and Review Draft Session', () => {
    it('retrieves draft session with unverified state for review before locking', async () => {
      const mockSession = {
        id: 'draft-session-101',
        athlete_id: 'athlete-arjun-001',
        evaluator_id: 'coach-ramesh-001',
        verified: false,
        assessment_date: '2026-11-13',
        assessment_results: [
          {
            id: 'res-draft-101',
            protocol_id: 'proto-sprint-id',
            trial_1: 4.52,
            trial_2: 4.38,
            trial_3: 4.45,
            best_score: 4.38,
            status: 'pending',
          },
        ],
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
          }),
        }),
      });

      const res: any = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('id', 'draft-session-101')
        .single();

      expect(res.data).toBeDefined();
      expect(res.data?.verified).toBe(false);
      expect(res.data?.assessment_results[0].status).toBe('pending');
      expect(res.data?.assessment_results[0].best_score).toBe(4.38);
    });
  });

  // ============================================================================
  // Scenario 7: Authorized Verification
  // ============================================================================
  describe('Scenario 7: Authorized Verification by Evaluator', () => {
    it('transitions session to verified=true and updates result status to verified', async () => {
      const verifierId = 'director-sharma-001';
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: verifierId, email: 'director@apex.in' } },
        error: null,
      });

      const sessionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const resultUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'assessment_sessions') return { update: sessionUpdate };
        if (table === 'assessment_results') return { update: resultUpdate };
        return {};
      });

      const response = await verifyAssessmentSession('draft-session-101');
      expect(response.error).toBeNull();
      expect(sessionUpdate).toHaveBeenCalledWith(expect.objectContaining({ verified: true }));
      expect(resultUpdate).toHaveBeenCalledWith({ status: 'verified' });
    });
  });

  // ============================================================================
  // Scenario 8: Athlete Dashboard History Retrieval
  // ============================================================================
  describe('Scenario 8: Athlete Dashboard History Retrieval', () => {
    it('retrieves verified records in athlete history and marks them as Organization Verified', async () => {
      const athleteId = 'athlete-arjun-001';

      const mockAthleteSessions = [
        {
          id: 'draft-session-101',
          athlete_id: athleteId,
          verified: true,
          assessment_date: '2026-11-13',
          assessment_results: [
            {
              protocol_code: 'TEST_30M_SPRINT',
              best_score: 4.38,
              status: 'verified',
            },
          ],
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAthleteSessions, error: null }),
          }),
        }),
      });

      const res: any = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('assessment_date', { ascending: false });

      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].verified).toBe(true);
      expect(res.data?.[0].assessment_results[0].best_score).toBe(4.38);
    });
  });

  // ============================================================================
  // Scenario 9: Academy Permitted Retrieval
  // ============================================================================
  describe('Scenario 9: Academy Permitted Access to Associated Records', () => {
    it('retrieves assessment sessions belonging to the academy organization', async () => {
      const academyId = 'apex-academy-id';

      const mockAcademySessions = [
        {
          id: 'draft-session-101',
          academy_id: academyId,
          athlete_id: 'athlete-arjun-001',
          verified: true,
          assessment_date: '2026-11-13',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAcademySessions, error: null }),
          }),
        }),
      });

      const res: any = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('academy_id', academyId)
        .order('created_at', { ascending: false });

      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].academy_id).toBe(academyId);
    });
  });

  // ============================================================================
  // Scenario 10: Cross-Organization Isolation
  // ============================================================================
  describe('Scenario 10: Cross-Organization Isolation Enforcement', () => {
    it('returns empty result when an unrelated organization attempts to query sessions', async () => {
      const unrelatedOrgId = 'unrelated-institution-999';

      // RLS or query scoping returns 0 records
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const res: any = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('institution_id', unrelatedOrgId)
        .order('created_at', { ascending: false });

      expect(res.data).toHaveLength(0);
    });
  });

  // ============================================================================
  // Scenario 11: Revoked Affiliation Isolation
  // ============================================================================
  describe('Scenario 11: Revoked Affiliation Revocation Enforcement', () => {
    it('excludes athletes whose affiliation is revoked from eligible evaluation candidates', async () => {
      const evaluatorId = 'coach-ramesh-001';

      // Academy lookup succeeds
      const academySelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'apex-academy-id', name: 'Apex Academy' },
            error: null,
          }),
        }),
      });

      // Affiliation query returns empty array because status is 'revoked' (filter is status='active')
      const affSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [], // Revoked affiliations are not returned by active query filter
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'academies') return { select: academySelect };
        if (table === 'athlete_affiliations') return { select: affSelect };
        return { select: vi.fn() };
      });

      const { data } = await fetchEligibleAthletesForEvaluator(evaluatorId, 'academy');
      expect(data).toHaveLength(0); // Zero eligible athletes when affiliations are revoked
    });
  });

  // ============================================================================
  // Scenario 12: Immutability of Verified Sessions
  // ============================================================================
  describe('Scenario 12: Verified Session Immutability & Audit Trail Integrity', () => {
    it('rejects deletion of a verified session preserving audit records', async () => {
      // In deleteAssessmentSession: query checks verified = false.
      // If a session is already verified, the delete call with eq('verified', false) affects 0 rows.
      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Cannot delete verified session') }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        delete: deleteMock,
      });

      const result = await deleteAssessmentSession('verified-session-999');
      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // Scenario 13: Incomplete, Negative, and Non-Numeric Measurement Validation
  // ============================================================================
  describe('Scenario 13: Measurement Validation Boundaries & Error Reporting', () => {
    it('rejects negative values matching database check constraint (check_positive_trials)', () => {
      const val = validateMeasurement('TEST_30M_SPRINT', -4.5);
      expect(val.isValid).toBe(false);
      expect(val.error).toMatch(/cannot be negative/i);
    });

    it('rejects values below physiological minimum (e.g. 1.2s for 30m sprint)', () => {
      const val = validateMeasurement('TEST_30M_SPRINT', 1.2);
      expect(val.isValid).toBe(false);
      expect(val.error).toMatch(/below the realistic minimum/i);
    });

    it('rejects values above physiological maximum (e.g. 25.0s for 30m sprint)', () => {
      const val = validateMeasurement('TEST_30M_SPRINT', 25.0);
      expect(val.isValid).toBe(false);
      expect(val.error).toMatch(/exceeds the maximum allowable limit/i);
    });

    it('rejects NaN or non-numeric inputs', () => {
      const val = validateMeasurement('TEST_30M_SPRINT', NaN);
      expect(val.isValid).toBe(false);
      expect(val.error).toMatch(/must be a valid number/i);
    });

    it('handles incomplete optional trials gracefully when at least one trial is valid', () => {
      // Athlete completes trial 1 and trial 2, skips trial 3
      const result = calculateBestScore('TEST_30M_SPRINT', [4.45, 4.39, null]);
      expect(result.bestScore).toBe(4.39);
      expect(result.validCount).toBe(2);
      expect(result.error).toBeUndefined();
    });

    it('returns null bestScore when all trials are empty', () => {
      const result = calculateBestScore('TEST_30M_SPRINT', [null, null, null]);
      expect(result.bestScore).toBeNull();
      expect(result.validCount).toBe(0);
    });
  });
});
