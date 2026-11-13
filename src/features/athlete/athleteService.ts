import { supabase } from '@/lib/supabase';
import type { AthleteProfileUpdateFormData } from './athleteSchemas';

export interface AthleteDashboardData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  state: string;
  district: string;
  dateOfBirth: string;
  age: number;
  isMinor: boolean;
  gender: string;
  primarySport: string;
  secondarySport: string | null;
  heightCm: number;
  weightKg: number;
  wingspanCm: number | null;
  apeIndex: number | null;
  bmi: number;
  compositeTalentScore: number;
  activeAffiliation: {
    id: string;
    name: string;
    type: 'academy' | 'institution';
    state: string;
    district: string;
  } | null;
  pendingAffiliations: Array<{
    id: string;
    name: string;
    type: 'academy' | 'institution';
    requestedAt: string;
  }>;
  assessmentSessions: Array<{
    id: string;
    date: string;
    venue: string | null;
    verified: boolean;
    evaluatorName: string;
    organizationName: string;
    results: Array<{
      id: string;
      protocolCode: string;
      protocolTitle: string;
      protocolCategory: string;
      unit: string;
      lowerIsBetter: boolean;
      trial1: number | null;
      trial2: number | null;
      trial3: number | null;
      bestScore: number;
      percentileRank: number | null;
      status: string;
    }>;
  }>;
  benchmarks: {
    sprint30m: { bestScore: number; percentile: number | null; date: string } | null;
    vertJump: { bestScore: number; percentile: number | null; date: string } | null;
    beepTest: { bestScore: number; percentile: number | null; date: string } | null;
  };
}

/**
 * Calculates accurate chronological age from Date of Birth string (YYYY-MM-DD).
 */
export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Calculates Ape Index: wingspan in cm minus standing height in cm.
 * A positive index indicates wingspan greater than height.
 */
export function calculateApeIndex(wingspanCm: number | null, heightCm: number): number | null {
  if (!wingspanCm || !heightCm || heightCm <= 0) return null;
  return parseFloat((wingspanCm - heightCm).toFixed(1));
}

/**
 * Calculates Body Mass Index (BMI).
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Fetches complete real-world athlete dashboard data from Supabase.
 * Respects RLS - queries only data accessible to the authenticated athlete.
 */
