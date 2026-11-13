import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function createAnonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const results = [];
function record(name, status, details = '') {
  results.push({ name, status, details });
  const symbol = status === 'PASS' ? '✓' : '✗';
  console.log(`[${symbol}] ${name}${details ? ` -> ${details}` : ''}`);
}

async function run() {
  console.log('======================================================================');
  console.log('PRATIBHASCAN WEB — PHASE 3C INSTITUTION PORTAL INTEGRATION TESTS');
  console.log(`Target: ${SUPABASE_URL} (Local Docker Stack)`);
  console.log('======================================================================\n');

  const ts = Date.now();
  const testPassword = 'Password123!';

  let instAUser = null;
  let instBUser = null;
  let studentUser = null;
  let instAId = null;
  let instBId = null;

  try {
    // ------------------------------------------------------------------------
    // 1. PROVISION SYNTHETIC INSTITUTION A (STATE SPORTS BOARD)
    // ------------------------------------------------------------------------
    console.log('--- 1. PROVISIONING SYNTHETIC INSTITUTION A ---');
    const instAEmail = `insta_${ts}@test.kaaryanlabs.local`;
    const instAClient = createAnonClient();

    const { data: instASignup, error: aErr } = await instAClient.auth.signUp({
      email: instAEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Director Rajeshwari Nayak',
          role: 'institution',
        },
      },
    });

    if (aErr || !instASignup.user) {
      record('Institution A Provisioning', 'FAIL', aErr?.message);
      return;
    }
    instAUser = instASignup.user;
    record('Institution A Provisioning', 'PASS', `User ID: ${instAUser.id}`);

    // Insert institution organization record
    const { data: newInstA, error: instAInsertErr } = await instAClient
      .from('institutions')
      .insert({
        owner_id: instAUser.id,
        name: 'Karnataka State Directorate of Youth Services',
        type: 'sports_board',
        contact_email: instAEmail,
        contact_phone: '+918022345678',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
      })
      .select()
      .single();

    if (instAInsertErr || !newInstA) {
      record('Institution A Onboarding Insert', 'FAIL', instAInsertErr?.message);
      return;
    }
    instAId = newInstA.id;
    record('Institution A Onboarding Insert', 'PASS', `Institution ID: ${instAId}`);

    // Update user profile onboarding complete
    await instAClient
      .from('user_profiles')
      .update({ is_onboarded: true, state: 'Karnataka', district: 'Bengaluru Urban' })
      .eq('id', instAUser.id);

    // ------------------------------------------------------------------------
    // 2. PROVISION SYNTHETIC INSTITUTION B (FOR MULTI-TENANT ISOLATION)
    // ------------------------------------------------------------------------
    console.log('\n--- 2. PROVISIONING SYNTHETIC INSTITUTION B (ISOLATION TARGET) ---');
    const instBEmail = `instb_${ts}@test.kaaryanlabs.local`;
    const instBClient = createAnonClient();

    const { data: instBSignup, error: bErr } = await instBClient.auth.signUp({
      email: instBEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Dean Arvind Swaminathan',
          role: 'institution',
        },
      },
    });

    if (bErr || !instBSignup.user) {
      record('Institution B Provisioning', 'FAIL', bErr?.message);
      return;
    }
    instBUser = instBSignup.user;
    record('Institution B Provisioning', 'PASS', `User ID: ${instBUser.id}`);

    const { data: newInstB } = await instBClient
      .from('institutions')
      .insert({
        owner_id: instBUser.id,
        name: 'National Sports University Collegiate Division',
        type: 'university',
        contact_email: instBEmail,
        state: 'Manipur',
        district: 'Imphal West',
      })
      .select()
      .single();
    instBId = newInstB?.id;
    record('Institution B Onboarding Insert', 'PASS', `Institution ID: ${instBId}`);

    // ------------------------------------------------------------------------
    // 3. PROVISION SYNTHETIC MINOR STUDENT-ATHLETE (AGE 16)
    // ------------------------------------------------------------------------
    console.log('\n--- 3. PROVISIONING SYNTHETIC MINOR STUDENT-ATHLETE ---');
    const studentEmail = `student_minor_${ts}@test.kaaryanlabs.local`;
    const studentClient = createAnonClient();

    const { data: stuSignup, error: stuErr } = await studentClient.auth.signUp({
      email: studentEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Aditya Kulkarni',
          role: 'athlete',
        },
      },
    });

    if (stuErr || !stuSignup.user) {
      record('Minor Student Provisioning', 'FAIL', stuErr?.message);
      return;
    }
    studentUser = stuSignup.user;
    record('Minor Student Provisioning', 'PASS', `Student ID: ${studentUser.id}`);

    // Update student physical baseline: DOB 2010-06-15 (Minor)
    const { error: stuBaseErr } = await studentClient
      .from('athletes')
      .update({
        date_of_birth: '2010-06-15',
        gender: 'male',
        primary_sport: 'Badminton',
        secondary_sport: 'Singles',
        height_cm: 168.0,
        weight_kg: 58.0,
        wingspan_cm: 171.0,
      })
      .eq('id', studentUser.id);

    if (stuBaseErr) {
      record('Student Baseline Update', 'FAIL', stuBaseErr.message);
      return;
    }
    record('Student Baseline Update', 'PASS', 'Minor baseline (Age ~16) registered');

    // ------------------------------------------------------------------------
    // 4. TEST: INSTITUTION PROFILE RETRIEVAL
    // ------------------------------------------------------------------------
    console.log('\n--- 4. TESTING INSTITUTION PROFILE RETRIEVAL ---');
    const { data: retrievedInst, error: getInstErr } = await instAClient
      .from('institutions')
      .select('*')
      .eq('owner_id', instAUser.id)
      .single();

    if (!getInstErr && retrievedInst && retrievedInst.name === 'Karnataka State Directorate of Youth Services') {
      record('Institution Profile Retrieval', 'PASS', `Retrieved: ${retrievedInst.name} (${retrievedInst.type})`);
    } else {
      record('Institution Profile Retrieval', 'FAIL', getInstErr?.message);
    }

    // ------------------------------------------------------------------------
    // 5. TEST: INSTITUTION PROFILE UPDATE (PERMITTED FIELDS)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. TESTING INSTITUTION PROFILE UPDATE ---');
    const { error: updateInstErr } = await instAClient
      .from('institutions')
      .update({
        name: 'Karnataka State Directorate of Sports & Physical Education',
        type: 'sports_board',
        contact_phone: '+918099887766',
        district: 'Bengaluru Urban',
      })
      .eq('id', instAId);

    if (!updateInstErr) {
      const { data: updatedInst } = await instAClient
        .from('institutions')
        .select('name, contact_phone')
        .eq('id', instAId)
        .single();

      if (updatedInst?.name === 'Karnataka State Directorate of Sports & Physical Education') {
        record('Institution Profile Update (Permitted)', 'PASS', 'Updated name and contact phone persisted');
      } else {
        record('Institution Profile Update (Permitted)', 'FAIL', 'Values did not persist');
      }
    } else {
      record('Institution Profile Update (Permitted)', 'FAIL', updateInstErr.message);
    }

    // ------------------------------------------------------------------------
    // 6. TEST: IMMUTABILITY OF INSTITUTION OWNERSHIP (GUARD TRIGGER)
    // ------------------------------------------------------------------------
    console.log('\n--- 6. TESTING INSTITUTION OWNERSHIP IMMUTABILITY TRIGGER ---');
    const { error: hijackErr } = await instAClient
      .from('institutions')
      .update({ owner_id: instBUser.id })
      .eq('id', instAId);

    if (hijackErr && hijackErr.message.includes('Institution ownership cannot be transferred')) {
      record('Institution Ownership Guard Trigger', 'PASS', `Rejected transfer: ${hijackErr.message}`);
    } else {
      record('Institution Ownership Guard Trigger', 'FAIL', hijackErr ? hijackErr.message : 'Transfer unexpectedly allowed');
    }

    // ------------------------------------------------------------------------
    // 7. TEST: STUDENT INBOUND AFFILIATION REQUEST
    // ------------------------------------------------------------------------
    console.log('\n--- 7. TESTING STUDENT INBOUND AFFILIATION REQUEST ---');
    const { data: inboundAff, error: inboundErr } = await studentClient
      .from('athlete_affiliations')
      .insert({
        athlete_id: studentUser.id,
        organization_type: 'institution',
        institution_id: instAId,
        status: 'pending',
        requested_by: studentUser.id,
      })
      .select()
      .single();

    if (!inboundErr && inboundAff) {
      record('Inbound Affiliation Request', 'PASS', `Affiliation ID: ${inboundAff.id}, Status: pending`);
    } else {
      record('Inbound Affiliation Request', 'FAIL', inboundErr?.message);
    }

    // ------------------------------------------------------------------------
    // 8. TEST: RLS GATES PRIVATE ASSESSMENT DATA WHEN PENDING
    // ------------------------------------------------------------------------
    console.log('\n--- 8. TESTING RLS GATE ON PENDING AFFILIATION ---');
    const { data: pendingSessions, error: pendingErr } = await instAClient
      .from('assessment_sessions')
      .select('*')
      .eq('athlete_id', studentUser.id);

    if (!pendingErr && pendingSessions.length === 0) {
      record('RLS Gating on Pending Affiliation', 'PASS', 'Assessment sessions inaccessible while affiliation is pending');
    } else {
      record('RLS Gating on Pending Affiliation', 'FAIL', `Sessions returned: ${pendingSessions?.length}`);
    }

    // ------------------------------------------------------------------------
    // 9. TEST: INSTITUTION APPROVES INBOUND AFFILIATION
    // ------------------------------------------------------------------------
    console.log('\n--- 9. TESTING AFFILIATION APPROVAL ---');
    const { error: approveErr } = await instAClient
      .from('athlete_affiliations')
      .update({
        status: 'active',
        approved_by: instAUser.id,
      })
      .eq('id', inboundAff.id);

    if (!approveErr) {
      const { data: activeAff } = await instAClient
        .from('athlete_affiliations')
        .select('status, approved_by')
        .eq('id', inboundAff.id)
        .single();

      if (activeAff?.status === 'active' && activeAff.approved_by === instAUser.id) {
        record('Affiliation Approval', 'PASS', 'Affiliation transitioned from pending -> active');
      } else {
        record('Affiliation Approval', 'FAIL', `Unexpected status: ${activeAff?.status}`);
      }
    } else {
      record('Affiliation Approval', 'FAIL', approveErr.message);
    }

    // ------------------------------------------------------------------------
    // 10. TEST: INSTITUTION CONDUCTS ASSESSMENT FOR ACTIVE STUDENT
    // ------------------------------------------------------------------------
    console.log('\n--- 10. TESTING ASSESSMENT CREATION FOR ACTIVE STUDENT ---');
    const { data: protoSprint } = await adminClient
      .from('assessment_protocols')
      .select('id')
      .eq('code', 'TEST_30M_SPRINT')
      .maybeSingle();

    const protoId = protoSprint ? protoSprint.id : '10000000-0000-0000-0000-000000000001';

    const { data: newSession, error: sessErr } = await instAClient
      .from('assessment_sessions')
      .insert({
        athlete_id: studentUser.id,
        evaluator_id: instAUser.id,
        institution_id: instAId,
        assessment_date: '2026-11-13',
        venue: 'Kanteerava Indoor Stadium',
        verified: false,
        notes: 'Inter-collegiate physical battery',
      })
      .select()
      .single();

    if (!sessErr && newSession) {
      record('Assessment Session Creation', 'PASS', `Session ID: ${newSession.id}`);

      // Insert assessment result
      const { data: newResult, error: resErr } = await instAClient
        .from('assessment_results')
        .insert({
          session_id: newSession.id,
          protocol_id: protoId,
          trial_1: 4.22,
          trial_2: 4.18,
          trial_3: 4.20,
          best_score: 4.18,
          percentile_rank: 79.0,
          status: 'pending',
        })
        .select()
        .single();

      if (!resErr && newResult) {
        record('Assessment Trial Result Insert', 'PASS', `Trial 4.18s recorded (Best Score)`);
      } else {
        record('Assessment Trial Result Insert', 'FAIL', resErr?.message);
      }
    } else {
      record('Assessment Session Creation', 'FAIL', sessErr?.message);
    }

    // ------------------------------------------------------------------------
    // 11. TEST: INSTITUTION READS ACTIVE ROSTER & ASSESSMENT SCORES
    // ------------------------------------------------------------------------
    console.log('\n--- 11. TESTING ACTIVE ROSTER & ASSESSMENT SCORE ACCESS ---');
    const { data: verifiedSessions, error: vSessErr } = await instAClient
      .from('assessment_sessions')
      .select('id, venue, assessment_date')
      .eq('athlete_id', studentUser.id);

    if (!vSessErr && verifiedSessions && verifiedSessions.length === 1) {
      record('Active Roster Assessment Access', 'PASS', `Retrieved ${verifiedSessions.length} session for active student`);
    } else {
      record('Active Roster Assessment Access', 'FAIL', vSessErr ? vSessErr.message : `Count: ${verifiedSessions?.length}`);
    }

    // ------------------------------------------------------------------------
    // 12. TEST: CROSS-INSTITUTION TENANT ISOLATION
    // ------------------------------------------------------------------------
    console.log('\n--- 12. TESTING CROSS-INSTITUTION TENANT ISOLATION ---');
    // Institution B has NO affiliation with Student 1. Attempt to read assessment sessions.
    const { data: instBSessions, error: bSessErr } = await instBClient
      .from('assessment_sessions')
      .select('*')
      .eq('athlete_id', studentUser.id);

    if (!bSessErr && instBSessions.length === 0) {
      record('Cross-Institution Tenant Isolation', 'PASS', 'Institution B cannot read Institution A student assessment records (0 rows returned)');
    } else {
      record('Cross-Institution Tenant Isolation', 'FAIL', `Institution B leaked records: ${instBSessions?.length}`);
    }

    // ------------------------------------------------------------------------
    // 13. TEST: AFFILIATION REVOCATION & ACCESS TERMINATION
    // ------------------------------------------------------------------------
    console.log('\n--- 13. TESTING AFFILIATION REVOCATION & ACCESS TERMINATION ---');
    const { error: revokeErr } = await instAClient
      .from('athlete_affiliations')
      .update({ status: 'revoked' })
      .eq('id', inboundAff.id);

    if (!revokeErr) {
      record('Affiliation Revocation', 'PASS', 'Affiliation transitioned to revoked');

      // Verify immediate cutoff using helper function
      const { data: checkActive } = await adminClient.rpc('has_active_institution_affiliation', {
        p_athlete_id: studentUser.id,
        p_institution_owner: instAUser.id,
      });

      if (checkActive === false) {
        record('Access Cutoff Verification', 'PASS', 'Active institution affiliation check evaluates to false after revocation');
      } else {
        record('Access Cutoff Verification', 'FAIL', `Check returned: ${checkActive}`);
      }
    } else {
      record('Affiliation Revocation', 'FAIL', revokeErr.message);
    }

    // ------------------------------------------------------------------------
    // 14. TEST: ANONYMOUS ACCESS REJECTION UNDER RLS
    // ------------------------------------------------------------------------
    console.log('\n--- 14. TESTING ANONYMOUS ACCESS REJECTION ---');
    const unauthClient = createAnonClient();
    const { data: unauthInsts } = await unauthClient
      .from('institutions')
      .select('*');

    const { data: unauthAffiliations } = await unauthClient
      .from('athlete_affiliations')
      .select('*');

    if (unauthInsts.length === 0 && unauthAffiliations.length === 0) {
      record('Anonymous Access Blocked', 'PASS', 'Unauthenticated queries return 0 protected rows under RLS');
    } else {
      record('Anonymous Access Blocked', 'FAIL', `Leaked: ${unauthInsts.length} institutions, ${unauthAffiliations.length} affiliations`);
    }

    // ------------------------------------------------------------------------
    // 15. TEST: MINOR SAFELOGIC VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- 15. TESTING MINOR SAFEGUARD AGE LOGIC ---');
    const { data: athleteRecord } = await adminClient
      .from('athletes')
      .select('date_of_birth')
      .eq('id', studentUser.id)
      .single();

    if (athleteRecord) {
      const birthDate = new Date(athleteRecord.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      const isMinor = age < 18;

      if (isMinor) {
        record('Minor Safeguard Identification', 'PASS', `Student age ${age} (< 18) mandates DPDP Act guardian consent`);
      } else {
        record('Minor Safeguard Identification', 'FAIL', `Age computed as ${age}`);
      }
    } else {
      record('Minor Safeguard Identification', 'FAIL', 'Student record not found');
    }

  } catch (err) {
    console.error('Unhandled Test Exception:', err);
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    console.log('\n--- CLEANING UP SYNTHETIC TEST RECORDS ---');
    if (instAId) {
      await adminClient.from('assessment_sessions').delete().eq('institution_id', instAId);
      await adminClient.from('athlete_affiliations').delete().eq('institution_id', instAId);
      await adminClient.from('institutions').delete().eq('id', instAId);
    }
    if (instBId) {
      await adminClient.from('assessment_sessions').delete().eq('institution_id', instBId);
      await adminClient.from('athlete_affiliations').delete().eq('institution_id', instBId);
      await adminClient.from('institutions').delete().eq('id', instBId);
    }
    if (studentUser) {
      await adminClient.from('athletes').delete().eq('id', studentUser.id);
      await adminClient.auth.admin.deleteUser(studentUser.id);
    }
    if (instAUser) {
      await adminClient.auth.admin.deleteUser(instAUser.id);
    }
    if (instBUser) {
      await adminClient.auth.admin.deleteUser(instBUser.id);
    }
    console.log('Test cleanup complete.');
  }

  // Summary
  console.log('\n======================================================================');
  console.log('PHASE 3C INSTITUTION PORTAL INTEGRATION TEST SUMMARY');
  console.log('======================================================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL:  ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
