-- ========================================================
-- PratibhaScan Database Schema (Supabase / PostgreSQL)
-- Migration: 20261112000000_initial_schema.sql
-- Description: Core tables for athletes, academies, institutions,
--              standardized assessment protocols & score tracking
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles (Extending auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'coach', 'academy_admin', 'institution_officer', 'admin')),
  avatar_url TEXT,
  phone_number TEXT,
  state TEXT,
  district TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Academies Table
CREATE TABLE IF NOT EXISTS public.academies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  sports_offered TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Institutions (Schools, Colleges, State Sports Boards)
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('school', 'college', 'university', 'sports_board', 'federation')),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Athletes Profile Details
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

-- 5. Standard Assessment Protocols (Benchmark Tests)
CREATE TABLE IF NOT EXISTS public.assessment_protocols (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('anthropometric', 'speed', 'endurance', 'power', 'agility', 'flexibility')),
  unit TEXT NOT NULL,
  lower_is_better BOOLEAN DEFAULT FALSE,
  description TEXT,
  elite_benchmark NUMERIC(8, 2),
  good_benchmark NUMERIC(8, 2),
  average_benchmark NUMERIC(8, 2),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. Assessment Sessions
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
  evaluator_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL,
  venue TEXT,
  composite_score NUMERIC(5, 2),
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. Assessment Results / Individual Test Trials
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

-- Row Level Security (RLS) Setup
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Base RLS Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can edit their own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Assessment protocols are readable by all authenticated users"
  ON public.assessment_protocols FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Athletes can view their own assessment sessions"
  ON public.assessment_sessions FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid() OR evaluator_id = auth.uid());
