import { ShieldCheck, Info } from 'lucide-react';

interface MinorSafeguardBannerProps {
  age: number;
}

export function MinorSafeguardBanner({ age }: MinorSafeguardBannerProps) {
  return (
    <div
      className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 shadow-xs text-navy-900 transition-all"
      role="status"
      aria-label="Minor Athlete Privacy Notice"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-teal-100 text-teal-700 shrink-0 mt-0.5">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-navy-950 text-sm">
              Minor Athlete Privacy Safeguards Active (Age: {age})
            </h4>
            <span className="bg-teal-200/70 text-teal-800 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              DPDP Act 2023 Compliant
            </span>
          </div>
          <p className="text-navy-700 leading-relaxed">
            In compliance with Section 9 of the Digital Personal Data Protection Act (2023), personal identification and biometric measurements for athletes under 18 are protected under strict least-privilege access controls.
          </p>
          <div className="flex items-center gap-1.5 text-navy-600 font-medium pt-1">
            <Info className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>
              Public search indexation and commercial tracking are strictly prohibited. Assessment trial data is accessible solely to authorized evaluators and verified affiliated academies.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
