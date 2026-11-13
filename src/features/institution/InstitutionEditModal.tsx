import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  institutionProfileUpdateSchema,
  INSTITUTION_TYPES,
  INSTITUTION_TYPE_LABELS,
  type InstitutionProfileUpdateFormData,
  type InstitutionType,
} from './institutionSchemas';
import { updateInstitutionProfile, type InstitutionProfile } from './institutionService';
import { AlertCircle, CheckCircle2, Landmark } from 'lucide-react';

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

interface InstitutionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionData: InstitutionProfile;
  onProfileUpdated: () => void;
}

export function InstitutionEditModal({
  isOpen,
  onClose,
  institutionData,
  onProfileUpdated,
}: InstitutionEditModalProps) {
  const [formData, setFormData] = useState<InstitutionProfileUpdateFormData>({
    name: institutionData.name,
    type: institutionData.type,
    contactEmail: institutionData.contactEmail,
    contactPhone: institutionData.contactPhone || '',
    state: institutionData.state,
    district: institutionData.district,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    // Validate using Zod schema
    const parseResult = institutionProfileUpdateSchema.safeParse(formData);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const { error } = await updateInstitutionProfile(institutionData.id, parseResult.data);
    setIsSubmitting(false);

    if (error) {
      setGeneralError(error.message);
      return;
    }

    setSuccessMessage('Institution profile successfully updated.');
    setTimeout(() => {
      onProfileUpdated();
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Institution Profile"
      description="Update verified institutional credentials, classification, and official contact details."
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{generalError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Institution Name */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Institution / Sports Board Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Karnataka State Sports Board / National Sports College"
            className="text-xs"
          />
          {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Institution Type */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Institution Classification *
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as InstitutionType })
            }
            className="w-full h-9 rounded-md border border-navy-300 bg-white px-3 py-1.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {INSTITUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {INSTITUTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-[11px] text-red-600 mt-1">{errors.type}</p>}
        </div>

        {/* Contact Email & Contact Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              Official Contact Email *
            </label>
            <Input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="secretary@sportsboard.gov.in"
              className="text-xs"
            />
            {errors.contactEmail && (
              <p className="text-[11px] text-red-600 mt-1">{errors.contactEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              Official Contact Phone
            </label>
            <Input
              type="tel"
              value={formData.contactPhone || ''}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="+91 80 2345 6789"
              className="text-xs"
            />
            {errors.contactPhone && (
              <p className="text-[11px] text-red-600 mt-1">{errors.contactPhone}</p>
            )}
          </div>
        </div>

        {/* State & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              State *
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full h-9 rounded-md border border-navy-300 bg-white px-3 py-1.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.state && <p className="text-[11px] text-red-600 mt-1">{errors.state}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              District *
            </label>
            <Input
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="e.g. Bengaluru Urban"
              className="text-xs"
            />
            {errors.district && (
              <p className="text-[11px] text-red-600 mt-1">{errors.district}</p>
            )}
          </div>
        </div>

        {/* Security & System Guard Notice */}
        <div className="p-2.5 rounded-lg bg-navy-50 border border-navy-200 text-[11px] text-navy-600 flex items-start gap-2">
          <Landmark className="h-4 w-4 shrink-0 text-navy-400 mt-0.5" />
          <p>
            Institution ownership ID and official government/federation verification status are system-managed. Official verification audits are conducted through district sports officers or state federation credentials.
          </p>
        </div>
      </form>
    </Modal>
  );
}
