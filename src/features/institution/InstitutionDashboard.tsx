import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TalentHeatmap } from './TalentHeatmap';
import { GraduationCap, MapPin, Users, Award, Download, Search } from 'lucide-react';

export function InstitutionDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            State Sports Board &amp; Institution Portal
          </h1>
          <p className="text-sm text-slate-500">
            District-level talent discovery pipeline, school scouting camps, and Khelo India / SAI benchmarks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Download Board Report
          </Button>
          <Button variant="primary" size="sm">
            Schedule Talent Camp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Total Scouted</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">2,430</p>
          <span className="text-xs text-emerald-600 font-medium">+18% this quarter</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Partner Schools</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">118</p>
          <span className="text-xs text-slate-400">Across 12 districts</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Eligible for National Camp</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">146</p>
          <span className="text-xs text-slate-400">Top 90th percentile</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Assessments Verified</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">98.2%</p>
          <span className="text-xs text-emerald-600 font-medium">AI &amp; Coach Checked</span>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>District Talent Heatmap &amp; Scouting Analytics</CardTitle>
              <CardDescription>
                Overview of physical fitness standards and sport-specific potential across regions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TalentHeatmap />
        </CardContent>
      </Card>
    </div>
  );
}
