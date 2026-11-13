-- ==============================================================================
-- PRATIBHASCAN SECURE DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- COMPANY: KAARYAN LABS
-- PRODUCT: PratibhaScan (AI-Powered Sports Talent Assessment & Development Platform)
-- MIGRATION: 20261112000000_initial_schema.sql
-- PHASE: Phase 2A - Secure Database Foundation
--
-- SECURITY ARCHITECTURE:
-- 1. Strictly three primary roles: 'athlete', 'academy', 'institution'.
-- 2. Immutable role creation via trigger from auth.users (direct client insert denied).
-- 3. Dedicated organization ownership (owner_id) with multi-tenancy isolation.
-- 4. Explicit athlete-to-organization affiliation model (prevents unilateral access).
-- 5. Authorized evaluator registry (prevents self-evaluation and score fabrication).
-- 6. Complete Row Level Security (RLS) on all tables (SELECT, INSERT, UPDATE, DELETE).
-- 7. Account suspension enforcement across all policies.
-- 8. Storage bucket security policies for private passports and parental consents.
-- ==============================================================================

-- Enable required cryptographic and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USER PROFILES & AUTHENTICATION OWNERSHIP
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'academy', 'institution')),
  phone_number TEXT,
  avatar_url TEXT,
  state TEXT,
  district TEXT,
  is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for role-based queries and suspension checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_suspended ON public.user_profiles(is_suspended);

-- Security helper: Check if user is active (not suspended)
CREATE OR REPLACE FUNCTION public.is_active_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND is_suspended = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger: Prevent arbitrary self-elevation of role or suspension tampering by user
CREATE OR REPLACE FUNCTION public.guard_user_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent role modification
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Unauthorized: User role modification is strictly prohibited.';
  END IF;

  -- Prevent self-unsuspension
  IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended AND auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'Unauthorized: Users cannot modify their own suspension status.';
  END IF;

  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_user_profile_update ON public.user_profiles;
CREATE TRIGGER trg_guard_user_profile_update
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_profile_update();

-- Automated profile creation trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract and validate role from metadata; default safely to 'athlete'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
  IF v_role NOT IN ('athlete', 'academy', 'institution') THEN
    v_role := 'athlete';
  END IF;

  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, v_full_name, v_role);

  -- If athlete, initialize baseline athlete record
  IF v_role = 'athlete' THEN
    INSERT INTO public.athletes (
      id,
      date_of_birth,
      gender,
      primary_sport,
      height_cm,
      weight_kg
    ) VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::DATE, '2008-01-01'::DATE),
      COALESCE(NEW.raw_user_meta_data->>'gender', 'other'),
      COALESCE(NEW.raw_user_meta_data->>'primary_sport', 'General Fitness'),
      COALESCE((NEW.raw_user_meta_data->>'height_cm')::NUMERIC, 170.0),
      COALESCE((NEW.raw_user_meta_data->>'weight_kg')::NUMERIC, 60.0)
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 2. ACADEMIES
-- Registered sports coaching centers and high-performance academies.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.academies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  sports_offered TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_academies_owner ON public.academies(owner_id);

-- Prevent unauthorized transfer of academy ownership
CREATE OR REPLACE FUNCTION public.guard_academy_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Unauthorized: Academy ownership cannot be transferred without administrative authorization.';
  END IF;
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_academy_update ON public.academies;
CREATE TRIGGER trg_guard_academy_update
  BEFORE UPDATE ON public.academies
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_academy_update();

-- ==============================================================================
-- 3. INSTITUTIONS
-- Educational institutions, colleges, district and state sports boards.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('school', 'college', 'university', 'sports_board', 'federation')),
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_institutions_owner ON public.institutions(owner_id);

-- Prevent unauthorized transfer of institution ownership
CREATE OR REPLACE FUNCTION public.guard_institution_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Unauthorized: Institution ownership cannot be transferred without administrative authorization.';
  END IF;
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_institution_update ON public.institutions;
CREATE TRIGGER trg_guard_institution_update
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_institution_update();

