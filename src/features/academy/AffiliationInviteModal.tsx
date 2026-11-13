import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { affiliationRequestSchema } from './academySchemas';
import { createAffiliationRequest } from './academyService';
import { ShieldAlert, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';

interface AffiliationInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  academyId: string;
  requesterId: string;
  onSuccess: () => void;
}

export function AffiliationInviteModal({
  isOpen,
  onClose,
  academyId,
  requesterId,
  onSuccess,
}: AffiliationInviteModalProps) {
  const [athleteId, setAthleteId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    setSuccessMessage(null);

    const parseResult = affiliationRequestSchema.safeParse({ athleteId, notes });
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      setFieldError(issue?.message || 'Invalid form input');
      return;
    }

    setIsSubmitting(true);
    const { error: reqError } = await createAffiliationRequest(
      academyId,
      parseResult.data.athleteId,
      requesterId
    );
    setIsSubmitting(false);

    if (reqError) {
      setError(reqError.message);
      return;
    }

    setSuccessMessage('Affiliation invitation successfully sent. Status is set to pending.');
    setTimeout(() => {
      onSuccess();
      onClose();
      setAthleteId('');
      setNotes('');
      setSuccessMessage(null);
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Athlete to Academy Roster"
      description="Send an affiliation request to an athlete using their unique PratibhaScan UUID."
      footerActions={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending Request...' : 'Send Affiliation Request'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* DPDP Act 2023 Minor Safeguard Notice */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Digital Personal Data Protection (DPDP) Act 2023 Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Affiliation requests for minor athletes (&lt; 18 years) require verified parental or legal guardian consent. Submitting an affiliation invitation places the athlete in <strong>pending</strong> status. Under Row-Level Security, private biometric assessments remain confidential until mutual affiliation is finalized.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Athlete ID */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Athlete Unique Identifier (UUID) *
          </label>
          <Input
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value.trim())}
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            className="text-xs font-mono"
          />
          {fieldError && <p className="text-[11px] text-red-600 mt-1">{fieldError}</p>}
          <p className="text-[10px] text-navy-400 mt-1">
            Athletes can find their unique ID on their digital biometric passport or profile page.
          </p>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Cohort / Batch Notes (Optional)
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. U-19 Sprint Talent Camp, Batch B"
            className="text-xs"
          />
        </div>

        <div className="p-3 rounded-lg bg-navy-50 border border-navy-200 text-[11px] text-navy-600 flex items-start gap-2">
          <UserPlus className="h-4 w-4 shrink-0 text-navy-400 mt-0.5" />
          <p>
            Once sent, the candidate will receive the affiliation invitation in their Athlete Dashboard. Once approved, biometric progress tracking and standardized evaluations will be unlocked.
          </p>
        </div>
      </form>
    </Modal>
  );
}
