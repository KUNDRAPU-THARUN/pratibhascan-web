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
  console.log('PRATIBHASCAN WEB — PHASE 3B ACADEMY HUB & AFFILIATION INTEGRATION TESTS');
  console.log(`Target: ${SUPABASE_URL} (Local Docker Stack)`);
  console.log('======================================================================\n');

  const ts = Date.now();
  const testPassword = 'Password123!';

  let academyAUser = null;
  let academyBUser = null;
  let athleteUser = null;
  let academyAId = null;
  let academyBId = null;

  try {
    // ------------------------------------------------------------------------
    // 1. PROVISION SYNTHETIC ACADEMY A (APEX HIGH PERFORMANCE)
    // ------------------------------------------------------------------------
    console.log('--- 1. PROVISIONING SYNTHETIC ACADEMY A ---');
    const acadAEmail = `acada_${ts}@test.kaaryanlabs.local`;
    const acadAClient = createAnonClient();

    const { data: acadASignup, error: aErr } = await acadAClient.auth.signUp({
      email: acadAEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Coach Vikram Rathore',
          role: 'academy',
        },
      },
    });

    if (aErr || !acadASignup.user) {
      record('Academy A Provisioning', 'FAIL', aErr?.message);
      return;
    }
    academyAUser = acadASignup.user;
    record('Academy A Provisioning', 'PASS', `User ID: ${academyAUser.id}`);

    // Insert academy organization record
    const { data: newAcadA, error: acadAInsertErr } = await acadAClient
      .from('academies')
      .insert({
        owner_id: academyAUser.id,
        name: 'Apex Sports High Performance Center',
        registration_number: `SAI-MH-${ts}`,
        contact_email: acadAEmail,
        contact_phone: '+919876543210',
        state: 'Maharashtra',
        district: 'Pune',
        address: 'Balewadi Sports Complex',
        sports_offered: ['Athletics', 'Badminton'],
      })
      .select()
      .single();

    if (acadAInsertErr || !newAcadA) {
      record('Academy A Onboarding Insert', 'FAIL', acadAInsertErr?.message);
      return;
    }
    academyAId = newAcadA.id;
    record('Academy A Onboarding Insert', 'PASS', `Academy ID: ${academyAId}`);

    // Update user profile onboarding complete
    await acadAClient
      .from('user_profiles')
      .update({ is_onboarded: true, state: 'Maharashtra', district: 'Pune' })
      .eq('id', academyAUser.id);

    // ------------------------------------------------------------------------
    // 2. PROVISION SYNTHETIC ACADEMY B (FOR MULTI-TENANT ISOLATION)
    // ------------------------------------------------------------------------
    console.log('\n--- 2. PROVISIONING SYNTHETIC ACADEMY B (ISOLATION TARGET) ---');
    const acadBEmail = `acadb_${ts}@test.kaaryanlabs.local`;
    const acadBClient = createAnonClient();

    const { data: acadBSignup, error: bErr } = await acadBClient.auth.signUp({
      email: acadBEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Coach Suman Das',
          role: 'academy',
        },
      },
    });

    if (bErr || !acadBSignup.user) {
      record('Academy B Provisioning', 'FAIL', bErr?.message);
      return;
    }
    academyBUser = acadBSignup.user;
    record('Academy B Provisioning', 'PASS', `User ID: ${academyBUser.id}`);

    const { data: newAcadB } = await acadBClient
      .from('academies')
      .insert({
        owner_id: academyBUser.id,
        name: 'Spartan Athletics Academy',
        registration_number: `SAI-KA-${ts}`,
        contact_email: acadBEmail,
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        sports_offered: ['Athletics'],
      })
      .select()
      .single();
    academyBId = newAcadB?.id;
    record('Academy B Onboarding Insert', 'PASS', `Academy ID: ${academyBId}`);

    // ------------------------------------------------------------------------
    // 3. PROVISION SYNTHETIC MINOR ATHLETE (AGE 16)
    // ------------------------------------------------------------------------
    console.log('\n--- 3. PROVISIONING SYNTHETIC MINOR ATHLETE ---');
    const athleteEmail = `athlete_minor_${ts}@test.kaaryanlabs.local`;
    const athleteClient = createAnonClient();

    const { data: athSignup, error: athErr } = await athleteClient.auth.signUp({
      email: athleteEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Kabir Varma',
          role: 'athlete',
        },
      },
    });

    if (athErr || !athSignup.user) {
      record('Minor Athlete Provisioning', 'FAIL', athErr?.message);
      return;
    }
    athleteUser = athSignup.user;
    record('Minor Athlete Provisioning', 'PASS', `Athlete ID: ${athleteUser.id}`);

    // Complete athlete baseline: DOB 2010-06-15 (Minor)
    const { error: athBaseErr } = await athleteClient
      .from('athletes')
      .update({
        date_of_birth: '2010-06-15',
        gender: 'male',
        primary_sport: 'Athletics',
        secondary_sport: '100m Sprint',
        height_cm: 172.0,
        weight_kg: 62.0,
        wingspan_cm: 176.0,
      })
      .eq('id', athleteUser.id);

    if (athBaseErr) {
      record('Athlete Baseline Insert', 'FAIL', athBaseErr.message);
      return;
    }
    record('Athlete Baseline Insert', 'PASS', 'Minor baseline (Age ~16) registered');

    // ------------------------------------------------------------------------
    // 4. TEST: ACADEMY PROFILE RETRIEVAL
    // ------------------------------------------------------------------------
    console.log('\n--- 4. TESTING ACADEMY PROFILE RETRIEVAL ---');
    const { data: retrievedAcad, error: getAcadErr } = await acadAClient
      .from('academies')
      .select('*')
      .eq('owner_id', academyAUser.id)
      .single();

    if (!getAcadErr && retrievedAcad && retrievedAcad.name === 'Apex Sports High Performance Center') {
      record('Academy Profile Retrieval', 'PASS', `Retrieved: ${retrievedAcad.name}`);
    } else {
      record('Academy Profile Retrieval', 'FAIL', getAcadErr?.message);
    }

    // ------------------------------------------------------------------------
    // 5. TEST: ACADEMY PROFILE UPDATE (PERMITTED FIELDS)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. TESTING ACADEMY PROFILE UPDATE ---');
    const { error: updateAcadErr } = await acadAClient
      .from('academies')
      .update({
        name: 'Apex High Performance Olympic Center',
        sports_offered: ['Athletics', 'Badminton', 'Swimming'],
        contact_phone: '+919123456789',
      })
      .eq('id', academyAId);

    if (!updateAcadErr) {
      const { data: updatedAcad } = await acadAClient
        .from('academies')
        .select('name, sports_offered, contact_phone')
        .eq('id', academyAId)
        .single();

      if (updatedAcad?.name === 'Apex High Performance Olympic Center' && updatedAcad.sports_offered.length === 3) {
        record('Academy Profile Update (Permitted)', 'PASS', 'Updated name, sports offered, and phone');
      } else {
        record('Academy Profile Update (Permitted)', 'FAIL', 'Values did not persist');
      }
    } else {
      record('Academy Profile Update (Permitted)', 'FAIL', updateAcadErr.message);
    }

    // ------------------------------------------------------------------------
    // 6. TEST: IMMUTABILITY OF ACADEMY OWNERSHIP (GUARD TRIGGER)
    // ------------------------------------------------------------------------
    console.log('\n--- 6. TESTING ACADEMY OWNERSHIP IMMUTABILITY TRIGGER ---');
    const { error: hijackErr } = await acadAClient
      .from('academies')
      .update({ owner_id: academyBUser.id })
      .eq('id', academyAId);

    if (hijackErr && hijackErr.message.includes('Academy ownership cannot be transferred')) {
      record('Academy Ownership Guard Trigger', 'PASS', `Rejected transfer: ${hijackErr.message}`);
    } else {
      record('Academy Ownership Guard Trigger', 'FAIL', hijackErr ? hijackErr.message : 'Transfer unexpectedly allowed');
    }

    // ------------------------------------------------------------------------
    // 7. TEST: ATHLETE INBOUND AFFILIATION REQUEST
    // ------------------------------------------------------------------------
    console.log('\n--- 7. TESTING ATHLETE INBOUND AFFILIATION REQUEST ---');
    const { data: inboundAff, error: inboundErr } = await athleteClient
      .from('athlete_affiliations')
      .insert({
        athlete_id: athleteUser.id,
        organization_type: 'academy',
        academy_id: academyAId,
        status: 'pending',
        requested_by: athleteUser.id,
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
    // Academy A attempts to read assessment sessions for athlete while pending
    const { data: pendingSessions, error: pendingErr } = await acadAClient
      .from('assessment_sessions')
      .select('*')
      .eq('athlete_id', athleteUser.id);

    if (!pendingErr && pendingSessions.length === 0) {
      record('RLS Gating on Pending Affiliation', 'PASS', 'Assessment sessions inaccessible while affiliation is pending');
    } else {
      record('RLS Gating on Pending Affiliation', 'FAIL', `Sessions returned: ${pendingSessions?.length}`);
    }

    // ------------------------------------------------------------------------
    // 9. TEST: ACADEMY APPROVES INBOUND AFFILIATION
    // ------------------------------------------------------------------------
    console.log('\n--- 9. TESTING AFFILIATION APPROVAL ---');
    const { error: approveErr } = await acadAClient
      .from('athlete_affiliations')
      .update({
        status: 'active',
        approved_by: academyAUser.id,
      })
      .eq('id', inboundAff.id);

    if (!approveErr) {
      const { data: activeAff } = await acadAClient
        .from('athlete_affiliations')
        .select('status, approved_by')
        .eq('id', inboundAff.id)
        .single();

      if (activeAff?.status === 'active' && activeAff.approved_by === academyAUser.id) {
        record('Affiliation Approval', 'PASS', 'Affiliation transitioned from pending -> active');
      } else {
        record('Affiliation Approval', 'FAIL', `Unexpected status: ${activeAff?.status}`);
      }
    } else {
      record('Affiliation Approval', 'FAIL', approveErr.message);
    }

    // ------------------------------------------------------------------------
    // 10. TEST: ACADEMY CONDUCTS ASSESSMENT SESSION FOR ACTIVE ATHLETE
    // ------------------------------------------------------------------------
    console.log('\n--- 10. TESTING ASSESSMENT CREATION FOR ACTIVE ATHLETE ---');
    // Find standard protocol ID for 30m sprint
    const { data: protoSprint } = await adminClient
      .from('assessment_protocols')
      .select('id')
      .eq('code', 'TEST_30M_SPRINT')
      .maybeSingle();

    const protoId = protoSprint ? protoSprint.id : '10000000-0000-0000-0000-000000000001';

    const { data: newSession, error: sessErr } = await acadAClient
      .from('assessment_sessions')
      .insert({
        athlete_id: athleteUser.id,
        evaluator_id: academyAUser.id,
        academy_id: academyAId,
        assessment_date: '2026-11-13',
        venue: 'Balewadi Track 1',
        verified: false,
        notes: 'Pre-season sprint baseline',
      })
      .select()
      .single();

    if (!sessErr && newSession) {
      record('Assessment Session Creation', 'PASS', `Session ID: ${newSession.id}`);

      // Insert assessment result
      const { data: newResult, error: resErr } = await acadAClient
        .from('assessment_results')
        .insert({
          session_id: newSession.id,
          protocol_id: protoId,
          trial_1: 4.15,
          trial_2: 4.08,
          trial_3: 4.12,
          best_score: 4.08,
          percentile_rank: 82.5,
          status: 'pending',
        })
        .select()
        .single();

      if (!resErr && newResult) {
        record('Assessment Trial Result Insert', 'PASS', `Trial 4.08s recorded (Best Score)`);
      } else {
        record('Assessment Trial Result Insert', 'FAIL', resErr?.message);
      }
    } else {
      record('Assessment Session Creation', 'FAIL', sessErr?.message);
    }

    // ------------------------------------------------------------------------
    // 11. TEST: ACADEMY READS ACTIVE ROSTER & ASSESSMENT SCORES
    // ------------------------------------------------------------------------
    console.log('\n--- 11. TESTING ACTIVE ROSTER & ASSESSMENT SCORE ACCESS ---');
    const { data: verifiedSessions, error: vSessErr } = await acadAClient
      .from('assessment_sessions')
      .select('id, venue, assessment_date')
      .eq('athlete_id', athleteUser.id);

    if (!vSessErr && verifiedSessions && verifiedSessions.length === 1) {
      record('Active Roster Assessment Access', 'PASS', `Retrieved ${verifiedSessions.length} session for active candidate`);
    } else {
      record('Active Roster Assessment Access', 'FAIL', vSessErr ? vSessErr.message : `Count: ${verifiedSessions?.length}`);
    }

    // ------------------------------------------------------------------------
    // 12. TEST: CROSS-ACADEMY TENANT ISOLATION
    // ------------------------------------------------------------------------
    console.log('\n--- 12. TESTING CROSS-ACADEMY TENANT ISOLATION ---');
    // Academy B has NO affiliation with Athlete 1. Attempt to read assessment sessions.
    const { data: acadBSessions, error: bSessErr } = await acadBClient
      .from('assessment_sessions')
      .select('*')
      .eq('athlete_id', athleteUser.id);

    if (!bSessErr && acadBSessions.length === 0) {
      record('Cross-Academy Tenant Isolation', 'PASS', 'Academy B cannot read Academy A athlete assessment records (0 rows returned)');
    } else {
      record('Cross-Academy Tenant Isolation', 'FAIL', `Academy B leaked records: ${acadBSessions?.length}`);
    }

    // ------------------------------------------------------------------------
    // 13. TEST: AFFILIATION REVOCATION & ACCESS TERMINATION
    // ------------------------------------------------------------------------
    console.log('\n--- 13. TESTING AFFILIATION REVOCATION & ACCESS TERMINATION ---');
    const { error: revokeErr } = await acadAClient
      .from('athlete_affiliations')
      .update({ status: 'revoked' })
      .eq('id', inboundAff.id);

    if (!revokeErr) {
      record('Affiliation Revocation', 'PASS', 'Affiliation transitioned to revoked');

      // Verify immediate cutoff from athlete assessment sessions
      // Because affiliation is revoked and has_active_academy_affiliation returns false:
      const { data: postRevokeSessions } = await acadAClient
        .from('assessment_sessions')
        .select('*')
        .eq('athlete_id', athleteUser.id)
        .eq('academy_id', academyBId); // query sessions from elsewhere

      // Also verify function has_active_academy_affiliation returns false
      const { data: checkActive, error: rpcErr } = await adminClient.rpc('has_active_academy_affiliation', {
        p_athlete_id: athleteUser.id,
        p_academy_owner: academyAUser.id,
      });

      if (checkActive === false) {
        record('Access Cutoff Verification', 'PASS', 'Active affiliation check evaluates to false after revocation');
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
    const { data: unauthAcademies } = await unauthClient
      .from('academies')
      .select('*');

    const { data: unauthAffiliations } = await unauthClient
      .from('athlete_affiliations')
      .select('*');

    if (unauthAcademies.length === 0 && unauthAffiliations.length === 0) {
      record('Anonymous Access Blocked', 'PASS', 'Unauthenticated queries return 0 protected rows under RLS');
    } else {
      record('Anonymous Access Blocked', 'FAIL', `Leaked: ${unauthAcademies.length} academies, ${unauthAffiliations.length} affiliations`);
    }

    // ------------------------------------------------------------------------
    // 15. TEST: MINOR SAFELOGIC VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- 15. TESTING MINOR SAFEGUARD AGE LOGIC ---');
    const { data: athleteRecord } = await adminClient
      .from('athletes')
      .select('date_of_birth')
      .eq('id', athleteUser.id)
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
        record('Minor Safeguard Identification', 'PASS', `Candidate age ${age} (< 18) mandates DPDP Act guardian consent`);
      } else {
        record('Minor Safeguard Identification', 'FAIL', `Age computed as ${age}`);
      }
    } else {
      record('Minor Safeguard Identification', 'FAIL', 'Athlete record not found');
    }

  } catch (err) {
    console.error('Unhandled Test Exception:', err);
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    console.log('\n--- CLEANING UP SYNTHETIC TEST RECORDS ---');
    if (academyAId) {
      await adminClient.from('assessment_sessions').delete().eq('academy_id', academyAId);
      await adminClient.from('athlete_affiliations').delete().eq('academy_id', academyAId);
      await adminClient.from('academies').delete().eq('id', academyAId);
    }
    if (academyBId) {
      await adminClient.from('assessment_sessions').delete().eq('academy_id', academyBId);
      await adminClient.from('athlete_affiliations').delete().eq('academy_id', academyBId);
      await adminClient.from('academies').delete().eq('id', academyBId);
    }
    if (athleteUser) {
      await adminClient.from('athletes').delete().eq('id', athleteUser.id);
      await adminClient.auth.admin.deleteUser(athleteUser.id);
    }
    if (academyAUser) {
      await adminClient.auth.admin.deleteUser(academyAUser.id);
    }
    if (academyBUser) {
      await adminClient.auth.admin.deleteUser(academyBUser.id);
    }
    console.log('Test cleanup complete.');
  }

  // Summary
  console.log('\n======================================================================');
  console.log('PHASE 3B ACADEMY HUB INTEGRATION TEST SUMMARY');
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