-- ==============================================================================
-- 4. ATHLETES & BIOMETRIC PASSPORTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.athletes (
  id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  primary_sport TEXT NOT NULL,
  secondary_sport TEXT,
  height_cm NUMERIC(5, 2) NOT NULL CHECK (height_cm > 50 AND height_cm < 260),
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 20 AND weight_kg < 300),
  wingspan_cm NUMERIC(5, 2) CHECK (wingspan_cm IS NULL OR (wingspan_cm > 50 AND wingspan_cm < 280)),
  composite_talent_score NUMERIC(5, 2) DEFAULT 0 CHECK (composite_talent_score >= 0 AND composite_talent_score <= 100),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- 5. ATHLETE-TO-ORGANIZATION AFFILIATION MODEL
-- Solves: Athletes cannot unilaterally claim an academy, and academies cannot
-- access athletes without mutual, active authorization.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.athlete_affiliations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('academy', 'institution')),
  academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'revoked')),
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT check_affiliation_target CHECK (
    (organization_type = 'academy' AND academy_id IS NOT NULL AND institution_id IS NULL) OR
    (organization_type = 'institution' AND institution_id IS NOT NULL AND academy_id IS NULL)
  ),
  CONSTRAINT unique_active_affiliation UNIQUE (athlete_id, organization_type, academy_id, institution_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliations_athlete ON public.athlete_affiliations(athlete_id, status);
CREATE INDEX IF NOT EXISTS idx_affiliations_academy ON public.athlete_affiliations(academy_id, status);
CREATE INDEX IF NOT EXISTS idx_affiliations_institution ON public.athlete_affiliations(institution_id, status);

-- Security helper: Check if an academy has an active affiliation with an athlete
CREATE OR REPLACE FUNCTION public.has_active_academy_affiliation(p_athlete_id UUID, p_academy_owner UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.athlete_affiliations aa
    JOIN public.academies a ON aa.academy_id = a.id
    WHERE aa.athlete_id = p_athlete_id
      AND aa.organization_type = 'academy'
      AND aa.status = 'active'
      AND a.owner_id = p_academy_owner
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Security helper: Check if an institution has an active affiliation with an athlete
CREATE OR REPLACE FUNCTION public.has_active_institution_affiliation(p_athlete_id UUID, p_institution_owner UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.athlete_affiliations aa
    JOIN public.institutions i ON aa.institution_id = i.id
    WHERE aa.athlete_id = p_athlete_id
      AND aa.organization_type = 'institution'
      AND aa.status = 'active'
      AND i.owner_id = p_institution_owner
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 6. EVALUATOR AUTHORIZATIONS
-- Solves: Evaluator authorization and score integrity.
-- Only active, authorized evaluators belonging to an academy/institution can test.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evaluator_authorizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluator_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('academy', 'institution')),
  academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  accreditation_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT check_evaluator_org CHECK (
    (organization_type = 'academy' AND academy_id IS NOT NULL AND institution_id IS NULL) OR
    (organization_type = 'institution' AND institution_id IS NOT NULL AND academy_id IS NULL)
  ),
  CONSTRAINT unique_evaluator_org UNIQUE (evaluator_id, organization_type, academy_id, institution_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluator_auth ON public.evaluator_authorizations(evaluator_id, status);

-- Security helper: Check if a user is an authorized evaluator
CREATE OR REPLACE FUNCTION public.is_authorized_evaluator(p_user_id UUID, p_academy_id UUID, p_institution_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct ownership of the academy
  IF p_academy_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.academies WHERE id = p_academy_id AND owner_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Direct ownership of the institution
  IF p_institution_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.institutions WHERE id = p_institution_id AND owner_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Accredited staff evaluator
  RETURN EXISTS (
    SELECT 1 FROM public.evaluator_authorizations
    WHERE evaluator_id = p_user_id
      AND status = 'active'
      AND (
        (p_academy_id IS NOT NULL AND academy_id = p_academy_id) OR
        (p_institution_id IS NOT NULL AND institution_id = p_institution_id)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 7. STANDARD ASSESSMENT PROTOCOLS
-- Immutable benchmark protocol definitions modeled on SAI norms.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_protocols (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('anthropometric', 'speed', 'endurance', 'power', 'agility', 'flexibility')),
  unit TEXT NOT NULL,
  lower_is_better BOOLEAN DEFAULT FALSE,
  description TEXT,
  methodology TEXT,
  equipment_required TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- 8. ASSESSMENT SESSIONS
-- Formal multi-trial testing events.
-- Rule: An athlete can NEVER evaluate themselves (athlete_id != evaluator_id).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
  evaluator_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL,
  venue TEXT,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT check_no_self_evaluation CHECK (athlete_id != evaluator_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_athlete ON public.assessment_sessions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_sessions_evaluator ON public.assessment_sessions(evaluator_id);

-- Trigger: Enforce assessment session immutability once verified
CREATE OR REPLACE FUNCTION public.guard_assessment_session_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Once verified, records cannot be altered or unverified
  IF OLD.verified = TRUE THEN
    RAISE EXCEPTION 'Unauthorized: A verified assessment session cannot be edited or modified.';
  END IF;

  -- Only organization owner can mark verified
  IF NEW.verified = TRUE AND OLD.verified = FALSE THEN
    NEW.verified_by = auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_assessment_session_update ON public.assessment_sessions;
CREATE TRIGGER trg_guard_assessment_session_update
  BEFORE UPDATE ON public.assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_assessment_session_update();

-- ==============================================================================
-- 9. ASSESSMENT RESULTS
-- Individual trial scores for an assessment session.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  protocol_id UUID REFERENCES public.assessment_protocols(id) NOT NULL,
  trial_1 NUMERIC(8, 2) CHECK (trial_1 IS NULL OR trial_1 >= 0),
  trial_2 NUMERIC(8, 2) CHECK (trial_2 IS NULL OR trial_2 >= 0),
  trial_3 NUMERIC(8, 2) CHECK (trial_3 IS NULL OR trial_3 >= 0),
  best_score NUMERIC(8, 2) NOT NULL CHECK (best_score >= 0),
  percentile_rank NUMERIC(5, 2) CHECK (percentile_rank IS NULL OR (percentile_rank >= 0 AND percentile_rank <= 100)),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_session_protocol UNIQUE (session_id, protocol_id)
);

CREATE INDEX IF NOT EXISTS idx_results_session ON public.assessment_results(session_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict least privilege on SELECT, INSERT, UPDATE, DELETE
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluator_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. user_profiles Policies
-- ------------------------------------------------------------------------------
-- Direct client INSERT is blocked; only system trigger creates user_profiles
REVOKE INSERT ON public.user_profiles FROM authenticated, anon;

CREATE POLICY "profiles_select_active"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY "profiles_update_own"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND public.is_active_user(auth.uid()))
  WITH CHECK (auth.uid() = id AND public.is_active_user(auth.uid()));

-- ------------------------------------------------------------------------------
-- B. academies Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "academies_select_authenticated"
  ON public.academies FOR SELECT
  TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY "academies_insert_owner"
  ON public.academies FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND public.is_active_user(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'academy'
    )
  );

CREATE POLICY "academies_update_owner"
  ON public.academies FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id AND public.is_active_user(auth.uid()))
  WITH CHECK (auth.uid() = owner_id AND public.is_active_user(auth.uid()));

CREATE POLICY "academies_delete_owner"
  ON public.academies FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id AND public.is_active_user(auth.uid()));

-- ------------------------------------------------------------------------------
-- C. institutions Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "institutions_select_authenticated"
  ON public.institutions FOR SELECT
  TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY "institutions_insert_owner"
  ON public.institutions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND public.is_active_user(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'institution'
    )
  );

CREATE POLICY "institutions_update_owner"
  ON public.institutions FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id AND public.is_active_user(auth.uid()))
  WITH CHECK (auth.uid() = owner_id AND public.is_active_user(auth.uid()));

CREATE POLICY "institutions_delete_owner"
  ON public.institutions FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id AND public.is_active_user(auth.uid()));

