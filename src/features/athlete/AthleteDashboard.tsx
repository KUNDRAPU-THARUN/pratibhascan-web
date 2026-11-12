import { useState } from 'react';
import { AthleteProfile, AssessmentResult } from '@/types';
import { AthleteProfileCard } from './AthleteProfileCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Flame, Zap, HeartPulse, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_ATHLETE: AthleteProfile = {
  id: 'ath_001',
  userId: 'usr_ath_01',
  fullName: 'Arjun Verma',
  dateOfBirth: '2008-04-15',
  age: 18,
  gender: 'male',
  primarySport: 'Athletics (Sprints)',
  secondarySport: 'Long Jump',
  heightCm: 178,
  weightKg: 68,
  wingspanCm: 182,
  academyName: 'National Center of Sports Excellence, Bengaluru',
  state: 'Karnataka',
  district: 'Bengaluru Urban',
  talentScore: 92,
  badges: ['Top 5% National Sprint', 'SAI Standard Verified', 'High Aerobic Base'],
};

const MOCK_RESULTS: AssessmentResult[] = [
  {
    id: 'res_01',
    protocolCode: 'TEST_30M_SPRINT',
    testName: '30-Meter Sprint',
    category: 'speed',
    bestScore: 3.82,
    unit: 'sec',
    percentileRank: 96,
    status: 'verified',
  },
  {
    id: 'res_02',
    protocolCode: 'TEST_VERT_JUMP',
    testName: 'Vertical Jump',
    category: 'power',
    bestScore: 62.5,
    unit: 'cm',
    percentileRank: 89,
    status: 'verified',
  },
  {
    id: 'res_03',
    protocolCode: 'TEST_BEEP_TEST',
    testName: 'Beep Test (Yo-Yo)',
    category: 'endurance',
    bestScore: 19.4,
    unit: 'shuttles',
    percentileRank: 91,
    status: 'verified',
  },
  {
    id: 'res_04',
    protocolCode: 'TEST_SIT_REACH',
    testName: 'Sit & Reach Flexibility',
    category: 'flexibility',
    bestScore: 34.0,
    unit: 'cm',
    percentileRank: 78,
    status: 'verified',
  },
];

export function AthleteDashboard() {
  const [athlete] = useState<AthleteProfile>(MOCK_ATHLETE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Athlete Hub</h1>
          <p className="text-sm text-slate-500">
            Physical benchmark monitoring, fitness assessments, and national talent rankings.
          </p>
        </div>
        <Link to="/assessments">
          <Button variant="primary">
            <Activity className="h-4 w-4 mr-2" />
            Start New Assessment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AthleteProfileCard athlete={athlete} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-100 text-brand-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Sprint Acceleration</p>
                  <p className="text-xl font-bold text-slate-900">3.82s (96th %tile)</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Lower Body Power</p>
                  <p className="text-xl font-bold text-slate-900">62.5 cm Jump</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Aerobic Capacity</p>
                  <p className="text-xl font-bold text-slate-900">Level 19.4</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Standardized Test Results</CardTitle>
                  <CardDescription>Verified by certified SAI / Academy evaluators</CardDescription>
                </div>
                <Badge variant="success">All Verified</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {MOCK_RESULTS.map((res) => (
                  <div key={res.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{res.testName}</p>
                      <p className="text-xs text-slate-500 capitalize">{res.category} protocol</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {res.bestScore} {res.unit}
                      </p>
                      <span className="text-xs text-emerald-600 font-medium">
                        {res.percentileRank}th Percentile
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
