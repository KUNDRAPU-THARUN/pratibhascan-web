/**
 * PratibhaScan Standardized Assessment Protocols & Results Types
 * Company: KAARYAN LABS
 */

export type AssessmentCategory =
  | 'anthropometric'
  | 'speed'
  | 'endurance'
  | 'power'
  | 'agility'
  | 'flexibility';

export interface AssessmentProtocol {
  code: string;
  name: string;
  category: AssessmentCategory;
  categoryLabel: string;
  unit: string;
  lowerIsBetter: boolean;
  equipmentRequired: string[];
  description: string;
  methodology: string;
  standardNormsReference: string;
  validRange?: {
    min: number;
    max: number;
  };
  maxAttempts?: number;
  bestResultRule?: string;
}

export interface AssessmentTrial {
  trialNumber: number;
  value: number;
  timestamp: string;
}

export interface AssessmentResultEntry {
  id: string;
  protocolCode: string;
  testName: string;
  category: AssessmentCategory;
  bestValue: number;
  unit: string;
  trials: number[];
  percentileBenchmark?: number;
  verificationStatus: 'pending' | 'verified' | 'requires_review';
  assessedAt: string;
}

export interface CreateAssessmentSessionInput {
  athleteId: string;
  protocolId: string;
  protocolCode: string;
  academyId?: string | null;
  institutionId?: string | null;
  assessmentDate: string;
  venue?: string;
  notes?: string;
  trial1?: number | null;
  trial2?: number | null;
  trial3?: number | null;
  bestScore?: number;
  verificationTier?: 'draft' | 'organization_recorded' | 'two_person_verified' | null;
}

export interface AssessmentSessionRecord {
  id: string;
  athleteId: string;
  athleteName: string;
  evaluatorId: string;
  evaluatorName: string;
  academyId: string | null;
  institutionId: string | null;
  organizationName: string;
  assessmentDate: string;
  venue: string | null;
  verified: boolean;
  verifiedBy: string | null;
  verificationTier?: 'draft' | 'organization_recorded' | 'two_person_verified' | null;
  secondaryReviewerId?: string | null;
  notes: string | null;
  createdAt: string;
  results: Array<{
    id: string;
    protocolId: string;
    protocolCode: string;
    protocolTitle: string;
    protocolCategory: string;
    unit: string;
    lowerIsBetter: boolean;
    trial1: number | null;
    trial2: number | null;
    trial3: number | null;
    bestScore: number;
    percentileRank: number | null;
    status: 'pending' | 'verified' | 'organization_recorded' | 'two_person_verified' | 'flagged';
  }>;
}

export type GuardianConsentPurpose = 'performance_tracking' | 'talent_scouting' | 'biometric_eval';
export type GuardianConsentStatus = 'active' | 'revoked' | 'expired';
export type GuardianVerificationMethod = 'phone_otp' | 'aadhaar_esign' | 'digilocker' | 'physical_affidavit';

export interface GuardianConsentRecord {
  id: string;
  athleteId: string;
  guardianId: string;
  guardianName: string;
  relationship: string;
  consentPurpose: GuardianConsentPurpose;
  status: GuardianConsentStatus;
  consentMethod: GuardianVerificationMethod;
  consentedAt: string;
  expiresAt: string;
  revokedAt?: string | null;
}
