/**
 * PratibhaScan E2E Test Accounts Provisioner
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Seeds synthetic test accounts against the local Supabase container (127.0.0.1:54321)
 * for authenticated Playwright browser testing across Athlete, Academy, and Institution roles.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = 'TestPassword123!';

const TEST_USERS = [
  {
    email: 'athlete.e2e@kaaryan.test',
    password: DEFAULT_PASSWORD,
    fullName: 'Arjun E2E Athlete',
    role: 'athlete',
  },
  {
    email: 'academy.e2e@kaaryan.test',
    password: DEFAULT_PASSWORD,
    fullName: 'Coach Vikram Director',
    role: 'academy',
  },
  {
    email: 'coach2.e2e@kaaryan.test',
    password: DEFAULT_PASSWORD,
    fullName: 'Coach Neha Reviewer',
    role: 'academy',
  },
  {
    email: 'institution.e2e@kaaryan.test',
    password: DEFAULT_PASSWORD,
    fullName: 'Officer Rahul State',
    role: 'institution',
  },
];

async function seed() {
  console.log('Seeding synthetic accounts for E2E testing against local Supabase...');

  const userIds = {};

  // 1. Create or retrieve auth users
  const { data: existingUsersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    throw new Error('Failed to list existing auth users: ' + listErr.message);
  }
  const existingByEmail = new Map(existingUsersData.users.map((u) => [u.email, u]));

  for (const u of TEST_USERS) {
    let uid;
    if (existingByEmail.has(u.email)) {
      uid = existingByEmail.get(u.email).id;
      console.log(`Updating existing user: ${u.email} (${uid})`);
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(uid, {
        password: u.password,
        email_confirm: true,
        user_metadata: { role: u.role, full_name: u.fullName },
      });
      if (updErr) console.warn('Update user warning:', updErr.message);
    } else {
      console.log(`Creating user: ${u.email}`);
      const { data: newUserData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { role: u.role, full_name: u.fullName },
      });
      if (createErr) throw createErr;
      uid = newUserData.user.id;
    }
    userIds[u.email] = uid;

    // Ensure user_profiles table is populated with state and district for completed onboarding
    await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: uid,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        phone_number: '+919876543210',
        is_suspended: false,
      });
  }

  const athleteUid = userIds['athlete.e2e@kaaryan.test'];
  const academyUid = userIds['academy.e2e@kaaryan.test'];
  const coach2Uid = userIds['coach2.e2e@kaaryan.test'];
  const institutionUid = userIds['institution.e2e@kaaryan.test'];

  // 2. Seed Athlete domain record
  console.log('Seeding athlete record for Arjun E2E Athlete...');
  await supabaseAdmin.from('athletes').upsert({
    id: athleteUid,
    date_of_birth: '2008-05-10',
    gender: 'male',
    primary_sport: 'Athletics',
    height_cm: 176.0,
    weight_kg: 66.0,
    wingspan_cm: 180.0,
    composite_talent_score: 84.5,
  });

  // 3. Seed Academy domain record
  console.log('Seeding academy record for Coach Vikram Director...');
  const academyId = 'e2e00000-0000-0000-0000-000000000001';
  await supabaseAdmin.from('academies').upsert({
    id: academyId,
    owner_id: academyUid,
    name: 'Apex E2E High Performance Academy',
    contact_email: 'apex.e2e@kaaryan.test',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    verified: true,
  });

  // 4. Seed Institution domain record
  console.log('Seeding institution record for Officer Rahul State...');
  const institutionId = 'e2e00000-0000-0000-0000-000000000002';
  await supabaseAdmin.from('institutions').upsert({
    id: institutionId,
    owner_id: institutionUid,
    name: 'State Sports Authority E2E',
    type: 'sports_board',
    contact_email: 'board.e2e@kaaryan.test',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    verified: true,
  });

  // 5. Authorize Coach 2 for Apex Academy
  console.log('Authorizing Coach Neha as accredited staff evaluator for Apex Academy...');
  await supabaseAdmin
    .from('evaluator_authorizations')
    .delete()
    .eq('evaluator_id', coach2Uid);

  await supabaseAdmin.from('evaluator_authorizations').insert({
    evaluator_id: coach2Uid,
    organization_type: 'academy',
    academy_id: academyId,
    accreditation_number: 'ACC-E2E-COACH2',
    status: 'active',
  });

  // 6. Active Affiliation for Athlete with Academy
  console.log('Affiliating athlete with Apex Academy...');
  await supabaseAdmin
    .from('athlete_affiliations')
    .delete()
    .eq('athlete_id', athleteUid);

  await supabaseAdmin.from('athlete_affiliations').insert({
    athlete_id: athleteUid,
    organization_type: 'academy',
    academy_id: academyId,
    status: 'active',
    requested_by: athleteUid,
    approved_by: academyUid,
  });

  // 7. Seed initial baseline verified session
  console.log('Seeding initial two-person verified baseline session...');
  const verifiedSessionId = 'e2e00000-0000-0000-0000-000000000010';

  // Clear any existing test sessions for this athlete/academy except baseline
  await supabaseAdmin
    .from('assessment_sessions')
    .delete()
    .eq('academy_id', academyId)
    .neq('id', verifiedSessionId);

  await supabaseAdmin.from('assessment_sessions').upsert({
    id: verifiedSessionId,
    athlete_id: athleteUid,
    evaluator_id: academyUid,
    academy_id: academyId,
    assessment_date: '2026-11-05',
    venue: 'Apex Center Track A',
    notes: 'Initial SAI Battery Benchmark',
    verified: true,
    verification_tier: 'two_person_verified',
    verified_by: coach2Uid,
    secondary_reviewer_id: coach2Uid,
    review_notes: 'Independently certified by Coach Neha',
  });

  // Fetch standard protocols
  const { data: sprintProtocol } = await supabaseAdmin
    .from('assessment_protocols')
    .select('id')
    .eq('code', 'TEST_30M_SPRINT')
    .maybeSingle();

  if (sprintProtocol) {
    await supabaseAdmin.from('assessment_results').upsert({
      id: 'e2e00000-0000-0000-0000-000000000020',
      session_id: verifiedSessionId,
      protocol_id: sprintProtocol.id,
      trial_1: 4.02,
      trial_2: 3.92,
      trial_3: 3.95,
      best_score: 3.92,
      status: 'two_person_verified',
    });
  }

  console.log('Synthetic accounts and initial records seeded successfully!');
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
