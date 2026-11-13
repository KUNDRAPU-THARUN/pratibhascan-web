import { supabase } from '@/lib/supabase';
import type { AcademyProfileUpdateFormData } from './academySchemas';
import { calculateAge } from '@/features/athlete/athleteService';

export interface DetailedSessionResult {
  protocolCode: string;
  protocolTitle: string;
  unit: string;
  bestScore: number;
  percentileRank: number | null;
  trials: (number | null)[];
}

export interface DetailedSession {
  sessionId: string;
  assessmentDate: string;
  venue: string | null;
  verified: boolean;
  notes: string | null;
  evaluatorName: string;
  results: DetailedSessionResult[];
}

export interface RosterAthlete {
  affiliationId: string;
  athleteId: string;
  fullName: string;
  email: string;
  primarySport: string;
  secondarySport: string | null;
  gender: string;
  dateOfBirth: string;
  age: number;
  isMinor: boolean;
  heightCm: number;
  weightKg: number;
  status: 'active' | 'pending' | 'rejected' | 'revoked';
  requestedBy: string;
  isOutboundInvite: boolean;
  affiliatedSince: string;
  latestSprint30m: string | null;
  latestVertJump: string | null;
  assessmentCount: number;
}

export interface AcademyEvaluator {
  id: string;
  evaluatorId: string;
  fullName: string;
  email: string;
  status: string;
  accreditationNumber: string | null;
}

export interface AcademyDashboardData {
  academy: {
    id: string;
    ownerId: string;
    name: string;
    registrationNumber: string | null;
    contactEmail: string;
    contactPhone: string | null;
    state: string;
    district: string;
    address: string | null;
    sportsOffered: string[];
    verified: boolean;
    createdAt: string;
  };
  metrics: {
    enrolledAthletesCount: number;
    pendingRequestsCount: number;
    certifiedCoachesCount: number;
    conductedAssessmentsCount: number;
  };
  roster: RosterAthlete[];
  evaluators: AcademyEvaluator[];
}

/**
 * Fetches real academy dashboard data from Supabase for the authenticated academy owner.
 * Strictly enforces RLS - only retrieves data owned by or affiliated with this academy.
 */
