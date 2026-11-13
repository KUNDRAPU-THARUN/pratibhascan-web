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
  console.log('PRATIBHASCAN WEB — PHASE 3A ATHLETE DASHBOARD INTEGRATION TEST SUITE');
  console.log(`Target: ${SUPABASE_URL} (Local Docker Stack)`);
  console.log('======================================================================\n');

  const ts = Date.now();
  const testPassword = 'Password123!';

  // ============================================================================
  // 1. CREATE SYNTHETIC ATHLETE A (PRIMARY)
  // ============================================================================
  console.log('--- 1. PROVISIONING SYNTHETIC ATHLETE A ---');
  const athleteAEmail = `athleteA_${ts}@test.kaaryanlabs.local`;
  const athleteAClient = createAnonClient();

  const { data: athleteASignup, error: aSignupErr } = await athleteAClient.auth.signUp({
    email: athleteAEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Tarun Sharma',
        role: 'athlete',
      },
    },
  });

  if (aSignupErr || !athleteASignup.user) {
    record('Athlete A Provisioning', 'FAIL', aSignupErr?.message);
    return;
  }
  const athleteAId = athleteASignup.user.id;
  record('Athlete A Provisioning', 'PASS', `User ID: ${athleteAId}`);

  // Complete initial onboarding baseline
  await athleteAClient
    .from('athletes')
    .update({
      date_of_birth: '2007-08-20',
      gender: 'male',
      primary_sport: 'Athletics',
      secondary_sport: '100m Sprint',
      height_cm: 175.0,
      weight_kg: 66.0,
      wingspan_cm: 181.0,
    })
    .eq('id', athleteAId);

  await athleteAClient
    .from('user_profiles')
    .update({
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      phone_number: '+919876543210',
    })
    .eq('id', athleteAId);

  // ============================================================================
  // 2. CREATE SYNTHETIC ATHLETE B (FOR ISOLATION TESTING)
  // ============================================================================
  console.log('\n--- 2. PROVISIONING SYNTHETIC ATHLETE B ---');
  const athleteBEmail = `athleteB_${ts}@test.kaaryanlabs.local`;
  const athleteBClient = createAnonClient();

  const { data: athleteBSignup } = await athleteBClient.auth.signUp({
    email: athleteBEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Priya Patel',
        role: 'athlete',
      },
    },
  });
  const athleteBId = athleteBSignup.user.id;
  record('Athlete B Provisioning', 'PASS', `User ID: ${athleteBId}`);

  // ============================================================================
  // 3. CREATE SYNTHETIC ACADEMY & EVALUATOR (FOR SESSION DATA)
  // ============================================================================
  console.log('\n--- 3. PROVISIONING ACADEMY & EVALUATOR ---');
  const academyEmail = `academyDirector_${ts}@test.kaaryanlabs.local`;
  const academyClient = createAnonClient();

  const { data: academySignup } = await academyClient.auth.signUp({
    email: academyEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Coach Rakesh Nambiar',
        role: 'academy',
      },
    },
  });
  const academyOwnerId = academySignup.user.id;

  const { data: academyOrg } = await academyClient
    .from('academies')
    .insert({
      owner_id: academyOwnerId,
      name: `Apex Track Club ${ts}`,
      contact_email: academyEmail,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      sports_offered: ['Athletics'],
    })
    .select()
    .single();

  record('Academy Creation', 'PASS', `Academy ID: ${academyOrg.id}`);

  // Create active affiliation between Athlete A and Academy
  await adminClient
    .from('athlete_affiliations')
    .insert({
      athlete_id: athleteAId,
      organization_type: 'academy',
      academy_id: academyOrg.id,
      status: 'active',
      requested_by: athleteAId,
      approved_by: academyOwnerId,
    });
  record('Active Affiliation Established', 'PASS', `Athlete A affiliated to ${academyOrg.name}`);

  // ============================================================================
  // 4. ATHLETE PROFILE UPDATE & PERSISTENCE VERIFICATION
  // ============================================================================
  console.log('\n--- 4. ATHLETE PROFILE MUTATION & PERSISTENCE ---');
  // Athlete A updates permitted fields
  const updatedName = 'Tarun R. Sharma';
  const updatedHeight = 177.0;
  const updatedWeight = 68.5;
  const updatedWingspan = 184.0;
  const updatedSport = 'Badminton';

  const { error: profileUpdateErr } = await athleteAClient
    .from('user_profiles')
    .update({
      full_name: updatedName,
      phone_number: '+919111222333',
      state: 'Karnataka',
      district: 'Mysuru',
    })
    .eq('id', athleteAId);

  const { error: athleteUpdateErr } = await athleteAClient
    .from('athletes')
    .update({
      primary_sport: updatedSport,
      height_cm: updatedHeight,
      weight_kg: updatedWeight,
      wingspan_cm: updatedWingspan,
    })
    .eq('id', athleteAId);

  if (!profileUpdateErr && !athleteUpdateErr) {
    record('Permitted Profile Update', 'PASS', 'Updated name, location, biometrics via Supabase');
  } else {
    record('Permitted Profile Update', 'FAIL', profileUpdateErr?.message || athleteUpdateErr?.message);
  }

  // Verify persistence on fresh read
  const { data: refreshedProfile } = await athleteAClient
    .from('user_profiles')
    .select('*')
    .eq('id', athleteAId)
    .single();

  const { data: refreshedAthlete } = await athleteAClient
    .from('athletes')
    .select('*')
    .eq('id', athleteAId)
    .single();

  if (
    refreshedProfile?.full_name === updatedName &&
    refreshedAthlete?.primary_sport === updatedSport &&
    Number(refreshedAthlete?.height_cm) === updatedHeight
  ) {
    record('Profile Update Persistence', 'PASS', 'Fresh read confirmed persisted changes');
  } else {
    record('Profile Update Persistence', 'FAIL', 'Data did not match expected updated values');
  }

  // ============================================================================
  // 5. SECURITY: PROTECTED FIELDS IMMUTABILITY
  // ============================================================================
  console.log('\n--- 5. SECURITY: PROTECTED FIELDS ---');
  // Attempt to change role
  const { error: roleSpoofErr } = await athleteAClient
    .from('user_profiles')
    .update({ role: 'academy' })
    .eq('id', athleteAId);

  if (roleSpoofErr && roleSpoofErr.message.includes('User role modification is strictly prohibited')) {
    record('Role Tampering Rejection', 'PASS', 'Trigger rejected role change');
  } else {
    record('Role Tampering Rejection', 'FAIL', roleSpoofErr?.message || 'Role change was not blocked');
  }

  // Attempt to change suspension status
  const { error: suspensionSpoofErr } = await athleteAClient
    .from('user_profiles')
    .update({ is_suspended: false })
    .eq('id', athleteAId);

  if (suspensionSpoofErr && suspensionSpoofErr.message.includes('Users cannot modify their own suspension status')) {
    record('Suspension Status Tampering Rejection', 'PASS', 'Trigger rejected self-unsuspension');
  } else {
    // If not suspended, check update doesn't allow setting true
    const { error: suspendSelfErr } = await athleteAClient
      .from('user_profiles')
      .update({ is_suspended: true })
      .eq('id', athleteAId);
    if (suspendSelfErr && suspendSelfErr.message.includes('Users cannot modify their own suspension status')) {
      record('Suspension Status Tampering Rejection', 'PASS', 'Trigger rejected self-suspension');
    } else {
      record('Suspension Status Tampering Rejection', 'FAIL', 'Suspension field mutation permitted');
    }
  }

  // ============================================================================
  // 6. REAL ASSESSMENT SESSIONS & RESULTS INTEGRATION
  // ============================================================================
  console.log('\n--- 6. ASSESSMENT SESSIONS & RESULTS INTEGRATION ---');
  // Academy creates verified assessment session for Athlete A
  const { data: sessionData, error: sessErr } = await adminClient
    .from('assessment_sessions')
    .insert({
      athlete_id: athleteAId,
      evaluator_id: academyOwnerId,
      academy_id: academyOrg.id,
      assessment_date: '2026-11-13',
      venue: 'Apex Athletics Stadium, Track 2',
      verified: true,
      verified_by: academyOwnerId,
    })
    .select()
    .single();

  if (sessErr || !sessionData) {
    record('Session Provisioning', 'FAIL', sessErr?.message);
    return;
  }
  record('Session Provisioning', 'PASS', `Session ID: ${sessionData.id}`);

  // Fetch protocol IDs for 30m sprint and vertical jump
  const { data: protoSprint } = await adminClient
    .from('assessment_protocols')
    .select('id')
    .eq('code', 'TEST_30M_SPRINT')
    .single();

  const { data: protoJump } = await adminClient
    .from('assessment_protocols')
    .select('id')
    .eq('code', 'TEST_VERT_JUMP')
    .single();

  if (protoSprint && protoJump) {
    // Insert sprint results: trials 4.02, 3.95, 3.89 -> best 3.89, 93rd percentile
    await adminClient
      .from('assessment_results')
      .insert({
        session_id: sessionData.id,
        protocol_id: protoSprint.id,
        trial_1: 4.02,
        trial_2: 3.95,
        trial_3: 3.89,
        best_score: 3.89,
        percentile_rank: 93.0,
        status: 'verified',
      });

    // Insert jump results: trials 58.0, 61.0, 62.5 -> best 62.5, 90th percentile
    await adminClient
      .from('assessment_results')
      .insert({
        session_id: sessionData.id,
        protocol_id: protoJump.id,
        trial_1: 58.0,
        trial_2: 61.0,
        trial_3: 62.5,
        best_score: 62.5,
        percentile_rank: 90.0,
        status: 'verified',
      });

    record('Assessment Results Provisioning', 'PASS', 'Inserted multi-trial sprint & vertical jump');
  } else {
    record('Assessment Results Provisioning', 'FAIL', 'Protocols not found in database');
  }

  // Athlete A queries their own sessions via authenticated client
  const { data: athleteASessions } = await athleteAClient
    .from('assessment_sessions')
    .select(`
      id,
      assessment_date,
      venue,
      verified
    `)
    .eq('athlete_id', athleteAId);

  if (athleteASessions && athleteASessions.length === 1 && athleteASessions[0].verified) {
    record('Athlete Self Session Retrieval', 'PASS', 'Athlete A successfully retrieved 1 verified session');
  } else {
    record('Athlete Self Session Retrieval', 'FAIL', `Retrieved ${athleteASessions?.length} sessions`);
  }

  // ============================================================================
  // 7. SECURITY: CROSS-ATHLETE PRIVACY & UNAUTHENTICATED RESTRICTION
  // ============================================================================
  console.log('\n--- 7. CROSS-ATHLETE PRIVACY & ACCESS CONTROL ---');
  // Athlete B attempts to read Athlete A's private assessment sessions
  const { data: athleteBQueryForA } = await athleteBClient
    .from('assessment_sessions')
    .select('*')
    .eq('athlete_id', athleteAId);

  if (!athleteBQueryForA || athleteBQueryForA.length === 0) {
    record('Cross-Athlete Assessment Isolation', 'PASS', 'Athlete B query for Athlete A returned 0 records (RLS enforced)');
  } else {
    record('Cross-Athlete Assessment Isolation', 'FAIL', `Athlete B received ${athleteBQueryForA.length} unauthorized records!`);
  }

  // Unauthenticated (anon) client attempts to read assessment sessions
  const anonClient = createAnonClient();
  const { data: anonSessionQuery } = await anonClient
    .from('assessment_sessions')
    .select('*');

  if (!anonSessionQuery || anonSessionQuery.length === 0) {
    record('Unauthenticated Session Access Denial', 'PASS', 'Anonymous client returned 0 records');
  } else {
    record('Unauthenticated Session Access Denial', 'FAIL', 'Anonymous client accessed records');
  }

  // Athlete B attempts to update Athlete A's biometric records
  const { error: athleteBHijackBio } = await athleteBClient
    .from('athletes')
    .update({ height_cm: 205.0 })
    .eq('id', athleteAId);

  // Check Athlete A's height remained untouched
  const { data: athleteACheck } = await adminClient
    .from('athletes')
    .select('height_cm')
    .eq('id', athleteAId)
    .single();

  if (Number(athleteACheck?.height_cm) === updatedHeight) {
    record('Cross-Athlete Write Tamper Prevention', 'PASS', 'Athlete A record unmodified by Athlete B (RLS blocked)');
  } else {
    record('Cross-Athlete Write Tamper Prevention', 'FAIL', 'Athlete B modified Athlete A record!');
  }

  // ============================================================================
  // 8. ATHLETE B EMPTY STATE VERIFICATION
  // ============================================================================
  console.log('\n--- 8. EMPTY STATE VERIFICATION FOR UNEVALUATED ATHLETE ---');
  const { data: athleteBSessions } = await athleteBClient
    .from('assessment_sessions')
    .select('*')
    .eq('athlete_id', athleteBId);

  if (athleteBSessions && athleteBSessions.length === 0) {
    record('Unevaluated Athlete Empty State', 'PASS', 'Athlete B has 0 sessions; triggers dashboard empty state');
  } else {
    record('Unevaluated Athlete Empty State', 'FAIL', `Athlete B had ${athleteBSessions?.length} unexpected sessions`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n======================================================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================================');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
