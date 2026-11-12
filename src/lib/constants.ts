export const APP_CONFIG = {
  name: 'PratibhaScan',
  tagline: 'Standardized Sports Talent Identification & Assessment Platform',
  version: '0.1.0',
};

export const SPORTS_LIST = [
  'Athletics (Track & Field)',
  'Badminton',
  'Basketball',
  'Boxing',
  'Cricket',
  'Football',
  'Hockey',
  'Kabaddi',
  'Kho Kho',
  'Shooting',
  'Swimming',
  'Table Tennis',
  'Volleyball',
  'Weightlifting',
  'Wrestling',
] as const;

export const ASSESSMENT_CATEGORIES = [
  { id: 'anthropometric', label: 'Anthropometric & Physical', icon: 'Ruler' },
  { id: 'speed', label: 'Speed & Acceleration', icon: 'Zap' },
  { id: 'endurance', label: 'Cardiovascular Endurance', icon: 'HeartPulse' },
  { id: 'power', label: 'Explosive Power', icon: 'Flame' },
  { id: 'agility', label: 'Agility & Coordination', icon: 'Repeat' },
  { id: 'flexibility', label: 'Flexibility & Mobility', icon: 'StretchHorizontal' },
] as const;

export const STANDARD_TESTS = [
  {
    code: 'TEST_30M_SPRINT',
    name: '30-Meter Flying Sprint',
    category: 'speed',
    unit: 'sec',
    lowerIsBetter: true,
    description: 'Measures maximal sprint speed and explosive acceleration from a standing start.',
  },
  {
    code: 'TEST_VERT_JUMP',
    name: 'Vertical Jump (Countermovement)',
    category: 'power',
    unit: 'cm',
    lowerIsBetter: false,
    description: 'Measures lower-body explosive power and vertical leap capability.',
  },
  {
    code: 'TEST_BEEP_TEST',
    name: '20m Multi-Stage Shuttle Run (Beep Test)',
    category: 'endurance',
    unit: 'level/shuttles',
    lowerIsBetter: false,
    description: 'Estimates maximal aerobic capacity (VO2 max) and cardiovascular stamina.',
  },
  {
    code: 'TEST_SIT_REACH',
    name: 'Sit and Reach Test',
    category: 'flexibility',
    unit: 'cm',
    lowerIsBetter: false,
    description: 'Evaluates hamstring and lower back flexibility.',
  },
  {
    code: 'TEST_ILLINOIS',
    name: 'Illinois Agility Run',
    category: 'agility',
    unit: 'sec',
    lowerIsBetter: true,
    description: 'Assesses directional change ability, acceleration, and body control.',
  },
  {
    code: 'TEST_HEIGHT_WEIGHT',
    name: 'Height, Weight & Wingspan',
    category: 'anthropometric',
    unit: 'cm / kg',
    lowerIsBetter: false,
    description: 'Physical baseline measurements and ape index calculation.',
  },
] as const;
