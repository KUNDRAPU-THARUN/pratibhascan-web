import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/features/auth/AuthContext';
import { STANDARD_PROTOCOLS } from '@/lib/constants';
import {
  fetchAthleteDashboardData,
  type AthleteDashboardData,
} from './athleteService';
import { AthleteEditModal } from './AthleteEditModal';
import { AthletePassportExportModal } from './AthletePassportExportModal';
import { MinorSafeguardBanner } from './MinorSafeguardBanner';
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
  Edit3,
  RefreshCw,
  AlertCircle,
  ClipboardCheck,
  Building,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AthleteViewProps {
  isPreview?: boolean;
}

export function AthleteView({ isPreview = false }: AthleteViewProps) {
  const { user } = useAuth();

  // Live data states
  const [data, setData] = useState<AthleteDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!isPreview);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (isPreview || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dashboardData = await fetchAthleteDashboardData(user.id);
      setData(dashboardData);
    } catch (err) {
      console.error('Failed to load athlete dashboard data:', err);
      setError((err as Error).message || 'Failed to retrieve athlete records from database.');
    } finally {
      setIsLoading(false);
    }
  }, [isPreview, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // --------------------------------------------------------------------------
  // PREVIEW / DEMO MODE VIEW
  // --------------------------------------------------------------------------
  if (isPreview) {
    return (
      <div className="space-y-6">
        {/* Preview Banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-amber-700 shrink-0" />
            <div>
              <p className="text-sm font-bold">Demonstration Preview Mode</p>
              <p className="text-xs text-amber-700">
                You are viewing sample mock data for design evaluation. Sign in to access your live Supabase-backed athlete dashboard.
              </p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="primary" size="sm">
              Sign In to Real Account
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
              Athletic Passport &amp; Assessment Hub
            </h1>
            <p className="text-xs sm:text-sm text-navy-500 mt-1">
              Verified biometric profile, standardized test scores, and national age-group percentiles.
            </p>
          </div>
        </div>

        {/* Demo Athlete Card */}
        <Card className="overflow-hidden border-navy-200">
          <div className="h-24 bg-gradient-to-r from-primary-600 via-teal-600 to-secondary-600 p-4 relative flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Badge variant="teal" className="bg-white/20 border-white/30 text-white backdrop-blur-xs text-[11px]">
                Protocols Modeled on SAI Benchmarks
              </Badge>
              <Badge variant="default" className="bg-navy-950/40 border-white/20 text-white backdrop-blur-xs text-[10px]">
                Sample Demo Data
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

        {/* Demo Benchmark Key Metrics */}
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
                  Sample 94th Percentile
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
                  Sample 91st Percentile
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
                  Sample 87th Percentile
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Demo Table */}
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
                          Sample Demonstration
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LIVE AUTHENTICATED MODE: LOADING STATE
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-navy-100 rounded-lg w-1/3" />
        <Card className="p-8 border-navy-200">
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
            <p className="text-sm font-semibold text-navy-700">Loading verified athletic records from database...</p>
          </div>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LIVE AUTHENTICATED MODE: ERROR STATE
  // --------------------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="space-y-6">
        <Card className="border-rose-200 bg-rose-50/50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-950">Unable to Retrieve Athlete Profile</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto mt-1 mb-4">
            {error || 'An unexpected error occurred while fetching your records.'}
          </p>
          <Button variant="primary" size="sm" onClick={() => loadDashboard()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LIVE AUTHENTICATED MODE: SUCCESS DATA VIEW
  // --------------------------------------------------------------------------
  const initials = data.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const shortId = `ATH-${data.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      {/* Minor Safeguard Banner (DPDP Act 2023) */}
      {data.isMinor && <MinorSafeguardBanner age={data.age} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
              Athletic Passport &amp; Assessment Hub
            </h1>
            <Badge variant="teal" className="text-[10px]">Live Connected</Badge>
          </div>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Verified biometric profile, standardized test scores, and national age-group percentiles.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 className="h-4 w-4 mr-1.5" />
            Edit Profile
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Passport
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
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
              SAI Protocol Standard
            </Badge>
            <Badge variant="default" className="bg-navy-950/40 border-white/20 text-white backdrop-blur-xs text-[10px]">
              Database Authenticated
            </Badge>
          </div>
          <span className="text-xs font-mono bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs font-semibold">
            ID: {shortId}
          </span>
        </div>

        <CardContent className="pt-0 relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl border-4 border-white bg-navy-900 text-white flex items-center justify-center text-xl font-bold shadow-md">
                {initials || 'AT'}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-navy-900">{data.fullName}</h2>
                  <Badge variant="teal" className="capitalize">{data.gender}</Badge>
                </div>
                <p className="text-xs font-semibold text-primary-700">
                  {data.primarySport} {data.secondarySport ? `— ${data.secondarySport}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-navy-500 pt-2 sm:pt-0">
              <span className="flex items-center gap-1 bg-navy-50 px-2.5 py-1 rounded-lg border border-navy-200/80">
                <MapPin className="h-3.5 w-3.5 text-navy-400" />
                {data.district}, {data.state}
              </span>
              <span className="flex items-center gap-1 bg-navy-50 px-2.5 py-1 rounded-lg border border-navy-200/80">
                <Calendar className="h-3.5 w-3.5 text-navy-400" />
                Age: {data.age} yrs (DOB: {data.dateOfBirth})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-navy-100 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-navy-50/70">
              <Ruler className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-[10px] text-navy-400 font-semibold uppercase">Standing Height</p>
                <p className="text-sm font-bold text-navy-900">{data.heightCm} cm</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-navy-50/70">
              <Weight className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-[10px] text-navy-400 font-semibold uppercase">Body Mass</p>
                <p className="text-sm font-bold text-navy-900">{data.weightKg} kg (BMI {data.bmi})</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-navy-50/70">
              <Activity className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-[10px] text-navy-400 font-semibold uppercase">Wingspan & Ape Index</p>
                <p className="text-sm font-bold text-navy-900">
                  {data.wingspanCm ? `${data.wingspanCm} cm (${data.apeIndex && data.apeIndex > 0 ? `+${data.apeIndex}` : data.apeIndex || 0})` : 'Not recorded'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-navy-50/70">
              <Building className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-[10px] text-navy-400 font-semibold uppercase">Affiliation</p>
                <p className="text-sm font-bold text-navy-900 truncate">
                  {data.activeAffiliation ? data.activeAffiliation.name : 'Independent / Unaffiliated'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Benchmark Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 30m Sprint */}
        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-700">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">30m Acceleration Sprint</p>
              {data.benchmarks.sprint30m ? (
                <>
                  <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                    {data.benchmarks.sprint30m.bestScore}s
                  </p>
                  <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                    {data.benchmarks.sprint30m.percentile ? `${data.benchmarks.sprint30m.percentile}th Percentile` : 'Verified Score'}
                  </span>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-navy-400 mt-0.5">Pending Assessment</p>
                  <span className="text-[11px] text-navy-400 block mt-0.5">Standard SAI Speed Test</span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Vertical Jump */}
        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary-100 text-secondary-700">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">Vertical Countermovement</p>
              {data.benchmarks.vertJump ? (
                <>
                  <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                    {data.benchmarks.vertJump.bestScore} cm
                  </p>
                  <span className="text-[11px] font-semibold text-secondary-700 bg-secondary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                    {data.benchmarks.vertJump.percentile ? `${data.benchmarks.vertJump.percentile}th Percentile` : 'Verified Score'}
                  </span>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-navy-400 mt-0.5">Pending Assessment</p>
                  <span className="text-[11px] text-navy-400 block mt-0.5">Standard SAI Power Test</span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Beep Test */}
        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">20m Yo-Yo / Beep Test</p>
              {data.benchmarks.beepTest ? (
                <>
                  <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                    Level {data.benchmarks.beepTest.bestScore}
                  </p>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                    {data.benchmarks.beepTest.percentile ? `${data.benchmarks.beepTest.percentile}th Percentile` : 'Verified Score'}
                  </span>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-navy-400 mt-0.5">Pending Assessment</p>
                  <span className="text-[11px] text-navy-400 block mt-0.5">Standard SAI Aerobic Test</span>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Verified Test History Table or Empty State */}
      <Card className="border-navy-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Standardized Protocol Assessment Log</CardTitle>
              <CardDescription>
                Multi-trial tests verified according to standard Sports Authority of India procedures.
              </CardDescription>
            </div>
            {data.assessmentSessions.length > 0 && (
              <Badge variant="teal">{data.assessmentSessions.length} Recorded Session{data.assessmentSessions.length > 1 ? 's' : ''}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.assessmentSessions.length > 0 ? (
            <div className="space-y-6">
              {data.assessmentSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-navy-200/90 overflow-hidden">
                  <div className="bg-navy-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-navy-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy-900">Session Date: {session.date}</span>
                      <span className="text-navy-300">·</span>
                      <span className="text-xs text-navy-600">Evaluator: {session.evaluatorName}</span>
                      <span className="text-navy-300">·</span>
                      <span className="text-xs text-navy-600">{session.organizationName}</span>
                    </div>
                    <div>
                      {session.verified ? (
                        <span className="inline-flex items-center text-xs font-semibold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Officially Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          Pending Verification
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm text-navy-600">
                      <thead className="bg-white text-[11px] uppercase font-bold text-navy-400 border-b border-navy-100">
                        <tr>
                          <th className="px-4 py-2.5">Protocol</th>
                          <th className="px-4 py-2.5">Category</th>
                          <th className="px-4 py-2.5">Trial 1</th>
                          <th className="px-4 py-2.5">Trial 2</th>
                          <th className="px-4 py-2.5">Trial 3</th>
                          <th className="px-4 py-2.5 font-bold text-navy-900">Best Mark</th>
                          <th className="px-4 py-2.5 text-right">Percentile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-100 bg-white">
                        {session.results.map((r) => (
                          <tr key={r.id} className="hover:bg-navy-50/50">
                            <td className="px-4 py-3 font-semibold text-navy-900">{r.protocolTitle}</td>
                            <td className="px-4 py-3 capitalize">{r.protocolCategory}</td>
                            <td className="px-4 py-3 font-mono">{r.trial1 !== null ? `${r.trial1} ${r.unit}` : '—'}</td>
                            <td className="px-4 py-3 font-mono">{r.trial2 !== null ? `${r.trial2} ${r.unit}` : '—'}</td>
                            <td className="px-4 py-3 font-mono">{r.trial3 !== null ? `${r.trial3} ${r.unit}` : '—'}</td>
                            <td className="px-4 py-3 font-bold text-navy-900 font-mono">
                              {r.bestScore} {r.unit}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {r.percentileRank !== null ? (
                                <span className="font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                                  {r.percentileRank}th %ile
                                </span>
                              ) : (
                                <span className="text-navy-400 text-xs">Standardized</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center space-y-4 max-w-lg mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-100 text-navy-600">
                <ClipboardCheck className="h-7 w-7 text-primary-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-navy-900">No Assessment Sessions Recorded Yet</h3>
                <p className="text-xs text-navy-500 leading-relaxed">
                  Your biometric passport is awaiting its first formal evaluation. Standard multi-trial assessments are conducted by authorized evaluators at accredited academies and schools.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/dashboard/assessments">
                  <Button variant="primary" size="sm">
                    View Standard Protocols &amp; Norms
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Trends Section */}
      <section id="trends" className="pt-2">
        <Card className="border-navy-200 bg-navy-50/50 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              <h3 className="text-base font-bold text-navy-900">Historical Performance Trends &amp; Percentile Shifts</h3>
            </div>
            <Badge variant="teal">Automated Tracking</Badge>
          </div>
          <p className="text-xs text-navy-600 leading-relaxed max-w-2xl">
            {data.assessmentSessions.length > 1
              ? `Tracking ${data.assessmentSessions.length} historical evaluation sessions for speed, explosive power, and aerobic capacity.`
              : 'Longitudinal charting activates automatically once two or more standardized evaluation sessions are recorded in the database.'}
          </p>
        </Card>
      </section>

      {/* Edit Profile Modal */}
      <AthleteEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        athleteData={data}
        onProfileUpdated={() => loadDashboard()}
      />

      {/* Export Passport Modal */}
      <AthletePassportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        athleteData={data}
      />

      {/* Share Profile Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Verified Athlete Profile"
        description="Share a secure link to your verified athletic passport."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-navy-600 leading-relaxed">
            Your athletic passport can be shared with coaches and scouts. Only authorized evaluators and affiliated academies can view raw biometric records.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="w-full rounded-lg border border-navy-200 bg-navy-50 px-3 py-2 text-xs text-navy-800 font-mono"
            />
            <Button variant="outline" size="sm" onClick={handleCopyShareLink}>
              {shareCopied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1 text-teal-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
