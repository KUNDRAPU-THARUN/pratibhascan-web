import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchInstitutionDashboardData,
  type InstitutionDashboardData,
  type StudentAthlete,
  approveStudentAffiliation,
  rejectStudentAffiliation,
} from './institutionService';
import { INSTITUTION_TYPE_LABELS } from './institutionSchemas';
import { InstitutionEditModal } from './InstitutionEditModal';
import { StudentEnrollModal } from './StudentEnrollModal';
import { StudentDetailInspectModal } from './StudentDetailInspectModal';
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
  Check,
  X,
  BadgeCheck,
  GraduationCap,
  Activity,
  Award,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface InstitutionViewProps {
  isPreview?: boolean;
}

interface DistrictScoutData {
  district: string;
  state: string;
  athletesAssessed: number;
  leadingSport: string;
  topPercentileCount: number;
}

const DISTRICT_DATA: DistrictScoutData[] = [
  { district: 'Bengaluru Urban', state: 'Karnataka', athletesAssessed: 520, leadingSport: 'Athletics (Sprints)', topPercentileCount: 48 },
  { district: 'Mysuru', state: 'Karnataka', athletesAssessed: 310, leadingSport: 'Wrestling & Power', topPercentileCount: 26 },
  { district: 'Belagavi', state: 'Karnataka', athletesAssessed: 280, leadingSport: 'Swimming & Endurance', topPercentileCount: 22 },
  { district: 'Dharwad', state: 'Karnataka', athletesAssessed: 210, leadingSport: 'Badminton & Agility', topPercentileCount: 19 },
  { district: 'Dakshina Kannada', state: 'Karnataka', athletesAssessed: 340, leadingSport: 'Athletics & Sprints', topPercentileCount: 35 },
  { district: 'Tumakuru', state: 'Karnataka', athletesAssessed: 190, leadingSport: 'Kabaddi & Agility', topPercentileCount: 14 },
];

