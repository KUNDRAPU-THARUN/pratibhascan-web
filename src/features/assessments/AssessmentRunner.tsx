import { useState } from 'react';
import { STANDARD_TESTS } from '@/lib/constants';
import { TestCard } from './TestCard';
import { ScorecardView } from './ScorecardView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AssessmentResult } from '@/types';
import { Activity, Check, ArrowLeft, Trophy } from 'lucide-react';

export function AssessmentRunner() {
  const [activeTestCode, setActiveTestCode] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState('Vikramaditya Roy');
  const [trial1, setTrial1] = useState('');
  const [trial2, setTrial2] = useState('');
  const [trial3, setTrial3] = useState('');

  const [completedResults, setCompletedResults] = useState<AssessmentResult[]>([
    {
      id: 'res_sample_1',
      protocolCode: 'TEST_30M_SPRINT',
      testName: '30-Meter Sprint',
      category: 'speed',
      trial1: 4.12,
      trial2: 3.98,
      trial3: 3.95,
      bestScore: 3.95,
      unit: 'sec',
      percentileRank: 93,
      status: 'verified',
    },
    {
      id: 'res_sample_2',
      protocolCode: 'TEST_VERT_JUMP',
      testName: 'Vertical Jump',
      category: 'power',
      trial1: 54,
      trial2: 58,
      trial3: 59.5,
      bestScore: 59.5,
      unit: 'cm',
      percentileRank: 87,
      status: 'verified',
    },
  ]);

  const activeTest = STANDARD_TESTS.find((t) => t.code === activeTestCode);

  const handleSaveResult = () => {
    if (!activeTest) return;
    const t1 = parseFloat(trial1) || 0;
    const t2 = parseFloat(trial2) || 0;
    const t3 = parseFloat(trial3) || 0;
    const validScores = [t1, t2, t3].filter((s) => s > 0);

    const best = activeTest.lowerIsBetter
      ? Math.min(...validScores)
      : Math.max(...validScores);

    const newResult: AssessmentResult = {
      id: `res_${Date.now()}`,
      protocolCode: activeTest.code,
      testName: activeTest.name,
      category: activeTest.category as any,
      trial1: t1 || undefined,
      trial2: t2 || undefined,
      trial3: t3 || undefined,
      bestScore: best || 0,
      unit: activeTest.unit,
      percentileRank: Math.floor(Math.random() * 20) + 80, // Demo rank
      status: 'verified',
    };

    setCompletedResults([newResult, ...completedResults]);
    setActiveTestCode(null);
    setTrial1('');
    setTrial2('');
    setTrial3('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Standardized Assessments
          </h1>
          <p className="text-sm text-slate-500">
            Execute standardized talent tests, record multi-trial biometric data, and calculate percentiles.
          </p>
        </div>
      </div>

      {activeTest ? (
        <Card className="max-w-xl mx-auto border-brand-200 ring-2 ring-brand-500/10">
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTestCode(null)}
                className="text-slate-500 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Tests
              </Button>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Unit: {activeTest.unit}
              </span>
            </div>
            <CardTitle>{activeTest.name}</CardTitle>
            <CardDescription>{activeTest.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Athlete Name"
              value={athleteName}
              onChange={(e) => setAthleteName(e.target.value)}
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Trial 1"
                type="number"
                step="any"
                placeholder="0.0"
                value={trial1}
                onChange={(e) => setTrial1(e.target.value)}
              />
              <Input
                label="Trial 2"
                type="number"
                step="any"
                placeholder="0.0"
                value={trial2}
                onChange={(e) => setTrial2(e.target.value)}
              />
              <Input
                label="Trial 3"
                type="number"
                step="any"
                placeholder="0.0"
                value={trial3}
                onChange={(e) => setTrial3(e.target.value)}
              />
            </div>

            <Button className="w-full mt-4" size="lg" onClick={handleSaveResult}>
              <Check className="h-4 w-4 mr-2" />
              Save &amp; Verify Assessment Score
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_TESTS.map((test) => (
              <TestCard
                key={test.code}
                test={test}
                onStartTest={(code) => setActiveTestCode(code)}
              />
            ))}
          </div>

          <ScorecardView results={completedResults} athleteName={athleteName} />
        </>
      )}
    </div>
  );
}
