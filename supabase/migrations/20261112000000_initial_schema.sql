-- ==============================================================================
-- PRATIBHASCAN DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- COMPANY: KAARYAN LABS
-- PRODUCT: PratibhaScan (Web & Mobile Ecosystem)
-- Migration: 20261112000000_initial_schema.sql
-- Phase: Architectural Blueprint (Phase 1.5 Security Hardening)
--
-- NOTE: This draft migration incorporates strict 3-role authorization,
-- Row Level Security (RLS), privilege escalation guards, and ownership tracking.
-- DO NOT RUN AGAINST PRODUCTION UNTIL PHASE 2 ACTIVATION.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USER PROFILES
-- Extends Supabase auth.users with PratibhaScan domain metadata.
-- Strictly limited to three ecosystem roles: 'athlete', 'academy', 'institution'.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'academy', 'institution')),
  phone_number TEXT,
  avatar_url TEXT,
  state TEXT,
  district TEXT,
  organization_id UUID, -- References academy or institution when applicable
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Trigger: Prevent arbitrary self-elevation of role
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role escalation or modification is forbidden. Contact platform governance.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_modification ON public.user_profiles;
CREATE TRIGGER trg_prevent_role_modification
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_modification();

-- ------------------------------------------------------------------------------
-- 2. ACADEMIES
-- Registered coaching academies and high-performance training centers.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. INSTITUTIONS
-- Schools, colleges, universities, and district/state sports boards.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. ATHLETES
-- Biometric details and affiliation links for athletes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.athletes (
  id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  primary_sport TEXT NOT NULL,
  secondary_sport TEXT,
  height_cm NUMERIC(5, 2) NOT NULL,
  weight_kg NUMERIC(5, 2) NOT NULL,
  wingspan_cm NUMERIC(5, 2),
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  composite_talent_score NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. ASSESSMENT PROTOCOLS
-- Catalog of standardized tests modeled on Sports Authority of India norms.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. ASSESSMENT SESSIONS
-- Formal testing sessions scheduled and conducted by verified evaluators.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
  evaluator_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL,
  venue TEXT,
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. ASSESSMENT RESULTS
-- Multi-trial physical data recorded during an assessment session.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  protocol_id UUID REFERENCES public.assessment_protocols(id) NOT NULL,
  trial_1 NUMERIC(8, 2),
  trial_2 NUMERIC(8, 2),
  trial_3 NUMERIC(8, 2),
  best_score NUMERIC(8, 2) NOT NULL,
  percentile_rank NUMERIC(5, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- 1. user_profiles Policies
CREATE POLICY "user_profiles_select_authenticated"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_profiles_update_owner"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 2. academies Policies
CREATE POLICY "academies_select_public"
  ON public.academies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "academies_insert_owner"
  ON public.academies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "academies_update_owner"
  ON public.academies FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 3. institutions Policies
CREATE POLICY "institutions_select_public"
  ON public.institutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "institutions_insert_owner"
  ON public.institutions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "institutions_update_owner"
  ON public.institutions FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 4. athletes Policies
CREATE POLICY "athletes_select_authenticated"
  ON public.athletes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "athletes_insert_self"
  ON public.athletes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "athletes_update_self"
  ON public.athletes FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 5. assessment_protocols Policies
CREATE POLICY "protocols_select_all"
  ON public.assessment_protocols FOR SELECT
  TO authenticated
  USING (true);

-- 6. assessment_sessions Policies
CREATE POLICY "sessions_select_involved"
  ON public.assessment_sessions FOR SELECT
  TO authenticated
  USING (
    athlete_id = auth.uid() OR
    evaluator_id = auth.uid() OR
    academy_id IN (SELECT id FROM public.academies WHERE owner_id = auth.uid()) OR
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
  );

CREATE POLICY "sessions_insert_evaluators"
  ON public.assessment_sessions FOR INSERT
  TO authenticated
  WITH CHECK (evaluator_id = auth.uid());

-- 7. assessment_results Policies
CREATE POLICY "results_select_involved"
  ON public.assessment_results FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions
      WHERE athlete_id = auth.uid() OR evaluator_id = auth.uid()
    )
  );

CREATE POLICY "results_insert_evaluator"
  ON public.assessment_results FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.assessment_sessions
      WHERE evaluator_id = auth.uid()
    )
  );

-- ==============================================================================
-- STORAGE BUCKETS SPECIFICATION (PHASE 2 BLUEPRINT)
-- ==============================================================================
-- Target Buckets:
-- 1. 'athlete-passports' (Private: Read restricted to athlete and verified scouts)
-- 2. 'avatars' (Public read: Authenticated write to own folder)
-- 3. 'parental-consents' (Private: Encrypted, read restricted to compliance officers)
