import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DashboardTopNav } from './DashboardTopNav';
import { DashboardSidebar } from './DashboardSidebar';
import { UserRole } from '@/types';
import { Sparkles, Info } from 'lucide-react';

export function DashboardShell() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial role from URL or default to 'athlete'
  const getInitialRole = (): UserRole => {
    if (location.pathname.includes('/academy')) return 'academy';
    if (location.pathname.includes('/institution')) return 'institution';
    return 'athlete';
  };

  const [activeRole, setActiveRole] = useState<UserRole>(getInitialRole);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (location.pathname.startsWith('/dashboard/')) {
      if (newRole === 'athlete') navigate('/dashboard/athlete');
      else if (newRole === 'academy') navigate('/dashboard/academy');
      else if (newRole === 'institution') navigate('/dashboard/institution');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy-50/60 font-sans text-navy-900">
      <DashboardTopNav
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1">
        <DashboardSidebar
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Phase 1 Foundation Advisory Banner */}
          <div className="rounded-xl border border-primary-200 bg-primary-50/80 p-3.5 sm:p-4 text-xs text-primary-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary-600 shrink-0" />
              <p>
                <span className="font-bold">Phase 1 Foundation Shell:</span> Exploring{' '}
                <span className="font-bold capitalize">{activeRole}</span> architecture. Supabase Auth &amp; PostgreSQL integration scheduled for Phase 2.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-white/80 px-2.5 py-1 rounded-md border border-primary-200 shrink-0">
              <Info className="h-3 w-3" />
              <span>Production-Oriented Preview</span>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
