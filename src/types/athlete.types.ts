/**
 * PratibhaScan Athlete & Ecosystem Entity Types
 * Company: KAARYAN LABS
 */

export interface AthleteProfile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  primarySport: string;
  secondarySport?: string;
  heightCm: number;
  weightKg: number;
  wingspanCm?: number;
  academyName?: string;
  institutionName?: string;
  state: string;
  district: string;
  compositeScore?: number;
  verifiedBadges?: string[];
}

export interface AcademyEntity {
  id: string;
  name: string;
  registrationNumber?: string;
  sportsOffered: string[];
  state: string;
  district: string;
  contactEmail: string;
  athleteCount: number;
}

export interface InstitutionEntity {
  id: string;
  name: string;
  type: 'school' | 'college' | 'university' | 'sports_board' | 'federation';
  state: string;
  district: string;
  scoutedCount: number;
  assessmentCount: number;
}
