import { z } from 'zod';

// Password complexity: min 8 characters, at least 1 letter and 1 number
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    role: z.enum(['athlete', 'academy', 'institution']),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one letter and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms of Service and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one letter and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Role Onboarding Schemas

export const athleteOnboardingSchema = z.object({
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  gender: z.enum(['male', 'female', 'other']),
  primarySport: z
    .string()
    .trim()
    .min(2, 'Primary sport is required'),
  secondarySport: z.string().trim().optional(),
  heightCm: z
    .number()
    .min(80, 'Height must be at least 80 cm')
    .max(250, 'Height must not exceed 250 cm'),
  weightKg: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(200, 'Weight must not exceed 200 kg'),
  wingspanCm: z
    .number()
    .min(80, 'Wingspan must be at least 80 cm')
    .max(260, 'Wingspan must not exceed 260 cm')
    .optional()
    .nullable(),
  state: z.string().trim().min(2, 'State is required'),
  district: z.string().trim().min(2, 'District is required'),
  phoneNumber: z.string().trim().optional().nullable(),
});

export type AthleteOnboardingFormData = z.infer<typeof athleteOnboardingSchema>;

export const academyOnboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Academy name must be at least 3 characters')
    .max(150, 'Academy name must not exceed 150 characters'),
  registrationNumber: z.string().trim().optional().nullable(),
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Contact email is required')
    .email('Please enter a valid email address'),
  contactPhone: z
    .string()
    .trim()
    .min(8, 'Contact phone must be at least 8 digits')
    .max(20, 'Contact phone must not exceed 20 digits')
    .optional()
    .nullable(),
  state: z.string().trim().min(2, 'State is required'),
  district: z.string().trim().min(2, 'District is required'),
  address: z.string().trim().optional().nullable(),
  sportsOffered: z
    .array(z.string())
    .min(1, 'Please select at least one sport offered'),
});

export type AcademyOnboardingFormData = z.infer<typeof academyOnboardingSchema>;

export const institutionOnboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Institution name must be at least 3 characters')
    .max(150, 'Institution name must not exceed 150 characters'),
  type: z.enum([
    'school',
    'college',
    'university',
    'sports_board',
    'federation',
  ]),
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Contact email is required')
    .email('Please enter a valid email address'),
  contactPhone: z.string().trim().optional().nullable(),
  state: z.string().trim().min(2, 'State is required'),
  district: z.string().trim().min(2, 'District is required'),
  address: z.string().trim().optional().nullable(),
});

export type InstitutionOnboardingFormData = z.infer<
  typeof institutionOnboardingSchema
>;
