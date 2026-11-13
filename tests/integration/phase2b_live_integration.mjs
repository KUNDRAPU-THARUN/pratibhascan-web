import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const MAILPIT_URL = 'http://127.0.0.1:54324';

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
  console.log('PRATIBHASCAN WEB — LIVE SUPABASE INTEGRATION TEST SUITE');
  console.log(`Connected to: ${SUPABASE_URL} (Local Docker Stack)`);
  console.log('======================================================================\n');

  const timestamp = Date.now();
  const testPassword = 'Password123!';

  // ============================================================================
  // 1. ATHLETE LIFECYCLE
  // ============================================================================
  console.log('\n--- 1. ATHLETE LIFECYCLE ---');
  const athleteEmail = `athlete_${timestamp}@test.kaaryanlabs.local`;
  const athleteClient = createAnonClient();

  const { data: athleteSignup, error: athleteSignupErr } = await athleteClient.auth.signUp({
    email: athleteEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Synthetic Athlete',
        role: 'athlete',
      },
    },
  });

  if (athleteSignupErr || !athleteSignup.user) {
    record('Athlete Signup', 'FAIL', athleteSignupErr?.message);
    return;
  }
  record('Athlete Signup', 'PASS', `User ID: ${athleteSignup.user.id}`);

  // Verify user_profiles row created with role = 'athlete'
  const { data: athleteProfile, error: athleteProfileErr } = await athleteClient
    .from('user_profiles')
    .select('*')
    .eq('id', athleteSignup.user.id)
    .single();

  if (athleteProfileErr || athleteProfile.role !== 'athlete') {
    record('Athlete Profile Trigger & Role Creation', 'FAIL', athleteProfileErr?.message || `Unexpected role: ${athleteProfile?.role}`);
  } else {
    record('Athlete Profile Trigger & Role Creation', 'PASS', `Profile role is ${athleteProfile.role}`);
  }

  // Onboard Athlete
  const { error: athleteBioUpdateErr } = await athleteClient
    .from('athletes')
    .update({
      date_of_birth: '2006-05-15',
      gender: 'male',
      primary_sport: 'Athletics',
      secondary_sport: 'Badminton',
      height_cm: 178,
      weight_kg: 68,
      wingspan_cm: 182,
    })
    .eq('id', athleteSignup.user.id);

  const { error: athleteProfileUpdateErr } = await athleteClient
    .from('user_profiles')
    .update({
      phone_number: '+919876543210',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
    })
    .eq('id', athleteSignup.user.id);

  if (athleteBioUpdateErr || athleteProfileUpdateErr) {
    record('Athlete Onboarding Submission', 'FAIL', athleteBioUpdateErr?.message || athleteProfileUpdateErr?.message);
  } else {
    record('Athlete Onboarding Submission', 'PASS', 'Biometrics & Location updated in DB');
  }

  // ============================================================================
  // 2. ACADEMY LIFECYCLE
  // ============================================================================
  console.log('\n--- 2. ACADEMY LIFECYCLE ---');
  const academyEmail = `academy_${timestamp}@test.kaaryanlabs.local`;
  const academyClient = createAnonClient();

  const { data: academySignup, error: academySignupErr } = await academyClient.auth.signUp({
    email: academyEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Synthetic Academy Director',
        role: 'academy',
      },
    },
  });

  if (academySignupErr || !academySignup.user) {
    record('Academy Signup', 'FAIL', academySignupErr?.message);
    return;
  }
  record('Academy Signup', 'PASS', `User ID: ${academySignup.user.id}`);

  // Verify academy profile role
  const { data: academyProfile } = await academyClient
    .from('user_profiles')
    .select('role')
    .eq('id', academySignup.user.id)
    .single();

  if (academyProfile?.role === 'academy') {
    record('Academy Profile Trigger & Role Creation', 'PASS', `Profile role is ${academyProfile.role}`);
  } else {
    record('Academy Profile Trigger & Role Creation', 'FAIL', `Role is ${academyProfile?.role}`);
  }

  // Onboard Academy
  const { data: academyOrg, error: academyOnboardErr } = await academyClient
    .from('academies')
    .insert({
      owner_id: academySignup.user.id,
      name: `Kaaryan Apex Sports Academy ${timestamp}`,
      registration_number: `REG-${timestamp}`,
      contact_email: academyEmail,
      contact_phone: '+919123456789',
      state: 'Maharashtra',
      district: 'Pune',
      sports_offered: ['Athletics', 'Shooting', 'Swimming'],
      verified: false,
    })
    .select()
    .single();

  if (academyOnboardErr || !academyOrg) {
    record('Academy Onboarding Submission', 'FAIL', academyOnboardErr?.message);
  } else {
    record('Academy Onboarding Submission', 'PASS', `Academy Org ID: ${academyOrg.id}`);
  }

  // ============================================================================
  // 3. INSTITUTION LIFECYCLE
  // ============================================================================
  console.log('\n--- 3. INSTITUTION LIFECYCLE ---');
  const institutionEmail = `institution_${timestamp}@test.kaaryanlabs.local`;
  const instClient = createAnonClient();

  const { data: instSignup, error: instSignupErr } = await instClient.auth.signUp({
    email: institutionEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Synthetic Institution Dean',
        role: 'institution',
      },
    },
  });

  if (instSignupErr || !instSignup.user) {
    record('Institution Signup', 'FAIL', instSignupErr?.message);
    return;
  }
  record('Institution Signup', 'PASS', `User ID: ${instSignup.user.id}`);

  // Onboard Institution
  const { data: instOrg, error: instOnboardErr } = await instClient
    .from('institutions')
    .insert({
      owner_id: instSignup.user.id,
      name: `National Sports University ${timestamp}`,
      type: 'university',
      contact_email: institutionEmail,
      contact_phone: '+919456781234',
      state: 'Delhi',
      district: 'New Delhi',
      verified: false,
    })
    .select()
    .single();

  if (instOnboardErr || !instOrg) {
    record('Institution Onboarding Submission', 'FAIL', instOnboardErr?.message);
  } else {
    record('Institution Onboarding Submission', 'PASS', `Institution Org ID: ${instOrg.id}`);
  }

  // ============================================================================
  // 4. AUTHENTICATION OPERATIONS & SESSION RESTORATION
  // ============================================================================
  console.log('\n--- 4. AUTHENTICATION OPERATIONS ---');
  
  // Test invalid login
  const { error: invalidLoginErr } = await createAnonClient().auth.signInWithPassword({
    email: athleteEmail,
    password: 'WrongPassword999!',
  });
  if (invalidLoginErr && invalidLoginErr.message.includes('Invalid login credentials')) {
    record('Invalid Login Rejection', 'PASS', 'Correct error returned');
  } else {
    record('Invalid Login Rejection', 'FAIL', invalidLoginErr?.message || 'No error raised');
  }

  // Test successful login
  const freshClient = createAnonClient();
  const { data: validLogin, error: validLoginErr } = await freshClient.auth.signInWithPassword({
    email: athleteEmail,
    password: testPassword,
  });
  if (validLoginErr || !validLogin.session) {
    record('Valid Login with Password', 'FAIL', validLoginErr?.message);
  } else {
    record('Valid Login with Password', 'PASS', 'Session established');
  }

  // Test session refresh (session restoration capability)
  const { data: refreshedSession, error: refreshErr } = await freshClient.auth.refreshSession({
    refresh_token: validLogin.session.refresh_token,
  });
  if (refreshErr || !refreshedSession.session) {
    record('Session Refresh & Restoration', 'FAIL', refreshErr?.message);
  } else {
    record('Session Refresh & Restoration', 'PASS', 'Refreshed access token successfully');
  }

  // Test Sign Out
  const { error: logoutErr } = await freshClient.auth.signOut();
  if (logoutErr) {
    record('Sign Out Teardown', 'FAIL', logoutErr.message);
  } else {
    record('Sign Out Teardown', 'PASS', 'Session revoked');
  }

  // ============================================================================
  // 5. PASSWORD RESET & MAILPIT EMAIL DISPATCH
  // ============================================================================
  console.log('\n--- 5. PASSWORD RECOVERY VIA MAILPIT ---');
  const { error: resetDispatchErr } = await createAnonClient().auth.resetPasswordForEmail(athleteEmail, {
    redirectTo: 'http://localhost:5173/reset-password',
  });

  if (resetDispatchErr) {
    record('Password Reset Request', 'FAIL', resetDispatchErr.message);
  } else {
    record('Password Reset Request', 'PASS', 'Reset request dispatched');
  }

  // Check Mailpit API for dispatched email
  try {
    const mailpitRes = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const mailpitData = await mailpitRes.json();
    const userMessage = mailpitData.messages?.find((m) =>
      m.To?.some((recipient) => recipient.Address === athleteEmail)
    );

    if (userMessage) {
      record('Mailpit Email Delivery', 'PASS', `Subject: "${userMessage.Subject}" received for ${athleteEmail}`);
    } else {
      record('Mailpit Email Delivery', 'FAIL', 'Email not found in Mailpit inbox');
    }
  } catch (err) {
    record('Mailpit Email Delivery', 'FAIL', err.message);
  }

  // ============================================================================
  // 6. SECURITY: PRIVILEGE ESCALATION & CROSS-TENANT ISOLATION
  // ============================================================================
  console.log('\n--- 6. SECURITY: IMMUTABILITY & ISOLATION ---');

  // Test 6A: Role self-assignment prevention (trigger lock_user_profile_role)
  const { error: roleElevationErr } = await athleteClient
    .from('user_profiles')
    .update({ role: 'academy' })
    .eq('id', athleteSignup.user.id);

  if (roleElevationErr && roleElevationErr.message.includes('User role modification is strictly prohibited')) {
    record('Role Self-Elevation Prevention', 'PASS', 'Trigger rejected role mutation: User role modification is strictly prohibited.');
  } else {
    record('Role Self-Elevation Prevention', 'FAIL', roleElevationErr?.message || 'Role change was not blocked!');
  }

  // Test 6B: Claiming an existing organization owned by another user
  const { error: hijackErr } = await athleteClient
    .from('academies')
    .update({ owner_id: athleteSignup.user.id })
    .eq('id', academyOrg.id);

  // Check that academyOrg owner_id is unchanged (still owned by academySignup.user.id, NOT athleteSignup.user.id)
  const { data: checkAcademy } = await adminClient
    .from('academies')
    .select('owner_id')
    .eq('id', academyOrg.id)
    .single();

  if (checkAcademy?.owner_id === academySignup.user.id && checkAcademy?.owner_id !== athleteSignup.user.id) {
    record('Academy Organization Hijack Prevention', 'PASS', 'Owner ID remained original; mutation blocked by RLS');
  } else {
    record('Academy Organization Hijack Prevention', 'FAIL', 'Academy ownership compromised');
  }

  // Test 6C: Unauthorized Evaluator Authorization Creation
  // Athlete attempts to authorize themselves as an evaluator for Academy Org
  const { error: evalAuthErr } = await athleteClient
    .from('evaluator_authorizations')
    .insert({
      evaluator_id: athleteSignup.user.id,
      organization_type: 'academy',
      academy_id: academyOrg.id,
      status: 'active',
    });

  if (evalAuthErr && evalAuthErr.message.includes('violates row-level security policy')) {
    record('Unauthorized Evaluator Authorization', 'PASS', `Rejected by RLS: ${evalAuthErr.message}`);
  } else {
    record('Unauthorized Evaluator Authorization', 'FAIL', evalAuthErr?.message || 'Unauthorized evaluator record created!');
  }

  // Test 6D: Athlete Self-Evaluation Check Constraint
  // Attempt to create assessment session where athlete_id === evaluator_id
  const { error: selfEvalErr } = await adminClient
    .from('assessment_sessions')
    .insert({
      athlete_id: athleteSignup.user.id,
      evaluator_id: athleteSignup.user.id,
      academy_id: academyOrg.id,
      assessment_date: '2026-11-13',
    });

  if (selfEvalErr && selfEvalErr.message.includes('check_no_self_evaluation')) {
    record('Self-Evaluation Prevention Constraint', 'PASS', 'Rejected by check_no_self_evaluation');
  } else {
    record('Self-Evaluation Prevention Constraint', 'FAIL', selfEvalErr?.message || 'Self-evaluation allowed');
  }

  // Test 6E: Account Suspension Enforcement
  // Admin sets is_suspended = true on the synthetic athlete
  await adminClient
    .from('user_profiles')
    .update({ is_suspended: true, suspension_reason: 'Automated acceptance test suspension' })
    .eq('id', athleteSignup.user.id);

  // Authenticated athlete attempts a read while suspended (must return 0 rows due to is_active_user check)
  const { data: suspendedReadData } = await athleteClient
    .from('user_profiles')
    .select('*')
    .eq('id', athleteSignup.user.id);

  // Authenticated athlete attempts an insert while suspended (must be rejected by RLS WITH CHECK)
  const { error: suspendedInsertErr } = await athleteClient
    .from('academies')
    .insert({
      owner_id: athleteSignup.user.id,
      name: 'Suspended User Academy Attempt',
      contact_email: 'suspended@test.local',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
    });

  if ((!suspendedReadData || suspendedReadData.length === 0) && suspendedInsertErr) {
    record('Suspended Account Operation Block', 'PASS', 'Read returned 0 rows and Write rejected by RLS (is_active_user check)');
  } else {
    record('Suspended Account Operation Block', 'FAIL', `Read: ${suspendedReadData?.length} rows, InsertErr: ${suspendedInsertErr?.message}`);
  }

  // Restore suspension state
  await adminClient
    .from('user_profiles')
    .update({ is_suspended: false, suspension_reason: null })
    .eq('id', athleteSignup.user.id);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n======================================================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal execution error in integration script:', err);
  process.exit(1);
});
