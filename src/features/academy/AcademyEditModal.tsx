import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  academyProfileUpdateSchema,
  type AcademyProfileUpdateFormData,
} from './academySchemas';
import { updateAcademyProfile, type AcademyDashboardData } from './academyService';
import { AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

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
  'Cricket',
  'Tennis',
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

interface AcademyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  academyData: AcademyDashboardData['academy'];
  onProfileUpdated: () => void;
}

export function AcademyEditModal({
  isOpen,
  onClose,
  academyData,
  onProfileUpdated,
}: AcademyEditModalProps) {
  const [formData, setFormData] = useState<AcademyProfileUpdateFormData>({
    name: academyData.name,
    registrationNumber: academyData.registrationNumber || '',
    contactEmail: academyData.contactEmail,
    contactPhone: academyData.contactPhone || '',
    state: academyData.state,
    district: academyData.district,
    address: academyData.address || '',
    sportsOffered: academyData.sportsOffered || ['Athletics'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSport = (sport: string) => {
    setFormData((prev) => {
      const exists = prev.sportsOffered.includes(sport);
      if (exists) {
        if (prev.sportsOffered.length <= 1) return prev; // keep at least one
        return {
          ...prev,
          sportsOffered: prev.sportsOffered.filter((s) => s !== sport),
        };
      } else {
        return {
          ...prev,
          sportsOffered: [...prev.sportsOffered, sport],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    // Validate using Zod schema
    const parseResult = academyProfileUpdateSchema.safeParse(formData);
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
    const { error } = await updateAcademyProfile(academyData.id, parseResult.data);
    setIsSubmitting(false);

    if (error) {
      setGeneralError(error.message);
      return;
    }

    setSuccessMessage('Academy profile successfully updated.');
    setTimeout(() => {
      onProfileUpdated();
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Academy Profile"
      description="Update verified organizational details, contact information, and athletic disciplines."
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

        {/* Academy Name */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Academy / High-Performance Center Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Apex High Performance Academy"
            className="text-xs"
          />
          {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Registration Number */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Official Registration / Accreditation Number
          </label>
          <Input
            value={formData.registrationNumber || ''}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            placeholder="e.g. SAI-ACAD-2024-884"
            className="text-xs"
          />
          {errors.registrationNumber && (
            <p className="text-[11px] text-red-600 mt-1">{errors.registrationNumber}</p>
          )}
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
              placeholder="director@academy.org"
              className="text-xs"
            />
            {errors.contactEmail && (
              <p className="text-[11px] text-red-600 mt-1">{errors.contactEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              Contact Phone
            </label>
            <Input
              type="tel"
              value={formData.contactPhone || ''}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="+91 98765 43210"
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
              placeholder="e.g. Pune"
              className="text-xs"
            />
            {errors.district && (
              <p className="text-[11px] text-red-600 mt-1">{errors.district}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Facility Address
          </label>
          <Input
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Plot 12, Sports Complex, Balewadi"
            className="text-xs"
          />
          {errors.address && <p className="text-[11px] text-red-600 mt-1">{errors.address}</p>}
        </div>

        {/* Sports Offered */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-navy-800">
              Sports Disciplines Offered *
            </label>
            <span className="text-[11px] text-navy-400">
              {formData.sportsOffered.length} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg border border-navy-200 bg-navy-50/40">
            {COMMON_SPORTS.map((sport) => {
              const isSelected = formData.sportsOffered.includes(sport);
              return (
                <button
                  type="button"
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-white text-navy-700 border border-navy-200 hover:bg-navy-100/70'
                  }`}
                >
                  {sport}
                </button>
              );
            })}
          </div>
          {errors.sportsOffered && (
            <p className="text-[11px] text-red-600 mt-1">{errors.sportsOffered}</p>
          )}
        </div>

        {/* Read-only Security note */}
        <div className="p-2.5 rounded-lg bg-navy-50 border border-navy-200 text-[11px] text-navy-600 flex items-start gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-navy-400 mt-0.5" />
          <p>
            Academy ownership ID and official verification status are system-managed. Verified status updates require SAI or district sports officer accreditation audits.
          </p>
        </div>
      </form>
    </Modal>
  );
}
