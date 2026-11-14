/**
 * PratibhaScan Standardized Assessment Calculations & Validation Engine
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Implements deterministic calculation, multi-trial scoring, and validation
 * modeled on standard physical testing procedures and SAI norms.
 *
 * Rule: Lower is better for sprint & agility (speed); higher is better for jump, reach, and endurance.
 * Never silently alter scoring rules.
 */

import type { AssessmentCategory } from '@/types/assessment.types';

export interface ProtocolSpecification {
  code: string;
  name: string;
  category: AssessmentCategory;
  categoryLabel: string;
  unit: string;
  lowerIsBetter: boolean;
  maxAttempts: number;
  validRange: {
    min: number;
    max: number;
  };
  selectionRuleDescription: string;
  equipmentRequired: string[];
  description: string;
  methodology: string;
  normsReference: string;
}

export const PROTOCOL_SPECIFICATIONS: Record<string, ProtocolSpecification> = {
  TEST_30M_SPRINT: {
    code: 'TEST_30M_SPRINT',
    name: '30-Meter Acceleration Sprint',
    category: 'speed',
    categoryLabel: 'Speed & Acceleration',
    unit: 'sec',
    lowerIsBetter: true,
    maxAttempts: 3,
    validRange: { min: 3.0, max: 12.0 },
    selectionRuleDescription: 'Lowest recorded time across validated trials is selected as the best score.',
    equipmentRequired: [
      'Electronic Timing Gates or Dual Synchronized Stopwatches',
      'Flat 40m Track',
      'Marker Cones',
    ],
    description: 'Evaluates linear sprint velocity and initial acceleration from a standing start position.',
    methodology:
      'Athlete begins in a stationary 2-point stance 50cm behind the initial timing beam. Time starts upon breaking the first beam and stops at 30m. Up to three validated attempts permitted.',
    normsReference: 'SAI National Sports Talent Contest Norms (Age 12-18)',
  },
  TEST_VERT_JUMP: {
    code: 'TEST_VERT_JUMP',
    name: 'Countermovement Vertical Jump',
    category: 'power',
    categoryLabel: 'Explosive Lower-Body Power',
    unit: 'cm',
    lowerIsBetter: false,
    maxAttempts: 3,
    validRange: { min: 10.0, max: 120.0 },
    selectionRuleDescription: 'Highest recorded leap displacement across validated trials is selected as the best score.',
    equipmentRequired: [
      'Digital Jump Mat or Vertec Jump Measuring Device',
      'Measuring Tape',
    ],
    description:
      'Measures vertical leap displacement reflecting maximum fast-twitch muscular power in the lower extremities.',
    methodology:
      'Athlete performs a rapid countermovement dip followed by maximal vertical explosion with reach. Highest jump across up to 3 validated trials recorded.',
    normsReference: 'Sports Authority of India Biomechanical Benchmarks',
  },
  TEST_BEEP_RUN: {
    code: 'TEST_BEEP_RUN',
    name: '20m Multi-Stage Shuttle Run (Beep Test)',
    category: 'endurance',
    categoryLabel: 'Cardiovascular Endurance',
    unit: 'shuttles',
    lowerIsBetter: false,
    maxAttempts: 1,
    validRange: { min: 1, max: 200 },
    selectionRuleDescription: 'Total completed 20-meter shuttles before exhaustion is recorded.',
    equipmentRequired: [
      'Calibrated Audio Playback System',
      '20m Measured Non-Slip Surface',
      'Cones',
    ],
    description:
      'Continuous incremental shuttle run estimating maximum aerobic capacity and cardiovascular stamina.',
    methodology:
      'Athlete shuttles between markers 20m apart pacing with progressive audio cues. Test concludes when athlete fails to reach line on two consecutive beeps.',
    normsReference: 'Léger & Lambert Standard Aerobic Protocol',
  },
  TEST_SIT_REACH: {
    code: 'TEST_SIT_REACH',
    name: 'Standardized Sit and Reach Test',
    category: 'flexibility',
    categoryLabel: 'Hamstring & Lower Back Mobility',
    unit: 'cm',
    lowerIsBetter: false,
    maxAttempts: 3,
    validRange: { min: 0.0, max: 60.0 },
    selectionRuleDescription: 'Maximum forward reach displacement held for 2 seconds across validated trials is selected.',
    equipmentRequired: ['Standard Sit & Reach Testing Box with Centimeter Scale'],
    description:
      'Quantifies flexibility of the posterior chain, lower back, and hamstring muscle groups.',
    methodology:
      'Athlete sits with knees locked flat against the test box face, reaches forward slowly with stacked palms, and holds maximal reach point for 2 seconds. Best of 3 trials.',
    normsReference: 'Wells and Dillon Standard Flexibility Scale',
  },
  TEST_ILLINOIS: {
    code: 'TEST_ILLINOIS',
    name: 'Illinois Agility Run',
    category: 'agility',
    categoryLabel: 'Agility & Directional Control',
    unit: 'sec',
    lowerIsBetter: true,
    maxAttempts: 3,
    validRange: { min: 12.0, max: 35.0 },
    selectionRuleDescription: 'Lowest completion time across validated trials is selected as the best score.',
    equipmentRequired: [
      '8 Marker Cones',
      'Stopwatch or Timing Gates',
      '10m x 5m Flat Course',
    ],
    description:
      'Measures ability to change direction rapidly while accelerating, decelerating, and weaving around markers.',
    methodology:
      'Athlete starts lying prone, sprints straight, weaves forward and back through 4 central cones, and finishes with a straight sprint.',
    normsReference: 'Getchell Agility Assessment Norms',
  },
  TEST_ANTHRO: {
    code: 'TEST_ANTHRO',
    name: 'Anthropometric Baseline & Ape Index',
    category: 'anthropometric',
    categoryLabel: 'Physical & Structural Baseline',
    unit: 'cm',
    lowerIsBetter: false,
    maxAttempts: 1,
    validRange: { min: 100.0, max: 240.0 },
    selectionRuleDescription: 'Standing height and wingspan recorded for anatomical ratio baseline.',
    equipmentRequired: [
      'Stadiometer',
      'Calibrated Digital Scale',
      'Wingspan Wall Grid',
    ],
    description:
      'Measures standing height, body mass, and fingertip-to-fingertip wingspan to compute the Ape Index.',
    methodology:
      'Barefoot standing height and arm span stretched horizontally against calibrated grid to calculate structural reach ratio.',
    normsReference: 'ISAK (International Society for the Advancement of Kinanthropometry)',
  },
};

