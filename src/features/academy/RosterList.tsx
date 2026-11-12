import { AthleteProfile } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Filter, Search, UserCheck } from 'lucide-react';

interface RosterListProps {
  athletes: AthleteProfile[];
  onSelectAthlete?: (athlete: AthleteProfile) => void;
}

export function RosterList({ athletes, onSelectAthlete }: RosterListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roster by athlete or sport..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1.5" />
            Filter
          </Button>
          <Button variant="primary" size="sm">
            <UserCheck className="h-4 w-4 mr-1.5" />
            Add Athlete
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Athlete</th>
              <th className="px-4 py-3">Primary Sport</th>
              <th className="px-4 py-3">Age / Gender</th>
              <th className="px-4 py-3">Talent Index</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {athletes.map((ath) => (
              <tr key={ath.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{ath.fullName}</div>
                  <div className="text-xs text-slate-400">{ath.district}, {ath.state}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{ath.primarySport}</Badge>
                </td>
                <td className="px-4 py-3 text-xs">
                  {ath.age} yrs • <span className="capitalize">{ath.gender}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-500 h-2 rounded-full"
                        style={{ width: `${ath.talentScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{ath.talentScore}/100</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectAthlete && onSelectAthlete(ath)}
                  >
                    View <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
