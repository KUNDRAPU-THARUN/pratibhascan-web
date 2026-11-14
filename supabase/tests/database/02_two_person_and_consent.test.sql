-- ==============================================================================
-- PRATIBHASCAN DATABASE TEST SUITE: TWO-PERSON INTEGRITY & GUARDIAN CONSENT (pgTAP)
-- COMPANY: KAARYAN LABS
-- PRODUCT: PratibhaScan (AI-Powered Sports Talent Assessment Platform)
-- TEST SCRIPT: supabase/tests/database/02_two_person_and_consent.test.sql
-- PHASE: Phase 3E.1 Database Hardening & Verification
--
-- Scenarios Tested:
-- 1. Evaluator records draft session (Allowed)
-- 2. Evaluator self-verification in two_person_verified mode is rejected (Denied/Throws)
-- 3. Authorized independent reviewer can verify in two_person_verified mode (Allowed)
-- 4. Audit metadata stamps reviewer ID and UTC timestamp (Verified)
-- 5. Verified session is immutable against edits (Denied/Throws)
-- 6. Verified session deletion is rejected by RLS (Denied/0 Rows)
-- 7. Organization owner cannot bypass separation of duty when recording evaluator (Denied/Throws)
-- 8. Verification with verification_tier = 'draft' is rejected (Denied/Throws)
-- 9. Single-evaluator organization_recorded workflow remains compatible (Allowed)
-- 10. Unauthorized third-party cannot update or verify session (Denied/0 Rows)
-- 11. Minor athlete without consent returns FALSE (Denied)
-- 12. Minor athlete with active verified consent returns TRUE (Allowed)
-- 13. Purpose-specific consent isolates ungranted purposes (Denied)
-- 14. Expired consent returns FALSE (Denied)
-- 15. Revoked consent returns FALSE (Denied)
-- 16. Unverified guardian identity returns FALSE (Denied)
-- 17. Unverified child linkage returns FALSE (Denied)
-- 18. Adult athlete returns TRUE without guardian consent (Allowed)
-- 19. Cross-family RLS isolation prevents accessing other families' data (Denied)
-- 20. Duplicate active consent for same purpose rejected by partial unique index (Denied/Throws)
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(20);

-- ------------------------------------------------------------------------------
-- FIXTURES SETUP (Running under postgres superuser role)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  -- Users
  uid_owner UUID := '30000000-0000-0000-0000-000000000001';
  uid_coach1 UUID := '30000000-0000-0000-0000-000000000002';
  uid_coach2 UUID := '30000000-0000-0000-0000-000000000003';
  uid_unauth_coach UUID := '30000000-0000-0000-0000-000000000009';
  
  uid_guardian_user1 UUID := '50000000-0000-0000-0000-000000000001';
  uid_guardian_user2 UUID := '50000000-0000-0000-0000-000000000002';
  uid_guardian_unverified_user UUID := '50000000-0000-0000-0000-000000000003';

  uid_minor1 UUID := '60000000-0000-0000-0000-000000000001';
  uid_minor2 UUID := '60000000-0000-0000-0000-000000000002';
  uid_minor3 UUID := '60000000-0000-0000-0000-000000000003';
  uid_minor4 UUID := '60000000-0000-0000-0000-000000000004';
  uid_minor5 UUID := '60000000-0000-0000-0000-000000000005';
  uid_minor_no_consent UUID := '60000000-0000-0000-0000-000000000006';
  uid_adult UUID := '60000000-0000-0000-0000-000000000007';

  -- Organization
  academy_id UUID := '70000000-0000-0000-0000-000000000001';

  -- Guardian Profiles
  gprof1_id UUID := '80000000-0000-0000-0000-000000000001';
  gprof2_id UUID := '80000000-0000-0000-0000-000000000002';
  gprof_unverified_id UUID := '80000000-0000-0000-0000-000000000003';

  -- Links
  link1_id UUID := '90000000-0000-0000-0000-000000000001';
  link2_id UUID := '90000000-0000-0000-0000-000000000002';
  link3_id UUID := '90000000-0000-0000-0000-000000000003';
  link4_id UUID := '90000000-0000-0000-0000-000000000004';
  link5_id UUID := '90000000-0000-0000-0000-000000000005';

  -- Sessions
  sess_draft UUID := 'a0000000-0000-0000-0000-000000000001';
  sess_owner_eval UUID := 'a0000000-0000-0000-0000-000000000002';
  sess_org_recorded UUID := 'a0000000-0000-0000-0000-000000000003';

