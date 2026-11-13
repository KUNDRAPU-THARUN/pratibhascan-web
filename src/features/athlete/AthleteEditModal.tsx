import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  athleteProfileUpdateSchema,
  type AthleteProfileUpdateFormData,
} from './athleteSchemas';
import { updateAthleteProfile, type AthleteDashboardData } from './athleteService';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const COMMON_SPORTS = [
  'Athletics',
  'Badminton',
  'Boxing',
  'Wrestling',
  'Swimming',
  'Shooting',
  'Archery',
  'Weightlifting',
  'Table Tennis',
  'Football',
  'Hockey',
  'Basketball',
  'Volleyball',
  'Gymnastics',
];

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

interface AthleteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteData: AthleteDashboardData;
  onProfileUpdated: () => void;
}

export function AthleteEditModal({
  isOpen,
  onClose,
  athleteData,
  onProfileUpdated,
}: AthleteEditModalProps) {
  const [fullName, setFullName] = useState(athleteData.fullName);
  const [phoneNumber, setPhoneNumber] = useState(athleteData.phoneNumber || '');
  const [state, setState] = useState(athleteData.state || 'Karnataka');
  const [district, setDistrict] = useState(athleteData.district || 'Bengaluru Urban');
  const [primarySport, setPrimarySport] = useState(athleteData.primarySport || 'Athletics');
  const [secondarySport, setSecondarySport] = useState(athleteData.secondarySport || '');
  const [heightCm, setHeightCm] = useState(athleteData.heightCm.toString());
  const [weightKg, setWeightKg] = useState(athleteData.weightKg.toString());
  const [wingspanCm, setWingspanCm] = useState(athleteData.wingspanCm ? athleteData.wingspanCm.toString() : '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const parsedHeight = parseFloat(heightCm);
    const parsedWeight = parseFloat(weightKg);
    const parsedWingspan = wingspanCm.trim() ? parseFloat(wingspanCm) : null;

    const payload: AthleteProfileUpdateFormData = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || null,
      state: state.trim(),
      district: district.trim(),
      primarySport: primarySport.trim(),
      secondarySport: secondarySport.trim() || null,
      heightCm: isNaN(parsedHeight) ? (undefined as unknown as number) : parsedHeight,
      weightKg: isNaN(parsedWeight) ? (undefined as unknown as number) : parsedWeight,
      wingspanCm: parsedWingspan !== null && isNaN(parsedWingspan) ? null : parsedWingspan,
    };

    const validation = athleteProfileUpdateSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updateAthleteProfile(athleteData.id, validation.data);
      if (error) {
        setFormError(error.message || 'Failed to update profile.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onProfileUpdated();
        onClose();
      }, 1000);
    } catch {
      setFormError('Network connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Athlete Profile & Baseline"
      description="Update your personal details and physical baseline. All changes are validated and synced with Supabase."
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-navy-900">Profile Updated Successfully</h3>
          <p className="text-xs text-navy-600">Your biometric baseline and contact details have been persisted.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
          {formError && (
            <div
              className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-rose-800 text-xs"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-fullName" className="block text-xs font-semibold text-navy-700 mb-1">
                Full Name *
              </label>
              <Input
                id="edit-fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Candidate Full Name"
                disabled={isSubmitting}
              />
              {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="edit-phone" className="block text-xs font-semibold text-navy-700 mb-1">
                Phone Number
              </label>
              <Input
                id="edit-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                disabled={isSubmitting}
              />
              {errors.phoneNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-primarySport" className="block text-xs font-semibold text-navy-700 mb-1">
                Primary Sport *
              </label>
              <select
                id="edit-primarySport"
                value={primarySport}
                onChange={(e) => setPrimarySport(e.target.value)}
                className="w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={isSubmitting}
              >
                {COMMON_SPORTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.primarySport && <p className="text-[11px] text-rose-600 mt-1">{errors.primarySport}</p>}
            </div>

            <div>
              <label htmlFor="edit-secondarySport" className="block text-xs font-semibold text-navy-700 mb-1">
                Secondary Sport / Event
              </label>
              <Input
                id="edit-secondarySport"
                type="text"
                value={secondarySport}
                onChange={(e) => setSecondarySport(e.target.value)}
                placeholder="e.g. 100m Sprints or Badminton"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="edit-height" className="block text-xs font-semibold text-navy-700 mb-1">
                Height (cm) *
              </label>
              <Input
                id="edit-height"
                type="number"
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                disabled={isSubmitting}
              />
              {errors.heightCm && <p className="text-[11px] text-rose-600 mt-1">{errors.heightCm}</p>}
            </div>

            <div>
              <label htmlFor="edit-weight" className="block text-xs font-semibold text-navy-700 mb-1">
                Body Mass (kg) *
              </label>
              <Input
                id="edit-weight"
                type="number"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="65"
                disabled={isSubmitting}
              />
              {errors.weightKg && <p className="text-[11px] text-rose-600 mt-1">{errors.weightKg}</p>}
            </div>

            <div>
              <label htmlFor="edit-wingspan" className="block text-xs font-semibold text-navy-700 mb-1">
                Wingspan (cm)
              </label>
              <Input
                id="edit-wingspan"
                type="number"
                step="0.5"
                value={wingspanCm}
                onChange={(e) => setWingspanCm(e.target.value)}
                placeholder="180"
                disabled={isSubmitting}
              />
              {errors.wingspanCm && <p className="text-[11px] text-rose-600 mt-1">{errors.wingspanCm}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-state" className="block text-xs font-semibold text-navy-700 mb-1">
                State / UT *
              </label>
              <select
                id="edit-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={isSubmitting}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.state && <p className="text-[11px] text-rose-600 mt-1">{errors.state}</p>}
            </div>

            <div>
              <label htmlFor="edit-district" className="block text-xs font-semibold text-navy-700 mb-1">
                District *
              </label>
              <Input
                id="edit-district"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Pune or Bengaluru Urban"
                disabled={isSubmitting}
              />
              {errors.district && <p className="text-[11px] text-rose-600 mt-1">{errors.district}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-navy-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
