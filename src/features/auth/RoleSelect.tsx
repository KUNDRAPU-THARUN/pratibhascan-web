import { UserRole } from '@/types';
import { User, Shield, Building2, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectProps {
  selectedRole: UserRole;
  onChange: (role: UserRole) => void;
}

export function RoleSelect({ selectedRole, onChange }: RoleSelectProps) {
  const roles: { id: UserRole; title: string; desc: string; icon: typeof User }[] = [
    {
      id: 'athlete',
      title: 'Athlete',
      desc: 'Track fitness stats, test scores, and get scouted',
      icon: User,
    },
    {
      id: 'coach',
      title: 'Coach / Scout',
      desc: 'Conduct verified tests and evaluate talent',
      icon: Shield,
    },
    {
      id: 'academy_admin',
      title: 'Sports Academy',
      desc: 'Manage roster, batches, and team performance',
      icon: Building2,
    },
    {
      id: 'institution_officer',
      title: 'School / Federation',
      desc: 'Grassroots discovery, district tournaments & analytics',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {roles.map((r) => {
        const Icon = r.icon;
        const isSelected = selectedRole === r.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={cn(
              'flex flex-col text-left p-3.5 rounded-xl border transition-all text-xs',
              isSelected
                ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn(
                  'p-1.5 rounded-lg',
                  isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="font-semibold text-slate-900">{r.title}</span>
            </div>
            <p className="text-slate-500 line-clamp-2 text-[11px] leading-relaxed">{r.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
