/**
 * PratibhaScan Standardized Assessment Suite & Session Management View
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Unifies standardized physical protocols, multi-trial testing, live validation,
 * evaluator authorization checks, and verification history across all roles.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProtocolCard } from './ProtocolCard';
import { NewAssessmentModal } from './NewAssessmentModal';
import { SessionDetailsModal } from './SessionDetailsModal';
import {
  fetchAssessmentProtocols,
  fetchEligibleAthletesForEvaluator,
  fetchOrganizationAssessmentSessions,
  type EligibleAthlete,
} from './assessmentService';
import type { ProtocolSpecification } from './assessmentCalculations';
import type { AssessmentSessionRecord } from '@/types/assessment.types';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  FileText,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export function AssessmentsView() {
  const { user, profile, organization } = useAuth();
  const userRole = profile?.role || 'athlete';
  const isEvaluatorRole = userRole === 'academy' || userRole === 'institution';

  const [activeTab, setActiveTab] = useState<'protocols' | 'sessions'>('protocols');
  const [protocols, setProtocols] = useState<ProtocolSpecification[]>([]);
  const [eligibleAthletes, setEligibleAthletes] = useState<EligibleAthlete[]>([]);
  const [sessions, setSessions] = useState<AssessmentSessionRecord[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'draft'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialProtocol, setModalInitialProtocol] = useState<ProtocolSpecification | null>(null);
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<AssessmentSessionRecord | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Load standard protocols
  const loadProtocols = useCallback(async () => {
    const { data, error } = await fetchAssessmentProtocols();
    if (error) {
      console.warn('Protocols error:', error.message);
    }
    setProtocols(data);
  }, []);

  // Load eligible athletes for evaluator
  const loadEligibleAthletes = useCallback(async () => {
    if (!user?.id || !isEvaluatorRole) return;
    const { data } = await fetchEligibleAthletesForEvaluator(user.id, userRole);
    setEligibleAthletes(data);
  }, [user?.id, userRole, isEvaluatorRole]);

  // Load sessions for organization
  const loadSessions = useCallback(async () => {
    if (!user?.id) return;
    if (isEvaluatorRole) {
      // Find organization ID from organization context or eligible athletes
      const orgId = organization?.id || (eligibleAthletes.length > 0 ? eligibleAthletes[0].organizationId : null);
      if (orgId) {
        const { data } = await fetchOrganizationAssessmentSessions(
          orgId,
          userRole as 'academy' | 'institution'
        );
        setSessions(data);
      }
    }
  }, [user?.id, userRole, isEvaluatorRole, organization?.id, eligibleAthletes]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoading(true);
      await loadProtocols();
      if (mounted) setIsLoading(false);
    }
    init();
    return () => {
      mounted = false;
    };
  }, [loadProtocols]);

  // Load evaluator-specific data when role is active
  useEffect(() => {
    if (isEvaluatorRole && user?.id) {
      loadEligibleAthletes();
    }
  }, [isEvaluatorRole, user?.id, loadEligibleAthletes]);

  useEffect(() => {
    if (isEvaluatorRole && (organization?.id || eligibleAthletes.length > 0)) {
      loadSessions();
    }
  }, [isEvaluatorRole, organization?.id, eligibleAthletes, loadSessions]);

  const handleOpenConductModal = (protocol?: ProtocolSpecification) => {
    setModalInitialProtocol(protocol || null);
    setIsModalOpen(true);
  };

  const handleSessionCreated = () => {
    loadSessions();
    setActiveTab('sessions');
  };

  // Filter protocols
  const categories = ['all', 'speed', 'power', 'endurance', 'flexibility', 'agility', 'anthropometric'];
  const filteredProtocols = protocols.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (statusFilter === 'verified' && !s.verified) return false;
    if (statusFilter === 'draft' && s.verified) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchAthlete = s.athleteName.toLowerCase().includes(q);
      const matchVenue = s.venue?.toLowerCase().includes(q);
      const matchResult = s.results.some((r) => r.protocolTitle.toLowerCase().includes(q));
      return matchAthlete || matchVenue || matchResult;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
              Standardized Assessment Suite
            </h1>
            <Badge variant="teal" className="text-[11px] font-semibold">
              Modeled on SAI Guidelines
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Standardized field evaluation battery, multi-trial scoring rules, and tamper-evident verification.
          </p>
        </div>

        {isEvaluatorRole && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              className="font-semibold shadow-xs"
              onClick={() => handleOpenConductModal()}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Conduct Assessment
            </Button>
          </div>
        )}
      </div>

      {/* Role Context Notices */}
      {userRole === 'athlete' && (
        <div className="p-3.5 rounded-xl bg-navy-50 border border-navy-200/90 text-xs text-navy-700 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-navy-900">Standardized Protocol Catalog &amp; Scoring Rules</p>
            <p className="leading-relaxed text-navy-600 text-[11px]">
              Under PratibhaScan security rules, athletes cannot evaluate themselves. Standardized assessments must be conducted and verified by authorized coaches and evaluators at accredited academies or schools. Comparative national percentiles require published federation empirical datasets. You can inspect your verified scores in your{' '}
              <a href="/dashboard/athlete" className="font-bold underline text-primary-700 hover:text-primary-800">
                Athletic Passport
              </a>.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-navy-200 pb-px">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('protocols')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'protocols'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4" />
              Standard Protocols ({protocols.length})
            </span>
          </button>

          {isEvaluatorRole && (
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-navy-500 hover:text-navy-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Assessment Records ({sessions.length})
              </span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="hidden sm:flex items-center relative w-64">
          <Search className="h-3.5 w-3.5 text-navy-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder={activeTab === 'protocols' ? 'Search protocols...' : 'Search records...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-navy-200 rounded-lg text-navy-900 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* TAB 1: PROTOCOL LIBRARY */}
      {activeTab === 'protocols' && (
        <div className="space-y-5">
          {isLoading ? (
            <div className="p-12 text-center text-navy-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <span>Loading standardized assessment battery...</span>
            </div>
          ) : (
            <>
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer capitalize ${
                      selectedCategory === cat
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'
                    }`}
                  >
                    {cat === 'all' ? 'All Protocols' : cat}
                  </button>
                ))}
              </div>

              {/* Protocols Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProtocols.map((protocol) => (
                  <ProtocolCard
                    key={protocol.code}
                    protocol={protocol}
                    canConduct={isEvaluatorRole}
                    onSelectForAssessment={(p) => handleOpenConductModal(p)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: ASSESSMENT SESSIONS / RECORDS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-navy-200/90 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-navy-500">Filter by Status:</span>
              <div className="flex items-center gap-1">
                {(['all', 'verified', 'draft'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium capitalize cursor-pointer transition-all ${
                      statusFilter === st
                        ? 'bg-primary-50 text-primary-800 border border-primary-300 font-bold'
                        : 'text-navy-600 hover:bg-navy-50'
                    }`}
                  >
                    {st === 'all' ? 'All' : st === 'verified' ? 'Officially Verified' : 'Draft / Pending'}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-navy-500"
              onClick={loadSessions}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Sessions Table or Empty State */}
          {filteredSessions.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-navy-200">
              <div className="p-3 rounded-full bg-navy-50 text-navy-400 inline-block mb-3">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-navy-900">No Assessment Records Found</h3>
              <p className="text-xs text-navy-500 mt-1 max-w-md mx-auto">
                No assessments match the current filter. Initiate a standardized test for your enrolled athletes using the button below.
              </p>
              {isEvaluatorRole && (
                <div className="pt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenConductModal()}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Conduct First Assessment
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <div className="border border-navy-200/90 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-navy-700">
                  <thead className="bg-navy-50/80 text-[10px] uppercase tracking-wider text-navy-500 font-bold border-b border-navy-200">
                    <tr>
                      <th className="px-4 py-3">Session Date</th>
                      <th className="px-4 py-3">Athlete</th>
                      <th className="px-4 py-3">Protocol &amp; Best Result</th>
                      <th className="px-4 py-3">Evaluator</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {filteredSessions.map((sess) => (
                      <tr key={sess.id} className="hover:bg-navy-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-navy-900">
                          {sess.assessmentDate}
                          {sess.venue && (
                            <span className="block text-[10px] text-navy-400 truncate max-w-36">
                              {sess.venue}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-navy-950 block">
                            {sess.athleteName}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {sess.results.map((r) => (
                            <div key={r.id} className="space-y-0.5">
                              <span className="font-medium text-navy-800">{r.protocolTitle}</span>
                              <span className="font-mono font-bold text-primary-700 block text-xs">
                                {r.bestScore} {r.unit}
                              </span>
                            </div>
                          ))}
                        </td>

                        <td className="px-4 py-3.5 text-navy-600">
                          {sess.evaluatorName}
                        </td>

                        <td className="px-4 py-3.5">
                          {sess.verificationTier === 'two_person_verified' ? (
                            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                              Two-Person Verified
                            </span>
                          ) : sess.verified ? (
                            <span className="inline-flex items-center text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3 mr-1 text-teal-600" />
                              Org Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                              <Clock className="h-3 w-3 mr-1 text-amber-600" />
                              Draft / Pending
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setSelectedSessionForDetails(sess)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guided Assessment Modal */}
      <NewAssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        protocols={protocols}
        initialProtocol={modalInitialProtocol}
        eligibleAthletes={eligibleAthletes}
        onSessionCreated={handleSessionCreated}
      />

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSessionForDetails}
        isOpen={!!selectedSessionForDetails}
        onClose={() => setSelectedSessionForDetails(null)}
        canVerify={isEvaluatorRole}
        onSessionUpdated={loadSessions}
      />
    </div>
  );
}
