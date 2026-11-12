export type AssessmentCategory =
  | 'anthropometric'
  | 'speed'
  | 'endurance'
  | 'power'
  | 'agility'
  | 'flexibility';

export interface AssessmentProtocol {
  id: string;
  code: string;
  title: string;
  category: AssessmentCategory;
  unit: string;
  lowerIsBetter: boolean;
  benchmarkNorms: {
    elite: number;
    good: number;
    average: number;
  };
}

export interface AssessmentResult {
  id: string;
  protocolCode: string;
  testName: string;
  category: AssessmentCategory;
  trial1?: number;
  trial2?: number;
  trial3?: number;
  bestScore: number;
  unit: string;
  percentileRank: number;
  status: 'pending' | 'verified' | 'flagged';
}

export interface AssessmentSession {
  id: string;
  athleteId: string;
  athleteName: string;
  evaluatorId: string;
  evaluatorName: string;
  assessmentDate: string;
  venue: string;
  results: AssessmentResult[];
  compositeScore: number;
  verified: boolean;
  notes?: string;
}
