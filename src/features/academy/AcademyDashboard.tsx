import { useState } from 'react';
import { AthleteProfile, Academy } from '@/types';
import { RosterList } from './RosterList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Award, ShieldCheck, Download } from 'lucide-react';

const MOCK_ACADEMY: Academy = {
  id: 'acad_001',
  name: 'Apex Sports High Performance Center',
  registrationNumber: 'REG-IND-2024-9812',
  sportsOffered: ['Athletics', 'Badminton', 'Swimming', 'Wrestling'],
  state: 'Haryana',
  district: 'Sonipat',
  contactEmail: 'admissions@apexhighperf.org',
  contactPhone: '+91 98765 43210',
  athleteCount: 142,
  coachCount: 12,
};

const MOCK_ROSTER: AthleteProfile[] = [
  {
    id: 'ath_001',
    userId: 'usr_01',
    fullName: 'Simran Kaur',
    dateOfBirth: '2007-06-21',
    age: 19,
    gender: 'female',
    primarySport: 'Badminton',
    heightCm: 172,
    weightKg: 60,
    state: 'Haryana',
    district: 'Sonipat',
    talentScore: 94,
    badges: ['State Gold Medalist', 'High Agility Score'],
  },
  {
    id: 'ath_002',
    userId: 'usr_02',
    fullName: 'Rohan Mehra',
    dateOfBirth: '2008-01-12',
    age: 18,
    gender: 'male',
    primarySport: 'Athletics',
    heightCm: 184,
    weightKg: 73,
    state: 'Punjab',
    district: 'Ludhiana',
    talentScore: 88,
    badges: ['SAI Benchmark Met'],
  },
  {
    id: 'ath_003',
    userId: 'usr_03',
    fullName: 'Kavita Yadav',
    dateOfBirth: '2009-11-04',
    age: 17,
    gender: 'female',
    primarySport: 'Wrestling',
    heightCm: 165,
    weightKg: 57,
    state: 'Haryana',
    district: 'Rohtak',
    talentScore: 91,
    badges: ['National Camp Selected'],
  },
];

export function AcademyDashboard() {
  const [academy] = useState<Academy>(MOCK_ACADEMY);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{academy.name}</h1>
            <span className="inline-flex items-center text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Verified Academy
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {academy.district}, {academy.state} • Reg: {academy.registrationNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export Roster
          </Button>
          <Button variant="primary" size="sm">
            Batch Assessment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Enrolled Athletes</p>
              <p className="text-2xl font-bold text-slate-900">{academy.athleteCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 text-brand-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Certified Coaches</p>
              <p className="text-2xl font-bold text-slate-900">{academy.coachCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Talent Benchmarks</p>
              <p className="text-2xl font-bold text-slate-900">89.4 Avg Index</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Academy Athlete Roster</CardTitle>
          <CardDescription>
            Manage active athletes, assessment scores, and progression tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RosterList athletes={MOCK_ROSTER} />
        </CardContent>
      </Card>
    </div>
  );
}
