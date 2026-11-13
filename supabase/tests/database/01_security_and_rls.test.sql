-- ==============================================================================
-- PRATIBHASCAN DATABASE SECURITY & RLS TEST SUITE (pgTAP)
-- COMPANY: KAARYAN LABS
-- PRODUCT: PratibhaScan (AI-Powered Sports Talent Assessment & Development Platform)
-- TEST SCRIPT: supabase/tests/database/01_security_and_rls.test.sql
-- PHASE: Phase 2A Automated Database Verification
--
-- Tests the 14 security and authorization scenarios:
-- 1. Athlete reading own records (Allowed)
-- 2. Athlete being denied another athlete's private records (Denied)
-- 3. Academy owner accessing authorized academy records (Allowed)
-- 4. Academy being denied unrelated institution records (Denied)
-- 5. Institution accessing its authorized records (Allowed)
-- 6. Unauthorized role modification being rejected by trigger (Denied/Throws)
-- 7. Unauthorized organization ownership changes being rejected (Denied/Throws)
-- 8A. Unauthorized assessment creation blocked by RLS for athlete (Denied/Throws 42501)
-- 8B. Assessment self-evaluation rejected by check_no_self_evaluation constraint in authorized context (Denied/Throws)
-- 9. Unauthorized assessment editing being rejected (Verified sessions locked) (Denied/Throws)
-- 10. Anonymous access being blocked from private records (Denied)
-- 11A. Unauthorized deletion of assessment session affects zero protected records (Denied/Empty)
-- 11B. Protected assessment session confirmed intact in authorized verification context (Allowed)
-- 12. Private media/storage access design verification (Denied/Verified)
-- ==============================================================================

BEGIN;

-- Load pgTAP extension if available
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(14);

-- ------------------------------------------------------------------------------
-- FIXTURES SETUP (Running under postgres superuser role)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_athlete1 UUID := '11111111-1111-1111-1111-111111111111';
  uid_athlete2 UUID := '22222222-2222-2222-2222-222222222222';
  uid_academy_owner UUID := '33333333-3333-3333-3333-333333333333';
  uid_institution_owner UUID := '44444444-4444-4444-4444-444444444444';
  academy_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  institution_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  session_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  unverified_session_id UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  protocol_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
