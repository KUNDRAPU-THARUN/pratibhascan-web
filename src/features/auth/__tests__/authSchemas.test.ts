import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  athleteOnboardingSchema,
  academyOnboardingSchema,
  institutionOnboardingSchema,
} from '../authSchemas';

describe('Auth Validation Schemas (Zod)', () => {
  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'athlete@pratibhascan.in',
        password: 'ValidPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'ValidPassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('valid email');
      }
    });

    it('rejects short passwords (< 6 chars)', () => {
      const result = loginSchema.safeParse({
        email: 'coach@apex.in',
        password: '123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('accepts valid athlete registration with password complexity', () => {
      const result = registerSchema.safeParse({
        fullName: 'Arjun Athlete',
        email: 'arjun@kaaryan.in',
        role: 'athlete',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
        agreeToTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid academy and institution roles', () => {
      const acad = registerSchema.safeParse({
        fullName: 'Coach Ramesh',
        email: 'ramesh@apex.in',
        role: 'academy',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
        agreeToTerms: true,
      });
      expect(acad.success).toBe(true);

      const inst = registerSchema.safeParse({
        fullName: 'Director Sharma',
        email: 'sharma@board.gov.in',
        role: 'institution',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
        agreeToTerms: true,
      });
      expect(inst.success).toBe(true);
    });

    it('rejects invalid / unapproved roles', () => {
      const result = registerSchema.safeParse({
        fullName: 'Super Admin',
        email: 'admin@kaaryan.in',
        role: 'superadmin',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without numbers', () => {
      const result = registerSchema.safeParse({
        fullName: 'Pooja Athlete',
        email: 'pooja@test.in',
        role: 'athlete',
        password: 'OnlyLettersPassword',
        confirmPassword: 'OnlyLettersPassword',
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('at least one letter and one number');
      }
    });

    it('rejects password confirmation mismatch', () => {
      const result = registerSchema.safeParse({
        fullName: 'Pooja Athlete',
        email: 'pooja@test.in',
        role: 'athlete',
        password: 'SecurePass1',
        confirmPassword: 'DifferentPass2',
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Passwords do not match');
      }
    });

    it('requires agreeing to terms', () => {
      const result = registerSchema.safeParse({
        fullName: 'Pooja Athlete',
        email: 'pooja@test.in',
        role: 'athlete',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
        agreeToTerms: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema & resetPasswordSchema', () => {
    it('validates email for password recovery', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'test@in.com' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
    });

    it('validates reset password and confirmation', () => {
      expect(
        resetPasswordSchema.safeParse({
          password: 'NewStrongPass1',
          confirmPassword: 'NewStrongPass1',
        }).success
      ).toBe(true);

      expect(
        resetPasswordSchema.safeParse({
          password: 'NewStrongPass1',
          confirmPassword: 'MismatchPass2',
        }).success
      ).toBe(false);
    });
  });

  describe('Role Onboarding Schemas', () => {
    it('validates athlete physical biometric parameters', () => {
      const valid = athleteOnboardingSchema.safeParse({
        dateOfBirth: '2008-05-15',
        gender: 'male',
        primarySport: 'Athletics',
        heightCm: 175.5,
        weightKg: 65.0,
        wingspanCm: 180.0,
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        phoneNumber: '+919876543210',
      });
      expect(valid.success).toBe(true);

      const invalidHeight = athleteOnboardingSchema.safeParse({
        dateOfBirth: '2008-05-15',
        gender: 'female',
        primarySport: 'Badminton',
        heightCm: 45, // Unrealistic height
        weightKg: 50,
        state: 'Karnataka',
        district: 'Bengaluru',
      });
      expect(invalidHeight.success).toBe(false);
    });

    it('validates academy registration and sports disciplines', () => {
      const valid = academyOnboardingSchema.safeParse({
        name: 'Apex Sports Center',
        contactEmail: 'contact@apex.in',
        contactPhone: '9876543210',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        sportsOffered: ['Athletics', 'Badminton'],
      });
      expect(valid.success).toBe(true);

      const noSports = academyOnboardingSchema.safeParse({
        name: 'Apex Sports Center',
        contactEmail: 'contact@apex.in',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        sportsOffered: [],
      });
      expect(noSports.success).toBe(false);
    });

    it('validates institution type categories', () => {
      const valid = institutionOnboardingSchema.safeParse({
        name: 'Karnataka State Athletic Board',
        type: 'sports_board',
        contactEmail: 'board@karnataka.gov.in',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
      });
      expect(valid.success).toBe(true);

      const invalidType = institutionOnboardingSchema.safeParse({
        name: 'Unknown Org',
        type: 'commercial_sponsor', // Not an allowed institution type
        contactEmail: 'sponsor@org.in',
        state: 'Karnataka',
        district: 'Bengaluru',
      });
      expect(invalidType.success).toBe(false);
    });
  });
});
