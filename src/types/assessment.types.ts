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
