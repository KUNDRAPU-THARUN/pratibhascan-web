-- ==============================================================================
-- PRATIBHASCAN MIGRATION: ASSESSMENT INTEGRITY & GUARDIAN CONSENT SUBSYSTEM
-- COMPANY: KAARYAN LABS
-- PRODUCT: PratibhaScan (AI-Powered Sports Talent Assessment Platform)
-- MIGRATION: 20261114000000_assessment_integrity_and_guardian_consent.sql
-- PHASE: Phase 3E.1 Database Hardening (Local Testing / Disposable Verification)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. EXTEND ASSESSMENT SESSIONS: VERIFICATION TIERS & TWO-PERSON INTEGRITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS verification_tier TEXT DEFAULT 'organization_recorded' NOT NULL
    CHECK (verification_tier IN ('draft', 'organization_recorded', 'two_person_verified')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS secondary_reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- ------------------------------------------------------------------------------
-- 2. EXTEND ASSESSMENT RESULTS STATUS
-- ------------------------------------------------------------------------------
ALTER TABLE public.assessment_results
  DROP CONSTRAINT IF EXISTS assessment_results_status_check;

ALTER TABLE public.assessment_results
  ADD CONSTRAINT assessment_results_status_check
    CHECK (status IN ('pending', 'verified', 'organization_recorded', 'two_person_verified', 'flagged'));

-- ------------------------------------------------------------------------------
-- 3. UPGRADE IMMUTABILITY & TWO-PERSON INTEGRITY TRIGGER
-- Security Hardened: Search path pinned, spoofed verified_by overwritten,
-- and verifier authorization strictly checked.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_assessment_session_update()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_id UUID;
  v_is_authorized BOOLEAN;
BEGIN
  -- Strict Immutability: Once verified in any tier, records cannot be altered or unverified
  IF OLD.verified = TRUE THEN
    RAISE EXCEPTION 'Unauthorized: A verified assessment session cannot be edited or modified.';
  END IF;

  v_caller_id := auth.uid();

  -- If transition to verified = TRUE occurs
  IF NEW.verified = TRUE AND OLD.verified = FALSE THEN
    -- Verify caller is an authorized evaluator for this academy or institution
    v_is_authorized := public.is_authorized_evaluator(v_caller_id, OLD.academy_id, OLD.institution_id);
    IF NOT v_is_authorized THEN
      RAISE EXCEPTION 'Unauthorized: Caller is not an authorized evaluator or reviewer for this organization.';
    END IF;

    -- Tier 2: Organization Recorded (Single Evaluator finalization)
    IF NEW.verification_tier = 'organization_recorded' THEN
      NEW.verified_by := v_caller_id;
      NEW.verified_at := TIMEZONE('utc', NOW());
    
    -- Tier 3: Two-Person Integrity (Dual Sign-Off)
    ELSIF NEW.verification_tier = 'two_person_verified' THEN
      -- STRICT: Recording evaluator CANNOT verify their own session for two-person integrity
      IF v_caller_id = OLD.evaluator_id THEN
        RAISE EXCEPTION 'Two-person integrity violation: An assessment evaluator cannot verify their own session for two-person certification (evaluator_id = %).', OLD.evaluator_id;
      END IF;
      
      NEW.verified_by := v_caller_id;
      NEW.secondary_reviewer_id := v_caller_id;
      NEW.verified_at := TIMEZONE('utc', NOW());
    ELSE
      -- Catch-all: If verified is true, tier must not be draft
      RAISE EXCEPTION 'Invalid State: An assessment session cannot be verified with verification_tier = draft.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- 4. UPDATE SESSIONS RLS POLICY FOR TWO-PERSON VERIFIERS
-- Allows authorized staff evaluators (not just owners) to verify sessions for their org
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "sessions_update_unverified" ON public.assessment_sessions;

CREATE POLICY "sessions_update_unverified"
  ON public.assessment_sessions FOR UPDATE
  TO authenticated
  USING (
    public.is_active_user(auth.uid())
    AND (
      -- Evaluator editing their own session
      evaluator_id = auth.uid()
      OR
      -- Organization owner or authorized staff verifier
      public.is_authorized_evaluator(auth.uid(), academy_id, institution_id)
    )
  );

-- ------------------------------------------------------------------------------
-- 5. GUARDIAN PROFILES TABLE (DPDP ACT 2023)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guardian_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('mother', 'father', 'legal_guardian', 'appointed_warden')),
  phone_number TEXT NOT NULL,
  email TEXT,
  government_id_type TEXT CHECK (government_id_type IN ('aadhaar', 'passport', 'voter_id', 'driving_license')),
  government_id_hash TEXT, -- Cryptographic hash only; raw IDs are never stored
  id_verified BOOLEAN DEFAULT FALSE NOT NULL,
  id_verified_at TIMESTAMPTZ,
  verification_method TEXT CHECK (verification_method IN ('phone_otp', 'aadhaar_esign', 'digilocker', 'physical_affidavit')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. GUARDIAN-ATHLETE LINKAGE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guardian_athlete_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guardian_id UUID REFERENCES public.guardian_profiles(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
  verification_status TEXT DEFAULT 'pending' NOT NULL 
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'terminated')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  supporting_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_guardian_athlete UNIQUE (guardian_id, athlete_id)
);

