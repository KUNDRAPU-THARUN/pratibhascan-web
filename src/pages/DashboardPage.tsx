import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AthleteDashboard } from '@/features/athlete/AthleteDashboard';
import { AcademyDashboard } from '@/features/academy/AcademyDashboard';
import { InstitutionDashboard } from '@/features/institution/InstitutionDashboard';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { User, Building2, GraduationCap, Shield } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [activeRoleView, setActiveRoleView] = useState<UserRole>(user?.role || 'athlete');

  return (
    <div className="space-y-6">
      {/* Role Switcher Toolbar for fast testing/evaluation */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Viewing Role:
          </span>
          <span className="text-xs font-bold capitalize text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
            {activeRoleView.replace('_', ' ')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={activeRoleView === 'athlete' ? 'primary' : 'outline'}
            onClick={() => setActiveRoleView('athlete')}
          >
            <User className="h-3.5 w-3.5 mr-1" />
            Athlete
          </Button>
          <Button
            size="sm"
            variant={activeRoleView === 'coach' || activeRoleView === 'academy_admin' ? 'primary' : 'outline'}
            onClick={() => setActiveRoleView('academy_admin')}
          >
            <Building2 className="h-3.5 w-3.5 mr-1" />
            Academy / Coach
          </Button>
          <Button
            size="sm"
            variant={activeRoleView === 'institution_officer' ? 'primary' : 'outline'}
            onClick={() => setActiveRoleView('institution_officer')}
          >
            <GraduationCap className="h-3.5 w-3.5 mr-1" />
            Institution / Board
          </Button>
        </div>
      </div>

      {/* Render matching dashboard */}
      {activeRoleView === 'athlete' && <AthleteDashboard />}
      {(activeRoleView === 'coach' || activeRoleView === 'academy_admin') && <AcademyDashboard />}
      {activeRoleView === 'institution_officer' && <InstitutionDashboard />}
      {activeRoleView === 'admin' && <InstitutionDashboard />}
    </div>
  );
}