export async function fetchAthleteDashboardData(athleteId: string): Promise<AthleteDashboardData> {
  if (!supabase) throw new Error('Supabase client is not available');

  // 1. Fetch user profile
  const { data: profile, error: profileErr } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role, phone_number, avatar_url, state, district, is_suspended')
    .eq('id', athleteId)
    .single();

  if (profileErr || !profile) {
    throw new Error(profileErr?.message || 'Failed to load athlete profile');
  }

  // 2. Fetch athlete baseline
  const { data: athlete, error: athleteErr } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athleteId)
    .single();

  if (athleteErr || !athlete) {
    throw new Error(athleteErr?.message || 'Athlete baseline record not found');
  }

  // 3. Fetch affiliations
  const { data: affiliations } = await supabase
    .from('athlete_affiliations')
    .select('*')
    .eq('athlete_id', athleteId);

  let activeAffiliation: AthleteDashboardData['activeAffiliation'] = null;
  const pendingAffiliations: AthleteDashboardData['pendingAffiliations'] = [];

  if (affiliations && affiliations.length > 0) {
    for (const aff of affiliations) {
      let orgName = 'Sports Organization';
      let orgState = profile.state || '';
      let orgDistrict = profile.district || '';

      if (aff.organization_type === 'academy' && aff.academy_id) {
        const { data: acad } = await supabase
          .from('academies')
          .select('name, state, district')
          .eq('id', aff.academy_id)
          .maybeSingle();
        if (acad) {
          orgName = acad.name;
          orgState = acad.state;
          orgDistrict = acad.district;
        }
      } else if (aff.organization_type === 'institution' && aff.institution_id) {
        const { data: inst } = await supabase
          .from('institutions')
          .select('name, state, district')
          .eq('id', aff.institution_id)
          .maybeSingle();
        if (inst) {
          orgName = inst.name;
          orgState = inst.state;
          orgDistrict = inst.district;
        }
      }

      if (aff.status === 'active' && !activeAffiliation) {
        activeAffiliation = {
          id: aff.id,
          name: orgName,
          type: aff.organization_type as 'academy' | 'institution',
          state: orgState,
          district: orgDistrict,
        };
      } else if (aff.status === 'pending') {
        pendingAffiliations.push({
          id: aff.id,
          name: orgName,
          type: aff.organization_type as 'academy' | 'institution',
          requestedAt: aff.created_at,
        });
      }
    }
  }

  // 4. Fetch assessment sessions
  const { data: sessions } = await supabase
    .from('assessment_sessions')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('assessment_date', { ascending: false });

  const assessmentSessions: AthleteDashboardData['assessmentSessions'] = [];
  const benchmarks: AthleteDashboardData['benchmarks'] = {
    sprint30m: null,
    vertJump: null,
    beepTest: null,
  };

  if (sessions && sessions.length > 0) {
    for (const sess of sessions) {
      // Fetch evaluator name
      let evaluatorName = 'Certified Evaluator';
      if (sess.evaluator_id) {
        const { data: evProfile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', sess.evaluator_id)
          .maybeSingle();
        if (evProfile) evaluatorName = evProfile.full_name;
      }

      // Fetch organization name
      let orgName = 'Direct Field Assessment';
      if (sess.academy_id) {
        const { data: acad } = await supabase
          .from('academies')
          .select('name')
          .eq('id', sess.academy_id)
          .maybeSingle();
        if (acad) orgName = acad.name;
      } else if (sess.institution_id) {
        const { data: inst } = await supabase
          .from('institutions')
          .select('name')
          .eq('id', sess.institution_id)
          .maybeSingle();
        if (inst) orgName = inst.name;
      }

      // Fetch results
      const { data: results } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('session_id', sess.id);

      const mappedResults: AthleteDashboardData['assessmentSessions'][0]['results'] = [];

      if (results && results.length > 0) {
        for (const res of results) {
          // Fetch protocol definition
          const { data: proto } = await supabase
            .from('assessment_protocols')
            .select('*')
            .eq('id', res.protocol_id)
            .maybeSingle();

          const protoCode = proto?.code || 'UNKNOWN';
          const protoTitle = proto?.title || 'Physical Test';
          const protoCategory = proto?.category || 'general';
          const protoUnit = proto?.unit || '';
          const protoLowerIsBetter = proto?.lower_is_better || false;

          mappedResults.push({
            id: res.id,
            protocolCode: protoCode,
            protocolTitle: protoTitle,
            protocolCategory: protoCategory,
            unit: protoUnit,
            lowerIsBetter: protoLowerIsBetter,
            trial1: res.trial_1,
            trial2: res.trial_2,
            trial3: res.trial_3,
            bestScore: res.best_score,
            percentileRank: res.percentile_rank,
            status: res.status,
          });

          // Check benchmarks if verified
          if (protoCode === 'TEST_30M_SPRINT' && (!benchmarks.sprint30m || res.best_score < benchmarks.sprint30m.bestScore)) {
            benchmarks.sprint30m = {
              bestScore: res.best_score,
              percentile: res.percentile_rank,
              date: sess.assessment_date,
            };
          } else if (protoCode === 'TEST_VERT_JUMP' && (!benchmarks.vertJump || res.best_score > benchmarks.vertJump.bestScore)) {
            benchmarks.vertJump = {
              bestScore: res.best_score,
              percentile: res.percentile_rank,
              date: sess.assessment_date,
            };
          } else if (protoCode === 'TEST_BEEP_RUN' && (!benchmarks.beepTest || res.best_score > benchmarks.beepTest.bestScore)) {
            benchmarks.beepTest = {
              bestScore: res.best_score,
              percentile: res.percentile_rank,
              date: sess.assessment_date,
            };
          }
        }
      }

      assessmentSessions.push({
        id: sess.id,
        date: sess.assessment_date,
        venue: sess.venue,
        verified: sess.verified,
        evaluatorName,
        organizationName: orgName,
        results: mappedResults,
      });
    }
  }

  const age = calculateAge(athlete.date_of_birth);
  const apeIndex = calculateApeIndex(athlete.wingspan_cm, athlete.height_cm);
  const bmi = calculateBMI(athlete.weight_kg, athlete.height_cm);

  return {
    id: athlete.id,
    fullName: profile.full_name,
    email: profile.email,
    phoneNumber: profile.phone_number,
    avatarUrl: profile.avatar_url,
    state: profile.state || 'Not specified',
    district: profile.district || 'Not specified',
    dateOfBirth: athlete.date_of_birth,
    age,
    isMinor: age < 18,
    gender: athlete.gender,
    primarySport: athlete.primary_sport,
    secondarySport: athlete.secondary_sport,
    heightCm: Number(athlete.height_cm),
    weightKg: Number(athlete.weight_kg),
    wingspanCm: athlete.wingspan_cm ? Number(athlete.wingspan_cm) : null,
    apeIndex,
    bmi,
    compositeTalentScore: Number(athlete.composite_talent_score || 0),
    activeAffiliation,
    pendingAffiliations,
    assessmentSessions,
    benchmarks,
  };
}

/**
 * Updates permitted athlete profile fields.
 * Strictly ignores any role or administrative fields.
 */
export async function updateAthleteProfile(
  athleteId: string,
  formData: AthleteProfileUpdateFormData
): Promise<{ error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    // 1. Update user_profiles (permitted fields: full_name, phone_number, state, district)
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .update({
        full_name: formData.fullName,
        phone_number: formData.phoneNumber || null,
        state: formData.state,
        district: formData.district,
      })
      .eq('id', athleteId);

    if (profileErr) {
      return { error: new Error(profileErr.message) };
    }

    // 2. Update athletes (permitted fields: primary_sport, secondary_sport, height_cm, weight_kg, wingspan_cm)
    const { error: athleteErr } = await supabase
      .from('athletes')
      .update({
        primary_sport: formData.primarySport,
        secondary_sport: formData.secondarySport || null,
        height_cm: formData.heightCm,
        weight_kg: formData.weightKg,
        wingspan_cm: formData.wingspanCm || null,
      })
      .eq('id', athleteId);

    if (athleteErr) {
      return { error: new Error(athleteErr.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}
