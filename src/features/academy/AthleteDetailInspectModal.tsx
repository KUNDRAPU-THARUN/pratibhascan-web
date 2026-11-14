import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/AuthContext';
import {
  type RosterAthlete,
  type DetailedSession,
  fetchAthleteDetailedHistory,
  approveAffiliation,
  rejectAffiliation,
  revokeAffiliation,
} from './academyService';
import {
  User,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Ruler,
  Weight,
  Activity,
  XCircle,
  Lock,
  Loader2,
  FileText,
  Copy,
  Play,
} from 'lucide-react';

interface AthleteDetailInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: RosterAthlete | null;
  academyId: string;
  onActionCompleted: () => void;
}

export function AthleteDetailInspectModal({
  isOpen,
  onClose,
  athlete,
  academyId,
  onActionCompleted,
}: AthleteDetailInspectModalProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DetailedSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!isOpen || !athlete) {
      setSessions([]);
      setActionError(null);
      setActionSuccess(null);
      setConfirmRevoke(false);
      return;
    }

    if (athlete.status === 'active') {
      setIsLoadingSessions(true);
      fetchAthleteDetailedHistory(athlete.athleteId, academyId).then(({ sessions, error }) => {
        setIsLoadingSessions(false);
        if (!error) {
          setSessions(sessions);
        }
      });
    } else {
      setSessions([]);
    }
  }, [isOpen, athlete, academyId]);

  if (!athlete) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(athlete.athleteId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleApprove = async () => {
    if (!user) return;
    setIsProcessing(true);
    setActionError(null);
    const { error } = await approveAffiliation(athlete.affiliationId, user.id);
    setIsProcessing(false);
    if (error) {
      setActionError(error.message);
    } else {
      setActionSuccess('Affiliation approved. Athlete is now an active member of your roster.');
      setTimeout(() => {
        onActionCompleted();
        onClose();
      }, 1000);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setActionError(null);
    const { error } = await rejectAffiliation(athlete.affiliationId);
    setIsProcessing(false);
    if (error) {
      setActionError(error.message);
    } else {
      setActionSuccess('Affiliation request rejected.');
      setTimeout(() => {
        onActionCompleted();
        onClose();
      }, 1000);
    }
  };

  const handleRevoke = async () => {
    setIsProcessing(true);
    setActionError(null);
    const { error } = await revokeAffiliation(athlete.affiliationId);
    setIsProcessing(false);
    if (error) {
      setActionError(error.message);
    } else {
      setActionSuccess('Affiliation revoked. Access to private assessment sessions has been terminated.');
      setTimeout(() => {
        onActionCompleted();
        onClose();
      }, 1000);
    }
  };

  // Calculate BMI if height and weight are valid
  const bmi =
    athlete.heightCm > 0 && athlete.weightKg > 0
      ? (athlete.weightKg / Math.pow(athlete.heightCm / 100, 2)).toFixed(1)
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${athlete.fullName} — Biometric Passport`}
      description="Authorized candidate overview, physical baseline, and verified testing logs."
      footerActions={
        <div className="flex items-center justify-between w-full">
          {athlete.status === 'active' ? (
            <Link to="/dashboard/assessments">
              <Button variant="primary" size="sm" className="text-xs font-semibold shadow-xs">
                <Play className="h-3 w-3 mr-1 fill-current" />
                Conduct Assessment
              </Button>
            </Link>
          ) : (
            <div />
          )}
          <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {actionError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* DPDP Act Minor Safeguard Banner */}
        {athlete.isMinor && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Minor Athlete Safeguard (DPDP Act 2023)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              This candidate is under 18 years of age ({athlete.age} years). Processing biometric and athletic performance data mandates verified parental or legal guardian consent. Affiliation approval alone does not substitute for statutory guardian consent.
            </p>
          </div>
        )}

        {/* Athlete Overview Card */}
        <div className="p-4 rounded-xl bg-navy-50/60 border border-navy-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-navy-200 flex items-center justify-center text-primary-600 font-bold text-lg shadow-xs">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-navy-900 text-base">{athlete.fullName}</h3>
                  {athlete.isMinor && (
                    <Badge variant="warning" className="text-[10px]">Minor Candidate</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-navy-500 text-xs mt-0.5">
                  <span className="font-mono text-[10px]">{athlete.athleteId}</span>
                  <button
                    onClick={handleCopyId}
                    className="p-1 hover:bg-navy-200/50 rounded transition-colors text-navy-400 hover:text-navy-600"
                    title="Copy Athlete ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedId && <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="blue">{athlete.primarySport}</Badge>
              {athlete.secondarySport && (
                <Badge variant="outline">{athlete.secondarySport}</Badge>
              )}
            </div>
          </div>

          {/* Physical Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-navy-200/60">
            <div className="bg-white p-2.5 rounded-lg border border-navy-200">
              <div className="flex items-center gap-1 text-[11px] text-navy-500 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                <span>Age / Gender</span>
              </div>
              <p className="text-sm font-bold text-navy-900 mt-1 capitalize">
                {athlete.age} yrs • {athlete.gender}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-navy-200">
              <div className="flex items-center gap-1 text-[11px] text-navy-500 font-medium">
                <Ruler className="h-3.5 w-3.5" />
                <span>Stature</span>
              </div>
              <p className="text-sm font-bold text-navy-900 mt-1">
                {athlete.heightCm > 0 ? `${athlete.heightCm} cm` : '—'}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-navy-200">
              <div className="flex items-center gap-1 text-[11px] text-navy-500 font-medium">
                <Weight className="h-3.5 w-3.5" />
                <span>Body Mass</span>
              </div>
              <p className="text-sm font-bold text-navy-900 mt-1">
                {athlete.weightKg > 0 ? `${athlete.weightKg} kg` : '—'}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-navy-200">
              <div className="flex items-center gap-1 text-[11px] text-navy-500 font-medium">
                <Activity className="h-3.5 w-3.5" />
                <span>Calculated BMI</span>
              </div>
              <p className="text-sm font-bold text-navy-900 mt-1">
                {bmi ? `${bmi} kg/m²` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Affiliation Status & Actions */}
        <div className="p-4 rounded-xl border border-navy-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Affiliation Relationship
              </h4>
              <Badge
                variant={
                  athlete.status === 'active'
                    ? 'success'
                    : athlete.status === 'pending'
                    ? 'warning'
                    : 'default'
                }
              >
                {athlete.status.toUpperCase()}
              </Badge>
            </div>
            <span className="text-[11px] text-navy-400">
              Since {new Date(athlete.affiliatedSince).toLocaleDateString()}
            </span>
          </div>

          {/* Action Row */}
          {athlete.status === 'pending' && !athlete.isOutboundInvite && (
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-primary-950">Inbound Affiliation Request</p>
                <p className="text-[11px] text-primary-700">
                  This athlete has requested to join your academy. Approve to unlock testing and cohort tracking.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Approve Affiliation
                </Button>
              </div>
            </div>
          )}

          {athlete.status === 'pending' && athlete.isOutboundInvite && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <p className="font-semibold text-amber-950">Outbound Invitation Sent</p>
              <p className="text-[11px] mt-0.5 text-amber-800">
                Awaiting candidate approval. Under Row-Level Security, biometric evaluations remain restricted until the athlete accepts.
              </p>
            </div>
          )}

          {athlete.status === 'active' && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-navy-600">
                Authorized for official assessments and battery tracking.
              </p>
              {!confirmRevoke ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmRevoke(true)}
                  disabled={isProcessing}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Revoke Affiliation
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-600 font-semibold">Confirm revoke?</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRevoke(false)}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRevoke}
                    disabled={isProcessing}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assessment History Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
              Verified Testing History
            </h4>
            <span className="text-[11px] text-navy-400">
              {sessions.length} sessions logged
            </span>
          </div>

          {athlete.status !== 'active' ? (
            <div className="p-4 rounded-xl bg-navy-50 border border-navy-200 text-center space-y-2">
              <Lock className="h-6 w-6 text-navy-400 mx-auto" />
              <p className="text-xs font-bold text-navy-800">Access Restricted Under RLS</p>
              <p className="text-[11px] text-navy-500 max-w-md mx-auto">
                Detailed assessment trials and longitudinal performance records are confidential. They will become accessible once an active affiliation is established.
              </p>
            </div>
          ) : isLoadingSessions ? (
            <div className="p-6 text-center text-navy-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              <span>Loading assessment trials...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 rounded-xl bg-navy-50/50 border border-dashed border-navy-300 text-center space-y-1">
              <FileText className="h-5 w-5 text-navy-400 mx-auto" />
              <p className="text-xs font-semibold text-navy-700">No Assessment Records Found</p>
              <p className="text-[11px] text-navy-400">
                No formal testing sessions have been conducted for this athlete at your academy yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {sessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className="p-3 rounded-lg border border-navy-200 bg-white hover:border-navy-300 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900">
                        {new Date(sess.assessmentDate).toLocaleDateString()}
                      </span>
                      {sess.venue && (
                        <span className="text-navy-400 text-[11px]">• {sess.venue}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-navy-500">By {sess.evaluatorName}</span>
                      {sess.verified && (
                        <Badge variant="success" className="text-[9px]">Verified</Badge>
                      )}
                    </div>
                  </div>

                  {sess.results.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-navy-100">
                      {sess.results.map((res, idx) => (
                        <div
                          key={idx}
                          className="bg-navy-50/50 px-2.5 py-1.5 rounded flex items-center justify-between text-xs"
                        >
                          <span className="text-navy-600 font-medium truncate mr-2">
                            {res.protocolTitle}
                          </span>
                          <span className="font-mono font-bold text-navy-900 shrink-0">
                            {res.bestScore} {res.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
