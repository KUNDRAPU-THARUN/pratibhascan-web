import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentAffiliationRequestSchema } from './institutionSchemas';
import { createStudentAffiliationRequest } from './institutionService';
import { ShieldAlert, AlertCircle, CheckCircle2, GraduationCap } from 'lucide-react';

interface StudentEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
  requesterId: string;
  onSuccess: () => void;
}

export function StudentEnrollModal({
  isOpen,
  onClose,
  institutionId,
  requesterId,
  onSuccess,
}: StudentEnrollModalProps) {
  const [athleteId, setAthleteId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [gradeOrDepartment, setGradeOrDepartment] = useState('');
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

    const parseResult = studentAffiliationRequestSchema.safeParse({
      athleteId,
      academicYear: academicYear || undefined,
      gradeOrDepartment: gradeOrDepartment || undefined,
      notes: notes || undefined,
    });

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      setFieldError(issue?.message || 'Invalid form input');
      return;
    }

    setIsSubmitting(true);
    const { error: reqError } = await createStudentAffiliationRequest(
      institutionId,
      parseResult.data.athleteId,
      requesterId
    );
    setIsSubmitting(false);

    if (reqError) {
      setError(reqError.message);
      return;
    }

    setSuccessMessage('Student affiliation invitation successfully sent. Status is set to pending.');
    setTimeout(() => {
      onSuccess();
      onClose();
      setAthleteId('');
      setAcademicYear('');
      setGradeOrDepartment('');
      setNotes('');
      setSuccessMessage(null);
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll Student-Athlete to Institution Roster"
      description="Send a verified affiliation invitation to a student using their unique PratibhaScan UUID."
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
            {isSubmitting ? 'Sending Invitation...' : 'Send Affiliation Invitation'}
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
            Enrolling school or youth athletes (&lt; 18 years) requires verifiable parental or legal guardian consent. Submitting this invitation creates a <strong>pending</strong> affiliation. Under PostgreSQL Row-Level Security, private biometric assessments and medical profiles remain confidential until mutual affiliation is confirmed.
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

        {/* Student Athlete ID */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Student-Athlete Unique Identifier (UUID) *
          </label>
          <Input
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value.trim())}
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            className="text-xs font-mono"
          />
          {fieldError && <p className="text-[11px] text-red-600 mt-1">{fieldError}</p>}
          <p className="text-[10px] text-navy-400 mt-1">
            Students can find their unique ID on their digital biometric passport or profile page.
          </p>
        </div>

        {/* Academic Year & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              Academic Year (Optional)
            </label>
            <Input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026-2027"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              Class / Grade / Department (Optional)
            </label>
            <Input
              value={gradeOrDepartment}
              onChange={(e) => setGradeOrDepartment(e.target.value)}
              placeholder="e.g. Class 10-B or Dept of Physical Ed"
              className="text-xs"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Institutional Batch / Cohort Notes (Optional)
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Inter-School Athletics Squad, U-17"
            className="text-xs"
          />
        </div>

        <div className="p-3 rounded-lg bg-navy-50 border border-navy-200 text-[11px] text-navy-600 flex items-start gap-2">
          <GraduationCap className="h-4 w-4 shrink-0 text-navy-400 mt-0.5" />
          <p>
            Once sent, the invitation appears in the student's Athlete Portal. Upon student confirmation, official physical education testing records and battery tracking become authorized.
          </p>
        </div>
      </form>
    </Modal>
  );
}
