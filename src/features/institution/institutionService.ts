import { supabase } from '@/lib/supabase';
import type { InstitutionProfileUpdateFormData, InstitutionType } from './institutionSchemas';
import { calculateAge } from '@/features/athlete/athleteService';

export interface StudentAthlete {
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

export interface InstitutionEvaluator {
  id: string;
  evaluatorId: string;
  fullName: string;
  email: string;
  status: string;
  accreditationNumber: string | null;
}

export interface InstitutionProfile {
  id: string;
  ownerId: string;
  name: string;
  type: InstitutionType;
  contactEmail: string;
  contactPhone: string | null;
  state: string;
  district: string;
  verified: boolean;
  createdAt: string;
}

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

export interface InstitutionDashboardData {
  institution: InstitutionProfile;
  metrics: {
    totalEnrolledStudents: number;
    pendingApplicationsCount: number;
    authorizedEvaluatorsCount: number;
    conductedAssessmentsCount: number;
  };
  sportsBreakdown: Record<string, number>;
  students: StudentAthlete[];
  evaluators: InstitutionEvaluator[];
}

/**
 * Fetches real institution dashboard data from Supabase for the authenticated owner.
 * Strictly enforces RLS - only retrieves data owned by or affiliated with this institution.
 */
export async function fetchInstitutionDashboardData(ownerId: string): Promise<InstitutionDashboardData> {
  if (!supabase) throw new Error('Supabase client is not available');

  // 1. Fetch Institution record owned by authenticated user
  const { data: institution, error: instErr } = await supabase
    .from('institutions')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (instErr) {
    throw new Error(instErr.message);
  }

  if (!institution) {
    throw new Error('No registered institution found for this account. Please complete institution onboarding.');
  }

  const institutionId = institution.id;

  // 2. Fetch student affiliations for this institution
  const { data: affiliations, error: affErr } = await supabase
    .from('athlete_affiliations')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('organization_type', 'institution')
    .order('created_at', { ascending: false });

  if (affErr) {
    throw new Error(affErr.message);
  }

  const students: StudentAthlete[] = [];
  const sportsBreakdown: Record<string, number> = {};
  let enrolledCount = 0;
  let pendingCount = 0;

  if (affiliations && affiliations.length > 0) {
    for (const aff of affiliations) {
      if (aff.status === 'active') enrolledCount++;
      if (aff.status === 'pending') pendingCount++;

      // Fetch student user profile (name, email)
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', aff.athlete_id)
        .maybeSingle();

      // Fetch student physical baseline
      const { data: athleteRecord } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', aff.athlete_id)
        .maybeSingle();

      const athleteName = userProfile?.full_name || 'Student Candidate';
      const athleteEmail = userProfile?.email || '';
      const primarySport = athleteRecord?.primary_sport || 'General Physical Education';
      const secondarySport = athleteRecord?.secondary_sport || null;
      const gender = athleteRecord?.gender || 'other';
      const dob = athleteRecord?.date_of_birth || '2008-01-01';
      const age = calculateAge(dob);
      const isMinor = age < 18;
      const height = athleteRecord?.height_cm ? Number(athleteRecord.height_cm) : 0;
      const weight = athleteRecord?.weight_kg ? Number(athleteRecord.weight_kg) : 0;

      // Track sport participation distribution for active students
      if (aff.status === 'active') {
        sportsBreakdown[primarySport] = (sportsBreakdown[primarySport] || 0) + 1;
      }

      // If active affiliation, query verified assessment history for sprint and jump
      let latestSprint: string | null = null;
      let latestJump: string | null = null;
      let assessmentCount = 0;

      if (aff.status === 'active') {
        const { data: sessions } = await supabase
          .from('assessment_sessions')
          .select('id, assessment_date')
          .eq('athlete_id', aff.athlete_id)
          .eq('institution_id', institutionId);

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

      students.push({
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

  // 3. Fetch certified staff evaluators authorized for this institution
  const { data: evaluatorsData } = await supabase
    .from('evaluator_authorizations')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('organization_type', 'institution')
    .eq('status', 'active');

  const evaluators: InstitutionEvaluator[] = [];
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
        fullName: evProfile?.full_name || 'Accredited Tester',
        email: evProfile?.email || '',
        status: ev.status,
        accreditationNumber: ev.accreditation_number,
      });
    }
  }

  // 4. Fetch total conducted assessment sessions by this institution
  const { count: conductedSessionsCount } = await supabase
    .from('assessment_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', institutionId);

  return {
    institution: {
      id: institution.id,
      ownerId: institution.owner_id,
      name: institution.name,
      type: institution.type as InstitutionType,
      contactEmail: institution.contact_email,
      contactPhone: institution.contact_phone,
      state: institution.state,
      district: institution.district,
      verified: institution.verified,
      createdAt: institution.created_at,
    },
    metrics: {
      totalEnrolledStudents: enrolledCount,
      pendingApplicationsCount: pendingCount,
      authorizedEvaluatorsCount: evaluators.length,
      conductedAssessmentsCount: conductedSessionsCount || 0,
    },
    sportsBreakdown,
    students,
    evaluators,
  };
}

/**
 * Updates permitted Institution Profile fields.
 * Strictly prevents modification of owner_id, verified, or id.
 */
export async function updateInstitutionProfile(
  institutionId: string,
  formData: InstitutionProfileUpdateFormData
): Promise<{ error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    const { error } = await supabase
      .from('institutions')
      .update({
        name: formData.name,
        type: formData.type,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone || null,
        state: formData.state,
        district: formData.district,
      })
      .eq('id', institutionId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Approves an inbound affiliation request from a student-athlete.
 * Sets status to 'active' and records approver ID.
 */
export async function approveStudentAffiliation(
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
 * Rejects an inbound affiliation request from a student-athlete.
 * Sets status to 'rejected'.
 */
export async function rejectStudentAffiliation(
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
 * Revokes an existing active affiliation with a student-athlete.
 * Immediately terminates the institution's access to private assessment data.
 */
export async function revokeStudentAffiliation(
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
 * Creates an outbound affiliation invitation from the institution to a student-athlete.
 * Enforces 'pending' status - grants NO data access until student confirms.
 */
export async function createStudentAffiliationRequest(
  institutionId: string,
  athleteId: string,
  requesterId: string
): Promise<{ error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    // 1. Verify candidate student-athlete exists
    const { data: athleteRecord, error: findErr } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .maybeSingle();

    if (findErr || !athleteRecord) {
      return { error: new Error('Student-Athlete ID not found in system. Please verify candidate UUID.') };
    }

    // 2. Insert affiliation request
    const { error: insertErr } = await supabase
      .from('athlete_affiliations')
      .insert({
        athlete_id: athleteId,
        organization_type: 'institution',
        institution_id: institutionId,
        status: 'pending',
        requested_by: requesterId,
      });

    if (insertErr) {
      if (insertErr.message.includes('unique_active_affiliation')) {
        return { error: new Error('An active or pending affiliation already exists for this candidate with your institution.') };
      }
      return { error: new Error(insertErr.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Fetches detailed assessment session history for an authorized student-athlete.
 * Returns empty if affiliation is not active or unauthorized under RLS.
 */
export async function fetchStudentDetailedHistory(
  athleteId: string,
  institutionId: string
): Promise<{ sessions: DetailedSession[]; error: Error | null }> {
  try {
    if (!supabase) throw new Error('Supabase client is not available');

    const { data: sessionRows, error: sessErr } = await supabase
      .from('assessment_sessions')
      .select('id, assessment_date, venue, verified, notes, evaluator_id')
      .eq('athlete_id', athleteId)
      .eq('institution_id', institutionId)
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

      const evaluatorName = evUser?.full_name || 'Accredited Tester';

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
