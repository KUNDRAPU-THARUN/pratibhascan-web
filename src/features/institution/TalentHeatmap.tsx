export interface RegionStat {
  district: string;
  athletesScouted: number;
  topSport: string;
  avgTalentScore: number;
}

const REGION_DATA: RegionStat[] = [
  { district: 'Bengaluru Urban', athletesScouted: 840, topSport: 'Athletics', avgTalentScore: 88 },
  { district: 'Mysuru', athletesScouted: 430, topSport: 'Wrestling', avgTalentScore: 84 },
  { district: 'Belagavi', athletesScouted: 390, topSport: 'Swimming', avgTalentScore: 81 },
  { district: 'Dharwad', athletesScouted: 260, topSport: 'Badminton', avgTalentScore: 86 },
  { district: 'Dakshina Kannada', athletesScouted: 510, topSport: 'Athletics', avgTalentScore: 89 },
];

export function TalentHeatmap() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REGION_DATA.map((region) => (
          <div
            key={region.district}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-900 text-sm">{region.district}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-50 text-brand-700">
                Index: {region.avgTalentScore}
              </span>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Athletes Scouted:</span>
                <span className="font-medium text-slate-700">{region.athletesScouted}</span>
              </div>
              <div className="flex justify-between">
                <span>Leading Sport:</span>
                <span className="font-medium text-slate-700">{region.topSport}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
