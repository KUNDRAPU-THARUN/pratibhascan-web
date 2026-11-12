import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { STANDARD_PROTOCOLS } from '@/lib/constants';
import {
  Activity,
  Zap,
  Flame,
  HeartPulse,
  Ruler,
  Weight,
  MapPin,
  Calendar,
  Share2,
  Download,
  Info,
} from 'lucide-react';

export function AthleteView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; desc: string }>({
    title: '',
    desc: '',
  });

  const handleAction = (title: string, desc: string) => {
    setModalContent({ title, desc });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
            Athletic Passport &amp; Assessment Hub
          </h1>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Verified biometric profile, standardized test scores, and national age-group percentiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleAction(
                'Export Verified Passport',
                'Official digital passport PDF generation with cryptographic verification will be activated in Phase 2 with Supabase Storage.'
              )
            }
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Passport
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              handleAction(
                'Share Verified Profile',
                'A secure, tamper-proof sharing link for academies and coaches will be available upon Supabase Auth verification in Phase 2.'
              )
            }
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share Profile
          </Button>
        </div>
      </div>

      {/* Athlete Header Profile Card */}
      <Card className="overflow-hidden border-navy-200">
        <div className="h-24 bg-gradient-to-r from-primary-600 via-teal-600 to-secondary-600 p-4 relative flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="bg-white/20 border-white/30 text-white backdrop-blur-xs text-[11px]">
              Protocols Modeled on SAI Benchmarks
            </Badge>
            <Badge variant="default" className="bg-navy-950/40 border-white/20 text-white backdrop-blur-xs text-[10px]">
              Illustrative Demo Data
            </Badge>
          </div>
          <span className="text-xs font-mono bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs font-semibold">
            ID: PS-2026-ATH-081 (Sample)
          </span>
        </div>

        <CardContent className="pt-0 relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl border-4 border-white bg-navy-900 text-white flex items-center justify-center text-xl font-bold shadow-md">
                AV
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-navy-900">Arjun Verma</h2>
                  <Badge variant="teal">Sample Profile</Badge>
                </div>
                <p className="text-xs font-semibold text-primary-700">Track &amp; Field — 100m / 200m Sprints</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-navy-500 pt-2 sm:pt-0">
              <span className="flex items-center gap-1 bg-navy-50 px-2.5 py-1 rounded-lg border border-navy-200/80">
                <MapPin className="h-3.5 w-3.5 text-navy-400" />
                Bengaluru, Karnataka
              </span>
              <span className="flex items-center gap-1 bg-navy-50 px-2.5 py-1 rounded-lg border border-navy-200/80">
                <Calendar className="h-3.5 w-3.5 text-navy-400" />
                Age: 17 yrs (DOB: 2008)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-navy-100 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-navy-50/70">
              <Ruler className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-[10px] text-navy-400 font-semibold uppercase">Standing Height</p>
                <p className="text-sm font-bold text-navy-900">178.5 cm</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-navy-50/70">
              <Weight className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-[10px] text-navy-400 font-semibold uppercase">Body Mass</p>
                <p className="text-sm font-bold text-navy-900">67.2 kg</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-navy-50/70">
              <Activity className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-[10px] text-navy-400 font-semibold uppercase">Wingspan</p>
                <p className="text-sm font-bold text-navy-900">183.0 cm (+4.5 Ape Index)</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-navy-50/70">
              <Info className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-[10px] text-navy-400 font-semibold uppercase">Affiliation</p>
                <p className="text-sm font-bold text-navy-900 truncate">Karnataka Athletic Assoc.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Benchmark Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-700">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">30m Acceleration Sprint</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">3.88s</p>
              <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                94th Percentile (Age 17)
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary-100 text-secondary-700">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">Vertical Countermovement</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">61.5 cm</p>
              <span className="text-[11px] font-semibold text-secondary-700 bg-secondary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                91st Percentile (Age 17)
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">20m Yo-Yo / Beep Test</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">Level 18.2</p>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                87th Percentile (Aerobic Base)
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Verified Test History Table */}
      <Card className="border-navy-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Standardized Protocol Assessment Log</CardTitle>
              <CardDescription>
                Multi-trial tests verified according to standard Sports Authority of India procedures.
              </CardDescription>
            </div>
            <Badge variant="teal">3 Trials per Battery</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-navy-600">
              <thead className="bg-navy-50 text-[11px] uppercase font-bold text-navy-500 border-b border-navy-200">
                <tr>
                  <th className="px-4 py-3">Protocol</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Trial 1</th>
                  <th className="px-4 py-3">Trial 2</th>
                  <th className="px-4 py-3">Trial 3</th>
                  <th className="px-4 py-3 font-bold text-navy-900">Best Mark</th>
                  <th className="px-4 py-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {STANDARD_PROTOCOLS.slice(0, 4).map((p, idx) => (
                  <tr key={p.code} className="hover:bg-navy-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-navy-900">{p.name}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-[10px]">{p.categoryLabel}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-navy-500 font-mono">{idx === 0 ? '4.02' : idx === 1 ? '58.0' : idx === 2 ? '17.1' : '31.0'} {p.unit}</td>
                    <td className="px-4 py-3.5 text-navy-500 font-mono">{idx === 0 ? '3.94' : idx === 1 ? '60.5' : idx === 2 ? '17.8' : '33.5'} {p.unit}</td>
                    <td className="px-4 py-3.5 text-navy-500 font-mono">{idx === 0 ? '3.88' : idx === 1 ? '61.5' : idx === 2 ? '18.2' : '34.0'} {p.unit}</td>
                    <td className="px-4 py-3.5 font-bold text-navy-900 font-mono">
                      {idx === 0 ? '3.88' : idx === 1 ? '61.5' : idx === 2 ? '18.2' : '34.0'} {p.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                        Verified Sample Trial
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends Section (Anchor target for Sidebar) */}
      <section id="trends" className="pt-2">
        <Card className="border-navy-200 bg-navy-50/50 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              <h3 className="text-base font-bold text-navy-900">Historical Performance Trends &amp; Percentile Shifts</h3>
            </div>
            <Badge variant="default">Phase 2 Integration</Badge>
          </div>
          <p className="text-xs text-navy-600 leading-relaxed max-w-2xl">
            Longitudinal charting tracks changes in acceleration velocity, countermovement jump height, and aerobic threshold over time. This module connects to Supabase historical test sessions upon Phase 2 activation.
          </p>
        </Card>
      </section>

      {/* Accessible Action Explanation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        description="Phase 1 Foundation Notice"
        footerActions={
          <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
            Dismiss
          </Button>
        }
      >
        <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
          {modalContent.desc}
        </p>
      </Modal>
    </div>
  );
}
