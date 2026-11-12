import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  MapPin,
  Calendar,
  Sparkles,
  Download,
  Award,
} from 'lucide-react';

interface DistrictScoutData {
  district: string;
  state: string;
  athletesAssessed: number;
  leadingSport: string;
  topPercentileCount: number; // 90th percentile +
}

const DISTRICT_DATA: DistrictScoutData[] = [
  { district: 'Bengaluru Urban', state: 'Karnataka', athletesAssessed: 520, leadingSport: 'Athletics (Sprints)', topPercentileCount: 48 },
  { district: 'Mysuru', state: 'Karnataka', athletesAssessed: 310, leadingSport: 'Wrestling & Power', topPercentileCount: 26 },
  { district: 'Belagavi', state: 'Karnataka', athletesAssessed: 280, leadingSport: 'Swimming & Endurance', topPercentileCount: 22 },
  { district: 'Dharwad', state: 'Karnataka', athletesAssessed: 210, leadingSport: 'Badminton & Agility', topPercentileCount: 19 },
  { district: 'Dakshina Kannada', state: 'Karnataka', athletesAssessed: 340, leadingSport: 'Athletics & Sprints', topPercentileCount: 35 },
  { district: 'Tumakuru', state: 'Karnataka', athletesAssessed: 190, leadingSport: 'Kabaddi & Agility', topPercentileCount: 14 },
];

export function InstitutionView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  const handleAction = (title: string, desc: string) => {
    setModalTitle(title);
    setModalDesc(desc);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
              State Sports Board &amp; Institution Portal
            </h1>
            <Badge variant="default">Federation View</Badge>
          </div>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            District-level scouting pipeline, verified school assessments, and Khelo India / SAI norm tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleAction(
                'Generate Board Talent Report',
                'Aggregated demographic and biometric PDF reports for ministry and board reviews will be enabled in Phase 2.'
              )
            }
          >
            <Download className="h-4 w-4 mr-1.5" />
            Board Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              handleAction(
                'Schedule District Talent Camp',
                'District camp creation, field tester dispatching, and QR protocol distribution connect in Phase 2.'
              )
            }
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Schedule Camp
          </Button>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-navy-200">
          <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider">Total Athletes Evaluated</p>
          <p className="text-2xl font-extrabold text-navy-900 mt-1">1,850</p>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Across 6 Districts
          </span>
        </Card>

        <Card className="p-4 border-navy-200">
          <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider">Partner Schools</p>
          <p className="text-2xl font-extrabold text-navy-900 mt-1">74</p>
          <span className="text-[11px] font-semibold text-navy-600 bg-navy-100 px-2 py-0.5 rounded-full inline-block mt-1">
            Active Testing Centers
          </span>
        </Card>

        <Card className="p-4 border-navy-200">
          <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider">National Camp Benchmarks</p>
          <p className="text-2xl font-extrabold text-primary-600 mt-1">164</p>
          <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
            &gt;90th Percentile SAI
          </span>
        </Card>

        <Card className="p-4 border-navy-200">
          <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider">Protocol Compliance</p>
          <p className="text-2xl font-extrabold text-navy-900 mt-1">99.4%</p>
          <span className="text-[11px] font-semibold text-secondary-700 bg-secondary-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Multi-Trial Integrity
          </span>
        </Card>
      </div>

      {/* District Talent Density Overview */}
      <Card className="border-navy-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>District Talent Density &amp; Regional Scouting Logs</CardTitle>
              <CardDescription>
                Overview of physical battery benchmarks and sport-specific potential across partner districts.
              </CardDescription>
            </div>
            <Badge variant="teal">Verified Protocol Data</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DISTRICT_DATA.map((d) => (
              <div
                key={d.district}
                className="p-4 rounded-xl border border-navy-200/90 bg-white hover:border-primary-300 transition-all shadow-subtle space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-navy-900 text-sm">
                    <MapPin className="h-4 w-4 text-primary-600 shrink-0" />
                    <span>{d.district}</span>
                  </div>
                  <span className="text-[10px] font-mono text-navy-400">{d.state}</span>
                </div>

                <div className="text-xs text-navy-600 space-y-1 pt-1 border-t border-navy-100">
                  <div className="flex justify-between">
                    <span>Athletes Tested:</span>
                    <span className="font-bold text-navy-900 font-mono">{d.athletesAssessed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Primary Sport Bias:</span>
                    <span className="font-medium text-navy-800">{d.leadingSport}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-primary-700 font-semibold flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" /> High-Potential (&gt;90%):
                    </span>
                    <span className="font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200 font-mono">
                      {d.topPercentileCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informational Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        description="Institution &amp; Sports Board Portal Notice"
        footerActions={
          <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
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
