import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateAge,
  calculateApeIndex,
  calculateBMI,
  updateAthleteProfile,
} from '../athleteService';
import { athleteProfileUpdateSchema } from '../athleteSchemas';

// Mock Supabase
const mockFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe('Athlete Data Calculations & Unit Tests', () => {
  describe('calculateAge', () => {
    it('calculates chronological age correctly based on today', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 16;
      // Exactly 16 years ago
      const dobString = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(calculateAge(dobString)).toBe(16);
    });

    it('returns 0 for empty or invalid date', () => {
      expect(calculateAge('')).toBe(0);
    });

    it('identifies minors correctly', () => {
      const today = new Date();
      const minorDob = `${today.getFullYear() - 15}-01-01`;
      const adultDob = `${today.getFullYear() - 22}-01-01`;

      expect(calculateAge(minorDob) < 18).toBe(true);
      expect(calculateAge(adultDob) < 18).toBe(false);
    });
  });

  describe('calculateApeIndex', () => {
    it('calculates positive Ape Index when wingspan exceeds height', () => {
      expect(calculateApeIndex(185, 180)).toBe(5.0);
    });

    it('calculates negative Ape Index when wingspan is less than height', () => {
      expect(calculateApeIndex(175, 180)).toBe(-5.0);
    });

    it('returns null when wingspan is missing or null', () => {
      expect(calculateApeIndex(null, 180)).toBeNull();
    });

    it('returns null when height is zero or invalid', () => {
      expect(calculateApeIndex(180, 0)).toBeNull();
    });
  });

  describe('calculateBMI', () => {
    it('calculates Body Mass Index accurately', () => {
      // 70 kg, 175 cm (1.75m) -> 70 / (1.75 * 1.75) = 22.86 -> 22.9
      expect(calculateBMI(70, 175)).toBe(22.9);
    });

    it('returns 0 for invalid dimensions', () => {
      expect(calculateBMI(0, 175)).toBe(0);
      expect(calculateBMI(70, 0)).toBe(0);
    });
  });

  describe('athleteProfileUpdateSchema', () => {
    it('validates a completely valid update payload', () => {
      const validPayload = {
        fullName: 'Vikramaditya Rathore',
        phoneNumber: '+919876543210',
        state: 'Rajasthan',
        district: 'Jaipur',
        primarySport: 'Athletics',
        secondarySport: 'Long Jump',
        heightCm: 182.5,
        weightKg: 74,
        wingspanCm: 188,
      };

      const result = athleteProfileUpdateSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects short full name', () => {
      const invalid = {
        fullName: 'A',
        state: 'Karnataka',
        district: 'Bengaluru',
        primarySport: 'Boxing',
        heightCm: 170,
        weightKg: 65,
      };

      const result = athleteProfileUpdateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('rejects out of range height (< 50 or > 260 cm)', () => {
      const invalidLow = {
        fullName: 'Test Athlete',
        state: 'Delhi',
        district: 'New Delhi',
        primarySport: 'Swimming',
        heightCm: 30, // Too low
        weightKg: 65,
      };

      const resultLow = athleteProfileUpdateSchema.safeParse(invalidLow);
      expect(resultLow.success).toBe(false);

      const invalidHigh = {
        ...invalidLow,
        heightCm: 320, // Too high
      };
      const resultHigh = athleteProfileUpdateSchema.safeParse(invalidHigh);
      expect(resultHigh.success).toBe(false);
    });

    it('rejects out of range weight (< 20 or > 300 kg)', () => {
      const invalidWeight = {
        fullName: 'Test Athlete',
        state: 'Delhi',
        district: 'New Delhi',
        primarySport: 'Wrestling',
        heightCm: 175,
        weightKg: 10, // Too low
      };

      const result = athleteProfileUpdateSchema.safeParse(invalidWeight);
      expect(result.success).toBe(false);
    });

    it('allows optional wingspan to be null', () => {
      const payloadWithNullWingspan = {
        fullName: 'Test Athlete',
        phoneNumber: null,
        state: 'Kerala',
        district: 'Kochi',
        primarySport: 'Badminton',
        heightCm: 176,
        weightKg: 66,
        wingspanCm: null,
      };

      const result = athleteProfileUpdateSchema.safeParse(payloadWithNullWingspan);
      expect(result.success).toBe(true);
    });
  });

  describe('updateAthleteProfile Service Method', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('updates permitted profile and athlete fields and disallows system fields', async () => {
      const mockProfileUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockAthleteUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') return { update: mockProfileUpdate };
        if (table === 'athletes') return { update: mockAthleteUpdate };
        return {};
      });

      const updateData = {
        fullName: 'Updated Name',
        phoneNumber: '+919988776655',
        state: 'Maharashtra',
        district: 'Pune',
        primarySport: 'Shooting',
        secondarySport: '10m Air Rifle',
        heightCm: 179,
        weightKg: 70,
        wingspanCm: 182,
      };

      const { error } = await updateAthleteProfile('athlete-uuid-1', updateData);
      expect(error).toBeNull();

      // Verify user_profiles update call payload
      expect(mockProfileUpdate).toHaveBeenCalledWith({
        full_name: 'Updated Name',
        phone_number: '+919988776655',
        state: 'Maharashtra',
        district: 'Pune',
      });

      // Verify athletes update call payload
      expect(mockAthleteUpdate).toHaveBeenCalledWith({
        primary_sport: 'Shooting',
        secondary_sport: '10m Air Rifle',
        height_cm: 179,
        weight_kg: 70,
        wingspan_cm: 182,
      });

      // Verify role and is_suspended were NEVER included in updates
      const profileArgs = mockProfileUpdate.mock.calls[0][0];
      expect(profileArgs).not.toHaveProperty('role');
      expect(profileArgs).not.toHaveProperty('is_suspended');
      expect(profileArgs).not.toHaveProperty('id');
    });

    it('returns error when database update fails', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Database connection error' } }),
        }),
      });

      const { error } = await updateAthleteProfile('athlete-uuid-1', {
        fullName: 'Test User',
        phoneNumber: null,
        state: 'Punjab',
        district: 'Ludhiana',
        primarySport: 'Hockey',
        heightCm: 175,
        weightKg: 68,
        wingspanCm: null,
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('Database connection error');
    });
  });
});
