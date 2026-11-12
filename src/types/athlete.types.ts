export interface AthleteProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  primarySport: string;
  secondarySport?: string;
  heightCm: number;
  weightKg: number;
  wingspanCm?: number;
  academyId?: string;
  academyName?: string;
  schoolOrCollege?: string;
  state: string;
  district: string;
  talentScore: number; // 0-100 overall composite score
  badges: string[];
}

export interface Academy {
  id: string;
  name: string;
  registrationNumber: string;
  sportsOffered: string[];
  state: string;
  district: string;
  contactEmail: string;
  contactPhone: string;
  athleteCount: number;
  coachCount: number;
}

export interface Institution {
  id: string;
  name: string;
  type: 'school' | 'college' | 'university' | 'sports_board' | 'federation';
  state: string;
  district: string;
  talentsScouted: number;
  assessmentsConducted: number;
}
