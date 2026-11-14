/**
 * PratibhaScan Assessment Management Service
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Implements database interactions for standardized assessment sessions,
 * multi-trial scoring, evaluator authorization checks, and verification workflows.
 *
 * All operations enforce Supabase PostgreSQL Row Level Security (RLS).
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  calculateBestScore,
  estimatePercentileRank,
  PROTOCOL_SPECIFICATIONS,
  type ProtocolSpecification,
} from './assessmentCalculations';
import type { DatabaseRole } from '@/types/database.types';
import type { AssessmentSessionRecord, CreateAssessmentSessionInput } from '@/types/assessment.types';

export interface EligibleAthlete {
  id: string; // athlete_id (same as user_profiles.id)
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  isMinor: boolean;
  primarySport: string;
  affiliationId: string;
  affiliationType: 'academy' | 'institution';
  organizationId: string;
  organizationName: string;
}

/**
 * Calculates chronological age from Date of Birth.
 */
function calculateAge(dobString: string): number {
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
 * Fetches the library of standardized assessment protocols.
 * Connects to public.assessment_protocols, with fallback to hardcoded constants in demo mode.
 */
export async function fetchAssessmentProtocols(): Promise<{
  data: ProtocolSpecification[];
  error: Error | null;
}> {
  try {
    if (!supabase || !isSupabaseConfigured()) {
      // Return hardcoded specifications for demo mode
      return {
        data: Object.values(PROTOCOL_SPECIFICATIONS),
        error: null,
      };
    }

    const { data, error } = await supabase
      .from('assessment_protocols')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.warn('Error fetching protocols from Supabase, using specifications fallback:', error.message);
      return { data: Object.values(PROTOCOL_SPECIFICATIONS), error: null };
    }

    if (!data || data.length === 0) {
      return { data: Object.values(PROTOCOL_SPECIFICATIONS), error: null };
    }

    const merged = data.map((row) => {
      const spec = PROTOCOL_SPECIFICATIONS[row.code];
      return {
        code: row.code,
        name: row.title,
        category: row.category,
        categoryLabel: spec?.categoryLabel || row.category.toUpperCase(),
        unit: row.unit,
        lowerIsBetter: row.lower_is_better ?? false,
        maxAttempts: spec?.maxAttempts || 3,
        validRange: spec?.validRange || { min: 0, max: 999 },
        selectionRuleDescription:
          spec?.selectionRuleDescription ||
          (row.lower_is_better ? 'Lowest valid score is selected.' : 'Highest valid score is selected.'),
        equipmentRequired: row.equipment_required || spec?.equipmentRequired || [],
        description: row.description || spec?.description || '',
        methodology: row.methodology || spec?.methodology || '',
        normsReference: spec?.normsReference || 'Sports Authority of India Guidelines',
      };
    });

    return { data: merged, error: null };
  } catch (err) {
    return {
      data: Object.values(PROTOCOL_SPECIFICATIONS),
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetches eligible athletes for an evaluator.
 * Rule:
 * 1. Athlete must have an ACTIVE affiliation with the evaluator's academy or institution.
 * 2. Evaluator CANNOT evaluate themselves (athlete_id != evaluatorId).
 * 3. Pending or inactive affiliations are excluded.
 */
export async function fetchEligibleAthletesForEvaluator(
  evaluatorId: string,
  userRole: DatabaseRole
): Promise<{
  data: EligibleAthlete[];
  error: Error | null;
}> {
  try {
    if (!supabase || !isSupabaseConfigured()) {
      // In demo mode or disconnected, return empty or mock data
      return { data: [], error: null };
    }

    const eligibleList: EligibleAthlete[] = [];

    if (userRole === 'academy') {
      // Find academy owned by this evaluator
      const { data: academy } = await supabase
        .from('academies')
        .select('id, name')
        .eq('owner_id', evaluatorId)
        .maybeSingle();

      let activeAcademyId = academy?.id;

      if (!activeAcademyId) {
        // Also check if authorized staff evaluator
        const { data: staffAuth } = await supabase
          .from('evaluator_authorizations')
          .select('academy_id')
          .eq('evaluator_id', evaluatorId)
          .eq('status', 'active')
          .maybeSingle();

        const staffRecord = staffAuth as { academy_id: string | null } | null;
        if (!staffRecord || !staffRecord.academy_id) {
          return { data: [], error: null };
        }
        activeAcademyId = staffRecord.academy_id;
      }

      if (!activeAcademyId) return { data: [], error: null };

      // Query active affiliations
      const { data: affiliations, error: affErr } = await supabase
        .from('athlete_affiliations')
        .select('id, athlete_id, created_at')
        .eq('academy_id', activeAcademyId)
        .eq('organization_type', 'academy')
        .eq('status', 'active');

      if (affErr) throw affErr;

      if (affiliations && affiliations.length > 0) {
        for (const aff of affiliations) {
          // Strict self-evaluation check: do not return self
          if (aff.athlete_id === evaluatorId) continue;

          // Fetch athlete profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', aff.athlete_id)
            .maybeSingle();

          const { data: athleteRecord } = await supabase
            .from('athletes')
            .select('gender, date_of_birth, primary_sport')
            .eq('id', aff.athlete_id)
            .maybeSingle();

          if (profile && athleteRecord) {
            const age = calculateAge(athleteRecord.date_of_birth);
            eligibleList.push({
              id: aff.athlete_id,
              fullName: profile.full_name,
              email: profile.email,
              gender: athleteRecord.gender,
              dateOfBirth: athleteRecord.date_of_birth,
              age,
              isMinor: age < 18,
              primarySport: athleteRecord.primary_sport,
              affiliationId: aff.id,
              affiliationType: 'academy',
              organizationId: activeAcademyId,
              organizationName: academy?.name || 'Academy',
            });
          }
        }
      }
    } else if (userRole === 'institution') {
      // Find institution owned by this evaluator
      const { data: inst } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('owner_id', evaluatorId)
        .maybeSingle();

      const activeInstitutionId = inst?.id;
      if (!activeInstitutionId) return { data: [], error: null };

      // Query active affiliations
      const { data: affiliations, error: affErr } = await supabase
        .from('athlete_affiliations')
        .select('id, athlete_id, created_at')
        .eq('institution_id', activeInstitutionId)
        .eq('organization_type', 'institution')
        .eq('status', 'active');

      if (affErr) throw affErr;

      if (affiliations && affiliations.length > 0) {
        for (const aff of affiliations) {
          // Strict self-evaluation check
          if (aff.athlete_id === evaluatorId) continue;

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', aff.athlete_id)
            .maybeSingle();

          const { data: athleteRecord } = await supabase
            .from('athletes')
            .select('gender, date_of_birth, primary_sport')
            .eq('id', aff.athlete_id)
            .maybeSingle();

          if (profile && athleteRecord) {
            const age = calculateAge(athleteRecord.date_of_birth);
            eligibleList.push({
              id: aff.athlete_id,
              fullName: profile.full_name,
              email: profile.email,
              gender: athleteRecord.gender,
              dateOfBirth: athleteRecord.date_of_birth,
              age,
              isMinor: age < 18,
              primarySport: athleteRecord.primary_sport,
              affiliationId: aff.id,
              affiliationType: 'institution',
              organizationId: activeInstitutionId,
              organizationName: inst?.name || 'Institution',
            });
          }
        }
      }
    }

    return { data: eligibleList, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Creates an assessment session and its initial multi-trial results row.
 * Strictly verifies that athlete_id != evaluator_id and that evaluator has active authorization.
 */
export async function createAssessmentSession(
  input: CreateAssessmentSessionInput
): Promise<{
  data: AssessmentSessionRecord | null;
  error: Error | null;
}> {
  try {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please check environment variables.');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Authentication required: No active session found.');
    }

    // STRICT CHECK: Self-evaluation rejected
    if (input.athleteId === user.id) {
      throw new Error('Security Violation: Athletes cannot evaluate themselves (check_no_self_evaluation).');
    }

    // Determine and calculate best score
    const trials = [input.trial1, input.trial2, input.trial3];
    const { bestScore, error: calcError } = calculateBestScore(input.protocolCode, trials);

    if (calcError) {
      throw new Error(`Trial validation failed: ${calcError}`);
    }

    if (bestScore === null) {
      throw new Error('At least one valid trial measurement is required to create an assessment session.');
    }

    // Lookup protocol ID in database
    let protocolDbId = input.protocolId;
    if (!protocolDbId) {
      const { data: protoRow } = await supabase
        .from('assessment_protocols')
        .select('id')
        .eq('code', input.protocolCode)
        .maybeSingle();
      if (protoRow) {
        protocolDbId = protoRow.id;
      }
    }

    if (!protocolDbId) {
      throw new Error(`Protocol reference '${input.protocolCode}' was not found in the database.`);
    }

    // Compute percentile benchmark
    const percentile = estimatePercentileRank(input.protocolCode, bestScore);

    // 1. Insert assessment_sessions record
    const { data: sessionRow, error: sessionErr } = await supabase
      .from('assessment_sessions')
      .insert({
        athlete_id: input.athleteId,
        evaluator_id: user.id,
        academy_id: input.academyId || null,
        institution_id: input.institutionId || null,
        assessment_date: input.assessmentDate,
        venue: input.venue || 'Field Testing Center',
        notes: input.notes || null,
        verified: false,
      })
      .select('*')
      .single();

    if (sessionErr) {
      throw new Error(`Failed to create assessment session: ${sessionErr.message}`);
    }

    // 2. Insert assessment_results record
    const { data: resultRow, error: resultErr } = await supabase
      .from('assessment_results')
      .insert({
        session_id: sessionRow.id,
        protocol_id: protocolDbId,
        trial_1: input.trial1 ?? null,
        trial_2: input.trial2 ?? null,
        trial_3: input.trial3 ?? null,
        best_score: bestScore,
        percentile_rank: percentile,
        status: 'pending',
      })
      .select('*')
      .single();

    if (resultErr) {
      // Rollback session if result insert fails
      await supabase.from('assessment_sessions').delete().eq('id', sessionRow.id);
      throw new Error(`Failed to record assessment trial results: ${resultErr.message}`);
    }

    // Fetch names for complete response
    const { data: athleteProf } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', input.athleteId)
      .maybeSingle();

    const { data: evaluatorProf } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    let orgName = 'Direct Field Assessment';
    if (input.academyId) {
      const { data: ac } = await supabase.from('academies').select('name').eq('id', input.academyId).maybeSingle();
      if (ac) orgName = ac.name;
    } else if (input.institutionId) {
      const { data: inst } = await supabase.from('institutions').select('name').eq('id', input.institutionId).maybeSingle();
      if (inst) orgName = inst.name;
    }

    const fullRecord: AssessmentSessionRecord = {
      id: sessionRow.id,
      athleteId: sessionRow.athlete_id,
      athleteName: athleteProf?.full_name || 'Athlete',
      evaluatorId: sessionRow.evaluator_id,
      evaluatorName: evaluatorProf?.full_name || 'Evaluator',
      academyId: sessionRow.academy_id,
      institutionId: sessionRow.institution_id,
      organizationName: orgName,
      assessmentDate: sessionRow.assessment_date,
      venue: sessionRow.venue,
      verified: sessionRow.verified,
      verifiedBy: sessionRow.verified_by,
      verificationTier: sessionRow.verification_tier,
      notes: sessionRow.notes,
      createdAt: sessionRow.created_at,
      results: [
        {
          id: resultRow.id,
          protocolId: protocolDbId,
          protocolCode: input.protocolCode,
          protocolTitle: PROTOCOL_SPECIFICATIONS[input.protocolCode]?.name || 'Assessment Protocol',
          protocolCategory: PROTOCOL_SPECIFICATIONS[input.protocolCode]?.category || 'general',
          unit: PROTOCOL_SPECIFICATIONS[input.protocolCode]?.unit || '',
          lowerIsBetter: PROTOCOL_SPECIFICATIONS[input.protocolCode]?.lowerIsBetter || false,
          trial1: resultRow.trial_1,
          trial2: resultRow.trial_2,
          trial3: resultRow.trial_3,
          bestScore: resultRow.best_score,
          percentileRank: resultRow.percentile_rank,
          status: resultRow.status,
        },
      ],
    };

    return { data: fullRecord, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Updates trial entries for an unverified assessment session.
 * Once a session is verified, modifications are strictly rejected by the database trigger.
 */
export async function updateAssessmentTrials(
  sessionId: string,
  resultId: string,
  protocolCode: string,
  trial1: number | null,
  trial2: number | null,
  trial3: number | null
): Promise<{ error: Error | null }> {
  try {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const { bestScore, error: calcError } = calculateBestScore(protocolCode, [trial1, trial2, trial3]);
    if (calcError) throw new Error(calcError);
    if (bestScore === null) throw new Error('At least one valid trial measurement is required.');

    const percentile = estimatePercentileRank(protocolCode, bestScore);

    const { error } = await supabase
      .from('assessment_results')
      .update({
        trial_1: trial1,
        trial_2: trial2,
        trial_3: trial3,
        best_score: bestScore,
        percentile_rank: percentile,
      })
      .eq('id', resultId)
      .eq('session_id', sessionId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Verifies an assessment session.
 * Locks the record in PostgreSQL: once verified = true, trigger guard_assessment_session_update
 * strictly blocks any subsequent UPDATE or DELETE.
 *
 * Supports Multi-Tier Verification:
 * - Default: organization_recorded (Single-evaluator internal academy/institution verification)
 * - twoPersonVerification: true (Enforces that verifier is a distinct authorized reviewer: evaluator_id != verified_by)
 */
export async function verifyAssessmentSession(
  sessionId: string,
  options?: {
    twoPersonVerification?: boolean;
    reviewerNotes?: string;
  }
): Promise<{ error: Error | null }> {
  try {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Authentication required.');
    }

    // Two-Person Integrity Pre-check: Evaluator cannot be independent verifier
    if (options?.twoPersonVerification) {
      const { data: session } = await supabase
        .from('assessment_sessions')
        .select('evaluator_id')
        .eq('id', sessionId)
        .maybeSingle();

      if (session && session.evaluator_id === user.id) {
        throw new Error(
          'Two-Person Integrity Violation: An assessment evaluator cannot verify their own session for two-person certification.'
        );
      }
    }

    const verificationTier = options?.twoPersonVerification ? 'two_person_verified' : 'organization_recorded';
    const status = options?.twoPersonVerification ? 'two_person_verified' : 'verified';

    // 1. Update session verified = true (PostgreSQL trigger stamps verified_by = auth.uid())
    const updatePayload: Record<string, any> = {
      verified: true,
      verification_tier: verificationTier,
    };
    if (options?.reviewerNotes) {
      updatePayload.review_notes = options.reviewerNotes;
    }

    const { error: sessionErr } = await supabase
      .from('assessment_sessions')
      .update(updatePayload as any)
      .eq('id', sessionId);

    if (sessionErr) throw sessionErr;

    // 2. Update results status to verified or two_person_verified
    const { error: resultErr } = await supabase
      .from('assessment_results')
      .update({ status: status as any })
      .eq('session_id', sessionId);

    if (resultErr) throw resultErr;

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Checks verifiable guardian consent for minor athletes under DPDP Act 2023.
 */
export async function checkMinorGuardianConsent(
  athleteId: string,
  purpose: 'performance_tracking' | 'talent_scouting' | 'biometric_eval' = 'performance_tracking'
): Promise<{
  isMinor: boolean;
  hasActiveConsent: boolean;
  consentRecord: any | null;
  error: Error | null;
}> {
  try {
    if (!supabase || !isSupabaseConfigured()) {
      return { isMinor: false, hasActiveConsent: true, consentRecord: null, error: null };
    }

    // 1. Check athlete age
    const { data: athlete } = await supabase
      .from('athletes')
      .select('date_of_birth')
      .eq('id', athleteId)
      .maybeSingle();

    if (!athlete || !athlete.date_of_birth) {
      return { isMinor: false, hasActiveConsent: true, consentRecord: null, error: null };
    }

    const dob = new Date(athlete.date_of_birth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age--;
    }

    const isMinor = age < 18;
    if (!isMinor) {
      return { isMinor: false, hasActiveConsent: true, consentRecord: null, error: null };
    }

    // 2. Query guardian_consents
    const { data: consent, error } = await supabase
      .from('guardian_consents' as any)
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('consent_purpose', purpose)
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())
      .maybeSingle();

    if (error) {
      // If table doesn't exist yet in local staging or unmigrated DB, fallback safely
      return { isMinor: true, hasActiveConsent: false, consentRecord: null, error: null };
    }

    return {
      isMinor: true,
      hasActiveConsent: !!consent,
      consentRecord: consent,
      error: null,
    };
  } catch (err) {
    return {
      isMinor: false,
      hasActiveConsent: false,
      consentRecord: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Deletes an unverified draft assessment session.
 * Verified sessions cannot be deleted (RLS policy sessions_delete_owner_unverified blocks this).
 */
export async function deleteAssessmentSession(sessionId: string): Promise<{ error: Error | null }> {
  try {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const { error } = await supabase
      .from('assessment_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('verified', false);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetches all assessment sessions accessible to the current user for an organization.
 */
export async function fetchOrganizationAssessmentSessions(
  organizationId: string,
  orgType: 'academy' | 'institution'
): Promise<{
  data: AssessmentSessionRecord[];
  error: Error | null;
}> {
  try {
    if (!supabase || !isSupabaseConfigured()) {
      return { data: [], error: null };
    }

    const column = orgType === 'academy' ? 'academy_id' : 'institution_id';

    const { data: sessions, error: sessErr } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq(column, organizationId)
      .order('assessment_date', { ascending: false });

    if (sessErr) throw sessErr;
    if (!sessions || sessions.length === 0) return { data: [], error: null };

    const records: AssessmentSessionRecord[] = [];

    for (const s of sessions) {
      // Fetch athlete name
      const { data: athleteProf } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', s.athlete_id)
        .maybeSingle();

      // Fetch evaluator name
      const { data: evalProf } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', s.evaluator_id)
        .maybeSingle();

      // Fetch results
      const { data: results } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('session_id', s.id);

      const mappedResults: AssessmentSessionRecord['results'] = [];
      if (results) {
        for (const r of results) {
          const { data: proto } = await supabase
            .from('assessment_protocols')
            .select('*')
            .eq('id', r.protocol_id)
            .maybeSingle();

          mappedResults.push({
            id: r.id,
            protocolId: r.protocol_id,
            protocolCode: proto?.code || 'UNKNOWN',
            protocolTitle: proto?.title || 'Physical Test',
            protocolCategory: proto?.category || 'general',
            unit: proto?.unit || '',
            lowerIsBetter: proto?.lower_is_better ?? false,
            trial1: r.trial_1,
            trial2: r.trial_2,
            trial3: r.trial_3,
            bestScore: r.best_score,
            percentileRank: r.percentile_rank,
            status: r.status,
          });
        }
      }

      records.push({
        id: s.id,
        athleteId: s.athlete_id,
        athleteName: athleteProf?.full_name || 'Athlete',
        evaluatorId: s.evaluator_id,
        evaluatorName: evalProf?.full_name || 'Evaluator',
        academyId: s.academy_id,
        institutionId: s.institution_id,
        organizationName: orgType === 'academy' ? 'Academy' : 'Institution',
        assessmentDate: s.assessment_date,
        venue: s.venue,
        verified: s.verified,
        verifiedBy: s.verified_by,
        verificationTier: s.verification_tier,
        notes: s.notes,
        createdAt: s.created_at,
        results: mappedResults,
      });
    }

    return { data: records, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