-- ------------------------------------------------------------------------------
-- 7. VERIFIABLE GUARDIAN CONSENTS (PURPOSE-SPECIFIC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guardian_consents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  link_id UUID REFERENCES public.guardian_athlete_links(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
  guardian_id UUID REFERENCES public.guardian_profiles(id) ON DELETE CASCADE NOT NULL,
  consent_purpose TEXT NOT NULL 
    CHECK (consent_purpose IN ('performance_tracking', 'talent_scouting', 'biometric_eval')),
  status TEXT DEFAULT 'active' NOT NULL 
    CHECK (status IN ('active', 'revoked', 'expired')),
  consent_method TEXT NOT NULL 
    CHECK (consent_method IN ('phone_otp', 'aadhaar_esign', 'digilocker_token', 'signed_affidavit_upload')),
  verification_token_hash TEXT NOT NULL,
  consented_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT check_consent_validity CHECK (expires_at > consented_at)
);

-- Partial index: At most one active consent per athlete per purpose
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_guardian_consent
  ON public.guardian_consents(athlete_id, consent_purpose)
  WHERE (status = 'active');

-- ------------------------------------------------------------------------------
-- 8. IMMUTABLE CONSENT AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consent_audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  consent_id UUID REFERENCES public.guardian_consents(id) ON DELETE SET NULL,
  athlete_id UUID NOT NULL,
  guardian_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'renewed', 'revoked', 'expired', 'erasure_requested')),
  actor_id UUID NOT NULL,
  ip_address INET,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. HELPER FUNCTION: CHECK VERIFIED MINOR CONSENT
-- Search path pinned for security definer safety
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_active_minor_consent(p_athlete_id UUID, p_purpose TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_dob DATE;
  v_age NUMERIC;
BEGIN
  -- Get athlete date of birth
  SELECT date_of_birth INTO v_dob FROM public.athletes WHERE id = p_athlete_id;
  
  -- If not found, return false
  IF v_dob IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate age in years
  v_age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_dob));

  -- If adult (>= 18), guardian consent is not required
  IF v_age >= 18 THEN
    RETURN TRUE;
  END IF;

  -- If minor (< 18), check active, unexpired consent with verified guardian link
  RETURN EXISTS (
    SELECT 1 
    FROM public.guardian_consents gc
    JOIN public.guardian_athlete_links gal ON gc.link_id = gal.id
    JOIN public.guardian_profiles gp ON gc.guardian_id = gp.id
    WHERE gc.athlete_id = p_athlete_id
      AND gc.consent_purpose = p_purpose
      AND gc.status = 'active'
      AND gc.expires_at > NOW()
      AND gal.verification_status = 'verified'
      AND gp.id_verified = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- 10. ENABLE ROW-LEVEL SECURITY ON CONSENT TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.guardian_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_athlete_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_logs ENABLE ROW LEVEL SECURITY;

-- Guardian access to own profile
DROP POLICY IF EXISTS "guardians_own_profile" ON public.guardian_profiles;
CREATE POLICY "guardians_own_profile"
  ON public.guardian_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Athletes can view their linked guardian's basic profile
DROP POLICY IF EXISTS "athletes_view_linked_guardian" ON public.guardian_profiles;
CREATE POLICY "athletes_view_linked_guardian"
  ON public.guardian_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.guardian_athlete_links
      WHERE guardian_id = guardian_profiles.id
        AND athlete_id = auth.uid()
    )
  );

-- Guardian access to own links
DROP POLICY IF EXISTS "guardians_own_links" ON public.guardian_athlete_links;
CREATE POLICY "guardians_own_links"
  ON public.guardian_athlete_links FOR ALL
  TO authenticated
  USING (
    guardian_id IN (SELECT id FROM public.guardian_profiles WHERE user_id = auth.uid())
    OR athlete_id = auth.uid()
  )
  WITH CHECK (
    guardian_id IN (SELECT id FROM public.guardian_profiles WHERE user_id = auth.uid())
  );

-- Guardian access to own consents
DROP POLICY IF EXISTS "guardians_own_consents" ON public.guardian_consents;
CREATE POLICY "guardians_own_consents"
  ON public.guardian_consents FOR ALL
  TO authenticated
  USING (
    guardian_id IN (SELECT id FROM public.guardian_profiles WHERE user_id = auth.uid())
    OR athlete_id = auth.uid()
  )
  WITH CHECK (
    guardian_id IN (SELECT id FROM public.guardian_profiles WHERE user_id = auth.uid())
  );

-- Audit log: insert only by system triggers, read by involved guardian/athlete
DROP POLICY IF EXISTS "audit_logs_read_involved" ON public.consent_audit_logs;
CREATE POLICY "audit_logs_read_involved"
  ON public.consent_audit_logs FOR SELECT
  TO authenticated
  USING (
    guardian_id IN (SELECT id FROM public.guardian_profiles WHERE user_id = auth.uid())
    OR athlete_id = auth.uid()
  );

COMMIT;