export function InstitutionView({ isPreview = false }: InstitutionViewProps) {
  const { user } = useAuth();

  // Live data states
  const [data, setData] = useState<InstitutionDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!isPreview);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [inspectStudent, setInspectStudent] = useState<StudentAthlete | null>(null);
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
      const result = await fetchInstitutionDashboardData(user.id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load institution portal');
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
    const { error } = await approveStudentAffiliation(affiliationId, user.id);
    setProcessingAffiliationId(null);
    if (error) {
      setQuickActionAlert({ type: 'error', message: error.message });
    } else {
      setQuickActionAlert({
        type: 'success',
        message: 'Affiliation approved. Student is now active on your institution roster.',
      });
      loadData();
    }
  };

  const handleQuickReject = async (affiliationId: string) => {
    setProcessingAffiliationId(affiliationId);
    setQuickActionAlert(null);
    const { error } = await rejectStudentAffiliation(affiliationId);
    setProcessingAffiliationId(null);
    if (error) {
      setQuickActionAlert({ type: 'error', message: error.message });
    } else {
      setQuickActionAlert({
        type: 'success',
        message: 'Student affiliation request rejected.',
      });
      loadData();
    }
  };

  // ==========================================
  // PREVIEW DEMO MODE RENDERING
  // ==========================================
  if (isPreview) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
                State Sports Board &amp; Institution Portal
              </h1>
              <Badge variant="blue">Federation View</Badge>
              <Badge variant="default" className="text-[10px]">
                Illustrative Demo Data
              </Badge>
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
                handlePreviewAction(
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
                handlePreviewAction(
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
            <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider">
              Total Athletes Evaluated
            </p>
            <p className="text-2xl font-extrabold text-navy-900 mt-1">1,850</p>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
              Across 6 Districts
            </span>
          </Card>

          <Card className="p-4 border-navy-200">
            <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider">
              Partner Schools
            </p>
            <p className="text-2xl font-extrabold text-navy-900 mt-1">74</p>
            <span className="text-[11px] font-semibold text-navy-600 bg-navy-100 px-2 py-0.5 rounded-full inline-block mt-1">
              Active Testing Centers
            </span>
          </Card>

          <Card className="p-4 border-navy-200">
            <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider">
              National Camp Benchmarks
            </p>
            <p className="text-2xl font-extrabold text-primary-600 mt-1">164</p>
            <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
              &gt;90th Percentile SAI
            </span>
          </Card>

          <Card className="p-4 border-navy-200">
            <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider">
              Protocol Compliance
            </p>
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

        {/* Modal */}
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title={previewModalTitle}
          description="Institution &amp; Sports Board Portal Notice"
          footerActions={
            <Button variant="outline" size="sm" onClick={() => setPreviewModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-navy-50 border border-navy-200 text-xs text-navy-700 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{previewModalDesc}</p>
            </div>
          </div>
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
          Loading Institution Portal &amp; Student Roster...
        </p>
        <p className="text-xs text-navy-500">
          Connecting to secure Supabase database and verifying institutional affiliations...
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
        <h2 className="text-lg font-bold text-navy-900">Unable to Load Institution Portal</h2>
        <p className="text-xs text-navy-600 leading-relaxed">
          {error || 'No institution registration found for this account.'}
        </p>
        <Button variant="primary" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const { institution, metrics, sportsBreakdown, students } = data;

  // Filter real student roster
  const filteredStudents = students.filter((stu) => {
    const matchesSearch =
      stu.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.primarySport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.athleteId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      selectedSport === 'all' ||
      stu.primarySport.toLowerCase() === selectedSport.toLowerCase();

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && stu.status === 'active') ||
      (statusFilter === 'pending' && stu.status === 'pending');

    return matchesSearch && matchesSport && matchesStatus;
  });

  const pendingInboundApplications = students.filter(
    (stu) => stu.status === 'pending' && !stu.isOutboundInvite
  );

  const sportsList = Object.keys(sportsBreakdown);

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
              {institution.name}
            </h1>
            <Badge variant="blue">{INSTITUTION_TYPE_LABELS[institution.type]}</Badge>
            {institution.verified ? (
              <Badge variant="success" className="flex items-center gap-1 text-[11px]">
                <BadgeCheck className="h-3 w-3" />
                Verified Institution
              </Badge>
            ) : (
              <Badge variant="warning" className="text-[11px]">
                Pending Accreditation
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            {institution.district}, {institution.state} • {institution.contactEmail}
            {institution.contactPhone && ` • Phone: ${institution.contactPhone}`}
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
            onClick={() => setIsEnrollModalOpen(true)}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Enroll Student
          </Button>
        </div>
      </div>

      {/* Minor Athlete Safeguard Banner (DPDP Act 2023) */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 text-xs">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong>DPDP Act 2023 Student Safeguard Notice:</strong> Enrolling minor students (&lt; 18 years) mandates verifiable parental or legal guardian consent. Affiliation approval authorizes institutional physical education participation but does not substitute for statutory guardian consent.
          </p>
        </div>
        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
          Statutory Safeguard
        </span>
      </div>

      {/* Inbound Applications Pending Banner */}
      {pendingInboundApplications.length > 0 && (
        <div className="p-4 rounded-xl bg-primary-50 border border-primary-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-950 font-bold text-xs sm:text-sm">
              <Clock className="h-4 w-4 text-primary-600" />
              <span>
                {pendingInboundApplications.length} Student Enrollment Application
                {pendingInboundApplications.length > 1 ? 's' : ''} Awaiting Review
              </span>
            </div>
            <span className="text-[11px] font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
              Inbound Applications
            </span>
          </div>

          <div className="space-y-2">
            {pendingInboundApplications.map((app) => (
              <div
                key={app.affiliationId}
                className="bg-white p-3 rounded-lg border border-primary-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-900">{app.fullName}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {app.primarySport}
                    </Badge>
                    {app.isMinor && (
                      <Badge variant="warning" className="text-[9px]">
                        Minor ({app.age}y)
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-navy-500 font-mono mt-0.5">
                    {app.athleteId} • Applied on{' '}
                    {new Date(app.affiliatedSince).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInspectStudent(app);
                      setIsInspectModalOpen(true);
                    }}
                    className="text-xs text-navy-600"
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReject(app.affiliationId)}
                    disabled={processingAffiliationId === app.affiliationId}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickApprove(app.affiliationId)}
                    disabled={processingAffiliationId === app.affiliationId}
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

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-navy-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary-100 text-secondary-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-navy-500 font-medium">Affiliated Students</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                {metrics.totalEnrolledStudents} Athletes
              </p>
              <span className="text-[11px] font-semibold text-secondary-700 bg-secondary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                Active Enrolled Roster
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
                {metrics.pendingApplicationsCount} Pending
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
              <p className="text-xs text-navy-500 font-medium">Staff Evaluators</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">
                {metrics.authorizedEvaluatorsCount} Staff
              </p>
              <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                Authorized Testers
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
                Official School Tests
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Real Sport Participation Distribution */}
      {sportsList.length > 0 && (
        <Card className="border-navy-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-navy-900">
                  Active Student Sport Disciplines
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of authorized affiliated students across sports programs.
                </CardDescription>
              </div>
              <Badge variant="teal">Verified Enrolled Cohort</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sportsList.map((sport) => (
                <div
                  key={sport}
                  className="bg-navy-50/60 p-3 rounded-xl border border-navy-200/80 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-navy-700">{sport}</p>
                    <p className="text-lg font-extrabold text-navy-950 mt-0.5">
                      {sportsBreakdown[sport]}
                    </p>
                  </div>
                  <Activity className="h-4 w-4 text-primary-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Roster Table Card */}
      <Card className="border-navy-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Institution Student Roster</CardTitle>
              <CardDescription>
                Search and review student-athlete benchmarks and physical progress.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
                <Input
                  placeholder="Filter student, sport, or ID..."
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
                  All ({students.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-navy-500 hover:text-navy-800'
                  }`}
                >
                  Active ({metrics.totalEnrolledStudents})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-navy-500 hover:text-navy-800'
                  }`}
                >
                  Pending ({metrics.pendingApplicationsCount})
                </button>
              </div>

              {/* Sport filter */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-xs"
                onClick={() =>
                  setSelectedSport((prev) =>
                    prev === 'all' && sportsList.length > 0 ? sportsList[0] : 'all'
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
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <GraduationCap className="h-8 w-8 text-navy-300 mx-auto" />
              <p className="text-sm font-semibold text-navy-700">No student-athletes found</p>
              <p className="text-xs text-navy-400 max-w-sm mx-auto">
                {students.length === 0
                  ? 'No students are currently enrolled in your institution roster. Click "Enroll Student" to invite candidates by their PratibhaScan UUID.'
                  : 'No student-athletes match the current search query or active filter.'}
              </p>
              {students.length === 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="mt-2 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Enroll First Student
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-navy-600">
                <thead className="bg-navy-50 text-[11px] uppercase font-bold text-navy-500 border-b border-navy-200">
                  <tr>
                    <th className="px-4 py-3">Student Athlete</th>
                    <th className="px-4 py-3">Sport Discipline</th>
                    <th className="px-4 py-3">Age &amp; Gender</th>
                    <th className="px-4 py-3">30m Acceleration</th>
                    <th className="px-4 py-3">Vertical Jump</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {filteredStudents.map((stu) => (
                    <tr key={stu.affiliationId} className="hover:bg-navy-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900">{stu.fullName}</span>
                          {stu.isMinor && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                              Minor
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-navy-400 font-mono">{stu.athleteId}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="text-[11px]">
                          {stu.primarySport}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-navy-700">
                        {stu.age} yrs • {stu.gender}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-navy-900">
                        {stu.status === 'active' ? stu.latestSprint30m || '—' : 'Restricted'}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-navy-900">
                        {stu.status === 'active' ? stu.latestVertJump || '—' : 'Restricted'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            stu.status === 'active'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : stu.status === 'pending'
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : 'text-navy-700 bg-navy-50 border-navy-200'
                          }`}
                        >
                          {stu.status === 'pending'
                            ? stu.isOutboundInvite
                              ? 'Invited'
                              : 'Pending'
                            : stu.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInspectStudent(stu);
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

      {/* Modals */}
      {isEditModalOpen && (
        <InstitutionEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          institutionData={institution}
          onProfileUpdated={loadData}
        />
      )}

      {isEnrollModalOpen && (
        <StudentEnrollModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          institutionId={institution.id}
          requesterId={user?.id || ''}
          onSuccess={loadData}
        />
      )}

      {isInspectModalOpen && inspectStudent && (
        <StudentDetailInspectModal
          isOpen={isInspectModalOpen}
          onClose={() => {
            setIsInspectModalOpen(false);
            setInspectStudent(null);
          }}
          student={inspectStudent}
          institutionId={institution.id}
          onActionCompleted={loadData}
        />
      )}
    </div>
  );
}