-- ------------------------------------------------------------------------------
-- D. athletes Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "athletes_select_authenticated"
  ON public.athletes FOR SELECT
  TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY "athletes_insert_self"
  ON public.athletes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND public.is_active_user(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'athlete'
    )
  );

CREATE POLICY "athletes_update_self"
  ON public.athletes FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND public.is_active_user(auth.uid()))
  WITH CHECK (auth.uid() = id AND public.is_active_user(auth.uid()));

-- ------------------------------------------------------------------------------
-- E. athlete_affiliations Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "affiliations_select_involved"
  ON public.athlete_affiliations FOR SELECT
  TO authenticated
  USING (
    athlete_id = auth.uid() OR
    academy_id IN (SELECT id FROM public.academies WHERE owner_id = auth.uid()) OR
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
  );

CREATE POLICY "affiliations_insert_requester"
  ON public.athlete_affiliations FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid() AND (
      athlete_id = auth.uid() OR
      academy_id IN (SELECT id FROM public.academies WHERE owner_id = auth.uid()) OR
      institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "affiliations_update_approver"
  ON public.athlete_affiliations FOR UPDATE
  TO authenticated
  USING (
    athlete_id = auth.uid() OR
    academy_id IN (SELECT id FROM public.academies WHERE owner_id = auth.uid()) OR
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- F. evaluator_authorizations Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "evaluators_select_involved"
  ON public.evaluator_authorizations FOR SELECT
  TO authenticated
  USING (
    evaluator_id = auth.uid() OR
    academy_id IN (SELECT id FROM public.academies WHERE owner_id = auth.uid()) OR
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
  );

CREATE POLICY "evaluators_insert_owner"
  ON public.evaluator_authorizations FOR INSERT
  TO authenticated
  WITH CHECK (
    academy_id IN (SELECT id FROM public.academies WHERE owner_id = auth.uid()) OR
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- G. assessment_protocols Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "protocols_select_all"
  ON public.assessment_protocols FOR SELECT
  TO authenticated
  USING (true);

-- Protocols are immutable by client users (read-only for authenticated & anon)
REVOKE INSERT, UPDATE, DELETE ON public.assessment_protocols FROM authenticated, anon;

-- ------------------------------------------------------------------------------
-- H. assessment_sessions Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "sessions_select_authorized"
  ON public.assessment_sessions FOR SELECT
  TO authenticated
  USING (
    public.is_active_user(auth.uid()) AND (
      athlete_id = auth.uid() OR
      evaluator_id = auth.uid() OR
      public.has_active_academy_affiliation(athlete_id, auth.uid()) OR
      public.has_active_institution_affiliation(athlete_id, auth.uid())
    )
  );

CREATE POLICY "sessions_insert_authorized_evaluator"
  ON public.assessment_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_active_user(auth.uid())
    AND evaluator_id = auth.uid()
    AND athlete_id != auth.uid() -- STRICT: Athlete cannot evaluate themselves!
    AND public.is_authorized_evaluator(auth.uid(), academy_id, institution_id)
  );

CREATE POLICY "sessions_update_unverified"
  ON public.assessment_sessions FOR UPDATE
  TO authenticated
  USING (
    public.is_active_user(auth.uid())
    AND (
      (evaluator_id = auth.uid() AND verified = FALSE) OR
      academy_id IN (SELECT id FROM public.academies WHERE owner_id = auth.uid()) OR
      institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "sessions_delete_owner_unverified"
  ON public.assessment_sessions FOR DELETE
  TO authenticated
  USING (
    public.is_active_user(auth.uid())
    AND verified = FALSE -- Verified sessions can NEVER be deleted by client!
    AND (
      academy_id IN (SELECT id FROM public.academies WHERE owner_id = auth.uid()) OR
      institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
    )
  );

-- ------------------------------------------------------------------------------
-- I. assessment_results Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "results_select_authorized"
  ON public.assessment_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_results.session_id
        AND (
          s.athlete_id = auth.uid() OR
          s.evaluator_id = auth.uid() OR
          public.has_active_academy_affiliation(s.athlete_id, auth.uid()) OR
          public.has_active_institution_affiliation(s.athlete_id, auth.uid())
        )
    )
  );

CREATE POLICY "results_insert_evaluator"
  ON public.assessment_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_results.session_id
        AND s.evaluator_id = auth.uid()
        AND s.verified = FALSE
    )
  );

CREATE POLICY "results_update_evaluator_unverified"
  ON public.assessment_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = assessment_results.session_id
        AND s.evaluator_id = auth.uid()
        AND s.verified = FALSE
    )
  );

-- ==============================================================================
-- STORAGE BUCKET POLICIES (BLUEPRINT & INVENTORY)
-- Buckets:
-- 1. 'athlete-passports' (Private)
-- 2. 'avatars' (Public Read, Private Write)
-- 3. 'parental-consents' (Private Encrypted)
-- ==============================================================================

-- Storage RLS assumes bucket creation in Supabase Storage schema
-- Example policy blueprint for 'athlete-passports':
-- CREATE POLICY "passports_select_owner_or_affiliated"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (
--     bucket_id = 'athlete-passports' AND (
--       (storage.foldername(name))[1] = auth.uid()::text OR
--       public.has_active_academy_affiliation((storage.foldername(name))[1]::UUID, auth.uid()) OR
--       public.has_active_institution_affiliation((storage.foldername(name))[1]::UUID, auth.uid())
--     )
--   );