BEGIN
  -- Insert into auth.users
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    INSERT INTO auth.users (id, email) VALUES
      (uid_owner, 'owner@test.in'),
      (uid_coach1, 'coach1@test.in'),
      (uid_coach2, 'coach2@test.in'),
      (uid_unauth_coach, 'unauth@test.in'),
      (uid_guardian_user1, 'parent1@test.in'),
      (uid_guardian_user2, 'parent2@test.in'),
      (uid_guardian_unverified_user, 'parent3@test.in'),
      (uid_minor1, 'minor1@test.in'),
      (uid_minor2, 'minor2@test.in'),
      (uid_minor3, 'minor3@test.in'),
      (uid_minor4, 'minor4@test.in'),
      (uid_minor5, 'minor5@test.in'),
      (uid_minor_no_consent, 'minor6@test.in'),
      (uid_adult, 'adult@test.in')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- User Profiles
  INSERT INTO public.user_profiles (id, email, full_name, role) VALUES
    (uid_owner, 'owner@test.in', 'Director Sharma', 'academy'),
    (uid_coach1, 'coach1@test.in', 'Coach Verma', 'academy'),
    (uid_coach2, 'coach2@test.in', 'Coach Iyer', 'academy'),
    (uid_unauth_coach, 'unauth@test.in', 'Coach Outsider', 'academy'),
    (uid_guardian_user1, 'parent1@test.in', 'Sunita Patel (Mother)', 'athlete'),
    (uid_guardian_user2, 'parent2@test.in', 'Rajesh Gupta (Father)', 'athlete'),
    (uid_guardian_unverified_user, 'parent3@test.in', 'Unverified Parent', 'athlete'),
    (uid_minor1, 'minor1@test.in', 'Aarav Patel (Minor 15)', 'athlete'),
    (uid_minor2, 'minor2@test.in', 'Diya Patel (Minor 14)', 'athlete'),
    (uid_minor3, 'minor3@test.in', 'Kavya Gupta (Minor 16)', 'athlete'),
    (uid_minor4, 'minor4@test.in', 'Rohan Das (Minor 13)', 'athlete'),
    (uid_minor5, 'minor5@test.in', 'Ananya Sen (Minor 15)', 'athlete'),
    (uid_minor_no_consent, 'minor6@test.in', 'Vikram Rao (Minor 14)', 'athlete'),
    (uid_adult, 'adult@test.in', 'Manish Adult (Age 22)', 'athlete')
  ON CONFLICT (id) DO NOTHING;

  -- Athletes (DOB setups: minors ~13-16 years old; adult ~22 years old)
  INSERT INTO public.athletes (id, date_of_birth, gender, primary_sport, height_cm, weight_kg) VALUES
    (uid_minor1, '2011-06-01', 'male', 'Athletics', 165.0, 52.0),
    (uid_minor2, '2012-03-15', 'female', 'Swimming', 158.0, 48.0),
    (uid_minor3, '2010-09-20', 'female', 'Badminton', 162.0, 50.0),
    (uid_minor4, '2013-11-05', 'male', 'Wrestling', 150.0, 45.0),
    (uid_minor5, '2011-01-10', 'female', 'Archery', 160.0, 49.0),
    (uid_minor_no_consent, '2012-08-18', 'male', 'Boxing', 155.0, 46.0),
    (uid_adult, '2004-01-01', 'male', 'Athletics', 178.0, 70.0)
  ON CONFLICT (id) DO UPDATE SET
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    primary_sport = EXCLUDED.primary_sport,
    height_cm = EXCLUDED.height_cm,
    weight_kg = EXCLUDED.weight_kg;

  -- Academy
  INSERT INTO public.academies (id, owner_id, name, contact_email, state, district, verified) VALUES
    (academy_id, uid_owner, 'Drona Sports Center', 'drona@test.in', 'Haryana', 'Rohtak', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- Evaluator Authorizations for Coach 1 and Coach 2
  INSERT INTO public.evaluator_authorizations (evaluator_id, organization_type, academy_id, accreditation_number, status) VALUES
    (uid_coach1, 'academy', academy_id, 'ACC-COACH-101', 'active'),
    (uid_coach2, 'academy', academy_id, 'ACC-COACH-102', 'active')
  ON CONFLICT DO NOTHING;

  -- Affiliations for Minor 1 and Adult
  INSERT INTO public.athlete_affiliations (athlete_id, organization_type, academy_id, status, requested_by, approved_by) VALUES
    (uid_minor1, 'academy', academy_id, 'active', uid_minor1, uid_owner),
    (uid_adult, 'academy', academy_id, 'active', uid_adult, uid_owner)
  ON CONFLICT DO NOTHING;

  -- Draft Assessment Session: Recorded by Coach 1
  INSERT INTO public.assessment_sessions (
    id, athlete_id, evaluator_id, academy_id, assessment_date, verification_tier, verified
  ) VALUES (
    sess_draft, uid_minor1, uid_coach1, academy_id, '2026-11-10', 'draft', FALSE
  ) ON CONFLICT (id) DO NOTHING;

  -- Draft Assessment Session: Recorded by Academy Owner directly
  INSERT INTO public.assessment_sessions (
    id, athlete_id, evaluator_id, academy_id, assessment_date, verification_tier, verified
  ) VALUES (
    sess_owner_eval, uid_minor1, uid_owner, academy_id, '2026-11-11', 'draft', FALSE
  ) ON CONFLICT (id) DO NOTHING;

  -- Assessment Session: for Organization Recorded test
  INSERT INTO public.assessment_sessions (
    id, athlete_id, evaluator_id, academy_id, assessment_date, verification_tier, verified
  ) VALUES (
    sess_org_recorded, uid_minor1, uid_coach1, academy_id, '2026-11-12', 'draft', FALSE
  ) ON CONFLICT (id) DO NOTHING;

  -- Guardian Profiles
  -- Guardian 1: Verified
  INSERT INTO public.guardian_profiles (
    id, user_id, full_name, relationship, phone_number, email,
    government_id_type, government_id_hash, id_verified, id_verified_at, verification_method
  ) VALUES (
    gprof1_id, uid_guardian_user1, 'Sunita Patel', 'mother', '+919876543210', 'parent1@test.in',
    'aadhaar', 'hash_sha256_mock_parent1', TRUE, TIMEZONE('utc', NOW()), 'aadhaar_esign'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Guardian 2: Verified (Different family)
  INSERT INTO public.guardian_profiles (
    id, user_id, full_name, relationship, phone_number, email,
    government_id_type, government_id_hash, id_verified, id_verified_at, verification_method
  ) VALUES (
    gprof2_id, uid_guardian_user2, 'Rajesh Gupta', 'father', '+919876543211', 'parent2@test.in',
    'aadhaar', 'hash_sha256_mock_parent2', TRUE, TIMEZONE('utc', NOW()), 'digilocker'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Guardian 3: Unverified ID
  INSERT INTO public.guardian_profiles (
    id, user_id, full_name, relationship, phone_number, email,
    government_id_type, government_id_hash, id_verified, id_verified_at, verification_method
  ) VALUES (
    gprof_unverified_id, uid_guardian_unverified_user, 'Unverified Parent', 'father', '+919876543212', 'parent3@test.in',
    'aadhaar', 'hash_sha256_mock_parent3', FALSE, NULL, NULL
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Guardian-Athlete Links
  -- Link 1: Guardian 1 -> Minor 1 (VERIFIED)
  INSERT INTO public.guardian_athlete_links (id, guardian_id, athlete_id, verification_status, verified_by, verified_at)
  VALUES (link1_id, gprof1_id, uid_minor1, 'verified', uid_owner, TIMEZONE('utc', NOW()))
  ON CONFLICT DO NOTHING;

  -- Link 2: Guardian 1 -> Minor 2 (VERIFIED)
  INSERT INTO public.guardian_athlete_links (id, guardian_id, athlete_id, verification_status, verified_by, verified_at)
  VALUES (link2_id, gprof1_id, uid_minor2, 'verified', uid_owner, TIMEZONE('utc', NOW()))
  ON CONFLICT DO NOTHING;

  -- Link 3: Guardian 2 -> Minor 3 (VERIFIED)
  INSERT INTO public.guardian_athlete_links (id, guardian_id, athlete_id, verification_status, verified_by, verified_at)
  VALUES (link3_id, gprof2_id, uid_minor3, 'verified', uid_owner, TIMEZONE('utc', NOW()))
  ON CONFLICT DO NOTHING;

  -- Link 4: Unverified Guardian -> Minor 4 (VERIFIED LINKAGE, but Guardian ID unverified)
  INSERT INTO public.guardian_athlete_links (id, guardian_id, athlete_id, verification_status, verified_by, verified_at)
  VALUES (link4_id, gprof_unverified_id, uid_minor4, 'verified', uid_owner, TIMEZONE('utc', NOW()))
  ON CONFLICT DO NOTHING;

  -- Link 5: Guardian 1 -> Minor 5 (PENDING LINKAGE)
  INSERT INTO public.guardian_athlete_links (id, guardian_id, athlete_id, verification_status)
  VALUES (link5_id, gprof1_id, uid_minor5, 'pending')
  ON CONFLICT DO NOTHING;

  -- Consents
  -- Consent 1: Minor 1 -> performance_tracking (ACTIVE, 1 year valid)
  INSERT INTO public.guardian_consents (
    link_id, athlete_id, guardian_id, consent_purpose, status, consent_method,
    verification_token_hash, consented_at, expires_at
  ) VALUES (
    link1_id, uid_minor1, gprof1_id, 'performance_tracking', 'active', 'aadhaar_esign',
    'hash_token_consent_1', TIMEZONE('utc', NOW() - INTERVAL '1 day'), TIMEZONE('utc', NOW() + INTERVAL '364 days')
  );

  -- Consent 2: Minor 1 -> talent_scouting (ACTIVE, 1 year valid)
  INSERT INTO public.guardian_consents (
    link_id, athlete_id, guardian_id, consent_purpose, status, consent_method,
    verification_token_hash, consented_at, expires_at
  ) VALUES (
    link1_id, uid_minor1, gprof1_id, 'talent_scouting', 'active', 'aadhaar_esign',
    'hash_token_consent_2', TIMEZONE('utc', NOW() - INTERVAL '1 day'), TIMEZONE('utc', NOW() + INTERVAL '364 days')
  );

  -- Consent 3: Minor 2 -> performance_tracking (EXPIRED)
  INSERT INTO public.guardian_consents (
    link_id, athlete_id, guardian_id, consent_purpose, status, consent_method,
    verification_token_hash, consented_at, expires_at
  ) VALUES (
    link2_id, uid_minor2, gprof1_id, 'performance_tracking', 'active', 'phone_otp',
    'hash_token_consent_3', TIMEZONE('utc', NOW() - INTERVAL '30 days'), TIMEZONE('utc', NOW() - INTERVAL '1 day')
  );

  -- Consent 4: Minor 3 -> performance_tracking (REVOKED)
  INSERT INTO public.guardian_consents (
    link_id, athlete_id, guardian_id, consent_purpose, status, consent_method,
    verification_token_hash, consented_at, expires_at, revoked_at, revocation_reason
  ) VALUES (
    link3_id, uid_minor3, gprof2_id, 'performance_tracking', 'revoked', 'digilocker_token',
    'hash_token_consent_4', TIMEZONE('utc', NOW() - INTERVAL '10 days'), TIMEZONE('utc', NOW() + INTERVAL '355 days'),
    TIMEZONE('utc', NOW() - INTERVAL '1 day'), 'Parent requested withdrawal'
  );

  -- Consent 5: Minor 4 -> performance_tracking (Active consent, but Guardian ID was unverified)
  INSERT INTO public.guardian_consents (
    link_id, athlete_id, guardian_id, consent_purpose, status, consent_method,
    verification_token_hash, consented_at, expires_at
  ) VALUES (
    link4_id, uid_minor4, gprof_unverified_id, 'performance_tracking', 'active', 'phone_otp',
    'hash_token_consent_5', TIMEZONE('utc', NOW() - INTERVAL '1 day'), TIMEZONE('utc', NOW() + INTERVAL '364 days')
  );

  -- Consent 6: Minor 5 -> performance_tracking (Active consent, but Link status is pending)
  INSERT INTO public.guardian_consents (
    link_id, athlete_id, guardian_id, consent_purpose, status, consent_method,
    verification_token_hash, consented_at, expires_at
  ) VALUES (
    link5_id, uid_minor5, gprof1_id, 'performance_tracking', 'active', 'phone_otp',
    'hash_token_consent_6', TIMEZONE('utc', NOW() - INTERVAL '1 day'), TIMEZONE('utc', NOW() + INTERVAL '364 days')
  );

END $$;

-- ------------------------------------------------------------------------------
-- TEST 1: Evaluator records draft session (Allowed)
-- ------------------------------------------------------------------------------
SELECT is(
  (SELECT verification_tier FROM public.assessment_sessions WHERE id = 'a0000000-0000-0000-0000-000000000001'),
  'draft',
  'TEST 1: Assessment session successfully created with verification_tier = draft'
);

-- ------------------------------------------------------------------------------
-- TEST 2: Evaluator cannot self-verify in two_person_verified mode (Denied/Throws)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000002'; -- Coach 1 (Recording Evaluator)

SELECT throws_matching(
  'UPDATE public.assessment_sessions
   SET verified = TRUE, verification_tier = ''two_person_verified'', review_notes = ''Self review''
   WHERE id = ''a0000000-0000-0000-0000-000000000001''',
  'Two-person integrity violation: An assessment evaluator cannot verify their own session',
  'TEST 2: Recording evaluator is strictly forbidden from self-verifying in two_person_verified tier'
);

-- ------------------------------------------------------------------------------
-- TEST 3: Authorized independent reviewer can verify in two_person_verified mode (Allowed)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000003'; -- Coach 2 (Independent Authorized Reviewer)

UPDATE public.assessment_sessions
SET verified = TRUE, verification_tier = 'two_person_verified', review_notes = 'Independent validation verified'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT verified FROM public.assessment_sessions WHERE id = 'a0000000-0000-0000-0000-000000000001'),
  TRUE,
  'TEST 3: Authorized independent reviewer successfully transitions draft to two_person_verified'
);

-- ------------------------------------------------------------------------------
-- TEST 4: Audit metadata stamps reviewer ID and UTC timestamp (Verified)
-- ------------------------------------------------------------------------------
SELECT is(
  (SELECT secondary_reviewer_id FROM public.assessment_sessions WHERE id = 'a0000000-0000-0000-0000-000000000001'),
  '30000000-0000-0000-0000-000000000003'::UUID,
  'TEST 4: Audit metadata correctly recorded secondary_reviewer_id as the verifying reviewer'
);

-- ------------------------------------------------------------------------------
-- TEST 5: Verified session is immutable against edits (Denied/Throws)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000003'; -- Coach 2

SELECT throws_ok(
  'UPDATE public.assessment_sessions
   SET review_notes = ''Attempted post-verification tampering''
   WHERE id = ''a0000000-0000-0000-0000-000000000001''',
  'Unauthorized: A verified assessment session cannot be edited or modified.',
  'TEST 5: Immutability trigger rejects modification of any field on a verified assessment session'
);

-- ------------------------------------------------------------------------------
-- TEST 6: Verified session deletion is rejected by RLS (Denied/0 Rows)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000003'; -- Coach 2

SELECT is_empty(
  'DELETE FROM public.assessment_sessions WHERE id = ''a0000000-0000-0000-0000-000000000001'' RETURNING id',
  'TEST 6: Verified assessment session deletion is rejected by RLS (0 rows affected)'
);

-- ------------------------------------------------------------------------------
-- TEST 7: Organization owner cannot bypass separation of duty when recording evaluator
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000001'; -- Director Sharma (Academy Owner & Evaluator)

SELECT throws_matching(
  'UPDATE public.assessment_sessions
   SET verified = TRUE, verification_tier = ''two_person_verified''
   WHERE id = ''a0000000-0000-0000-0000-000000000002''',
  'Two-person integrity violation: An assessment evaluator cannot verify their own session',
  'TEST 7: Organization owner is subject to two-person separation of duty when they are the recording evaluator'
);

-- ------------------------------------------------------------------------------
-- TEST 8: Verification with verification_tier = 'draft' is rejected (Denied/Throws)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000003'; -- Coach 2

SELECT throws_ok(
  'UPDATE public.assessment_sessions
   SET verified = TRUE, verification_tier = ''draft''
   WHERE id = ''a0000000-0000-0000-0000-000000000002''',
  'Invalid State: An assessment session cannot be verified with verification_tier = draft.',
  'TEST 8: Trigger prevents verifying an assessment session with verification_tier = draft'
);

-- ------------------------------------------------------------------------------
-- TEST 9: Single-evaluator organization_recorded workflow remains compatible (Allowed)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000002'; -- Coach 1 (Evaluator)

UPDATE public.assessment_sessions
SET verified = TRUE, verification_tier = 'organization_recorded'
WHERE id = 'a0000000-0000-0000-0000-000000000003';

SELECT is(
  (SELECT verification_tier FROM public.assessment_sessions WHERE id = 'a0000000-0000-0000-0000-000000000003'),
  'organization_recorded',
  'TEST 9: Single-evaluator organization_recorded verification remains fully operational'
);

-- ------------------------------------------------------------------------------
-- TEST 10: Unauthorized third-party cannot update or verify session (Denied/0 Rows)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000009'; -- Coach Outsider (Unassociated)

SELECT is_empty(
  'UPDATE public.assessment_sessions
   SET verified = TRUE, verification_tier = ''two_person_verified''
   WHERE id = ''a0000000-0000-0000-0000-000000000002''
   RETURNING id',
  'TEST 10: Unauthorized third-party evaluator is denied updating or verifying organization sessions'
);

-- ------------------------------------------------------------------------------
-- TEST 11: Minor athlete without consent returns FALSE (Denied)
-- ------------------------------------------------------------------------------
RESET ROLE;

SELECT is(
  public.has_active_minor_consent('60000000-0000-0000-0000-000000000006'::UUID, 'performance_tracking'),
  FALSE,
  'TEST 11: Minor athlete with no recorded consent returns FALSE'
);

-- ------------------------------------------------------------------------------
-- TEST 12: Minor athlete with active verified consent returns TRUE (Allowed)
-- ------------------------------------------------------------------------------
SELECT is(
  public.has_active_minor_consent('60000000-0000-0000-0000-000000000001'::UUID, 'performance_tracking'),
  TRUE,
  'TEST 12: Minor athlete with verified guardian and active consent returns TRUE'
);

-- ------------------------------------------------------------------------------
-- TEST 13: Purpose-specific consent isolates ungranted purposes (Denied)
-- ------------------------------------------------------------------------------
SELECT is(
  public.has_active_minor_consent('60000000-0000-0000-0000-000000000001'::UUID, 'biometric_eval'),
  FALSE,
  'TEST 13: Minor athlete has performance_tracking and talent_scouting, but biometric_eval returns FALSE'
);

-- ------------------------------------------------------------------------------
-- TEST 14: Expired consent returns FALSE (Denied)
-- ------------------------------------------------------------------------------
SELECT is(
  public.has_active_minor_consent('60000000-0000-0000-0000-000000000002'::UUID, 'performance_tracking'),
  FALSE,
  'TEST 14: Minor athlete with expired consent returns FALSE'
);

-- ------------------------------------------------------------------------------
-- TEST 15: Revoked consent returns FALSE (Denied)
-- ------------------------------------------------------------------------------
SELECT is(
  public.has_active_minor_consent('60000000-0000-0000-0000-000000000003'::UUID, 'performance_tracking'),
  FALSE,
  'TEST 15: Minor athlete with revoked consent returns FALSE'
);

-- ------------------------------------------------------------------------------
-- TEST 16: Unverified guardian identity returns FALSE (Denied)
-- ------------------------------------------------------------------------------
SELECT is(
  public.has_active_minor_consent('60000000-0000-0000-0000-000000000004'::UUID, 'performance_tracking'),
  FALSE,
  'TEST 16: Active consent from guardian with id_verified = FALSE returns FALSE'
);

-- ------------------------------------------------------------------------------
-- TEST 17: Unverified child linkage returns FALSE (Denied)
-- ------------------------------------------------------------------------------
SELECT is(
  public.has_active_minor_consent('60000000-0000-0000-0000-000000000005'::UUID, 'performance_tracking'),
  FALSE,
  'TEST 17: Active consent with pending guardian_athlete_link returns FALSE'
);

-- ------------------------------------------------------------------------------
-- TEST 18: Adult athlete returns TRUE without guardian consent (Allowed)
-- ------------------------------------------------------------------------------
SELECT is(
  public.has_active_minor_consent('60000000-0000-0000-0000-000000000007'::UUID, 'performance_tracking'),
  TRUE,
  'TEST 18: Adult athlete (Age 22) automatically evaluates to TRUE without guardian consent'
);

-- ------------------------------------------------------------------------------
-- TEST 19: Cross-family RLS isolation prevents accessing other families' data (Denied)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '50000000-0000-0000-0000-000000000001'; -- Guardian 1 (Sunita Patel)

SELECT is(
  (SELECT count(*)::INT FROM public.guardian_profiles WHERE user_id = '50000000-0000-0000-0000-000000000002'),
  0,
  'TEST 19: Guardian 1 cannot access Guardian 2 profile (Cross-family RLS isolation)'
);

-- ------------------------------------------------------------------------------
-- TEST 20: Duplicate active consent for same purpose rejected by partial unique index (Denied/Throws)
-- ------------------------------------------------------------------------------
RESET ROLE;

SELECT throws_ok(
  'INSERT INTO public.guardian_consents (
     link_id, athlete_id, guardian_id, consent_purpose, status, consent_method,
     verification_token_hash, expires_at
   ) VALUES (
     ''90000000-0000-0000-0000-000000000001'', ''60000000-0000-0000-0000-000000000001'',
     ''80000000-0000-0000-0000-000000000001'', ''performance_tracking'', ''active'', ''phone_otp'',
     ''duplicate_hash_token'', NOW() + INTERVAL ''180 days''
   )',
  '23505',
  NULL,
  'TEST 20: Partial unique index idx_unique_active_guardian_consent prevents duplicate active consents'
);

SELECT * FROM finish();
ROLLBACK;
