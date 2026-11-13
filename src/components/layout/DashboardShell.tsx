import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DashboardTopNav } from './DashboardTopNav';
import { DashboardSidebar } from './DashboardSidebar';
import { UserRole } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { ShieldCheck, Info } from 'lucide-react';

interface DashboardShellProps {
  isPreview?: boolean;
}

export function DashboardShell({ isPreview = false }: DashboardShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();

  // Determine initial role from URL or user role
  const getInitialRole = (): UserRole => {
    if (!isPreview && role) return role;
    if (location.pathname.includes('/academy')) return 'academy';
    if (location.pathname.includes('/institution')) return 'institution';
    return 'athlete';
  };

  const [activeRole, setActiveRole] = useState<UserRole>(getInitialRole);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Synchronize role if user logs in or role resolves
  useEffect(() => {
    if (!isPreview && role) {
      setActiveRole(role);
    }
  }, [isPreview, role]);

  const handleRoleChange = (newRole: UserRole) => {
    if (!isPreview) return; // Prevent role switching for authenticated users

    setActiveRole(newRole);
    if (location.pathname.includes('/preview/')) {
      navigate(`/preview/${newRole}`);
    } else if (location.pathname.startsWith('/dashboard/')) {
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
        isPreview={isPreview}
      />

      <div className="flex flex-1">
        <DashboardSidebar
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isPreview={isPreview}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Status Advisory Banner */}
          {isPreview ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 sm:p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <p>
                  <span className="font-bold">Demonstration Preview Mode:</span> Exploring{' '}
                  <span className="font-bold capitalize">{activeRole}</span> interface. This mode uses illustrative mock data for design review.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-white/90 px-2.5 py-1 rounded-md border border-amber-200 shrink-0">
                <span>Preview Only</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-3.5 sm:p-4 text-xs text-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-primary-600 shrink-0" />
                <p>
                  <span className="font-bold">Authenticated Portal:</span> Logged in as{' '}
                  <span className="font-semibold text-navy-900">{profile?.full_name || user?.email}</span> (
                  <span className="font-bold uppercase tracking-wider">{activeRole}</span>). Database Row Level Security active.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-800 bg-white/90 px-2.5 py-1 rounded-md border border-teal-200 shrink-0">
                <span>Verified Session</span>
              </div>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}
