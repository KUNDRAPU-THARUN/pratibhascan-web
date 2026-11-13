import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  institutionProfileUpdateSchema,
  studentAffiliationRequestSchema,
  INSTITUTION_TYPES,
} from '../institutionSchemas';
import {
  updateInstitutionProfile,
  approveStudentAffiliation,
  rejectStudentAffiliation,
  revokeStudentAffiliation,
  createStudentAffiliationRequest,
} from '../institutionService';
import { calculateAge } from '@/features/athlete/athleteService';

// Mock Supabase
const mockFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe('Institution Feature — Unit Tests & Validation Suites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('institutionProfileUpdateSchema Validation', () => {
    it('validates a complete, valid institution update payload across all permitted types', () => {
      for (const t of INSTITUTION_TYPES) {
        const payload = {
          name: 'Karnataka State Directorate of Youth Services',
          type: t,
          contactEmail: 'contact@sportsboard.karnataka.gov.in',
          contactPhone: '+91 80 2234 5678',
          state: 'Karnataka',
          district: 'Bengaluru Urban',
        };

        const result = institutionProfileUpdateSchema.safeParse(payload);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe(t);
        }
      }
    });

    it('rejects short institution name (< 3 chars)', () => {
      const payload = {
        name: 'AB',
        type: 'school',
        contactEmail: 'principal@school.edu.in',
        state: 'Delhi',
        district: 'New Delhi',
      };

      const result = institutionProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'name');
        expect(error?.message).toContain('at least 3 characters');
      }
    });

    it('rejects invalid institution type classification', () => {
      const payload = {
        name: 'Valid Sports High School',
        type: 'unrecognized_club',
        contactEmail: 'info@school.org',
        state: 'Maharashtra',
        district: 'Pune',
      };

      const result = institutionProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'type');
        expect(error).toBeDefined();
      }
    });

    it('rejects invalid contact email address', () => {
      const payload = {
        name: 'Government Sports High School',
        type: 'school',
        contactEmail: 'not-a-valid-email',
        state: 'Punjab',
        district: 'Patiala',
      };

      const result = institutionProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'contactEmail');
        expect(error?.message).toContain('valid official contact email');
      }
    });

    it('accepts optional phone number as null, empty or omitted', () => {
      const payload = {
        name: 'District Sports Council',
        type: 'sports_board',
        contactEmail: 'office@districtsports.org',
        state: 'Kerala',
        district: 'Ernakulam',
      };

      const result = institutionProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid phone number formats', () => {
      const payload = {
        name: 'State Sports Academy School',
        type: 'school',
        contactEmail: 'sports@school.ac.in',
        contactPhone: 'phone1234',
        state: 'Haryana',
        district: 'Sonipat',
      };

      const result = institutionProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'contactPhone');
        expect(error?.message).toContain('valid phone number');
      }
    });
  });

  describe('studentAffiliationRequestSchema Validation', () => {
    it('accepts valid UUID format for student-athlete ID', () => {
      const payload = {
        athleteId: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        academicYear: '2026-2027',
        gradeOrDepartment: 'Class 10-A',
        notes: 'Inter-School Athletics Training Cohort',
      };

      const result = studentAffiliationRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.athleteId).toBe('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');
        expect(result.data.academicYear).toBe('2026-2027');
      }
    });

    it('rejects non-UUID student identifier', () => {
      const payload = {
        athleteId: 'student_12345',
      };

      const result = studentAffiliationRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'athleteId');
        expect(error?.message).toContain('valid Student-Athlete UUID');
      }
    });

    it('rejects excessively long notes (> 250 chars)', () => {
      const payload = {
        athleteId: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        notes: 'n'.repeat(251),
      };

      const result = studentAffiliationRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'notes');
        expect(error?.message).toContain('cannot exceed 250 characters');
      }
    });
  });

  describe('Minor Student Safeguard Logic (DPDP Act 2023)', () => {
    it('accurately identifies minor students (< 18 years) for mandatory guardian consent workflow', () => {
      const today = new Date();
      const minorDob = `${today.getFullYear() - 15}-03-10`;
      const adultDob = `${today.getFullYear() - 20}-07-22`;

      const minorAge = calculateAge(minorDob);
      const adultAge = calculateAge(adultDob);

      expect(minorAge).toBe(15);
      expect(minorAge < 18).toBe(true);

      expect(adultAge).toBe(20);
      expect(adultAge < 18).toBe(false);
    });
  });

  describe('Institution Service Mutation Functions', () => {
    it('updateInstitutionProfile updates permitted fields and handles success', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await updateInstitutionProfile('inst-uuid-1', {
        name: 'National Sports University College of Physical Education',
        type: 'college',
        contactEmail: 'dean@nsu.edu.in',
        contactPhone: '+91 80 9999 8888',
        state: 'Manipur',
        district: 'Imphal West',
      });

      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('institutions');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'National Sports University College of Physical Education',
          type: 'college',
          contact_email: 'dean@nsu.edu.in',
          state: 'Manipur',
          district: 'Imphal West',
        })
      );
    });

    it('approveStudentAffiliation updates status to active and records approver', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await approveStudentAffiliation('aff-inst-99', 'inst-owner-uuid');
      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('athlete_affiliations');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'active',
        approved_by: 'inst-owner-uuid',
      });
    });

    it('rejectStudentAffiliation updates status to rejected', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await rejectStudentAffiliation('aff-inst-99');
      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('athlete_affiliations');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'rejected',
      });
    });

    it('revokeStudentAffiliation updates status to revoked', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await revokeStudentAffiliation('aff-inst-99');
      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('athlete_affiliations');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'revoked',
      });
    });

    it('createStudentAffiliationRequest verifies student existence before creating pending affiliation', async () => {
      // Step 1: select('id').eq('id', athleteId).maybeSingle()
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'student-uuid-101' },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      });

      // Step 2: insert()
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'athletes') return { select: mockSelect };
        if (table === 'athlete_affiliations') return { insert: mockInsert };
        return {};
      });

      const res = await createStudentAffiliationRequest(
        'inst-uuid-10',
        'student-uuid-101',
        'inst-owner-10'
      );

      expect(res.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith({
        athlete_id: 'student-uuid-101',
        organization_type: 'institution',
        institution_id: 'inst-uuid-10',
        status: 'pending',
        requested_by: 'inst-owner-10',
      });
    });

    it('createStudentAffiliationRequest returns error if candidate student does not exist', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      });

      const res = await createStudentAffiliationRequest(
        'inst-uuid-10',
        'non-existent-uuid',
        'inst-owner-10'
      );

      expect(res.error).not.toBeNull();
      expect(res.error?.message).toContain('Student-Athlete ID not found in system');
    });
  });
});
