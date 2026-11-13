import { z } from 'zod';

/**
 * Zod validation schema for updating Academy Profile.
 * Protected fields (owner_id, verified, id) are strictly excluded.
 */
export const academyProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Academy name must be at least 3 characters')
    .max(120, 'Academy name cannot exceed 120 characters'),
  registrationNumber: z
    .string()
    .trim()
    .max(50, 'Registration number cannot exceed 50 characters')
    .nullable()
    .optional(),
  contactEmail: z
    .string()
    .trim()
    .email('Please enter a valid official contact email address'),
  contactPhone: z
    .string()
    .trim()
    .regex(/^$|^[+]?[0-9\s-]{10,15}$/, 'Please enter a valid phone number')
    .nullable()
    .optional(),
  state: z.string().trim().min(2, 'Please select your state'),
  district: z.string().trim().min(2, 'Please enter your district'),
  address: z
    .string()
    .trim()
    .max(250, 'Address cannot exceed 250 characters')
    .nullable()
    .optional(),
  sportsOffered: z
    .array(z.string().trim().min(2))
    .min(1, 'Please select at least one sport program offered by your academy'),
});

export type AcademyProfileUpdateFormData = z.infer<typeof academyProfileUpdateSchema>;

/**
 * Zod validation schema for requesting an athlete affiliation.
 */
export const affiliationRequestSchema = z.object({
  athleteId: z
    .string()
    .trim()
    .uuid('Please enter a valid Athlete UUID (e.g. from candidate passport)'),
  notes: z
    .string()
    .trim()
    .max(250, 'Notes cannot exceed 250 characters')
    .optional(),
});

export type AffiliationRequestFormData = z.infer<typeof affiliationRequestSchema>;
