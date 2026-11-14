-- ==============================================================================
-- PRATIBHASCAN DATABASE MIGRATION: SEED STANDARD ASSESSMENT PROTOCOLS
-- COMPANY: KAARYAN LABS
-- PRODUCT: PratibhaScan (AI-Powered Sports Talent Assessment & Development Platform)
-- MIGRATION: 20261113000000_seed_assessment_protocols.sql
-- PURPOSE: Seeds standard physical assessment battery protocols modeled on SAI guidelines
--          and enables public read access for preview demonstration.
-- ==============================================================================

-- 1. Insert Standard Assessment Protocols
INSERT INTO public.assessment_protocols (
  code,
  title,
  category,
  unit,
  lower_is_better,
  description,
  methodology,
  equipment_required
)
VALUES
  (
    'TEST_30M_SPRINT',
    '30-Meter Acceleration Sprint',
    'speed',
    'sec',
    TRUE,
    'Evaluates linear sprint velocity and initial acceleration from a standing start position.',
    'Athlete begins in a stationary 2-point stance 50cm behind the initial timing beam. Time starts upon breaking first beam and stops at 30m. Best of three recorded attempts.',
    ARRAY['Electronic Timing Gates or Dual Synchronized Stopwatches', 'Flat 40m Track', 'Marker Cones']
  ),
  (
    'TEST_VERT_JUMP',
    'Countermovement Vertical Jump',
    'power',
    'cm',
    FALSE,
    'Measures vertical leap displacement reflecting maximum fast-twitch muscular power in the lower extremities.',
    'Athlete performs a rapid countermovement dip followed by maximal vertical explosion with reach. Highest jump across 3 validated trials recorded.',
    ARRAY['Digital Jump Mat or Vertec Jump Measuring Device', 'Measuring Tape']
  ),
  (
    'TEST_BEEP_RUN',
    '20m Multi-Stage Shuttle Run (Beep Test)',
    'endurance',
    'shuttles',
    FALSE,
    'Continuous incremental shuttle run estimating maximum aerobic capacity and cardiovascular stamina.',
    'Athlete shuttles between markers 20m apart pacing with progressive audio cues. Test concludes when athlete fails to reach line on two consecutive beeps.',
    ARRAY['Calibrated Audio Playback System', '20m Measured Non-Slip Surface', 'Cones']
  ),
  (
    'TEST_SIT_REACH',
    'Standardized Sit and Reach Test',
    'flexibility',
    'cm',
    FALSE,
    'Quantifies flexibility of the posterior chain, lower back, and hamstring muscle groups.',
    'Athlete sits with knees locked flat against the test box face, reaches forward slowly with stacked palms, and holds maximal reach point for 2 seconds.',
    ARRAY['Standard Sit & Reach Testing Box with Centimeter Scale']
  ),
  (
    'TEST_ILLINOIS',
    'Illinois Agility Run',
    'agility',
    'sec',
    TRUE,
    'Measures ability to change direction rapidly while accelerating, decelerating, and weaving around markers.',
    'Athlete starts lying prone, sprints straight, weaves forward and back through 4 central cones, and finishes with a straight sprint.',
    ARRAY['8 Marker Cones', 'Stopwatch or Timing Gates', '10m x 5m Flat Course']
  ),
  (
    'TEST_ANTHRO',
    'Anthropometric Baseline & Ape Index',
    'anthropometric',
    'cm',
    FALSE,
    'Measures standing height, body mass, and fingertip-to-fingertip wingspan to compute the Ape Index.',
    'Barefoot standing height and arm span stretched horizontally against calibrated grid to calculate structural reach ratio.',
    ARRAY['Stadiometer', 'Calibrated Digital Scale', 'Wingspan Wall Grid']
  )
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  unit = EXCLUDED.unit,
  lower_is_better = EXCLUDED.lower_is_better,
  description = EXCLUDED.description,
  methodology = EXCLUDED.methodology,
  equipment_required = EXCLUDED.equipment_required;

-- 2. Allow anonymous read access for public demonstration preview (/preview)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'assessment_protocols' AND policyname = 'protocols_select_anon'
  ) THEN
    CREATE POLICY "protocols_select_anon"
      ON public.assessment_protocols FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