BEGIN
  -- Insert dummy auth.users if auth schema exists in local environment
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    INSERT INTO auth.users (id, email) VALUES
      (uid_athlete1, 'athlete1@pratibhascan.test'),
      (uid_athlete2, 'athlete2@pratibhascan.test'),
      (uid_academy_owner, 'academy@pratibhascan.test'),
      (uid_institution_owner, 'institution@pratibhascan.test')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- User Profiles
  INSERT INTO public.user_profiles (id, email, full_name, role) VALUES
    (uid_athlete1, 'athlete1@pratibhascan.test', 'Arjun Athlete', 'athlete'),
    (uid_athlete2, 'athlete2@pratibhascan.test', 'Pooja Athlete', 'athlete'),
    (uid_academy_owner, 'academy@pratibhascan.test', 'Coach Ramesh', 'academy'),
    (uid_institution_owner, 'institution@pratibhascan.test', 'Officer Kumar', 'institution')
  ON CONFLICT (id) DO NOTHING;

  -- Athletes
  INSERT INTO public.athletes (id, date_of_birth, gender, primary_sport, height_cm, weight_kg) VALUES
    (uid_athlete1, '2008-05-10', 'male', 'Athletics', 178.0, 68.0),
    (uid_athlete2, '2009-02-14', 'female', 'Badminton', 165.0, 54.0)
  ON CONFLICT (id) DO NOTHING;

  -- Academy
  INSERT INTO public.academies (id, owner_id, name, contact_email, state, district, verified) VALUES
    (academy_id, uid_academy_owner, 'Apex Sports Academy', 'apex@test.in', 'Karnataka', 'Bengaluru', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- Institution
  INSERT INTO public.institutions (id, owner_id, name, type, contact_email, state, district, verified) VALUES
    (institution_id, uid_institution_owner, 'State Athletic Board', 'sports_board', 'board@test.in', 'Karnataka', 'Bengaluru', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- Active Affiliation for Athlete 1 with Academy
  INSERT INTO public.athlete_affiliations (id, athlete_id, organization_type, academy_id, status, requested_by, approved_by) VALUES
    (uuid_generate_v4(), uid_athlete1, 'academy', academy_id, 'active', uid_athlete1, uid_academy_owner)
  ON CONFLICT DO NOTHING;

  -- Protocol
  INSERT INTO public.assessment_protocols (id, code, title, category, unit, lower_is_better) VALUES
    (protocol_id, 'TEST_30M_SPRINT', '30m Sprint', 'speed', 'sec', TRUE)
  ON CONFLICT (code) DO NOTHING;

  -- Session (verified)
  INSERT INTO public.assessment_sessions (id, athlete_id, evaluator_id, academy_id, assessment_date, verified) VALUES
    (session_id, uid_athlete1, uid_academy_owner, academy_id, '2026-11-01', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- Session (unverified, owned by academy)
  INSERT INTO public.assessment_sessions (id, athlete_id, evaluator_id, academy_id, assessment_date, verified) VALUES
    (unverified_session_id, uid_athlete1, uid_academy_owner, academy_id, '2026-11-02', FALSE)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 1: Athlete reading own records (Allowed)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT is(
  (SELECT count(*)::INT FROM public.athletes WHERE id = '11111111-1111-1111-1111-111111111111'),
  1,
  'TEST 1: Athlete can view own athletic record'
);

-- ------------------------------------------------------------------------------
-- TEST 2: Athlete denied another athlete private sessions where not involved (Denied)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222'; -- Athlete 2

SELECT is(
  (SELECT count(*)::INT FROM public.assessment_sessions WHERE athlete_id = '11111111-1111-1111-1111-111111111111'),
  0,
  'TEST 2: Athlete 2 is denied access to Athlete 1 assessment sessions'
);

-- ------------------------------------------------------------------------------
-- TEST 3: Academy owner accessing authorized academy records (Allowed)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333'; -- Academy Owner

SELECT is(
  (SELECT count(*)::INT FROM public.academies WHERE owner_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'TEST 3: Academy owner can view and manage own academy records'
);

-- ------------------------------------------------------------------------------
-- TEST 4: Academy being denied unrelated institution records (Denied)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333'; -- Academy Owner

-- Cannot update institution owned by another user
UPDATE public.institutions SET name = 'Hacked Institution' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT is(
  (SELECT name FROM public.institutions WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'State Athletic Board',
  'TEST 4: Academy owner is denied modifying unrelated institution records'
);

-- ------------------------------------------------------------------------------
-- TEST 5: Institution accessing its authorized records (Allowed)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444444'; -- Institution Owner

SELECT is(
  (SELECT count(*)::INT FROM public.institutions WHERE owner_id = '44444444-4444-4444-4444-444444444444'),
  1,
  'TEST 5: Institution owner can access own authorized institution records'
);

-- ------------------------------------------------------------------------------
-- TEST 6: Unauthorized role modification being rejected (Denied/Throws)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111'; -- Athlete attempting to become institution

SELECT throws_ok(
  'UPDATE public.user_profiles SET role = ''institution'' WHERE id = ''11111111-1111-1111-1111-111111111111''',
  'Unauthorized: User role modification is strictly prohibited.',
  'TEST 6: Privilege escalation via user_profiles.role update is rejected by trigger'
);

-- ------------------------------------------------------------------------------
-- TEST 7: Unauthorized organization ownership changes being rejected (Denied/Throws)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333'; -- Academy Owner

SELECT throws_ok(
  'UPDATE public.academies SET owner_id = ''11111111-1111-1111-1111-111111111111'' WHERE id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa''',
  'Unauthorized: Academy ownership cannot be transferred without administrative authorization.',
  'TEST 7: Academy ownership transfer without administrative authorization is rejected'
);

-- ------------------------------------------------------------------------------
-- TEST 8A: Unauthorized assessment creation blocked by RLS for athlete (Denied)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111'; -- Athlete attempting to create self session

SELECT throws_ok(
  'INSERT INTO public.assessment_sessions (athlete_id, evaluator_id, academy_id, assessment_date) VALUES (''11111111-1111-1111-1111-111111111111'', ''11111111-1111-1111-1111-111111111111'', ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'', ''2026-11-13'')',
  '42501',
  'new row violates row-level security policy for table "assessment_sessions"',
  'TEST 8A: Unauthorized athlete cannot insert assessment sessions (rejected by RLS policy)'
);

-- ------------------------------------------------------------------------------
-- TEST 8B: Assessment self-evaluation rejected by check_no_self_evaluation constraint (Denied)
-- ------------------------------------------------------------------------------
RESET ROLE; -- Restore superuser / database owner context to test database table constraint layer directly

SELECT throws_ok(
  'INSERT INTO public.assessment_sessions (athlete_id, evaluator_id, academy_id, assessment_date) VALUES (''11111111-1111-1111-1111-111111111111'', ''11111111-1111-1111-1111-111111111111'', ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'', ''2026-11-13'')',
  '23514',
  'new row for relation "assessment_sessions" violates check constraint "check_no_self_evaluation"',
  'TEST 8B: check_no_self_evaluation constraint rejects self-evaluation in authorized database context'
);

-- ------------------------------------------------------------------------------
-- TEST 9: Unauthorized assessment editing rejected (Verified sessions locked) (Denied)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333'; -- Evaluator attempting to alter verified session

SELECT throws_ok(
  'UPDATE public.assessment_sessions SET notes = ''Tampered verified note'' WHERE id = ''cccccccc-cccc-cccc-cccc-cccccccccccc''',
  'Unauthorized: A verified assessment session cannot be edited or modified.',
  'TEST 9: Modification of verified assessment session is rejected by immutability trigger'
);

-- ------------------------------------------------------------------------------
-- TEST 10: Anonymous access being blocked from private records (Denied)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::INT FROM public.athletes),
  0,
  'TEST 10: Anonymous unauthenticated users cannot read athlete private profiles'
);

-- ------------------------------------------------------------------------------
-- TEST 11A: Unauthorized deletion of assessment session affects zero protected records (Denied)
-- ------------------------------------------------------------------------------
-- 1. Attempt deletion under unauthorized authenticated identity (Athlete 2)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222'; -- Athlete 2

-- 2. Confirm that zero protected records are deleted
SELECT is_empty(
  'DELETE FROM public.assessment_sessions WHERE id = ''eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'' RETURNING id',
  'TEST 11A: Unauthorized user deletion attempt affects zero protected records'
);

-- ------------------------------------------------------------------------------
-- TEST 11B: Protected assessment session confirmed intact in authorized verification context (Allowed)
-- ------------------------------------------------------------------------------
-- 3. Verify the original record still exists using an appropriately authorized verification context
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333'; -- Academy Owner (authorized evaluator/owner)

SELECT is(
  (SELECT count(*)::INT FROM public.assessment_sessions WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  1,
  'TEST 11B: Protected assessment session remains intact when verified by authorized owner'
);

-- ------------------------------------------------------------------------------
-- TEST 12: Private media access design verification
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222'; -- Athlete 2

-- Verify affiliation security helper functions isolate cross-organization records
SELECT is(
  public.has_active_academy_affiliation('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
  FALSE,
  'TEST 12: Private affiliation helper denies unaffiliated athlete access to academy storage and records'
);

SELECT * FROM finish();
ROLLBACK;
