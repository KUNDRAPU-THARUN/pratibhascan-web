import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  academyProfileUpdateSchema,
  affiliationRequestSchema,
} from '../academySchemas';
import {
  updateAcademyProfile,
  approveAffiliation,
  rejectAffiliation,
  revokeAffiliation,
  createAffiliationRequest,
} from '../academyService';
import { calculateAge } from '@/features/athlete/athleteService';

// Mock Supabase
const mockFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe('Academy Feature — Unit Tests & Validation Suites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('academyProfileUpdateSchema Validation', () => {
    it('validates a complete, valid academy update payload', () => {
      const payload = {
        name: 'National Sports High Performance Academy',
        registrationNumber: 'SAI-IND-2024-889',
        contactEmail: 'director@nationalsports.in',
        contactPhone: '+91 98765 43210',
        state: 'Maharashtra',
        district: 'Pune',
        address: 'Sector 5, Balewadi Sports Complex',
        sportsOffered: ['Athletics', 'Badminton', 'Swimming'],
      };

      const result = academyProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('National Sports High Performance Academy');
        expect(result.data.sportsOffered).toHaveLength(3);
      }
    });

    it('rejects short academy name (< 3 chars)', () => {
      const payload = {
        name: 'AB',
        contactEmail: 'test@academy.org',
        state: 'Delhi',
        district: 'New Delhi',
        sportsOffered: ['Athletics'],
      };

      const result = academyProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'name');
        expect(error?.message).toContain('at least 3 characters');
      }
    });

    it('rejects invalid email address', () => {
      const payload = {
        name: 'Valid Academy Name',
        contactEmail: 'not-an-email',
        state: 'Punjab',
        district: 'Patiala',
        sportsOffered: ['Athletics'],
      };

      const result = academyProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'contactEmail');
        expect(error?.message).toContain('valid official contact email');
      }
    });

    it('rejects empty sports offered array', () => {
      const payload = {
        name: 'Valid Academy Name',
        contactEmail: 'contact@academy.com',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        sportsOffered: [],
      };

      const result = academyProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'sportsOffered');
        expect(error?.message).toContain('at least one sport program');
      }
    });

    it('accepts optional phone and address as null or omitted', () => {
      const payload = {
        name: 'Minimal Academy Profile',
        contactEmail: 'admin@minimal.org',
        state: 'Haryana',
        district: 'Rohtak',
        sportsOffered: ['Wrestling'],
      };

      const result = academyProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid phone number formats', () => {
      const payload = {
        name: 'Valid Academy',
        contactEmail: 'admin@academy.org',
        contactPhone: 'abc12345',
        state: 'Haryana',
        district: 'Rohtak',
        sportsOffered: ['Boxing'],
      };

      const result = academyProfileUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'contactPhone');
        expect(error?.message).toContain('valid phone number');
      }
    });
  });

  describe('affiliationRequestSchema Validation', () => {
    it('accepts valid UUID format for athlete ID', () => {
      const payload = {
        athleteId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        notes: 'U-19 Sprint Camp Evaluation',
      };

      const result = affiliationRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.athleteId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      }
    });

    it('rejects malformed non-UUID athlete identifier', () => {
      const payload = {
        athleteId: 'invalid-athlete-id-12345',
      };

      const result = affiliationRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'athleteId');
        expect(error?.message).toContain('valid Athlete UUID');
      }
    });

    it('rejects excessively long notes (> 250 chars)', () => {
      const payload = {
        athleteId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        notes: 'a'.repeat(251),
      };

      const result = affiliationRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === 'notes');
        expect(error?.message).toContain('cannot exceed 250 characters');
      }
    });
  });

  describe('Minor Safeguard Identification (DPDP Act 2023)', () => {
    it('accurately identifies minor athletes (< 18 years) for regulatory notice', () => {
      const today = new Date();
      const minorDob = `${today.getFullYear() - 16}-05-10`;
      const adultDob = `${today.getFullYear() - 19}-02-15`;

      const minorAge = calculateAge(minorDob);
      const adultAge = calculateAge(adultDob);

      expect(minorAge).toBe(16);
      expect(minorAge < 18).toBe(true);

      expect(adultAge).toBe(19);
      expect(adultAge < 18).toBe(false);
    });

    it('treats 17-year-olds on the cusp as minors until their 18th birthday', () => {
      const today = new Date();
      // Born 18 years ago tomorrow -> still 17 today
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const y = tomorrow.getFullYear() - 18;
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const d = String(tomorrow.getDate()).padStart(2, '0');
      const dobString = `${y}-${m}-${d}`;
      const age = calculateAge(dobString);
      expect(age).toBe(17);
      expect(age < 18).toBe(true);
    });
  });

  describe('Academy Service Mutation Functions', () => {
    it('updateAcademyProfile updates permitted fields and handles success', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await updateAcademyProfile('acad-uuid-1', {
        name: 'Apex Academy',
        registrationNumber: 'REG-123',
        contactEmail: 'contact@apex.in',
        contactPhone: '+91 99999 88888',
        state: 'Maharashtra',
        district: 'Pune',
        address: 'Balewadi',
        sportsOffered: ['Badminton'],
      });

      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('academies');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Apex Academy',
          registration_number: 'REG-123',
          contact_email: 'contact@apex.in',
          state: 'Maharashtra',
          district: 'Pune',
          sports_offered: ['Badminton'],
        })
      );
    });

    it('approveAffiliation updates status to active and sets approved_by', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await approveAffiliation('aff-uuid-99', 'user-owner-1');
      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('athlete_affiliations');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'active',
        approved_by: 'user-owner-1',
      });
    });

    it('rejectAffiliation updates status to rejected', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await rejectAffiliation('aff-uuid-99');
      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('athlete_affiliations');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'rejected',
      });
    });

    it('revokeAffiliation updates status to revoked', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await revokeAffiliation('aff-uuid-99');
      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('athlete_affiliations');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'revoked',
      });
    });

    it('createAffiliationRequest verifies athlete existence before creating pending request', async () => {
      // Step 1: select('id').eq('id', athleteId).maybeSingle()
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'athlete-uuid-42' },
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

      const res = await createAffiliationRequest(
        'acad-uuid-1',
        'athlete-uuid-42',
        'requester-user-1'
      );

      expect(res.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith({
        athlete_id: 'athlete-uuid-42',
        organization_type: 'academy',
        academy_id: 'acad-uuid-1',
        status: 'pending',
        requested_by: 'requester-user-1',
      });
    });

    it('createAffiliationRequest returns error if candidate athlete does not exist', async () => {
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

      const res = await createAffiliationRequest(
        'acad-uuid-1',
        'non-existent-uuid',
        'requester-user-1'
      );

      expect(res.error).not.toBeNull();
      expect(res.error?.message).toContain('Athlete ID not found in system');
    });
  });
});
