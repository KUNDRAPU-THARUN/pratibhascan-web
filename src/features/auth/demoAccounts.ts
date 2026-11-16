import type { User } from '@supabase/supabase-js';
import type { DatabaseRole } from '@/types/database.types';
import type { UserProfile, AcademyOrg, InstitutionOrg, AthleteData } from './AuthContext';

export interface DemoAccountConfig {
  user: User;
  profile: UserProfile;
  role: DatabaseRole;
  athleteData?: AthleteData;
  organization?: AcademyOrg | InstitutionOrg;
}

export const DEMO_ACCOUNTS: Record<string, DemoAccountConfig> = {
  'athlete.e2e@kaaryan.test': {
    role: 'athlete',
    user: {
      id: 'bd133b77-31a2-41f2-b322-c04a699d2676',
      email: 'athlete.e2e@kaaryan.test',
      app_metadata: {},
      user_metadata: { role: 'athlete', full_name: 'Arjun E2E Athlete' },
      aud: 'authenticated',
      created_at: '2026-11-12T00:00:00.000Z',
    } as User,
    profile: {
      id: 'bd133b77-31a2-41f2-b322-c04a699d2676',
      email: 'athlete.e2e@kaaryan.test',
      full_name: 'Arjun E2E Athlete',
      role: 'athlete',
      phone_number: '+919876543210',
      avatar_url: null,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      is_suspended: false,
      suspension_reason: null,
      created_at: '2026-11-12T00:00:00.000Z',
    },
    athleteData: {
      id: 'bd133b77-31a2-41f2-b322-c04a699d2676',
      date_of_birth: '2008-05-15',
      gender: 'male',
      primary_sport: 'Athletics (100m Sprint)',
      secondary_sport: 'Long Jump',
      height_cm: 178.5,
      weight_kg: 68.2,
      wingspan_cm: 182.0,
      composite_talent_score: 87.4,
    },
  },
  'academy.e2e@kaaryan.test': {
    role: 'academy',
    user: {
      id: '81893def-cebb-4991-b846-75fff7a91cc0',
      email: 'academy.e2e@kaaryan.test',
      app_metadata: {},
      user_metadata: { role: 'academy', full_name: 'Coach Vikram Director' },
      aud: 'authenticated',
      created_at: '2026-11-12T00:00:00.000Z',
    } as User,
    profile: {
      id: '81893def-cebb-4991-b846-75fff7a91cc0',
      email: 'academy.e2e@kaaryan.test',
      full_name: 'Coach Vikram Director',
      role: 'academy',
      phone_number: '+919876543211',
      avatar_url: null,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      is_suspended: false,
      suspension_reason: null,
      created_at: '2026-11-12T00:00:00.000Z',
    },
    organization: {
      id: 'acad-demo-001',
      owner_id: '81893def-cebb-4991-b846-75fff7a91cc0',
      name: 'Apex Sports Academy',
      registration_number: 'REG-KA-2024-001',
      contact_email: 'academy.e2e@kaaryan.test',
      contact_phone: '+919876543211',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      sports_offered: ['Athletics', 'Football', 'Badminton'],
      verified: true,
    },
  },
  'coach2.e2e@kaaryan.test': {
    role: 'academy',
    user: {
      id: '3919a5b5-b557-43ff-a18f-0524d6fed411',
      email: 'coach2.e2e@kaaryan.test',
      app_metadata: {},
      user_metadata: { role: 'academy', full_name: 'Coach Neha Reviewer' },
      aud: 'authenticated',
      created_at: '2026-11-12T00:00:00.000Z',
    } as User,
    profile: {
      id: '3919a5b5-b557-43ff-a18f-0524d6fed411',
      email: 'coach2.e2e@kaaryan.test',
      full_name: 'Coach Neha Reviewer',
      role: 'academy',
      phone_number: '+919876543213',
      avatar_url: null,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      is_suspended: false,
      suspension_reason: null,
      created_at: '2026-11-12T00:00:00.000Z',
    },
    organization: {
      id: 'acad-demo-001',
      owner_id: '81893def-cebb-4991-b846-75fff7a91cc0',
      name: 'Apex Sports Academy',
      registration_number: 'REG-KA-2024-001',
      contact_email: 'academy.e2e@kaaryan.test',
      contact_phone: '+919876543211',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      sports_offered: ['Athletics', 'Football', 'Badminton'],
      verified: true,
    },
  },
  'institution.e2e@kaaryan.test': {
    role: 'institution',
    user: {
      id: 'fe8d91e1-ae9a-4a26-88bf-90cc33324df6',
      email: 'institution.e2e@kaaryan.test',
      app_metadata: {},
      user_metadata: { role: 'institution', full_name: 'Officer Rahul State' },
      aud: 'authenticated',
      created_at: '2026-11-12T00:00:00.000Z',
    } as User,
    profile: {
      id: 'fe8d91e1-ae9a-4a26-88bf-90cc33324df6',
      email: 'institution.e2e@kaaryan.test',
      full_name: 'Officer Rahul State',
      role: 'institution',
      phone_number: '+919876543212',
      avatar_url: null,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      is_suspended: false,
      suspension_reason: null,
      created_at: '2026-11-12T00:00:00.000Z',
    },
    organization: {
      id: 'inst-demo-001',
      owner_id: 'fe8d91e1-ae9a-4a26-88bf-90cc33324df6',
      name: 'Department of Youth & Sports Affairs',
      type: 'sports_board',
      contact_email: 'institution.e2e@kaaryan.test',
      contact_phone: '+919876543212',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      verified: true,
    },
  },
};

// Aliases for user convenience
DEMO_ACCOUNTS['athlete@kaaryan.test'] = DEMO_ACCOUNTS['athlete.e2e@kaaryan.test'];
DEMO_ACCOUNTS['academy@kaaryan.test'] = DEMO_ACCOUNTS['academy.e2e@kaaryan.test'];
DEMO_ACCOUNTS['institution@kaaryan.test'] = DEMO_ACCOUNTS['institution.e2e@kaaryan.test'];
