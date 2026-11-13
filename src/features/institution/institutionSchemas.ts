import { z } from 'zod';

export const INSTITUTION_TYPES = [
  'school',
  'college',
  'university',
  'sports_board',
  'federation',
] as const;

export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  school: 'School / K-12 Academy',
  college: 'Undergraduate College',
  university: 'University',
  sports_board: 'District / State Sports Board',
  federation: 'Sports Federation',
};

/**
 * Zod validation schema for updating Institution Profile.
 * Protected fields (owner_id, verified, id) are strictly excluded.
 */
export const institutionProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Institution name must be at least 3 characters')
    .max(150, 'Institution name cannot exceed 150 characters'),
  type: z.enum(INSTITUTION_TYPES, {
    message: 'Please select a valid institution classification',
  }),
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
});

export type InstitutionProfileUpdateFormData = z.infer<typeof institutionProfileUpdateSchema>;

/**
 * Zod validation schema for student affiliation invitation/request.
 */
export const studentAffiliationRequestSchema = z.object({
  athleteId: z
    .string()
    .trim()
    .uuid('Please enter a valid Student-Athlete UUID (e.g. from student passport)'),
  academicYear: z
    .string()
    .trim()
    .max(50, 'Academic year cannot exceed 50 characters')
    .optional(),
  gradeOrDepartment: z
    .string()
    .trim()
    .max(100, 'Grade or Department cannot exceed 100 characters')
    .optional(),
  notes: z
    .string()
    .trim()
    .max(250, 'Notes cannot exceed 250 characters')
    .optional(),
});

export type StudentAffiliationRequestFormData = z.infer<typeof studentAffiliationRequestSchema>;
