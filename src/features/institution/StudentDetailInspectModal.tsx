import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/AuthContext';
import {
  type StudentAthlete,
  type DetailedSession,
  fetchStudentDetailedHistory,
  approveStudentAffiliation,
  rejectStudentAffiliation,
  revokeStudentAffiliation,
} from './institutionService';
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
} from 'lucide-react';

interface StudentDetailInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAthlete | null;
  institutionId: string;
  onActionCompleted: () => void;
}

export function StudentDetailInspectModal({
  isOpen,
  onClose,
  student,
  institutionId,
  onActionCompleted,
}: StudentDetailInspectModalProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DetailedSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!isOpen || !student) {
      setSessions([]);
      setActionError(null);
      setActionSuccess(null);
      setConfirmRevoke(false);
      return;
    }

    if (student.status === 'active') {
      setIsLoadingSessions(true);
      fetchStudentDetailedHistory(student.athleteId, institutionId).then(({ sessions, error }) => {
        setIsLoadingSessions(false);
        if (!error) {
          setSessions(sessions);
        }
      });
    } else {
      setSessions([]);
    }
  }, [isOpen, student, institutionId]);

  if (!student) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(student.athleteId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleApprove = async () => {
    if (!user) return;
    setIsProcessing(true);
    setActionError(null);
    const { error } = await approveStudentAffiliation(student.affiliationId, user.id);
    setIsProcessing(false);
    if (error) {
      setActionError(error.message);
    } else {
      setActionSuccess('Student affiliation approved. Candidate is now active on your institution roster.');
      setTimeout(() => {
        onActionCompleted();
        onClose();
      }, 1000);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setActionError(null);
    const { error } = await rejectStudentAffiliation(student.affiliationId);
    setIsProcessing(false);
    if (error) {
      setActionError(error.message);
    } else {
      setActionSuccess('Student affiliation request rejected.');
      setTimeout(() => {
        onActionCompleted();
        onClose();
      }, 1000);
    }
  };

  const handleRevoke = async () => {
    setIsProcessing(true);
    setActionError(null);
    const { error } = await revokeStudentAffiliation(student.affiliationId);
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
    student.heightCm > 0 && student.weightKg > 0
      ? (student.weightKg / Math.pow(student.heightCm / 100, 2)).toFixed(1)
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${student.fullName} — Student Passport`}
      description="Authorized student baseline, physical development metrics, and official school testing logs."
      footerActions={
        <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
          Close
        </Button>
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
        {student.isMinor && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Minor Student Safeguard (DPDP Act 2023)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              This student is under 18 years of age ({student.age} years). Processing biometric and athletic performance data mandates verified parental or legal guardian consent. Affiliation approval alone does not substitute for statutory guardian consent.
            </p>
          </div>
        )}

        {/* Student Overview Card */}
        <div className="p-4 rounded-xl bg-navy-50/60 border border-navy-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-navy-200 flex items-center justify-center text-primary-600 font-bold text-lg shadow-xs">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-navy-900 text-base">{student.fullName}</h3>
                  {student.isMinor && (
                    <Badge variant="warning" className="text-[10px]">Minor Candidate</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-navy-500 text-xs mt-0.5">
                  <span className="font-mono text-[10px]">{student.athleteId}</span>
                  <button
                    onClick={handleCopyId}
                    className="p-1 hover:bg-navy-200/50 rounded transition-colors text-navy-400 hover:text-navy-600"
                    title="Copy Student ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedId && <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="blue">{student.primarySport}</Badge>
              {student.secondarySport && (
                <Badge variant="outline">{student.secondarySport}</Badge>
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
                {student.age} yrs • {student.gender}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-navy-200">
              <div className="flex items-center gap-1 text-[11px] text-navy-500 font-medium">
                <Ruler className="h-3.5 w-3.5" />
                <span>Stature</span>
              </div>
              <p className="text-sm font-bold text-navy-900 mt-1">
                {student.heightCm > 0 ? `${student.heightCm} cm` : '—'}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-navy-200">
              <div className="flex items-center gap-1 text-[11px] text-navy-500 font-medium">
                <Weight className="h-3.5 w-3.5" />
                <span>Body Mass</span>
              </div>
              <p className="text-sm font-bold text-navy-900 mt-1">
                {student.weightKg > 0 ? `${student.weightKg} kg` : '—'}
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
                Institutional Affiliation
              </h4>
              <Badge
                variant={
                  student.status === 'active'
                    ? 'success'
                    : student.status === 'pending'
                    ? 'warning'
                    : 'default'
                }
              >
                {student.status.toUpperCase()}
              </Badge>
            </div>
            <span className="text-[11px] text-navy-400">
              Since {new Date(student.affiliatedSince).toLocaleDateString()}
            </span>
          </div>

          {/* Action Row */}
          {student.status === 'pending' && !student.isOutboundInvite && (
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-primary-950">Inbound Enrollment Application</p>
                <p className="text-[11px] text-primary-700">
                  This student has applied to affiliate with your institution. Approve to unlock official school athletic records.
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
                  Approve Enrollment
                </Button>
              </div>
            </div>
          )}

          {student.status === 'pending' && student.isOutboundInvite && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <p className="font-semibold text-amber-950">Outbound Invitation Pending</p>
              <p className="text-[11px] mt-0.5 text-amber-800">
                Awaiting student confirmation. Under PostgreSQL Row-Level Security, private assessment records remain restricted until the student accepts.
              </p>
            </div>
          )}

          {student.status === 'active' && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-navy-600">
                Authorized for school athletic testing and physical education evaluations.
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
              School Assessment History
            </h4>
            <span className="text-[11px] text-navy-400">
              {sessions.length} sessions conducted
            </span>
          </div>

          {student.status !== 'active' ? (
            <div className="p-4 rounded-xl bg-navy-50 border border-navy-200 text-center space-y-2">
              <Lock className="h-6 w-6 text-navy-400 mx-auto" />
              <p className="text-xs font-bold text-navy-800">Access Restricted Under RLS</p>
              <p className="text-[11px] text-navy-500 max-w-md mx-auto">
                Detailed assessment trials and longitudinal performance records are confidential. They will become accessible once an active affiliation is confirmed by the student or legal guardian.
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
                No formal testing sessions have been conducted for this student at your institution yet.
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
