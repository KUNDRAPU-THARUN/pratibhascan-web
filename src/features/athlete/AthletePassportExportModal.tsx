import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AthleteDashboardData } from './athleteService';
import { Printer, ShieldCheck, QrCode } from 'lucide-react';

interface AthletePassportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteData: AthleteDashboardData;
}

export function AthletePassportExportModal({
  isOpen,
  onClose,
  athleteData,
}: AthletePassportExportModalProps) {
  const shortId = `ATH-${athleteData.id.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified Athletic Passport"
      description="Official biometric record and standardized physical evaluation summary."
    >
      <div className="space-y-4 pt-1">
        {/* Printable Card Area */}
        <div className="rounded-xl border border-navy-200 bg-white p-5 shadow-xs space-y-4 print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-navy-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-navy-950 text-base">PratibhaScan</span>
                <Badge variant="teal" className="text-[10px]">Official Record</Badge>
              </div>
              <p className="text-[11px] text-navy-500 font-medium mt-0.5">
                KAARYAN LABS · Sports Talent Assessment Platform
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-navy-900 bg-navy-100 px-2.5 py-1 rounded-md">
                {shortId}
              </span>
              <p className="text-[10px] text-navy-400 mt-1">
                Issued: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Candidate Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-navy-400">Athlete Name</p>
              <p className="font-bold text-navy-900 text-sm mt-0.5">{athleteData.fullName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-navy-400">Sport & Event</p>
              <p className="font-bold text-navy-900 text-sm mt-0.5">
                {athleteData.primarySport} {athleteData.secondarySport ? `(${athleteData.secondarySport})` : ''}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-navy-400">Date of Birth / Age</p>
              <p className="font-medium text-navy-800 mt-0.5">
                {athleteData.dateOfBirth} ({athleteData.age} years)
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-navy-400">Location</p>
              <p className="font-medium text-navy-800 mt-0.5">
                {athleteData.district}, {athleteData.state}
              </p>
            </div>
          </div>

          {/* Biometrics */}
          <div className="rounded-lg bg-navy-50/80 p-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-navy-500 block uppercase font-medium">Height</span>
              <span className="font-bold text-navy-900">{athleteData.heightCm} cm</span>
            </div>
            <div>
              <span className="text-[10px] text-navy-500 block uppercase font-medium">Weight</span>
              <span className="font-bold text-navy-900">{athleteData.weightKg} kg</span>
            </div>
            <div>
              <span className="text-[10px] text-navy-500 block uppercase font-medium">BMI</span>
              <span className="font-bold text-navy-900">{athleteData.bmi} kg/m²</span>
            </div>
          </div>

          {/* Affiliation */}
          <div className="border-t border-navy-100 pt-3 flex items-center justify-between text-xs">
            <span className="text-navy-500 font-medium">Affiliated Organization:</span>
            <span className="font-bold text-navy-900">
              {athleteData.activeAffiliation ? athleteData.activeAffiliation.name : 'Independent / Unaffiliated'}
            </span>
          </div>

          {/* Verification Badge & QR Placeholder */}
          <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-navy-950">Database Verified Profile</p>
                <p className="text-[11px] text-navy-600">Standardized protocol benchmark records authenticated by KAARYAN LABS</p>
              </div>
            </div>
            <QrCode className="h-8 w-8 text-navy-400 shrink-0 opacity-60" />
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
