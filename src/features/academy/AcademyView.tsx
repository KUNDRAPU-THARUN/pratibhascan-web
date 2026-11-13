import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchAcademyDashboardData,
  type AcademyDashboardData,
  type RosterAthlete,
  approveAffiliation,
  rejectAffiliation,
} from './academyService';
import { AcademyEditModal } from './AcademyEditModal';
import { AffiliationInviteModal } from './AffiliationInviteModal';
import { AthleteDetailInspectModal } from './AthleteDetailInspectModal';
import {
  Users,
  Building2,
  Calendar,
  Filter,
  Plus,
  Search,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Clock,
  ShieldAlert,
  FileText,
  Check,
  X,
  BadgeCheck,
} from 'lucide-react';

interface AcademyViewProps {
  isPreview?: boolean;
}

interface MockRosterMember {
  id: string;
  name: string;
  sport: string;
  age: number;
  gender: string;
  sprintScore: string;
  jumpScore: string;
  status: 'active' | 'evaluating';
}

const MOCK_ROSTER: MockRosterMember[] = [
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

export function AcademyView({ isPreview = false }: AcademyViewProps) {
  const { user } = useAuth();

  // Live data states
  const [data, setData] = useState<AcademyDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!isPreview);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inspectAthlete, setInspectAthlete] = useState<RosterAthlete | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  // Preview-only info modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalTitle, setPreviewModalTitle] = useState('');
  const [previewModalDesc, setPreviewModalDesc] = useState('');

  // Quick action processing for inbound requests
  const [processingAffiliationId, setProcessingAffiliationId] = useState<string | null>(null);
  const [quickActionAlert, setQuickActionAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (isPreview || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAcademyDashboardData(user.id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load academy dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [isPreview, user]);

  useEffect(() => {
    if (!isPreview) {
      loadData();
    }
  }, [isPreview, loadData]);

  const handlePreviewAction = (title: string, desc: string) => {
    setPreviewModalTitle(title);
    setPreviewModalDesc(desc);
    setPreviewModalOpen(true);
  };

  const handleQuickApprove = async (affiliationId: string) => {
    if (!user) return;
    setProcessingAffiliationId(affiliationId);
    setQuickActionAlert(null);
    const { error } = await approveAffiliation(affiliationId, user.id);
    setProcessingAffiliationId(null);
    if (error) {
      setQuickActionAlert({ type: 'error', message: error.message });
    } else {
      setQuickActionAlert({
        type: 'success',
        message: 'Affiliation approved. Candidate is now active on your roster.',
      });
      loadData();
    }
  };

  const handleQuickReject = async (affiliationId: string) => {
    setProcessingAffiliationId(affiliationId);
    setQuickActionAlert(null);
    const { error } = await rejectAffiliation(affiliationId);
    setProcessingAffiliationId(null);
    if (error) {
      setQuickActionAlert({ type: 'error', message: error.message });
    } else {
      setQuickActionAlert({
        type: 'success',
        message: 'Affiliation request rejected.',
      });
      loadData();
    }
  };

  // ==========================================
  // PREVIEW MODE RENDERING
  // ==========================================
  if (isPreview) {
    const filteredMockRoster = MOCK_ROSTER.filter((ath) => {
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
              <Badge variant="default" className="text-[10px]">
                Illustrative Demo Data
              </Badge>
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
                handlePreviewAction(
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
                handlePreviewAction(
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
                  {filteredMockRoster.map((ath) => (
                    <tr key={ath.id} className="hover:bg-navy-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-navy-900">{ath.name}</div>
                        <div className="text-[10px] text-navy-400 font-mono">{ath.id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="text-[11px]">
                          {ath.sport}
                        </Badge>
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
                            handlePreviewAction(
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

        {/* Modal */}
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title={previewModalTitle}
          description="Academy Hub — Preview Demonstration Notice"
          footerActions={
            <Button variant="outline" size="sm" onClick={() => setPreviewModalOpen(false)}>
              Close
            </Button>
          }
        >
          <p className="text-xs text-navy-700 leading-relaxed">{previewModalDesc}</p>
        </Modal>
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED LIVE SUPABASE RENDERING
  // ==========================================
  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-sm font-semibold text-navy-800">
          Loading Academy Hub &amp; Roster...
        </p>
        <p className="text-xs text-navy-500">
          Connecting to secure Supabase database and verifying affiliations...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-navy-900">Unable to Load Academy Hub</h2>
        <p className="text-xs text-navy-600 leading-relaxed">
          {error || 'No academy registration found for this account.'}
        </p>
        <Button variant="primary" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const { academy, metrics, roster } = data;

  // Filter real roster
  const filteredRoster = roster.filter((ath) => {
    const matchesSearch =
      ath.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ath.primarySport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ath.athleteId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      selectedSport === 'all' ||
      ath.primarySport.toLowerCase() === selectedSport.toLowerCase();

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && ath.status === 'active') ||
      (statusFilter === 'pending' && ath.status === 'pending');

    return matchesSearch && matchesSport && matchesStatus;
  });

  const pendingInboundRequests = roster.filter(
    (ath) => ath.status === 'pending' && !ath.isOutboundInvite
  );

  return (
    <div className="space-y-6">
      {/* Quick Action Alert */}
      {quickActionAlert && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            quickActionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {quickActionAlert.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{quickActionAlert.message}</span>
          </div>
          <button
            onClick={() => setQuickActionAlert(null)}
            className="text-navy-400 hover:text-navy-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
              {academy.name}
            </h1>
            <Badge variant="blue">Academy Hub</Badge>
            {academy.verified ? (
              <Badge variant="success" className="flex items-center gap-1 text-[11px]">
                <BadgeCheck className="h-3 w-3" />
                Verified Center
              </Badge>
            ) : (
              <Badge variant="warning" className="text-[11px]">
                Pending Accreditation
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            {academy.district}, {academy.state} • {academy.sportsOffered.join(', ')}
            {academy.registrationNumber && ` • Reg: ${academy.registrationNumber}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
            Edit Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Athlete
          </Button>
        </div>
      </div>

      {/* Minor Athlete Safeguard Banner (DPDP Act 2023) */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 text-xs">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong>DPDP Act 2023 Compliance Notice:</strong> Enrolling minor athletes (&lt; 18 years) requires verified parental/guardian consent. Affiliation approvals grant sports coaching access but do not substitute for statutory guardian consent.
          </p>
        </div>
        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
          Statutory Safeguard
        </span>
      </div>

      {/* Inbound Affiliation Pending Banner */}
      {pendingInboundRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-primary-50 border border-primary-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-950 font-bold text-xs sm:text-sm">
              <Clock className="h-4 w-4 text-primary-600" />
              <span>
                {pendingInboundRequests.length} Athlete Affiliation Request
                {pendingInboundRequests.length > 1 ? 's' : ''} Awaiting Review
              </span>
            </div>
            <span className="text-[11px] font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
              Inbound Applications
            </span>
          </div>

          <div className="space-y-2">
            {pendingInboundRequests.map((req) => (
              <div
                key={req.affiliationId}
                className="bg-white p-3 rounded-lg border border-primary-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-900">{req.fullName}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {req.primarySport}
                    </Badge>
                    {req.isMinor && (
                      <Badge variant="warning" className="text-[9px]">
                        Minor ({req.age}y)
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-navy-500 font-mono mt-0.5">
                    {req.athleteId} • Applied on{' '}
                    {new Date(req.affiliatedSince).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInspectAthlete(req);
                      setIsInspectModalOpen(true);
                    }}
                    className="text-xs text-navy-600"
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReject(req.affiliationId)}
                    disabled={processingAffiliationId === req.affiliationId}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickApprove(req.affiliationId)}
                    disabled={processingAffiliationId === req.affiliationId}
                    className="text-xs"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary-100 text-secondary-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">Enrolled Cohort</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                {metrics.enrolledAthletesCount} Athletes
              </p>
              <span className="text-[11px] font-semibold text-secondary-700 bg-secondary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                Active Affiliations
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">Pending Requests</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                {metrics.pendingRequestsCount} Pending
              </p>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">
                Awaiting Confirmation
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
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                {metrics.certifiedCoachesCount} Staff
              </p>
              <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                Authorized Evaluators
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
              <p className="text-xs text-navy-500 font-medium">Logged Assessments</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                {metrics.conductedAssessmentsCount} Sessions
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                Standard Battery Tests
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
            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
                <Input
                  placeholder="Filter athlete, sport, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Status filter toggle */}
              <div className="flex items-center bg-navy-50 p-0.5 rounded-md border border-navy-200 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-navy-500 hover:text-navy-800'
                  }`}
                >
                  All ({roster.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-navy-500 hover:text-navy-800'
                  }`}
                >
                  Active ({metrics.enrolledAthletesCount})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-navy-500 hover:text-navy-800'
                  }`}
                >
                  Pending ({metrics.pendingRequestsCount})
                </button>
              </div>

              {/* Sport filter */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-xs"
                onClick={() =>
                  setSelectedSport((prev) =>
                    prev === 'all'
                      ? academy.sportsOffered[0] || 'Athletics'
                      : 'all'
                  )
                }
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                {selectedSport === 'all' ? 'All Sports' : selectedSport}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRoster.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <FileText className="h-8 w-8 text-navy-300 mx-auto" />
              <p className="text-sm font-semibold text-navy-700">No athletes found</p>
              <p className="text-xs text-navy-400 max-w-sm mx-auto">
                {roster.length === 0
                  ? 'No athletes are currently enrolled in your academy cohort. Click "Add Athlete" to send an invitation via their PratibhaScan UUID.'
                  : 'No athletes match the current search query or active filter.'}
              </p>
              {roster.length === 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="mt-2 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add First Athlete
                </Button>
              )}
            </div>
          ) : (
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
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {filteredRoster.map((ath) => (
                    <tr key={ath.affiliationId} className="hover:bg-navy-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900">{ath.fullName}</span>
                          {ath.isMinor && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                              Minor
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-navy-400 font-mono">{ath.athleteId}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="text-[11px]">
                          {ath.primarySport}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-navy-700">
                        {ath.age} yrs • {ath.gender}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-navy-900">
                        {ath.status === 'active' ? ath.latestSprint30m || '—' : 'Restricted'}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-navy-900">
                        {ath.status === 'active' ? ath.latestVertJump || '—' : 'Restricted'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            ath.status === 'active'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : ath.status === 'pending'
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : 'text-navy-700 bg-navy-50 border-navy-200'
                          }`}
                        >
                          {ath.status === 'pending'
                            ? ath.isOutboundInvite
                              ? 'Invited'
                              : 'Pending'
                            : ath.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInspectAthlete(ath);
                            setIsInspectModalOpen(true);
                          }}
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
          )}
        </CardContent>
      </Card>

      {/* Cohort Comparative Benchmarking */}
      <section id="cohort" className="pt-2">
        <Card className="border-navy-200 bg-navy-50/50 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-600" />
              <h3 className="text-base font-bold text-navy-900">Comparative Cohort Benchmarking</h3>
            </div>
            <Badge variant="default">SAI Norms Ready</Badge>
          </div>
          <p className="text-xs text-navy-600 leading-relaxed max-w-2xl">
            Cohort comparisons allow head coaches to evaluate physical distribution across age brackets, sports disciplines, and training cycles. Longitudinal assessments conducted at this academy populate percentile benchmarking automatically.
          </p>
        </Card>
      </section>

      {/* Modals */}
      {isEditModalOpen && (
        <AcademyEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          academyData={academy}
          onProfileUpdated={loadData}
        />
      )}

      {isInviteModalOpen && (
        <AffiliationInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          academyId={academy.id}
          requesterId={user?.id || ''}
          onSuccess={loadData}
        />
      )}

      {isInspectModalOpen && inspectAthlete && (
        <AthleteDetailInspectModal
          isOpen={isInspectModalOpen}
          onClose={() => {
            setIsInspectModalOpen(false);
            setInspectAthlete(null);
          }}
          athlete={inspectAthlete}
          academyId={academy.id}
          onActionCompleted={loadData}
        />
      )}
    </div>
  );
}
