/**
 * PratibhaScan New Assessment Session Modal
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Guided multi-step workflow for authorized evaluators to conduct field tests:
 * Step 1: Select eligible actively affiliated athlete (strict RLS compliance)
 * Step 2: Select standardized protocol
 * Step 3: Session details (date, venue, notes)
 * Step 4: Multi-trial recording, live validation, and best score computation
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import type { ProtocolSpecification } from './assessmentCalculations';
import {
  calculateBestScore,
  validateMeasurement,
} from './assessmentCalculations';
import type { EligibleAthlete } from './assessmentService';
import {
  createAssessmentSession,
  verifyAssessmentSession,
} from './assessmentService';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface NewAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocols: ProtocolSpecification[];
  initialProtocol?: ProtocolSpecification | null;
  eligibleAthletes: EligibleAthlete[];
  onSessionCreated: () => void;
}

export const NewAssessmentModal: React.FC<NewAssessmentModalProps> = ({
  isOpen,
  onClose,
  protocols,
  initialProtocol,
  eligibleAthletes,
  onSessionCreated,
}) => {
  // Form step: 1 = Athlete & Protocol, 2 = Session Details & Trials, 3 = Confirmation
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedProtocolCode, setSelectedProtocolCode] = useState<string>('');
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [venue, setVenue] = useState<string>('Standardized Field Track');
  const [notes, setNotes] = useState<string>('');

  // Multi-trial inputs
  const [trial1, setTrial1] = useState<string>('');
  const [trial2, setTrial2] = useState<string>('');
  const [trial3, setTrial3] = useState<string>('');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected protocol from prop if provided
  useEffect(() => {
    if (initialProtocol) {
      setSelectedProtocolCode(initialProtocol.code);
    } else if (protocols.length > 0 && !selectedProtocolCode) {
      setSelectedProtocolCode(protocols[0].code);
    }
  }, [initialProtocol, protocols, selectedProtocolCode]);

  // Set default athlete if list available
  useEffect(() => {
    if (eligibleAthletes.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(eligibleAthletes[0].id);
    }
  }, [eligibleAthletes, selectedAthleteId]);

  const activeProtocol = protocols.find((p) => p.code === selectedProtocolCode) || protocols[0];
  const activeAthlete = eligibleAthletes.find((a) => a.id === selectedAthleteId);

  // Calculate live best score
  const numTrial1 = trial1.trim() !== '' ? parseFloat(trial1) : null;
  const numTrial2 = trial2.trim() !== '' ? parseFloat(trial2) : null;
  const numTrial3 = trial3.trim() !== '' ? parseFloat(trial3) : null;

  const { bestScore } = calculateBestScore(
    selectedProtocolCode,
    [numTrial1, numTrial2, numTrial3]
  );

  // Real-time trial validation
  const handleTrialChange = (trialIndex: 1 | 2 | 3, valueString: string) => {
    if (trialIndex === 1) setTrial1(valueString);
    if (trialIndex === 2) setTrial2(valueString);
    if (trialIndex === 3) setTrial3(valueString);

    const newErrors = { ...validationErrors };
    const key = `trial${trialIndex}`;

    if (valueString.trim() === '') {
      delete newErrors[key];
      setValidationErrors(newErrors);
      return;
    }

    const val = parseFloat(valueString);
    if (isNaN(val)) {
      newErrors[key] = 'Must be a valid number';
    } else {
      const validation = validateMeasurement(selectedProtocolCode, val);
      if (!validation.isValid) {
        newErrors[key] = validation.error || 'Invalid measurement value';
      } else {
        delete newErrors[key];
      }
    }
    setValidationErrors(newErrors);
  };

  const resetForm = () => {
    setTrial1('');
    setTrial2('');
    setTrial3('');
    setNotes('');
    setValidationErrors({});
    setGeneralError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (shouldVerifyImmediately: boolean) => {
    setGeneralError(null);

    if (!selectedAthleteId) {
      setGeneralError('Please select an eligible athlete with an active affiliation.');
      return;
    }

    if (!selectedProtocolCode) {
      setGeneralError('Please select a standardized assessment protocol.');
      return;
    }

    if (!assessmentDate) {
      setGeneralError('Assessment date is required.');
      return;
    }

    if (numTrial1 === null && numTrial2 === null && numTrial3 === null) {
      setGeneralError('At least Trial 1 measurement is required to record an assessment.');
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      setGeneralError('Please correct the validation errors in trial measurements before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionResult = await createAssessmentSession({
        athleteId: selectedAthleteId,
        protocolId: '', // Will be looked up by protocolCode
        protocolCode: selectedProtocolCode,
        academyId: activeAthlete?.affiliationType === 'academy' ? activeAthlete.organizationId : null,
        institutionId: activeAthlete?.affiliationType === 'institution' ? activeAthlete.organizationId : null,
        assessmentDate,
        venue,
        notes,
        trial1: numTrial1,
        trial2: numTrial2,
        trial3: numTrial3,
        bestScore: bestScore ?? undefined,
      });

      if (sessionResult.error || !sessionResult.data) {
        throw new Error(sessionResult.error?.message || 'Failed to create assessment session');
      }

      if (shouldVerifyImmediately) {
        const verifyResult = await verifyAssessmentSession(sessionResult.data.id);
        if (verifyResult.error) {
          throw new Error(`Session recorded as draft, but verification failed: ${verifyResult.error.message}`);
        }
      }

      onSessionCreated();
      handleClose();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : String(err));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Conduct Standardized Assessment"
      description="Record multi-trial biometric and physical test measurements with automated validation"
      size="lg"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || bestScore === null || Object.keys(validationErrors).length > 0}
              isLoading={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || bestScore === null || Object.keys(validationErrors).length > 0}
              isLoading={isSubmitting}
              className="font-semibold shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Verify &amp; Seal Session
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 py-1">
        {/* General Error Banner */}
        {generalError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{generalError}</div>
          </div>
        )}

        {/* Section 1: Athlete and Protocol Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Athlete Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-navy-700">
              Eligible Affiliated Athlete <span className="text-rose-500">*</span>
            </label>
            {eligibleAthletes.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  No actively affiliated athletes found in your organization. Athletes must accept affiliation before assessments can be recorded.
                </p>
              </div>
            ) : (
              <select
                aria-label="Eligible Affiliated Athlete"
                className="w-full h-10 px-3 text-xs bg-white border border-navy-200 rounded-lg text-navy-900 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                disabled={isSubmitting}
              >
                {eligibleAthletes.map((ath) => (
                  <option key={ath.id} value={ath.id}>
                    {ath.fullName} ({ath.primarySport} · Age {ath.age})
                  </option>
                ))}
              </select>
            )}

            {/* Athlete metadata & minor safeguard badge */}
            {activeAthlete && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-navy-600">
                <span className="font-medium text-navy-800">{activeAthlete.primarySport}</span>
                <span>·</span>
                <span>Age: {activeAthlete.age}</span>
                {activeAthlete.isMinor && (
                  <Badge variant="teal" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                    <ShieldAlert className="h-3 w-3 mr-1 text-amber-600 inline" />
                    Minor Athlete (Guardian Consent Required)
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Protocol Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-navy-700">
              Assessment Protocol <span className="text-rose-500">*</span>
            </label>
            <select
              aria-label="Assessment Protocol"
              className="w-full h-10 px-3 text-xs bg-white border border-navy-200 rounded-lg text-navy-900 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={selectedProtocolCode}
              onChange={(e) => {
                setSelectedProtocolCode(e.target.value);
                setTrial1('');
                setTrial2('');
                setTrial3('');
                setValidationErrors({});
              }}
              disabled={isSubmitting}
            >
              {protocols.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>

            {activeProtocol && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-navy-500">
                <span>Unit: <strong className="text-navy-800 font-mono">{activeProtocol.unit}</strong></span>
                <span className={`font-semibold ${activeProtocol.lowerIsBetter ? 'text-amber-800' : 'text-primary-800'}`}>
                  {activeProtocol.lowerIsBetter ? 'Lower Time = Better' : 'Higher Mark = Better'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Session Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <FormField label="Assessment Date" required>
            <Input
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Testing Venue / Location">
            <Input
              placeholder="e.g. Main Track & Field Facility"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        {/* Section 3: Multi-Trial Entry Box */}
        {activeProtocol && (
          <div className="p-4 rounded-xl bg-navy-50/70 border border-navy-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  Multi-Trial Data Entry ({activeProtocol.unit})
                </h4>
                <p className="text-[11px] text-navy-500 mt-0.5">
                  Allowed range: {activeProtocol.validRange.min} to {activeProtocol.validRange.max} {activeProtocol.unit}. Max attempts: {activeProtocol.maxAttempts}.
                </p>
              </div>
              <Badge variant="teal" className="text-[10px]">
                {activeProtocol.categoryLabel}
              </Badge>
            </div>

            {/* Trial Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Trial 1 */}
              <div>
                <Input
                  label="Trial 1 (Required)"
                  type="number"
                  step="any"
                  placeholder={`0.00 ${activeProtocol.unit}`}
                  value={trial1}
                  onChange={(e) => handleTrialChange(1, e.target.value)}
                  error={validationErrors.trial1}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Trial 2 (if allowed) */}
              <div>
                <Input
                  label="Trial 2 (Optional)"
                  type="number"
                  step="any"
                  placeholder={activeProtocol.maxAttempts >= 2 ? `0.00 ${activeProtocol.unit}` : 'N/A for single-trial test'}
                  value={trial2}
                  onChange={(e) => handleTrialChange(2, e.target.value)}
                  error={validationErrors.trial2}
                  disabled={isSubmitting || activeProtocol.maxAttempts < 2}
                />
              </div>

              {/* Trial 3 (if allowed) */}
              <div>
                <Input
                  label="Trial 3 (Optional)"
                  type="number"
                  step="any"
                  placeholder={activeProtocol.maxAttempts >= 3 ? `0.00 ${activeProtocol.unit}` : 'N/A for test'}
                  value={trial3}
                  onChange={(e) => handleTrialChange(3, e.target.value)}
                  error={validationErrors.trial3}
                  disabled={isSubmitting || activeProtocol.maxAttempts < 3}
                />
              </div>
            </div>

            {/* Calculated Best Score Preview Banner */}
            {bestScore !== null ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Computed Best Performance
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-950">
                      {bestScore} {activeProtocol.unit}
                    </span>
                    <span className="text-[11px] text-emerald-700 ml-2">
                      ({activeProtocol.lowerIsBetter ? 'Lowest valid time selected' : 'Highest valid mark selected'})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                    Validation Status
                  </span>
                  <span className="text-xs font-bold text-emerald-900">
                    Standardized Score
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-navy-400 italic">
                Enter at least one valid measurement to compute the score.
              </p>
            )}
          </div>
        )}

        {/* Section 4: Notes */}
        <FormField label="Evaluator Notes / Environmental Conditions">
          <Input
            placeholder="e.g. Dry track, 24°C, slight headwind, athlete reported full recovery"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Security / Verification Advisory Notice */}
        <div className="p-3 rounded-lg bg-navy-50/80 border border-navy-200/80 text-[11px] text-navy-700 flex items-start gap-2 leading-relaxed">
          <ShieldCheck className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
          <p>
            <strong>Organization Verification Notice:</strong> Selecting &quot;Verify &amp; Seal Session&quot; applies an immutable seal via PostgreSQL RLS. The session is recorded under your evaluator identity for this organization. Independent national or government accreditation requires external federation adjudication.
          </p>
        </div>
      </div>
    </Modal>
  );
};
