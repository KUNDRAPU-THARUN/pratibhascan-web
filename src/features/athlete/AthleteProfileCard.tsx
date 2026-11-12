import { AthleteProfile } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, MapPin, Ruler, Weight } from 'lucide-react';

interface AthleteProfileCardProps {
  athlete: AthleteProfile;
}

export function AthleteProfileCard({ athlete }: AthleteProfileCardProps) {
  return (
    <Card className="overflow-hidden border-slate-200">
      <div className="bg-gradient-to-r from-brand-600 to-amber-500 h-24 relative p-4 flex items-end">
        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-semibold">
          Talent Score: {athlete.talentScore}/100
        </div>
      </div>
      <CardContent className="pt-0 relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 mb-4 gap-3">
          <div className="h-20 w-20 rounded-2xl border-4 border-white bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-md">
            {athlete.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {athlete.badges.map((badge) => (
              <Badge key={badge} variant="brand" className="text-[11px]">
                <Award className="h-3 w-3 mr-1" />
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900">{athlete.fullName}</h3>
          <p className="text-sm font-medium text-brand-600">{athlete.primarySport}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {athlete.district}, {athlete.state}
            </span>
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5 text-slate-400" />
              {athlete.heightCm} cm
            </span>
            <span className="flex items-center gap-1">
              <Weight className="h-3.5 w-3.5 text-slate-400" />
              {athlete.weightKg} kg
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