/**
 * Validates a single trial measurement against the protocol's allowable biological/technical range.
 */
export function validateMeasurement(
  protocolCode: string,
  value: number | null | undefined
): { isValid: boolean; error?: string } {
  if (value === null || value === undefined) {
    return { isValid: true };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return { isValid: false, error: 'Measurement must be a valid number' };
  }

  // Negative checks (database schema enforces >= 0 for all trial scores)
  if (value < 0) {
    return { isValid: false, error: 'Measurement score cannot be negative' };
  }

  const spec = PROTOCOL_SPECIFICATIONS[protocolCode];
  if (!spec) {
    // If unknown protocol, ensure non-negative
    return { isValid: true };
  }

  if (value < spec.validRange.min) {
    return {
      isValid: false,
      error: `Score (${value} ${spec.unit}) is below the realistic minimum of ${spec.validRange.min} ${spec.unit}`,
    };
  }

  if (value > spec.validRange.max) {
    return {
      isValid: false,
      error: `Score (${value} ${spec.unit}) exceeds the maximum allowable limit of ${spec.validRange.max} ${spec.unit}`,
    };
  }

  return { isValid: true };
}

/**
 * Calculates the best score from up to 3 trials based on the protocol's directional rule:
 * - Speed / Agility: Lower is better -> min(valid trials)
 * - Power / Endurance / Flexibility: Higher is better -> max(valid trials)
 */
export function calculateBestScore(
  protocolCode: string,
  trials: Array<number | null | undefined>
): {
  bestScore: number | null;
  validCount: number;
  error?: string;
} {
  const spec = PROTOCOL_SPECIFICATIONS[protocolCode];
  const lowerIsBetter = spec ? spec.lowerIsBetter : false;

  const validScores: number[] = [];

  for (let i = 0; i < trials.length; i++) {
    const val = trials[i];
    if (val !== null && val !== undefined && !isNaN(val)) {
      const validation = validateMeasurement(protocolCode, val);
      if (!validation.isValid) {
        return {
          bestScore: null,
          validCount: validScores.length,
          error: `Trial ${i + 1}: ${validation.error}`,
        };
      }
      validScores.push(val);
    }
  }

  if (validScores.length === 0) {
    return { bestScore: null, validCount: 0 };
  }

  const best = lowerIsBetter ? Math.min(...validScores) : Math.max(...validScores);

  // Round to 2 decimal places to match PostgreSQL NUMERIC(8, 2)
  const rounded = Math.round(best * 100) / 100;

  return {
    bestScore: rounded,
    validCount: validScores.length,
  };
}

/**
 * Scientific Validity Notice:
 * National athletic percentile rankings require empirical, age- and gender-stratified
 * reference datasets with published cohort sample sizes, standard deviations, and peer-reviewed
 * testing methodologies. In accordance with Phase 3D.5 scientific accuracy guidelines,
 * heuristic linear approximations are disabled to prevent presenting unvalidated predictions as
 * authenticated sports measurements.
 *
 * Raw physiological metrics (seconds, cm, shuttles) are preserved with 100% precision.
 * This function returns null until an authoritative national normative dataset is integrated.
 */
export function estimatePercentileRank(
  _protocolCode: string,
  _bestScore: number,
  _age?: number,
  _gender?: string
): number | null {
  // Disabled until peer-reviewed and officially published national normative datasets are integrated
  return null;
}
