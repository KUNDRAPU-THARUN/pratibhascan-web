import { AssessmentResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface ScorecardViewProps {
  results: AssessmentResult[];
  athleteName: string;
}

export function ScorecardView({ results, athleteName }: ScorecardViewProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Verified Assessment Scorecard</CardTitle>
            <p className="text-xs text-slate-500">Athlete: {athleteName}</p>
          </div>
          <Badge variant="success">SAI Standard</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Test Name</th>
                <th className="px-3 py-2">Trial 1</th>
                <th className="px-3 py-2">Trial 2</th>
                <th className="px-3 py-2">Trial 3</th>
                <th className="px-3 py-2 font-bold text-slate-900">Best Score</th>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-3 font-medium text-slate-900">{res.testName}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{res.trial1 ?? '-'}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{res.trial2 ?? '-'}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{res.trial3 ?? '-'}</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    {res.bestScore} {res.unit}
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold text-brand-600">
                    {res.percentileRank}th %tile
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