export async function fetchAcademyDashboardData(ownerId: string): Promise<AcademyDashboardData> {
  if (!supabase) throw new Error('Supabase client is not available');

  // 1. Fetch Academy record owned by user
  const { data: academy, error: acadErr } = await supabase
    .from('academies')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (acadErr) {
    throw new Error(acadErr.message);
  }

  if (!academy) {
    throw new Error('No registered academy found for this account. Please complete academy onboarding.');
  }

  const academyId = academy.id;

  // 2. Fetch athlete affiliations for this academy
  const { data: affiliations, error: affErr } = await supabase
    .from('athlete_affiliations')
    .select('*')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (affErr) {
    throw new Error(affErr.message);
  }

  const roster: RosterAthlete[] = [];
  let enrolledCount = 0;
  let pendingCount = 0;

  if (affiliations && affiliations.length > 0) {
    for (const aff of affiliations) {
      if (aff.status === 'active') enrolledCount++;
      if (aff.status === 'pending') pendingCount++;

      // Fetch athlete user profile (name, email)
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', aff.athlete_id)
        .maybeSingle();

      // Fetch athlete physical baseline
      const { data: athleteRecord } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', aff.athlete_id)
        .maybeSingle();

      const athleteName = userProfile?.full_name || 'Candidate Athlete';
      const athleteEmail = userProfile?.email || '';
      const primarySport = athleteRecord?.primary_sport || 'General Fitness';
      const secondarySport = athleteRecord?.secondary_sport || null;
      const gender = athleteRecord?.gender || 'other';
      const dob = athleteRecord?.date_of_birth || '2008-01-01';
      const age = calculateAge(dob);
      const isMinor = age < 18;
      const height = athleteRecord?.height_cm ? Number(athleteRecord.height_cm) : 0;
      const weight = athleteRecord?.weight_kg ? Number(athleteRecord.weight_kg) : 0;

      // If active affiliation, query verified assessment history for sprint and jump
      let latestSprint: string | null = null;
      let latestJump: string | null = null;
      let assessmentCount = 0;

      if (aff.status === 'active') {
        const { data: sessions } = await supabase
          .from('assessment_sessions')
          .select('id, assessment_date')
          .eq('athlete_id', aff.athlete_id)
          .eq('academy_id', academyId);

        if (sessions && sessions.length > 0) {
          assessmentCount = sessions.length;
          const sessionIds = sessions.map((s) => s.id);

          const { data: results } = await supabase
            .from('assessment_results')
            .select('*')
            .in('session_id', sessionIds);

          if (results) {
            for (const r of results) {
              const { data: proto } = await supabase
                .from('assessment_protocols')
                .select('code, unit')
                .eq('id', r.protocol_id)
                .maybeSingle();

              if (proto?.code === 'TEST_30M_SPRINT' && !latestSprint) {
                latestSprint = `${r.best_score}${proto.unit}`;
              } else if (proto?.code === 'TEST_VERT_JUMP' && !latestJump) {
                latestJump = `${r.best_score}${proto.unit}`;
              }
            }
          }
        }
      }

      roster.push({
        affiliationId: aff.id,
        athleteId: aff.athlete_id,
        fullName: athleteName,
        email: athleteEmail,
        primarySport,
        secondarySport,
        gender,
        dateOfBirth: dob,
        age,
        isMinor,
        heightCm: height,
        weightKg: weight,
        status: aff.status as 'active' | 'pending' | 'rejected' | 'revoked',
        requestedBy: aff.requested_by,
        isOutboundInvite: aff.requested_by === ownerId,
        affiliatedSince: aff.created_at,
        latestSprint30m: latestSprint,
        latestVertJump: latestJump,
        assessmentCount,
      });
    }
  }

  // 3. Fetch certified coaches / evaluators
  const { data: evaluatorsData } = await supabase
    .from('evaluator_authorizations')
    .select('*')
    .eq('academy_id', academyId)
    .eq('status', 'active');

  const evaluators: AcademyEvaluator[] = [];
  if (evaluatorsData && evaluatorsData.length > 0) {
    for (const ev of evaluatorsData) {
      const { data: evProfile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', ev.evaluator_id)
        .maybeSingle();

      evaluators.push({
        id: ev.id,
        evaluatorId: ev.evaluator_id,
        fullName: evProfile?.full_name || 'Accredited Coach',
        email: evProfile?.email || '',
        status: ev.status,
        accreditationNumber: ev.accreditation_number,
      });
    }
  }

  // 4. Fetch total conducted assessment sessions by this academy
  const { count: conductedSessionsCount } = await supabase
    .from('assessment_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId);

  return {
    academy: {
      id: academy.id,
      ownerId: academy.owner_id,
      name: academy.name,
      registrationNumber: academy.registration_number,
      contactEmail: academy.contact_email,
      contactPhone: academy.contact_phone,
      state: academy.state,
      district: academy.district,
      address: academy.address,
      sportsOffered: academy.sports_offered || [],
      verified: academy.verified,
      createdAt: academy.created_at,
    },
    metrics: {
      enrolledAthletesCount: enrolledCount,
      pendingRequestsCount: pendingCount,
      certifiedCoachesCount: evaluators.length,
      conductedAssessmentsCount: conductedSessionsCount || 0,
    },
    roster,
    evaluators,
  };
}

/**
 * Updates permitted Academy Profile fields.
 * Strictly prevents modification of owner_id, verified, or id.
 */
export async function updateAcademyProfile(
  academyId: string,
  formData: AcademyProfileUpdateFormData
): Promise<{ error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    const { error } = await supabase
      .from('academies')
      .update({
        name: formData.name,
        registration_number: formData.registrationNumber || null,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone || null,
        state: formData.state,
        district: formData.district,
        address: formData.address || null,
        sports_offered: formData.sportsOffered,
      })
      .eq('id', academyId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Approves an inbound affiliation request from an athlete.
 * Sets status to 'active' and records approver ID.
 */
export async function approveAffiliation(
  affiliationId: string,
  approverId: string
): Promise<{ error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    const { error } = await supabase
      .from('athlete_affiliations')
      .update({
        status: 'active',
        approved_by: approverId,
      })
      .eq('id', affiliationId);

    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Rejects an inbound affiliation request from an athlete.
 * Sets status to 'rejected'.
 */
export async function rejectAffiliation(
  affiliationId: string
): Promise<{ error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    const { error } = await supabase
      .from('athlete_affiliations')
      .update({
        status: 'rejected',
      })
      .eq('id', affiliationId);

    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Revokes an existing active affiliation with an athlete.
 * Immediately terminates the academy's access to private assessment data.
 */
export async function revokeAffiliation(
  affiliationId: string
): Promise<{ error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    const { error } = await supabase
      .from('athlete_affiliations')
      .update({
        status: 'revoked',
      })
      .eq('id', affiliationId);

    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Creates an outbound affiliation invitation from the academy to an athlete.
 * Enforces 'pending' status - grants NO data access until athlete confirms.
 */
export async function createAffiliationRequest(
  academyId: string,
  athleteId: string,
  requesterId: string
): Promise<{ error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    // 1. Verify candidate athlete exists
    const { data: athleteRecord, error: findErr } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .maybeSingle();

    if (findErr || !athleteRecord) {
      return { error: new Error('Athlete ID not found in system. Please verify candidate UUID.') };
    }

    // 2. Insert affiliation request
    const { error: insertErr } = await supabase
      .from('athlete_affiliations')
      .insert({
        athlete_id: athleteId,
        organization_type: 'academy',
        academy_id: academyId,
        status: 'pending',
        requested_by: requesterId,
      });

    if (insertErr) {
      if (insertErr.message.includes('unique_active_affiliation')) {
        return { error: new Error('An active or pending affiliation already exists for this candidate.') };
      }
      return { error: new Error(insertErr.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Fetches detailed assessment session history for an authorized athlete.
 * Returns empty if affiliation is not active or unauthorized under RLS.
 */
export async function fetchAthleteDetailedHistory(
  athleteId: string,
  academyId: string
): Promise<{ sessions: DetailedSession[]; error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    const { data: sessionRows, error: sessErr } = await supabase
      .from('assessment_sessions')
      .select('id, assessment_date, venue, verified, notes, evaluator_id')
      .eq('athlete_id', athleteId)
      .eq('academy_id', academyId)
      .order('assessment_date', { ascending: false });

    if (sessErr) {
      return { sessions: [], error: new Error(sessErr.message) };
    }

    if (!sessionRows || sessionRows.length === 0) {
      return { sessions: [], error: null };
    }

    const sessions: DetailedSession[] = [];

    for (const sess of sessionRows) {
      // Fetch evaluator display name
      const { data: evUser } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', sess.evaluator_id)
        .maybeSingle();

      const evaluatorName = evUser?.full_name || 'Accredited Evaluator';

      // Fetch individual protocol test scores
      const { data: resultsRows } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('session_id', sess.id);

      const results: DetailedSessionResult[] = [];
      if (resultsRows) {
        for (const r of resultsRows) {
          const { data: proto } = await supabase
            .from('assessment_protocols')
            .select('code, title, unit')
            .eq('id', r.protocol_id)
            .maybeSingle();

          results.push({
            protocolCode: proto?.code || 'UNKNOWN',
            protocolTitle: proto?.title || 'Protocol Test',
            unit: proto?.unit || '',
            bestScore: Number(r.best_score),
            percentileRank: r.percentile_rank ? Number(r.percentile_rank) : null,
            trials: [
              r.trial_1 ? Number(r.trial_1) : null,
              r.trial_2 ? Number(r.trial_2) : null,
              r.trial_3 ? Number(r.trial_3) : null,
            ],
          });
        }
      }

      sessions.push({
        sessionId: sess.id,
        assessmentDate: sess.assessment_date,
        venue: sess.venue,
        verified: sess.verified,
        notes: sess.notes,
        evaluatorName,
        results,
      });
    }

    return { sessions, error: null };
  } catch (err) {
    return { sessions: [], error: err as Error };
  }
}
