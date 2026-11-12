import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Users,
  Building2,
  Calendar,
  Filter,
  Plus,
  Search,
  ChevronRight,
  Sparkles,
  Download,
} from 'lucide-react';

interface RosterMember {
  id: string;
  name: string;
  sport: string;
  age: number;
  gender: string;
  sprintScore: string;
  jumpScore: string;
  status: 'active' | 'evaluating';
}

const MOCK_ROSTER: RosterMember[] = [
  {
    id: 'ath_101',
    name: 'Simran Kaur',
    sport: 'Badminton',
    age: 18,
    gender: 'Female',
    sprintScore: '4.12s',
    jumpScore: '52.0cm',
    status: 'active',
  },
  {
    id: 'ath_102',
    name: 'Rohan Mehra',
    sport: 'Athletics (Sprints)',
    age: 17,
    gender: 'Male',
    sprintScore: '3.91s',
    jumpScore: '63.0cm',
    status: 'active',
  },
  {
    id: 'ath_103',
    name: 'Kavita Yadav',
    sport: 'Wrestling',
    age: 19,
    gender: 'Female',
    sprintScore: '4.35s',
    jumpScore: '49.5cm',
    status: 'active',
  },
  {
    id: 'ath_104',
    name: 'Devraj Patil',
    sport: 'Swimming',
    age: 16,
    gender: 'Male',
    sprintScore: '4.08s',
    jumpScore: '57.0cm',
    status: 'evaluating',
  },
  {
    id: 'ath_105',
    name: 'Ananya Deshmukh',
    sport: 'Athletics (Jumps)',
    age: 18,
    gender: 'Female',
    sprintScore: '4.18s',
    jumpScore: '58.5cm',
    status: 'active',
  },
];

export function AcademyView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  const handleAction = (title: string, desc: string) => {
    setModalTitle(title);
    setModalDesc(desc);
    setInfoModalOpen(true);
  };

  const filteredRoster = MOCK_ROSTER.filter((ath) => {
    const matchesSearch =
      ath.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ath.sport.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'all' || ath.sport.includes(selectedSport);
    return matchesSearch && matchesSport;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
              Apex Sports High Performance Center
            </h1>
            <Badge variant="blue">Academy Portal</Badge>
            <Badge variant="default" className="text-[10px]">Illustrative Demo Data</Badge>
          </div>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Cohort management, athlete onboarding, and batch standardized testing logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleAction(
                'Export Cohort Analytics',
                'Comprehensive cohort CSV & XLSX reporting with statistical summaries will be activated in Phase 2.'
              )
            }
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              handleAction(
                'Add Athlete to Roster',
                'Athlete invitation, KYC verification, and parental consent forms connect in Phase 2 with Supabase Auth & Storage.'
              )
            }
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Athlete
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary-100 text-secondary-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">Enrolled Cohort</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">84 Athletes</p>
              <span className="text-[11px] font-semibold text-secondary-700 bg-secondary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                4 Active Training Batches
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">Certified Coaches</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">8 Certified</p>
              <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                SAI Calibration Standards
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">Next Battery Assessment</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">In 6 Days</p>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                Quarterly Physical Battery
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Roster Table Card */}
      <Card className="border-navy-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Cohort Athlete Roster</CardTitle>
              <CardDescription>
                Search and review biometric benchmarks for academy athletes.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
                <Input
                  placeholder="Filter athlete or sport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2 text-xs"
                  onClick={() =>
                    setSelectedSport((prev) => (prev === 'all' ? 'Athletics' : 'all'))
                  }
                >
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  {selectedSport === 'all' ? 'Filter' : selectedSport}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-navy-600">
              <thead className="bg-navy-50 text-[11px] uppercase font-bold text-navy-500 border-b border-navy-200">
                <tr>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3">Sport</th>
                  <th className="px-4 py-3">Age &amp; Gender</th>
                  <th className="px-4 py-3">30m Sprint</th>
                  <th className="px-4 py-3">Vertical Jump</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Passport</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredRoster.map((ath) => (
                  <tr key={ath.id} className="hover:bg-navy-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-navy-900">{ath.name}</div>
                      <div className="text-[10px] text-navy-400 font-mono">{ath.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-[11px]">{ath.sport}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-navy-700">
                      {ath.age} yrs • {ath.gender}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-navy-900">
                      {ath.sprintScore}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-navy-900">
                      {ath.jumpScore}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {ath.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleAction(
                            `${ath.name} — Passport Detail`,
                            `Detailed historical passport views and longitudinal charts for ${ath.name} will be displayed here in Phase 2.`
                          )
                        }
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Inspect <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cohort Comparison Section (Anchor target for Sidebar) */}
      <section id="cohort" className="pt-2">
        <Card className="border-navy-200 bg-navy-50/50 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-600" />
              <h3 className="text-base font-bold text-navy-900">Comparative Cohort Benchmarking</h3>
            </div>
            <Badge variant="default">Phase 2 Integration</Badge>
          </div>
          <p className="text-xs text-navy-600 leading-relaxed max-w-2xl">
            Cohort comparisons allow head coaches to evaluate physical distribution across age brackets, sports disciplines, and training cycles. Cohort aggregations activate with Supabase database queries in Phase 2.
          </p>
        </Card>
      </section>

      {/* Informational Modal */}
      <Modal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title={modalTitle}
        description="Academy Hub — Phase 1 Notice"
        footerActions={
          <Button variant="outline" size="sm" onClick={() => setInfoModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-navy-50 border border-navy-200 text-xs text-navy-700 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{modalDesc}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
