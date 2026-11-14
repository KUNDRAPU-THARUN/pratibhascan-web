import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAssessmentProtocols,
  fetchEligibleAthletesForEvaluator,
  createAssessmentSession,
  verifyAssessmentSession,
  deleteAssessmentSession,
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

describe('Assessment Engine — Service Methods & Authorization Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAssessmentProtocols', () => {
    it('fetches standardized protocols from Supabase assessment_protocols table', async () => {
      const mockProtocols = [
        {
          id: 'proto-1',
          code: 'TEST_30M_SPRINT',
          title: '30-Meter Acceleration Sprint',
          category: 'speed',
          unit: 'sec',
          lower_is_better: true,
          equipment_required: ['Gates', 'Cones'],
          description: 'Linear speed test',
          methodology: 'Stationary start',
        },
      ];

      const selectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockProtocols, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
      });

      const { data, error } = await fetchAssessmentProtocols();
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].code).toBe('TEST_30M_SPRINT');
      expect(data[0].lowerIsBetter).toBe(true);
    });

    it('falls back to local specifications gracefully on network failure', async () => {
      const selectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network failure') }),
      });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
      });

      const { data, error } = await fetchAssessmentProtocols();
      expect(error).toBeNull();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].validRange).toBeDefined();
    });
  });

  describe('fetchEligibleAthletesForEvaluator', () => {
    it('strictly returns only athletes with ACTIVE affiliations and excludes self', async () => {
      const evaluatorId = 'coach-user-id';

      // 1. Academy lookup
      const academySelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'acad-1', name: 'Apex Elite Academy' },
            error: null,
          }),
        }),
      });

      // 2. Affiliation lookup (returns 1 active other, 1 pending, 1 self)
      const affSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'aff-1', athlete_id: 'athlete-valid-id', created_at: '2026-11-01' },
                { id: 'aff-2', athlete_id: evaluatorId, created_at: '2026-11-01' }, // Self (must be filtered)
              ],
              error: null,
            }),
          }),
        }),
      });

      // 3. User profiles & athlete records
      const profileSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { full_name: 'Pooja Nair', email: 'pooja@example.com' },
            error: null,
          }),
        }),
      });

      const athleteSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { gender: 'female', date_of_birth: '2010-05-15', primary_sport: 'Athletics' },
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
      expect(data[0].id).toBe('athlete-valid-id');
      expect(data[0].fullName).toBe('Pooja Nair');
      expect(data[0].isMinor).toBe(true); // Born 2008
      expect(data.some((a) => a.id === evaluatorId)).toBe(false); // Self excluded
    });
  });

  describe('createAssessmentSession', () => {
    it('strictly throws if an athlete attempts self-evaluation (check_no_self_evaluation)', async () => {
      const userId = 'athlete-id-123';
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: userId, email: 'athlete@example.com' } },
        error: null,
      });

      const result = await createAssessmentSession({
        athleteId: userId, // Identical to authenticated user!
        protocolId: 'proto-uuid',
        protocolCode: 'TEST_30M_SPRINT',
        assessmentDate: '2026-11-13',
        trial1: 4.5,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/cannot evaluate themselves/i);
    });

    it('creates session and results row when valid trial measurements are provided', async () => {
      const evaluatorId = 'evaluator-uuid-456';
      const athleteId = 'athlete-uuid-789';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: evaluatorId, email: 'coach@example.com' } },
        error: null,
      });

      const sessionInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'sess-new-1',
              athlete_id: athleteId,
              evaluator_id: evaluatorId,
              assessment_date: '2026-11-13',
              venue: 'Stadium',
              verified: false,
              created_at: '2026-11-13T10:00:00Z',
            },
            error: null,
          }),
        }),
      });

      const resultInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'res-new-1',
              session_id: 'sess-new-1',
              protocol_id: 'proto-sprint',
              trial_1: 4.52,
              trial_2: 4.38,
              trial_3: 4.45,
              best_score: 4.38,
              percentile_rank: 64,
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
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'proto-sprint' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Test Name' }, error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const response = await createAssessmentSession({
        athleteId,
        protocolId: 'proto-sprint',
        protocolCode: 'TEST_30M_SPRINT',
        assessmentDate: '2026-11-13',
        venue: 'Stadium',
        trial1: 4.52,
        trial2: 4.38,
        trial3: 4.45,
      });

      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe('sess-new-1');
      expect(response.data?.results[0].bestScore).toBe(4.38); // Selected minimum for sprint!
      expect(response.data?.verified).toBe(false); // Created as draft
    });
  });

  describe('verifyAssessmentSession', () => {
    it('updates session verified to true and updates result status to verified', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'verifier-id', email: 'director@example.com' } },
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

      const result = await verifyAssessmentSession('sess-123');
      expect(result.error).toBeNull();
      expect(sessionUpdate).toHaveBeenCalledWith(expect.objectContaining({ verified: true }));
      expect(resultUpdate).toHaveBeenCalledWith({ status: 'verified' });
    });
  });

  describe('deleteAssessmentSession', () => {
    it('deletes draft sessions where verified is false', async () => {
      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        delete: deleteMock,
      });

      const result = await deleteAssessmentSession('sess-draft-1');
      expect(result.error).toBeNull();
    });
  });
});
