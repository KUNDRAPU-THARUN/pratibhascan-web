import { z } from 'zod';

/**
 * Validation schema for updating athlete profile fields.
 * Only permitted personal and biometric fields can be modified.
 * System fields (role, suspension, id, evaluator accreditation) are strictly prohibited.
 */
export const athleteProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^$|^[+]?[0-9\s-]{10,15}$/, 'Please enter a valid phone number')
    .nullable()
    .optional(),
  state: z.string().trim().min(2, 'Please select your state'),
  district: z.string().trim().min(2, 'Please enter your district'),
  primarySport: z.string().trim().min(2, 'Please specify your primary sport'),
  secondarySport: z.string().trim().nullable().optional(),
  heightCm: z
    .number()
    .min(50, 'Height must be at least 50 cm')
    .max(260, 'Height cannot exceed 260 cm'),
  weightKg: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(300, 'Weight cannot exceed 300 kg'),
  wingspanCm: z
    .number()
    .min(50, 'Wingspan must be at least 50 cm')
    .max(280, 'Wingspan cannot exceed 280 cm')
    .nullable()
    .optional(),
});

export type AthleteProfileUpdateFormData = z.infer<typeof athleteProfileUpdateSchema>;
