/**
 * PratibhaScan Assessment Session Details Modal
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 */

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AssessmentSessionRecord } from '@/types/assessment.types';
import { verifyAssessmentSession, deleteAssessmentSession } from './assessmentService';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trash2,
  MapPin,
  AlertCircle,
  Users,
} from 'lucide-react';

interface SessionDetailsModalProps {
  session: AssessmentSessionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  canVerify?: boolean;
  onSessionUpdated?: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  isOpen,
  onClose,
  canVerify = false,
  onSessionUpdated,
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [verificationTier, setVerificationTier] = useState<'organization_recorded' | 'two_person_verified'>('organization_recorded');
  const [reviewerNotes, setReviewerNotes] = useState('');

  if (!session) return null;

  const isRecordingEvaluator = user?.id === session.evaluatorId;

  const handleVerify = async () => {
    setActionError(null);
    setIsProcessing(true);
    try {
      const isTwoPerson = verificationTier === 'two_person_verified';
      const result = await verifyAssessmentSession(session.id, {
        twoPersonVerification: isTwoPerson,
        reviewerNotes: reviewerNotes.trim() ? reviewerNotes.trim() : undefined,
      });
      if (result.error) throw result.error;
      if (onSessionUpdated) onSessionUpdated();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this draft assessment session? This action cannot be undone.')) {
      return;
    }
    setActionError(null);
    setIsProcessing(true);
    try {
      const result = await deleteAssessmentSession(session.id);
      if (result.error) throw result.error;
      if (onSessionUpdated) onSessionUpdated();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assessment Session Record"
      description={`Session ID: ${session.id.slice(0, 8)}... · Conducted on ${session.assessmentDate}`}
      size="lg"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div>
            {!session.verified && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={handleDelete}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Draft
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Close
            </Button>
            {!session.verified && canVerify && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleVerify}
                disabled={isProcessing}
                isLoading={isProcessing}
                className="font-semibold shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Verify &amp; Seal Session
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {actionError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{actionError}</div>
          </div>
        )}

        {/* Verification Status Header Banner */}
        {session.verificationTier === 'two_person_verified' ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                  Two-Person Verified Record (Dual Sign-Off)
                </span>
                <Badge variant="teal" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">
                  Dual Sign-Off
                </Badge>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                This assessment session has been evaluated by an authorized coach and independently certified by a distinct secondary reviewer under Two-Person Integrity rules. The record is permanently sealed in the database.
              </p>
            </div>
          </div>
        ) : session.verified ? (
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-teal-900">
                  Organization Verified Record
                </span>
                <Badge variant="teal" className="text-[10px]">
                  Sealed
                </Badge>
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">
                This assessment session has been evaluated and verified by an authorized organization evaluator. Under PostgreSQL Row-Level Security rules, verified records are sealed against modification. Internal organization verification does not constitute external government or federation accreditation.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  Draft Assessment (Pending Verification)
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                This record is currently in draft state. It can be reviewed, edited, or verified by an authorized evaluator or organization owner.
              </p>
            </div>
          </div>
        )}

        {/* Session Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-navy-50/70 border border-navy-200/80 text-xs">
          <div>
            <span className="text-navy-400 block text-[10px] uppercase font-bold tracking-wider">
              Athlete
            </span>
            <span className="font-semibold text-navy-900 block truncate">
              {session.athleteName}
            </span>
          </div>

          <div>
            <span className="text-navy-400 block text-[10px] uppercase font-bold tracking-wider">
              Evaluator
            </span>
            <span className="font-semibold text-navy-900 block truncate">
              {session.evaluatorName}
            </span>
          </div>

          <div>
            <span className="text-navy-400 block text-[10px] uppercase font-bold tracking-wider">
              Organization
            </span>
            <span className="font-semibold text-navy-900 block truncate">
              {session.organizationName}
            </span>
          </div>

          <div>
            <span className="text-navy-400 block text-[10px] uppercase font-bold tracking-wider">
              Assessment Date
            </span>
            <span className="font-semibold text-navy-900 block">
              {session.assessmentDate}
            </span>
          </div>
        </div>

        {/* Location & Notes */}
        {(session.venue || session.notes) && (
          <div className="text-xs text-navy-700 space-y-1 px-1">
            {session.venue && (
              <p className="flex items-center gap-1.5 text-navy-600">
                <MapPin className="h-3.5 w-3.5 text-navy-400 shrink-0" />
                <span>Venue: <strong>{session.venue}</strong></span>
              </p>
            )}
            {session.notes && (
              <p className="text-navy-600 italic">
                Notes: &quot;{session.notes}&quot;
              </p>
            )}
          </div>
        )}

        {/* Multi-Trial Results Table */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
            Recorded Protocol Results ({session.results.length})
          </h4>

          <div className="border border-navy-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-navy-700">
              <thead className="bg-navy-50/80 text-[10px] uppercase tracking-wider text-navy-500 font-bold border-b border-navy-200">
                <tr>
                  <th className="px-3.5 py-2.5">Protocol</th>
                  <th className="px-3 py-2.5">Trial 1</th>
                  <th className="px-3 py-2.5">Trial 2</th>
                  <th className="px-3 py-2.5">Trial 3</th>
                  <th className="px-3.5 py-2.5 text-right font-extrabold text-navy-900">Best Score</th>
                  <th className="px-3.5 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 bg-white">
                {session.results.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-50/40">
                    <td className="px-3.5 py-3">
                      <p className="font-semibold text-navy-950">{r.protocolTitle}</p>
                      <p className="text-[10px] text-navy-400 font-mono capitalize">{r.protocolCategory}</p>
                    </td>
                    <td className="px-3 py-3 font-mono">
                      {r.trial1 !== null ? `${r.trial1} ${r.unit}` : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono">
                      {r.trial2 !== null ? `${r.trial2} ${r.unit}` : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono">
                      {r.trial3 !== null ? `${r.trial3} ${r.unit}` : '—'}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <span className="font-mono font-bold text-sm text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200/60 inline-block">
                        {r.bestScore} {r.unit}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono text-[11px] font-semibold text-navy-600 capitalize">
                      {r.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Options (When Draft and Evaluator can verify) */}
        {!session.verified && canVerify && (
          <div className="p-4 rounded-xl bg-navy-50/80 border border-navy-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary-600" />
                Select Verification Tier
              </span>
              <span className="text-[11px] text-navy-500">Separation of duty rules apply</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                  verificationTier === 'organization_recorded'
                    ? 'bg-teal-50/60 border-teal-500 text-teal-950'
                    : 'bg-white border-navy-200 text-navy-700 hover:bg-navy-50'
                }`}
              >
                <input
                  type="radio"
                  name="verificationTier"
                  value="organization_recorded"
                  checked={verificationTier === 'organization_recorded'}
                  onChange={() => setVerificationTier('organization_recorded')}
                  className="mt-0.5 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="block text-xs font-bold">Organization Recorded</span>
                  <span className="block text-[11px] text-navy-500 mt-0.5">
                    Evaluator finalization. Seals session in internal registry.
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                  verificationTier === 'two_person_verified'
                    ? 'bg-emerald-50/60 border-emerald-500 text-emerald-950'
                    : 'bg-white border-navy-200 text-navy-700 hover:bg-navy-50'
                }`}
              >
                <input
                  type="radio"
                  name="verificationTier"
                  value="two_person_verified"
                  checked={verificationTier === 'two_person_verified'}
                  onChange={() => setVerificationTier('two_person_verified')}
                  className="mt-0.5 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="block text-xs font-bold">Two-Person Verified</span>
                  <span className="block text-[11px] text-navy-500 mt-0.5">
                    Dual sign-off. Requires independent secondary reviewer.
                  </span>
                </div>
              </label>
            </div>

            {verificationTier === 'two_person_verified' && isRecordingEvaluator && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Two-Person Separation of Duty Warning:</strong> You are the recording evaluator ({session.evaluatorName}). Two-person verification requires certification by an independent secondary coach.
                </div>
              </div>
            )}

            {verificationTier === 'two_person_verified' && !isRecordingEvaluator && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-semibold text-navy-700">
                  Reviewer Notes / Certification Remarks (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Video reviewed and sprint times certified"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-navy-200 rounded-lg text-navy-900"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
